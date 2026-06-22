import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
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

app.use('/org', orgRoutes);
app.use('/org/projects', projectRoutes);
app.use('/grants', grantsRoutes);
app.use('/applications', applicationsRoutes);
app.use('/engine', engineRoutes);

// ── Start ────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🌱 Seedling API running on http://localhost:${env.PORT}`);
});

export default app;
