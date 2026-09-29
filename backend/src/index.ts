import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import { authenticate, verifyToken } from './middleware/auth.middleware';
import { makeThreatEvent, makeThreatHistory } from './lib/threats';

const app = express();
const port = config.port;

// Behind the platform proxy (Railway), req.ip is the proxy address unless we
// trust the first hop — without this the rate limiter keys every request to one
// IP and audit rows record the proxy, not the client (SEC-CONF-002).
app.set('trust proxy', 1);

// 1. Security Middleware
app.use(helmet());

// CORS is an explicit allowlist, not a wildcard (SEC-CONF-001). Only known
// frontend origins may call the API from a browser; credentials are permitted
// so the app can move to cookie-based sessions.
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true
  })
);

// Cap body size so a single request cannot exhaust memory; reject malformed
// JSON with a generic 400 instead of leaking a parser stack trace (SEC-ERR-001).
app.use(express.json({ limit: '100kb' }));

// 2. Rate Limiting.
// General API limiter: 100 requests / 15 min / IP.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Auth limiter: a stricter, dedicated bucket for credential endpoints so online
// password guessing is throttled independently of ordinary API traffic
// (SEC-AUTH-003). Successful logins do not count toward the limit.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many attempts. Please wait before trying again.' }
});

// 3. User & Auth Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);

// Protected Mock Data Routes (Secured with verify JWT middleware)
app.get('/api/stats', authenticate, (req, res) => {
  res.json({
    activeAlerts: Math.floor(Math.random() * 20) + 5,
    systemsOnline: 42,
    totalSys: 45,
    networkTraffic: `${(Math.random() * 5 + 1).toFixed(1)} TB/s`,
    anomaliesDetected: Math.floor(Math.random() * 5),
  });
});

// Cross-team anomaly routing — the product's stated positioning: one anomaly is
// classified and delivered to the team that owns the response (SOC vs IT Ops),
// not broadcast to everyone. Synthetic demonstration data; `team` is the field
// the Alert Center filters on. Times are epoch ms so the client renders relative
// labels itself rather than trusting a frozen "5m ago" string.
app.get('/api/alerts', authenticate, (_req, res) => {
  const now = Date.now();
  const min = 60_000;
  res.json([
    {
      id: 'ALT-2041', team: 'soc', severity: 'critical', ts: now - 2 * min,
      title: 'Multiple failed IAM auth attempts',
      source: 'External VPN Gateway',
      description: 'Brute-force signature from an unknown subnet targeting admin accounts.'
    },
    {
      id: 'ALT-2039', team: 'itops', severity: 'critical', ts: now - 6 * min,
      title: 'High latency on Payment API',
      source: 'Payment Gateway · Node 4',
      description: 'Response times degraded ~300% over 5 minutes, approaching timeout thresholds.'
    },
    {
      id: 'ALT-2036', team: 'soc', severity: 'warning', ts: now - 14 * min,
      title: 'Unusual outbound traffic',
      source: 'Core Segment · Node 4',
      description: 'Sustained egress to a low-reputation host outside the maintenance window.'
    },
    {
      id: 'ALT-2033', team: 'itops', severity: 'warning', ts: now - 22 * min,
      title: 'Storage IOPS spike',
      source: 'Core Database Cluster',
      description: 'Disk read operations spiking across replication nodes; query optimisation may be needed.'
    },
    {
      id: 'ALT-2030', team: 'itops', severity: 'info', ts: now - 48 * min,
      title: 'API rate limit approaching',
      source: 'Payment Gateway · 3rd-party',
      description: 'Third-party request volume trending toward the plan limit; may cap by end of day.'
    }
  ]);
});

// Backfill for the SOC feed. The live tail arrives over the socket below;
// this is only what the console needs to render before the first push.
app.get('/api/security', authenticate, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 500, 2000);
  res.json(makeThreatHistory(limit));
});

app.get('/api/systems', authenticate, (req, res) => {
  res.json([
    { name: 'Core Database', status: 'optimal', uptime: '99.9%' },
    { name: 'Auth Service', status: 'optimal', uptime: '99.9%' },
    { name: 'Log Aggregator', status: 'optimal', uptime: '100%' },
  ]);
});

// 4. Real-time WebSockets setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: config.corsOrigins, credentials: true }
});

// Authenticate the handshake. The threat and metric feed used to stream to any
// anonymous connection (SEC-API-001); now a client must present a valid token
// (via socket.handshake.auth.token) before it joins, using the same verifier as
// the HTTP middleware so both enforce one rule.
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '');
  const user = verifyToken(token);
  if (!user) {
    return next(new Error('Authentication required.'));
  }
  (socket.data as { user?: unknown }).user = user;
  next();
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Threat feed. Emitted individually and on a bursty cadence — the client
  // batches arrivals into 250ms windows before it touches the DOM, so there is
  // no need to pre-aggregate here.
  let threatTimer: NodeJS.Timeout;
  const scheduleThreat = () => {
    threatTimer = setTimeout(() => {
      const burst = Math.random() > 0.86 ? Math.floor(Math.random() * 5) + 2 : 1;
      for (let i = 0; i < burst; i++) {
        socket.emit('threat-event', makeThreatEvent());
      }
      scheduleThreat();
    }, 180 + Math.random() * 900);
  };
  scheduleThreat();

  // Round-trip probe. The console measures real latency rather than
  // displaying a decorative number.
  socket.on('ping-rtt', (ack?: () => void) => {
    if (typeof ack === 'function') ack();
  });

  // Emit simulated live CPU/RAM stats every 3 seconds
  const interval = setInterval(() => {
    const cpu = Math.floor(Math.random() * 40) + 30; // 30-70%
    const ram = Math.floor(Math.random() * 30) + 50; // 50-80%
    
    socket.emit('system-metrics', { cpu, ram });
    
    // Anomaly Rule Engine (Simulated Logic)
    if (ram > 75) {
      socket.emit('anomaly-alert', { 
        title: 'High RAM Usage', 
        severity: 'warning',
        message: `RAM usage spiked to ${ram}%` 
      });
    }
  }, 3000);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    clearInterval(interval);
    clearTimeout(threatTimer);
  });
});

// Unknown API routes return a generic JSON 404 rather than Express's default
// "Cannot GET /path" text, which confirms route existence to a scanner.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Terminal error handler. Logs the full error server-side and returns a generic
// body — no stack traces, filesystem paths, or dependency internals reach the
// client (SEC-ERR-001). Body-parser's malformed-JSON error lands here too.
app.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed request body.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large.' });
  }
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({ error: 'Internal server error.' });
});

httpServer.listen(port, () => {
  console.log(`Secure Backend listening on http://localhost:${port}`);
});
