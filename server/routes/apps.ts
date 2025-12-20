import express, { Request, Response } from 'express';

import { getWingetPackageInfo, searchPackages, getPopularPackages } from '../services/winget';

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

        // If no explicit search but category is selected, map category to relevant search terms
        if (!searchQuery && category) {
            switch (category) {
                case 'basics': searchQuery = 'browser chat'; break;
                case 'developer': searchQuery = 'develop ide git'; break;
                case 'media': searchQuery = 'video audio player'; break;
                case 'runtime': searchQuery = 'runtime redistributable'; break;
                case 'utilities': searchQuery = 'utility tool'; break;
            }
        }

        // If we have a search query (explicit or from category) or we want to fetch more than the initial static set
        if (searchQuery || skipNum > 0) {
            console.log(`Searching Winget: query="${searchQuery}", category="${category || 'all'}", take=${takeNum}, skip=${skipNum}`);
            const results = await searchPackages(searchQuery, takeNum, skipNum);
            console.log(`Winget search returned ${results.length} results`);

            // Force category consistency for search results derived from category filters
            if (category && category !== 'popular' && results.length > 0) {
                results.forEach((app: any) => {
                    const validCategories = ['basics', 'utilities', 'developer', 'media', 'runtime'];
                    if (validCategories.includes(category as string)) {
                        app.category = category;
                    }
                });
            }

            return res.json(results);
        }

        // Fallback/Initial view
        console.log('Initial load: fetching from Winget...');
        const results = await searchPackages('', takeNum, skipNum);
        console.log(`Initial Winget fetch returned ${results.length} results`);

        // Force category consistency: if the user explicitly asked for a category (and we mapped it to a search),
        // ensure the results belong to that category visually.
        // This prevents the issue where searching for "Basics" returns an app classified as "Utilities",
        // causing the "Utilities" tab counter to increment instead of "Basics".
        if (category && category !== 'popular' && results.length > 0) {
            results.forEach((app: any) => {
                // Determine if the requested category is one of the valid App categories
                const validCategories = ['basics', 'utilities', 'developer', 'media', 'runtime'];
                if (validCategories.includes(category as string)) {
                    app.category = category;
                }
            });
        }


        // If Winget fails or returns empty for empty search, return empty (don't fallback to static)
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
router.get('/meta/categories', (req: Request, res: Response) => {
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
        const wingetInfo = await getWingetPackageInfo(id);
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
