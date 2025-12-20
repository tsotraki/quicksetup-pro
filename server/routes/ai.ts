import express, { Request, Response } from 'express';
import { getAIRecommendations } from '../services/aiRecommendations.js';

const router = express.Router();

// Get AI-recommended apps based on user description
router.post('/recommend', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const recommendations = await getAIRecommendations(prompt);

        res.json({
            prompt,
            recommendations,
            count: recommendations.length
        });
    } catch (error) {
        console.error('AI recommendation error:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

export default router;
