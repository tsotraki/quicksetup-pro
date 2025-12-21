import axios from 'axios';
import type { App, Category, ScriptResponse, AIRecommendationResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
    // Get all apps with optional filters and pagination
    getApps: async (params?: { category?: string; search?: string; popular?: boolean; take?: number; skip?: number }): Promise<App[]> => {
        const response = await axios.get(`${API_BASE_URL}/apps`, { params });
        return response.data;
    },

    // Get single app by ID
    getApp: async (id: string): Promise<App> => {
        const response = await axios.get(`${API_BASE_URL}/apps/${id}`);
        return response.data;
    },

    // Get categories
    getCategories: async (): Promise<Category[]> => {
        const response = await axios.get(`${API_BASE_URL}/apps/meta/categories`);
        return response.data;
    },

    // Generate installation script
    generateScript: async (apps: { id: string; name: string; wingetId: string }[], format: 'ps1' | 'bat' = 'ps1'): Promise<ScriptResponse> => {
        const response = await axios.post(`${API_BASE_URL}/script/generate`, { apps, format });
        return response.data;
    },

    // Get AI recommendations
    getAIRecommendations: async (prompt: string): Promise<AIRecommendationResponse> => {
        const response = await axios.post(`${API_BASE_URL}/ai/recommend`, { prompt });
        return response.data;
    }
};
