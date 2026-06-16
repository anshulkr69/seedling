import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ──────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

// ── Health check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'seedling-api' })
})

// ── Routes ──────────────────────────────────────────────
// TODO (Anshu): Mount routes as you build them:
// import authRoutes from './routes/auth.routes'
// import orgRoutes from './routes/org.routes'
// import projectRoutes from './routes/projects.routes'
// import grantsRoutes from './routes/grants.routes'
// import applicationsRoutes from './routes/applications.routes'
// import engineRoutes from './routes/engine.routes'
//
// app.use('/auth', authRoutes)
// app.use('/org', orgRoutes)
// app.use('/org/projects', projectRoutes)
// app.use('/grants', grantsRoutes)
// app.use('/applications', applicationsRoutes)
// app.use('/engine', engineRoutes)

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌱 Seedling API running on http://localhost:${PORT}`)
})

export default app
