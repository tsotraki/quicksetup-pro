import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import appsRouter from './routes/apps';
import scriptRouter from './routes/script';
import aiRouter from './routes/ai';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/apps', appsRouter);
app.use('/api/script', scriptRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 QuickSetup Pro server running on http://localhost:${PORT}`);
    console.log(`📦 API available at http://localhost:${PORT}/api `);
});
