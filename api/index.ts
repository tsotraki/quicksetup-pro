import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import appsRouter from './routes/apps.js';
import scriptRouter from './routes/script.js';
import aiRouter from './routes/ai.js';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://tsotraki.github.io'
    ],
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

// Only start server if not in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 QuickSetup Pro server running on http://localhost:${PORT}`);
        console.log(`📦 API available at http://localhost:${PORT}/api `);
    });
}

// Export for Vercel
export default app;
