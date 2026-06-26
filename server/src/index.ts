import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(helmet());

// Split CLIENT_URL by commas to allow multiple origins (e.g. local dev + production)
const allowedOrigins = env.CLIENT_URL.split(',').map(url => url.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow server-to-server or curl requests
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// ── Health check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'seedling-api', environment: env.NODE_ENV });
});

app.get('/debug-env', (_req, res) => {
  const getRole = (key: string | undefined) => {
    if (!key) return 'undefined';
    const parts = key.split('.');
    if (parts.length < 2 || !parts[1]) return 'invalid-jwt';
    try {
      const payload = JSON.parse(Buffer.from(parts[1] as string, 'base64').toString('utf8'));
      return payload.role || 'no-role-field';
    } catch (e: any) {
      return `error: ${e.message}`;
    }
  };

  res.json({
    SUPABASE_URL: env.SUPABASE_URL,
    CLIENT_URL: env.CLIENT_URL,
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    SUPABASE_ANON_KEY_ROLE: getRole(env.SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY_ROLE: getRole(env.SUPABASE_SERVICE_ROLE_KEY),
  });
});

// ── Routes ──────────────────────────────────────────────
import orgRoutes from './routes/org.routes.js';
import projectRoutes from './routes/projects.routes.js';
import grantsRoutes from './routes/grants.routes.js';
import applicationsRoutes from './routes/applications.routes.js';
import engineRoutes from './routes/engine.routes.js';
import authRoutes from './routes/auth.routes.js';
import { startCronJobs } from './cron/reminders.cron.js';

app.use('/org', orgRoutes);
app.use('/org/projects', projectRoutes);
app.use('/grants', grantsRoutes);
app.use('/applications', applicationsRoutes);
app.use('/engine', engineRoutes);
app.use('/auth', authRoutes);

// ── Start Cron Jobs ──────────────────────────────────────
startCronJobs();

// ── Start ────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🌱 Seedling API running on http://localhost:${env.PORT}`);
});

export default app;
