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
