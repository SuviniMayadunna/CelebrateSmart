import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/database';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import { authenticate, requireAdmin } from './middleware/auth';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL via Prisma
connectDB();

// Middleware
const configuredClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedClientOrigins = new Set(
  configuredClientUrl
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, Postman)
      if (!origin) return callback(null, true);

      // Always allow configured client origin(s)
      if (allowedClientOrigins.has(origin)) return callback(null, true);

      // Always allow localhost / loopback origins (any port)
      try {
        const url = new URL(origin);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') {
          return callback(null, true);
        }
      } catch {
        // ignore
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Admin routes (requires authentication + admin role)
app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

// Protected route example (requires authentication)
app.get('/api/protected', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'This is a protected route',
    user: req.user,
  });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'CelebrateSmart API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/api/health',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🎉 CelebrateSmart API Server Running   ║
║                                           ║
║   Port: ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
║   Database: PostgreSQL                    ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await disconnectDB();
  process.exit(0);
});

export default app;
