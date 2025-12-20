import express, { Request, Response } from 'express';
import { generatePowerShellScript, generateBatchScript } from '../services/scriptGenerator.js';


const router = express.Router();

// Generate installation script
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const { apps: selectedApps, format = 'ps1' } = req.body;

        if (!selectedApps || !Array.isArray(selectedApps) || selectedApps.length === 0) {
            return res.status(400).json({ error: 'No apps selected' });
        }

        // Generate script based on format
        const script = format === 'bat'
            ? generateBatchScript(selectedApps)
            : generatePowerShellScript(selectedApps);

        res.json({
            script,
            appCount: selectedApps.length,
            apps: selectedApps.map(app => ({
                id: app.id,
                name: app.name,
                wingetId: app.wingetId
            }))
        });
    } catch (error) {
        console.error('Script generation error:', error);
        res.status(500).json({ error: 'Failed to generate script' });
    }
});

export default router;
