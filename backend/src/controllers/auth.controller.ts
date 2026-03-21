import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── Local Auth ─────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: role || 'USER',
      },
    });

    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register', details: error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // User exists but registered via OAuth — prompt them to use social login
      return res.status(401).json({
        error: user ? 'Akun ini terdaftar via Google/Facebook. Silakan gunakan tombol social login.' : 'Invalid credentials',
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = makeToken(user);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
};

// ── OAuth Callbacks ────────────────────────────────────────────────────────────
// Called after passport.authenticate() succeeds — user is attached to req
export const oauthCallback = (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string; email: string; role: string; name?: string | null };
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/?auth_error=oauth_failed`);
    }

    const token = makeToken(user);
    const userData = encodeURIComponent(
      JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name })
    );

    // Redirect to frontend with token in query string
    res.redirect(`${FRONTEND_URL}/?auth_token=${token}&auth_user=${userData}`);
  } catch {
    res.redirect(`${FRONTEND_URL}/?auth_error=server_error`);
  }
};
