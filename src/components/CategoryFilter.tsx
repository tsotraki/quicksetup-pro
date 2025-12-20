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
    return (
        <div className="category-filter">
            <button
                className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => onSelectCategory(null)}
            >
                <Icons.Grid3x3 size={20} />
                <span>All Apps</span>
            </button>

            {categories.map(category => {
                const IconComponent = (Icons as any)[category.icon] || Icons.Package;

                return (
                    <button
                        key={category.id}
                        className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                        onClick={() => onSelectCategory(category.id)}
                    >
                        <IconComponent size={20} />
                        <span>{category.name}</span>
                        <span className="count">{category.count}</span>
                    </button>
                );
            })}
        </div>
    );
};
