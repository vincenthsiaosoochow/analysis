import React from 'react';

/**
 * 艺术品卡片骨架屏（瀑布流）
 */
export const SkeletonArtworkCard: React.FC = () => {
    const randomHeight = Math.random() * 100 + 250;

    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm mb-3">
            <div
                className="w-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer"
                style={{ height: `${randomHeight}px` }}
            ></div>
            <div className="p-3 space-y-2">
                <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer rounded w-4/5"></div>
                <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer rounded w-2/3"></div>
            </div>
        </div>
    );
};

/**
 * 艺术品列表骨架屏容器（瀑布流布局）
 */
export const SkeletonArtworkList: React.FC = () => {
    return (
        <div className="masonry-container px-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="masonry-item">
                    <SkeletonArtworkCard />
                </div>
            ))}
        </div>
    );
};
