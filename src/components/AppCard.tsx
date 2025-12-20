import React from 'react';
import type { App } from '../types';
import * as Icons from 'lucide-react';
import './AppCard.css';

interface AppCardProps {
    app: App;
    selected: boolean;
    onToggle: (appId: string) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, selected, onToggle }) => {
    // Get the icon component dynamically
    const IconComponent = (Icons as any)[app.icon] || Icons.Package;

    return (
        <div
            className={`app-card ${selected ? 'selected' : ''}`}
            onClick={() => onToggle(app.id)}
        >
            <div className="app-card-header">
                <div className="app-icon">
                    <IconComponent size={32} />
                </div>
                {app.popular && (
                    <span className="badge badge-primary">Popular</span>
                )}
            </div>

            <div className="app-card-body">
                <h3 className="app-name">{app.name}</h3>
                <p className="app-description">{app.description}</p>

                <div className="app-tags">
                    {app.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                    ))}
                </div>
            </div>

            <div className="app-card-footer">
                <span className="winget-id">{app.wingetId}</span>
                <div className={`checkbox ${selected ? 'checked' : ''}`}>
                    {selected && <Icons.Check size={16} />}
                </div>
            </div>
        </div>
    );
};
