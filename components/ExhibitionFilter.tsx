import React, { useState, useEffect } from 'react';
import { ExhibitionStatus, ExhibitionStatusLabel } from '../types';
import { exhibitionAPI } from '../services/exhibitionService';

interface ExhibitionFilterProps {
    onFilterChange: (filters: { status?: string; city?: string }) => void;
    activeFilters: { status?: string; city?: string };
}

const ExhibitionFilter: React.FC<ExhibitionFilterProps> = ({ onFilterChange, activeFilters }) => {
    const [cities, setCities] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // 获取有展览的城市列表
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const availableCities = await exhibitionAPI.getCities();
                setCities(availableCities);
            } catch (error) {
                console.error("Failed to fetch cities", error);
            }
        };
        fetchCities();
    }, []);

    return (
        <div className="mb-6 space-y-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                <button
                    onClick={() => onFilterChange({ ...activeFilters, status: undefined })}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${!activeFilters.status
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                        : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                        }`}
                >
                    全部状态
                </button>
                {Object.values(ExhibitionStatus).map((status) => (
                    <button
                        key={status}
                        onClick={() => {
                            onFilterChange({ ...activeFilters, status: status === activeFilters.status ? undefined : status });
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeFilters.status === status
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                            }`}
                    >
                        {ExhibitionStatusLabel[status] || status}
                    </button>
                ))}
            </div>

            {/* City Filter - 动态显示有展览的城市 */}
            {cities.length > 0 && (
                <div className={`relative transition-all duration-300 ${isExpanded ? 'active' : ''}`}>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => onFilterChange({ ...activeFilters, city: undefined })}
                            className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${!activeFilters.city
                                ? 'text-slate-900 bg-slate-100'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            全部地区
                        </button>
                        {(isExpanded ? cities : cities.slice(0, 7)).map(city => (
                            <button
                                key={city}
                                onClick={() => onFilterChange({ ...activeFilters, city: city === activeFilters.city ? undefined : city })}
                                className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${activeFilters.city === city
                                    ? 'text-primary bg-primary/5 font-bold'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {city}
                            </button>
                        ))}
                        {cities.length > 7 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="px-2 py-1 text-[10px] text-slate-300 flex items-center hover:text-slate-500"
                            >
                                {isExpanded ? '收起' : '更多'}
                                <span className="material-symbols-outlined text-[14px] ml-0.5">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExhibitionFilter;
