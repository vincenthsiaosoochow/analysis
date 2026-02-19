import React, { useEffect, useState } from 'react';
import { Exhibition, ExhibitionStatus, ExhibitionStatusLabel } from '../types';
import { exhibitionAPI } from '../services/exhibitionService';

interface ExhibitionDetailProps {
    id: number;
    onBack: () => void;
    currentUserId?: number; // Pass this if available to check ownership if needed elsewhere, 
    // but service handles favorite status mostly.
    onNavigateVenue?: (venue: string) => void;
}

const ExhibitionDetail: React.FC<ExhibitionDetailProps> = ({ id, onBack, onNavigateVenue }) => {
    const [exhibition, setExhibition] = useState<Exhibition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavoriting, setIsFavoriting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            try {
                const data = await exhibitionAPI.getExhibition(id);
                setExhibition(data);
            } catch (error) {
                console.error("Failed to fetch exhibition detail", error);
                alert("获取展览详情失败");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleToggleFavorite = async () => {
        if (!exhibition) return;

        setIsFavoriting(true);
        try {
            const result = await exhibitionAPI.toggleFavorite(exhibition.id);
            setExhibition(prev => prev ? { ...prev, is_favorited: result.is_favorited } : null);
        } catch (error) {
            console.error("Toggle favorite failed", error);
            // Assuming 401 means not logged in
            alert("请先登录会员");
        } finally {
            setIsFavoriting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="size-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!exhibition) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    };

    return (
        <div className="min-h-screen bg-white animate-fade-in pb-20">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium">
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm">返回列表</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleFavorite}
                            disabled={isFavoriting}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-95 ${exhibition.is_favorited
                                ? 'bg-red-50 border-red-100 text-red-500'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${exhibition.is_favorited ? 'fill-current' : ''}`}>favorite</span>
                            <span className="text-xs font-bold">{exhibition.is_favorited ? '已收藏' : '收藏'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto">
                {/* Hero Image */}
                <div className="relative aspect-video w-full bg-slate-100 md:rounded-b-3xl overflow-hidden">
                    <img
                        src={exhibition.cover_image || 'https://picsum.photos/seed/art/800/600'}
                        alt={exhibition.title}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur p-2 rounded-lg text-white text-center min-w-[60px]">
                        <div className="text-[10px] opacity-80 uppercase tracking-widest leading-none mb-1">Status</div>
                        <div className="text-sm font-bold">{ExhibitionStatusLabel[exhibition.status as ExhibitionStatus] || exhibition.status}</div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-2">
                        {exhibition.title}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-8">
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                        <span>{exhibition.city}</span>
                        <span>·</span>
                        {/* Venue Link */}
                        <button
                            onClick={() => onNavigateVenue && onNavigateVenue(exhibition.venue)}
                            className="text-primary font-bold hover:underline"
                        >
                            {exhibition.venue}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary">calendar_clock</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-1">展览时间</h3>
                                    <p className="text-sm text-slate-600">
                                        {formatDate(exhibition.start_date)} - {formatDate(exhibition.end_date)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-purple-600">confirmation_number</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-1">门票信息</h3>
                                    <p className="text-sm text-slate-600 whitespace-pre-line">
                                        {exhibition.ticket_info || '暂无门票信息'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="size-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-orange-600">map</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-1">详细地址</h3>
                                    <p className="text-sm text-slate-600">
                                        {exhibition.address || exhibition.venue}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400">info</span>
                                展览介绍
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {exhibition.description || '暂无详细介绍'}
                            </p>
                            {exhibition.official_link && (
                                <a
                                    href={exhibition.official_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 mt-6 text-xs text-primary font-bold hover:underline"
                                >
                                    访问官网 <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Copyright Notice */}
                    <div className="mt-12 pt-8 border-t border-slate-100">
                        <div className="flex gap-3 items-start">
                            <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">info</span>
                            <p className="text-xs leading-relaxed text-slate-500">
                                <span className="font-bold text-slate-700">版权声明：</span>
                                展览图文资讯均来源于各美术馆、艺术机构官方发布及公开合法渠道，仅用于非商业性艺术分享与交流。相关素材版权归原作者、美术馆及艺术机构所有。若有版权方异议，请联系我们。
                            </p>
                        </div>
                    </div>

                    {/* Global Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-slate-300 text-[9px] uppercase tracking-widest">© 2026 FUHUNG Art Analysis</p>
                        <p className="text-slate-400 text-[10px] mt-1.5 hover:text-slate-600 transition-colors cursor-default underline decoration-slate-200">用户协议与隐私条款</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExhibitionDetail;
