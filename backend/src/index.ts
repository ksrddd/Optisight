import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import { authenticate } from './middleware/auth.middleware';

const app = express();
const port = process.env.PORT || 3001;

// 1. Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// 2. Rate Limiting (100 requests per 15 mins)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// 3. User & Auth Routes
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

app.get('/api/alerts', authenticate, (req, res) => {
  res.json([
    { id: 1, message: 'Unusual outbound traffic detected on Node 4', severity: 'critical', time: '5m ago' },
    { id: 2, message: 'CPU spike on Auth Server', severity: 'warning', time: '12m ago' },
    { id: 3, message: 'Unauthorized access attempt blocked', severity: 'critical', time: '22m ago' },
    { id: 4, message: 'API rate limit exceeded for Client XYZ', severity: 'warning', time: '2h ago' }
  ]);
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
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

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
  });
});

httpServer.listen(port, () => {
  console.log(`Secure Backend listening on http://localhost:${port}`);
});
