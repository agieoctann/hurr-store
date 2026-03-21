import { Router } from 'express';
import passport from 'passport';
import { register, login, oauthCallback } from '../controllers/auth.controller';

// Import passport strategies (side-effects only)
import '../lib/passport';

const router = Router();

// ── Local Auth ─────────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);

// ── Google OAuth ───────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: true })
);
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?auth_error=google_failed`, session: true }),
  oauthCallback
);

// ── Facebook OAuth ─────────────────────────────────────────────────────────────
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'], session: true })
);
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?auth_error=facebook_failed`, session: true }),
  oauthCallback
);

export default router;
