import React from 'react';

/**
 * 展览卡片骨架屏
 */
export const SkeletonExhibitionCard: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            {/* 图片骨架 */}
            <div className="w-full h-64 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer"></div>

            {/* 内容骨架 */}
            <div className="p-4 space-y-3">
                {/* 标题 */}
                <div className="h-5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer rounded w-3/4"></div>

                {/* 场馆/城市 */}
                <div className="space-y-2">
                    <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer rounded w-1/2"></div>
                    <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer rounded w-1/3"></div>
                </div>

                {/* 日期 */}
                <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer rounded w-2/3"></div>
            </div>
        </div>
    );
};

/**
 * 艺术品卡片骨架屏（瀑布流）
 */
export const SkeletonArtworkCard: React.FC = () => {
    const randomHeight = Math.random() * 100 + 250; // 250-350px随机高度

    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm mb-3">
            {/* 图片骨架 - 随机高度模拟瀑布流 */}
            <div
                className="w-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer"
                style={{ height: `${randomHeight}px` }}
            ></div>

            {/* 内容骨架 */}
            <div className="p-3 space-y-2">
                <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer rounded w-4/5"></div>
                <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer rounded w-2/3"></div>
            </div>
        </div>
    );
};

/**
 * 展览列表骨架屏容器（网格布局）
 */
export const SkeletonExhibitionList: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {[...Array(6)].map((_, i) => (
                <SkeletonExhibitionCard key={i} />
            ))}
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
