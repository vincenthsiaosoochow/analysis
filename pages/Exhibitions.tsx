import React, { useState, useEffect, useMemo } from 'react';
import { Exhibition, ExhibitionFilterState } from '../types';
import { exhibitionAPI } from '../services/exhibitionService';
import ExhibitionCard from '../components/ExhibitionCard';
import ExhibitionFilter from '../components/ExhibitionFilter';

interface ExhibitionsProps {
    onNavigateDetail: (id: number) => void;
    onBack: () => void;
}

const Exhibitions: React.FC<ExhibitionsProps> = ({ onNavigateDetail, onBack }) => {
    const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState<ExhibitionFilterState>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        fetchExhibitions();
    }, [filters]);

    // Handle scroll for back-to-top button
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchExhibitions = async () => {
        setIsLoading(true);
        try {
            const data = await exhibitionAPI.getExhibitions(filters);
            setExhibitions(data);
        } catch (error) {
            console.error("Failed to fetch exhibitions", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Client-side search for now, or trigger API with debouncing (API supports keyword)
    // Here implementing API call on search enter or button
    const handleSearch = () => {
        setFilters(prev => ({ ...prev, keyword: searchQuery }));
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="animate-fade-in min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md pt-6 pb-4 px-4 shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-4 max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="material-symbols-outlined text-slate-400 hover:text-slate-600">arrow_back</button>
                        <h1 className="text-2xl font-bold text-slate-900">全球艺术展览</h1>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="max-w-5xl mx-auto mb-4">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="搜索展览、展馆或艺术家..."
                            className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setFilters(prev => ({ ...prev, keyword: '' })) }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 hover:text-slate-500"
                            >
                                close
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="max-w-5xl mx-auto">
                    <ExhibitionFilter
                        activeFilters={filters}
                        onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
                    />
                </div>
            </header>

            {/* List Content */}
            <main className="px-4 max-w-5xl mx-auto mt-2">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="size-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : exhibitions.length > 0 ? (
                    <div className="masonry-container">
                        {exhibitions.map(ex => (
                            <ExhibitionCard key={ex.id} exhibition={ex} onClick={onNavigateDetail} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center flex flex-col items-center">
                        <span className="material-symbols-outlined text-slate-200 text-5xl mb-4">event_busy</span>
                        <p className="text-slate-400 text-sm">暂无符合条件的展览</p>
                    </div>
                )}
            </main>

            {/* Back to Top */}
            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-6 bg-white border border-slate-100 shadow-xl rounded-full p-3 text-slate-500 hover:text-primary transition-all z-30 flex items-center justify-center active:scale-95"
                >
                    <span className="material-symbols-outlined">arrow_upward</span>
                </button>
            )}
        </div>
    );
};

export default Exhibitions;
