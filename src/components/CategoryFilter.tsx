import React from 'react';
import type { Category } from '../types';
import * as Icons from 'lucide-react';
import './CategoryFilter.css';

interface CategoryFilterProps {
    categories: Category[];
    selectedCategory: string | null;
    onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
    categories,
    selectedCategory,
    onSelectCategory
}) => {
    // Separate "Popular" from other categories
    const popularCategory = categories.find(cat => cat.id === 'popular');
    const otherCategories = categories.filter(cat => cat.id !== 'popular');

    return (
        <div className="category-filter-container">
            {/* Main Tabs Row: All Apps & Popular */}
            <div className="main-tabs">
                <button
                    className={`main-tab ${selectedCategory === null ? 'active' : ''}`}
                    onClick={() => onSelectCategory(null)}
                >
                    <Icons.Grid3x3 size={22} />
                    <span>All Apps</span>
                </button>

                {popularCategory && (
                    <button
                        className={`main-tab ${selectedCategory === 'popular' ? 'active' : ''}`}
                        onClick={() => onSelectCategory('popular')}
                    >
                        <Icons.Zap size={22} />
                        <span>Popular</span>
                        {popularCategory.count > 0 && (
                            <span className="count">{popularCategory.count}</span>
                        )}
                    </button>
                )}
            </div>

            {/* Category Tabs Row */}
            <div className="category-tabs">
                {otherCategories.map(category => {
                    const IconComponent = (Icons as any)[category.icon] || Icons.Package;

                    return (
                        <button
                            key={category.id}
                            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                            onClick={() => onSelectCategory(category.id)}
                        >
                            <IconComponent size={18} />
                            <span>{category.name}</span>
                            {category.count > 0 && (
                                <span className="count">{category.count}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
