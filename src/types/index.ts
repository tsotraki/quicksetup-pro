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

export interface Category {
    id: string;
    name: string;
    icon: string;
    count: number;
}

export interface ScriptResponse {
    script: string;
    appCount: number;
    apps: Array<{
        id: string;
        name: string;
        wingetId: string;
    }>;
}

export interface AIRecommendationResponse {
    prompt: string;
    recommendations: App[];
    count: number;
}
