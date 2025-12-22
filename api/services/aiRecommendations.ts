import { searchPackages } from './winget.js';

export interface App {
    id: string;
    name: string;
    wingetId: string;
    category: 'basics' | 'utilities' | 'developer' | 'media' | 'runtime';
    description: string;
    icon: string;
    popular: boolean;
    tags: string[];
}

/**
 * Calculate relevance score for an app based on search prompt
 */
function calculateRelevanceScore(app: App, prompt: string): number {
    const promptLower = prompt.toLowerCase();
    const words = promptLower.split(/\s+/);
    let score = 0;

    // Combine all searchable text
    const name = app.name.toLowerCase();
    const description = app.description.toLowerCase();
    const tags = app.tags.map(t => t.toLowerCase()).join(' ');
    const wingetId = app.wingetId.toLowerCase();

    // Exact name match = highest score
    if (name === promptLower) {
        score += 100;
    } else if (name.includes(promptLower)) {
        score += 50;
    }

    // Check each word in prompt
    words.forEach(word => {
        if (word.length < 2) return; // Skip very short words

        // Name contains word
        if (name.includes(word)) score += 20;

        // WingetId contains word
        if (wingetId.includes(word)) score += 15;

        // Tags contain word
        if (tags.includes(word)) score += 10;

        // Description contains word
        if (description.includes(word)) score += 5;
    });

    // Boost popular apps slightly
    if (app.popular) score += 5;

    return score;
}

/**
 * AI-powered app recommendations using intelligent search
 * Now works with ANY keyword by searching the winget API
 */
export async function getAIRecommendations(prompt: string): Promise<App[]> {
    try {
        // Search for packages using the prompt
        const searchResults = await searchPackages(prompt, 20, 0);

        if (!searchResults || searchResults.length === 0) {
            return [];
        }

        // Calculate relevance scores for each result
        const scoredResults = searchResults
            .map((app: any) => ({
                app,
                score: calculateRelevanceScore(app as App, prompt)
            }))
            .filter((result: any) => result.score > 0) // Only include results with some relevance
            .sort((a: any, b: any) => b.score - a.score); // Sort by score descending

        // Return top 8 most relevant apps
        const topResults = scoredResults.slice(0, 8).map((r: any) => r.app as App);

        return topResults;
    } catch (error) {
        console.error('[AI Recommendations] Error:', error);
        return [];
    }
}
