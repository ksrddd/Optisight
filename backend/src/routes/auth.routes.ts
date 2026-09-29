import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { config } from '../config';

const router = express.Router();
const prisma = new PrismaClient();

// A precomputed bcrypt hash of a random string. When a login names an unknown
// account we still run a comparison against this so the unknown-user and
// wrong-password paths take comparable time — closing the timing oracle in
// SEC-AUTH-004. It is never a valid password for any real account.
const DUMMY_HASH = '$2b$12$hLbQXHmXtjYNjzw5Vd/AI.yhUTr7hVnCXHdrESTFqWIt4SgshI6mi';

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check email not already registered
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        role: 'analyst', // Default role for self-registered users
      },
    });

    // Log the registration
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'REGISTER_SUCCESS',
        ipAddress: req.ip || req.socket.remoteAddress,
        details: `New user registered: ${newUser.email}`,
      },
    });

    // Generate JWT immediately after registration
    const payload = { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    res.status(201).json({ token, user: payload });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find the user. Run a bcrypt compare on both branches — against a dummy
    // hash when the account does not exist — so unknown-user and wrong-password
    // requests take comparable time and cannot be distinguished (SEC-AUTH-004).
    const user = await prisma.user.findUnique({ where: { email } });
    const validPassword = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

    if (!user || !validPassword) {
      // Audit both failure modes. Previously an unknown-email attempt wrote no
      // row, hiding the strongest brute-force / enumeration signal (SEC-LOG-001).
      // Never store the submitted password or the raw probe as identifying data.
      await prisma.auditLog.create({
        data: {
          userId: user?.id ?? null,
          action: 'LOGIN_FAILED',
          ipAddress: req.ip || req.socket.remoteAddress,
          details: user ? 'Invalid password attempt' : 'Login attempt for unknown account',
        },
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        ipAddress: req.ip || req.socket.remoteAddress,
        details: 'User logged in successfully',
      },
    });

    res.json({ token, user: payload });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    console.error('[Me Error]', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
router.post('/logout', authenticate, async (req: any, res) => {
  try {
    // Log the logout action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LOGOUT',
        ipAddress: req.ip || req.socket.remoteAddress,
        details: 'User logged out',
      },
    });
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('[Logout Error]', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
