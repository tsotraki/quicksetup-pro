import express, { Express, Request, Response } from 'express';
// Deployment trigger: 2025-12-20T22:25:00Z
import cors from 'cors';
import appsRouter from './routes/apps.js';
import scriptRouter from './routes/script.js';
import aiRouter from './routes/ai.js';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:3000',
            'https://tsotraki.github.io'
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/apps', appsRouter);
app.use('/api/script', scriptRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root welcome/health check for Vercel
app.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', project: 'QuickSetup Pro API' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 QuickSetup Pro server running on port ${PORT}`);
    console.log(`📦 API available at /api`);
});

// Export for compatibility
export default app;
