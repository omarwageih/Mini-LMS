import React from 'react';
import { Search, X } from 'lucide-react';

const SearchFilter = ({ 
    searchValue, 
    onSearchChange, 
    placeholder = 'Search...',
    filters = [],  // [{label, value, options: [{label, value}]}]
    filterValues = {},
    onFilterChange,
    className = ''
}) => {
    return (
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}>
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
                {searchValue && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={14} className="text-slate-400" />
                    </button>
                )}
            </div>

            {/* Filter Dropdowns */}
            {filters.map((filter) => (
                <select
                    key={filter.value}
                    value={filterValues[filter.value] || ''}
                    onChange={(e) => onFilterChange(filter.value, e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none min-w-[140px]"
                >
                    <option value="">{filter.label}</option>
                    {filter.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ))}
        </div>
    );
};

export default SearchFilter;
