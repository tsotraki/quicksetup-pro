import express, { Request, Response } from 'express';

import { getWingetPackageInfo, searchPackages, getPopularPackages } from '../services/winget.js';
const router = express.Router();

// Get all apps (with pagination and search)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { search, category, take = '12', skip = '0' } = req.query;

        // Convert query params to numbers
        const takeNum = parseInt(take as string);
        const skipNum = parseInt(skip as string);

        let searchQuery = (search as string) || '';

        // If category is 'popular', use the dedicated fetcher
        if (category === 'popular' && !searchQuery) {
            console.log(`Fetching popular packages: take=${takeNum}, skip=${skipNum}`);
            const results = await getPopularPackages(takeNum, skipNum);
            return res.json(results);
        }

        // Determine search query based on category
        if (!searchQuery && category) {
            switch (category) {
                case 'basics': searchQuery = 'browser communication social vpn chat message'; break;
                case 'developer': searchQuery = 'code ide editor git sdk program develop terminal'; break;
                case 'media': searchQuery = 'video audio music player image photo stream codec'; break;
                case 'runtime': searchQuery = 'runtime framework redistributable library driver directx'; break;
                case 'utilities': searchQuery = 'utility tool archive compress file system utility'; break;
            }
        }

        // Search for packages
        if (searchQuery || skipNum > 0) {
            console.log(`Searching Winget: query="${searchQuery}", category="${category || 'all'}", take=${takeNum}, skip=${skipNum}`);

            // Fetch more results to allow for filtering
            const fetchCount = category && category !== 'popular' ? takeNum * 3 : takeNum;
            const results = await searchPackages(searchQuery, fetchCount, skipNum);
            console.log(`Winget search returned ${results.length} results`);

            // Filter by actual category if a category is selected
            let filteredResults = results;
            if (category && category !== 'popular') {
                filteredResults = results.filter((app: any) => app.category === category);
                console.log(`Filtered to ${filteredResults.length} apps in category "${category}"`);
            }

            // Return requested number of results
            const finalResults = filteredResults.slice(0, takeNum);
            return res.json(finalResults);
        }


        // Fallback/Initial view (no category, no search)
        console.log('Initial load: fetching from Winget...');
        const results = await searchPackages('', takeNum, skipNum);
        console.log(`Initial Winget fetch returned ${results.length} results`);

        // If Winget fails or returns empty, return empty array
        if (results.length === 0 && skipNum === 0) {
            console.log('Winget returned empty');
            return res.json([]);
        }

        res.json(results);

    } catch (error) {
        console.error('Error fetching apps:', error);
        res.status(500).json({ error: 'Failed to fetch apps' });
    }
});

// Get categories (MUST be before /:id to avoid route matching issues)
router.get('/meta/categories', (_req: Request, res: Response) => {
    const categories = [
        { id: 'popular', name: 'Popular', icon: 'Star', count: 0 },
        { id: 'basics', name: 'Basics', icon: 'Globe', count: 0 },
        { id: 'utilities', name: 'Utilities', icon: 'Wrench', count: 0 },
        { id: 'developer', name: 'Developer', icon: 'Code', count: 0 },
        { id: 'media', name: 'Media', icon: 'PlayCircle', count: 0 },
        { id: 'runtime', name: 'Runtime', icon: 'Cpu', count: 0 }
    ];

    res.json(categories);
});

// Get app by ID
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const wingetInfo = await getWingetPackageInfo(id || '');
        if (!wingetInfo) {
            return res.status(404).json({ error: 'App not found' });
        }

        // Construct App object from Winget info
        const app = {
            ...wingetInfo,
            id: id,
            name: id, // We might not get the full name easily from just getWingetPackageInfo without search, but let's try
            wingetId: id,
            category: 'utilities', // Default
            description: 'Fetched from Winget',
            icon: 'Package',
            popular: false,
            tags: [],
        };

        res.json(app);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch app details' });
    }
});

export default router;
