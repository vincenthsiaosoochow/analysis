import React from 'react';
import { Exhibition, ExhibitionStatus, ExhibitionStatusLabel } from '../types';

interface ExhibitionCardProps {
    exhibition: Exhibition;
    onClick: (id: number) => void;
}

const ExhibitionCard: React.FC<ExhibitionCardProps> = ({ exhibition, onClick }) => {
    // Format dates
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status: ExhibitionStatus) => {
        switch (status) {
            case ExhibitionStatus.ONGOING:
                return 'bg-emerald-500/90 text-white';
            case ExhibitionStatus.UPCOMING:
                return 'bg-amber-500/90 text-white';
            case ExhibitionStatus.ENDED:
                return 'bg-slate-400/90 text-white';
            default:
                return 'bg-slate-400/90 text-white';
        }
    };

    return (
        <div
            className="masonry-item group cursor-pointer break-inside-avoid mb-6"
            onClick={() => onClick(exhibition.id)}
        >
            <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98] bg-slate-50">
                <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                        src={exhibition.cover_image || 'https://picsum.photos/seed/art/400/600'}
                        alt={exhibition.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        crossOrigin="anonymous"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Status Badge */}
                <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-sm ${getStatusColor(exhibition.status)}`}>
                    {ExhibitionStatusLabel[exhibition.status] || exhibition.status}
                </div>

                {/* Date Badge */}
                <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px] text-white">calendar_month</span>
                    <span className="text-[10px] font-medium text-white">
                        {formatDate(exhibition.start_date)} - {formatDate(exhibition.end_date)}
                    </span>
                </div>
            </div>

            <div className="px-1 mt-3">
                <h3 className="font-bold text-slate-900 text-[14px] leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {exhibition.title}
                </h3>
                <div className="flex items-center gap-1 mt-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <p className="text-[11px] truncate">
                        {exhibition.city ? `${exhibition.city} · ` : ''}{exhibition.venue}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExhibitionCard;
