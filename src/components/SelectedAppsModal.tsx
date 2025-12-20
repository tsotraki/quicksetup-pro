import React, { useRef, useEffect } from 'react';
import { X, Trash2, Download } from 'lucide-react';
import type { App } from '../types';
import './SelectedAppsModal.css';

interface SelectedAppsModalProps {
    apps: App[];
    isOpen: boolean;
    onClose: () => void;
    onRemove: (app: App) => void;
    onGenerate: (format: 'ps1' | 'bat') => void;
}

export const SelectedAppsModal: React.FC<SelectedAppsModalProps> = ({
    apps,
    isOpen,
    onClose,
    onRemove,
    onGenerate
}) => {
    const [format, setFormat] = React.useState<'ps1' | 'bat'>('ps1');
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" ref={modalRef}>
                <div className="modal-header">
                    <h2>Selected Apps ({apps.length})</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="selected-list">
                    {apps.length === 0 ? (
                        <p className="empty-message">No apps selected yet.</p>
                    ) : (
                        apps.map((app) => (
                            <div key={app.id} className="selected-item">
                                <div className="item-info">
                                    <span className="item-name">{app.name}</span>
                                    <span className="item-id">{app.wingetId}</span>
                                </div>
                                <button
                                    className="remove-btn"
                                    onClick={() => onRemove(app)}
                                    title="Remove"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-footer">
                    <div className="format-selector">
                        <span>Format:</span>
                        <div className="format-options">
                            <button
                                className={`format-btn ${format === 'ps1' ? 'active' : ''}`}
                                onClick={() => setFormat('ps1')}
                            >
                                .ps1 (PowerShell)
                            </button>
                            <button
                                className={`format-btn ${format === 'bat' ? 'active' : ''}`}
                                onClick={() => setFormat('bat')}
                            >
                                .bat (Batch)
                            </button>
                        </div>
                    </div>
                    <div className="footer-actions">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Keep Browsing
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => onGenerate(format)}
                            disabled={apps.length === 0}
                        >
                            <Download size={18} />
                            Generate Script
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
