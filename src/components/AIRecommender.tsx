import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import './AIRecommender.css';

interface AIRecommenderProps {
    onRecommend: (prompt: string) => Promise<void>;
    isLoading: boolean;
}

export const AIRecommender: React.FC<AIRecommenderProps> = ({ onRecommend, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const suggestions = [
        'Setup for web development',
        'Gaming PC essentials',
        'Content creation and streaming',
        'Office and productivity',
        'Python data science setup',
        'Basic new PC setup'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            await onRecommend(prompt);
            setPrompt('');
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
        onRecommend(suggestion);
    };

    return (
        <div className={`ai-recommender ${isExpanded ? 'expanded' : ''}`}>
            <button
                className="ai-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <Sparkles size={20} />
                <span>AI Recommendations</span>
            </button>

            {isExpanded && (
                <div className="ai-content fade-in">
                    <p className="ai-description">
                        Describe your setup needs and get AI-powered app recommendations
                    </p>

                    <form onSubmit={handleSubmit} className="ai-form">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Setup for web development and design"
                            disabled={isLoading}
                            className="ai-input"
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || !prompt.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="spinner-icon" />
                                    <span>Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    <span>Get Recommendations</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="ai-suggestions">
                        <p className="suggestions-label">Quick suggestions:</p>
                        <div className="suggestions-grid">
                            {suggestions.map(suggestion => (
                                <button
                                    key={suggestion}
                                    className="suggestion-chip"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    disabled={isLoading}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
