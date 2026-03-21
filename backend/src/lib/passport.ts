import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import prisma from './prisma';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// ── GOOGLE ─────────────────────────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL:  `${BACKEND_URL}/api/auth/google/callback`,
    scope: ['profile', 'email'],
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google profile'));

      // Cari user yang sudah ada (by email atau providerId)
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { provider: 'google', providerId: profile.id },
          ],
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: profile.displayName || profile.name?.givenName || null,
            provider: 'google',
            providerId: profile.id,
            role: 'USER',
          },
        });
      } else if (!user.providerId) {
        // Existing local user — link OAuth
        user = await prisma.user.update({
          where: { id: user.id },
          data: { provider: 'google', providerId: profile.id },
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }
));

// ── FACEBOOK ───────────────────────────────────────────────────────────────────
passport.use(new FacebookStrategy(
  {
    clientID:     process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL:  `${BACKEND_URL}/api/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'displayName', 'name'],
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;

      let user = await prisma.user.findFirst({
        where: email
          ? { OR: [{ email }, { provider: 'facebook', providerId: profile.id }] }
          : { provider: 'facebook', providerId: profile.id },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: email || `fb_${profile.id}@noemail.placeholder`,
            name: profile.displayName || null,
            provider: 'facebook',
            providerId: profile.id,
            role: 'USER',
          },
        });
      } else if (!user.providerId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { provider: 'facebook', providerId: profile.id },
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }
));

// Serialize / deserialize (minimal — kita pakai JWT, session hanya untuk OAuth flow)
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
