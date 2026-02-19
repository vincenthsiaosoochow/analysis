
import React, { useRef } from 'react';
import { ArtworkAnalysis } from '../types';

interface AnalysisViewProps {
  analysis: ArtworkAnalysis;
  onBack: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onLogin?: () => void;
}

const ReportLogo: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="size-11 bg-[#001A41] rounded-[12px] flex items-center justify-center shrink-0 shadow-sm">
      <span className="text-2xl text-white font-cal font-bold italic leading-none">F</span>
    </div>
    <div className="flex flex-col justify-center leading-none text-left">
      <span className="text-xl text-[#001A41] font-cal font-bold tracking-tight">FUHUNG</span>
      <span className="text-[10px] text-slate-400 font-bold tracking-[0.15em] uppercase mt-0.5">Art Analysis</span>
    </div>
  </div>
);

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onBack, isSaved = false, onToggleSave, onLogin }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'S': return 'bg-amber-500 text-white';
      case 'A': return 'bg-emerald-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-slate-400 text-white';
      default: return 'bg-slate-200 text-slate-500';
    }
  };



  const handleShare = async () => {
    const shareTitle = `${analysis.artist}-${analysis.title} | 分析报告`;
    const shareText = `这是由 FUHUNG AI 生成的专业艺术品投资分析报告，深度解析了作品《${analysis.title}》的艺术价值与市场潜力。`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${window.location.href}`);
      alert('分享链接已复制到剪贴板');
    }
  };

  const renderSafeContent = (content: any) => {
    if (!content) return null;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {content.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    }
    if (typeof content === 'object') {
      return (
        <div className="space-y-1">
          {Object.entries(content).map(([key, value], idx) => (
            <div key={idx}>
              <span className="font-semibold">{key}:</span> {String(value)}
            </div>
          ))}
        </div>
      );
    }
    return String(content);
  };

  return (
    <div className="bg-slate-50 min-h-screen animate-fade-in max-w-md mx-auto relative">
      <nav className="sticky top-0 z-[60] flex items-center bg-white/80 backdrop-blur-xl p-4 justify-between border-b border-slate-100">
        <button onClick={onBack} className="flex size-10 shrink-0 items-center justify-start text-slate-900">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h2 className="text-slate-900 text-base font-semibold tracking-tight flex-1 text-center">FUHUNG 专业报告</h2>
        <div className="flex w-10 items-center justify-end">
          <button onClick={onToggleSave} className={`flex items-center justify-center transition-colors ${isSaved ? 'text-red-500' : 'text-slate-400'}`}>
            <span className={`material-symbols-outlined text-2xl ${isSaved ? 'fill-current' : ''}`}>
              favorite
            </span>
          </button>
        </div>
      </nav>

      <main ref={reportRef} className="pb-24 bg-slate-50">
        <div className="px-5 py-6">
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-white p-2">
            <img alt={analysis.title} className="w-full h-full object-cover rounded-xl" src={analysis.imageUrl} crossOrigin="anonymous" />
          </div>
        </div>

        <div className="px-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-fuhung-blue text-xl">info</span>
              <h3 className="text-fuhung-blue text-sm font-bold tracking-widest uppercase">艺术品概览</h3>
            </div>
            <div className="flex justify-between items-start">
              <div className="space-y-1.5 flex-1">
                <p className="text-2xl font-bold text-slate-900 leading-tight">{analysis.title}</p>
                <p className="text-slate-400 text-[13px] flex flex-wrap items-center gap-x-2">
                  <span className="font-medium text-slate-500">{analysis.artist}</span>
                  <span className="text-slate-200">|</span>
                  <span>{analysis.artistGender || '未知'}</span>
                  <span className="text-slate-200">|</span>
                  <span>{analysis.origin}</span>
                </p>
              </div>
              <div className="h-10 w-10 bg-fuhung-light-blue rounded-full flex items-center justify-center shrink-0 ml-4">
                <span className="material-symbols-outlined text-fuhung-blue text-xl">palette</span>
              </div>
            </div>
          </div>

          {analysis.coreAnalysis && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-fuhung-blue text-xl">psychology</span>
                <h3 className="text-fuhung-blue text-sm font-bold tracking-widest uppercase">核心艺术分析</h3>
              </div>
              <div className="space-y-5">
                {[
                  { label: '艺术风格', content: renderSafeContent(analysis.coreAnalysis.styleAndSchool), icon: 'brush' },
                  { label: '色彩运用', content: renderSafeContent(analysis.coreAnalysis.colorUsage), icon: 'palette' },
                  { label: '笔触肌理', content: renderSafeContent(analysis.coreAnalysis.brushworkTexture), icon: 'texture' },
                  { label: '构图布局', content: renderSafeContent(analysis.coreAnalysis.compositionLayout), icon: 'grid_view' },
                  { label: '题材意境', content: renderSafeContent(analysis.coreAnalysis.themeAndMood), icon: 'mood' },
                  { label: '艺术价值', content: renderSafeContent(analysis.coreAnalysis.artisticValue), icon: 'stars' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="size-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-slate-400 text-sm">{item.icon}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {analysis.artistInfo ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-fuhung-blue text-xl">person_search</span>
                <h3 className="text-fuhung-blue text-sm font-bold tracking-widest uppercase">艺术家信息</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">基础信息</h4>
                  <div className="text-sm text-slate-600 leading-relaxed">{renderSafeContent(analysis.artistInfo.basics)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-fuhung-light-blue/30 rounded-xl">
                    <h4 className="text-[10px] font-bold text-fuhung-blue mb-1 uppercase">市场定位</h4>
                    <div className="text-[13px] text-slate-800 font-medium">{renderSafeContent(analysis.artistInfo.marketPosition)}</div>
                  </div>
                  <div className="p-3 bg-fuhung-light-blue/30 rounded-xl">
                    <h4 className="text-[10px] font-bold text-fuhung-blue mb-1 uppercase">风格演变</h4>
                    <div className="text-[13px] text-slate-800 font-medium">{renderSafeContent(analysis.artistInfo.styleEvolution)}</div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">代表作品与参考价</h4>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {renderSafeContent(analysis.artistInfo.representativeWorks)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
              <span className="material-symbols-outlined text-4xl text-slate-300">lock</span>
              <p className="text-sm font-bold text-slate-400">会员专享：艺术家详细档案</p>
            </div>
          )}

          {analysis.investmentAnalysis ? (
            <div className="bg-[#001A41] text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 size-40 bg-fuhung-blue/10 rounded-full blur-3xl"></div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-fuhung-blue text-2xl">trending_up</span>
                  <h3 className="text-slate-300 text-sm font-bold tracking-widest uppercase">投资价值分析</h3>
                </div>
                <div className={`size-12 rounded-xl flex flex-col items-center justify-center font-bold text-xl ${getRatingColor(analysis.investmentAnalysis.rating)}`}>
                  <span className="text-[8px] opacity-70 leading-none mb-1">GRADE</span>
                  {analysis.investmentAnalysis.rating}
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] text-fuhung-blue font-bold tracking-widest uppercase mb-2">评级依据</h4>
                  <div className="text-slate-300 text-sm leading-relaxed">{renderSafeContent(analysis.investmentAnalysis.ratingReason)}</div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h4 className="text-xs font-bold text-white mb-2">市场行情 (近3年)</h4>
                    <div className="text-xs text-slate-400">{renderSafeContent(analysis.investmentAnalysis.marketTrends)}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h4 className="text-xs font-bold text-white mb-2">收藏建议</h4>
                    <div className="text-xs text-slate-400">
                      {renderSafeContent(analysis.investmentAnalysis.collectionAdvice)}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2 text-red-400">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <h4 className="text-xs font-bold">风险提示</h4>
                  </div>
                  <div className="text-[11px] text-red-400/80 leading-relaxed">
                    {renderSafeContent(analysis.investmentAnalysis.riskAlert)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-[2rem] overflow-hidden group cursor-pointer" onClick={onLogin}>
              {/* 模糊背景 */}
              <div className="absolute inset-0 bg-[#001A41] blur-md opacity-90 scale-105"></div>

              <div className="relative z-10 bg-[#001A41]/80 backdrop-blur-xl p-10 flex flex-col items-center justify-center text-center py-20 border border-white/10 rounded-[2rem]">
                <div className="size-16 rounded-2xl bg-fuhung-blue/20 flex items-center justify-center mb-6 ring-1 ring-fuhung-blue/50">
                  <span className="material-symbols-outlined text-3xl text-fuhung-blue">lock</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">解锁专家级投资报告</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-xs">
                  立即登录，查看完整的艺术品价值评级、市场趋势分析及收藏风险提示。
                </p>
                <button className="bg-fuhung-blue hover:bg-fuhung-blue/90 text-white font-bold py-3 px-10 rounded-xl transition-all active:scale-95 shadow-lg shadow-fuhung-blue/20">
                  登录 / 注册
                </button>
              </div>
            </div>
          )}

          {/* Clean Footer for the Analysis Report */}
          <div className="pt-12 pb-12 mt-10 border-t border-slate-200 bg-white -mx-5 px-10 flex flex-col items-center justify-center">
            <div className="text-left">
              <div className="flex gap-2 items-start mb-2">
                <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0 mt-0.5">info</span>
                <p className="text-[10px] text-slate-500 font-bold">版权声明</p>
              </div>
              <p className="text-[9px] text-slate-400 px-1 leading-relaxed">
                用户自主上传的艺术品图片，其版权归属与合法性由上传用户自行承担。本平台 AI 生成的分析报告仅供参考，不构成任何投资建议。艺术品市场存在价格波动、流动性等风险，投资决策请审慎评估，平台不对相关投资损失承担法律责任。
              </p>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6"></div>

            <p className="text-slate-300 text-[9px] uppercase tracking-widest">© 2026 FUHUNG Art Analysis</p>
            <p className="text-slate-400 text-[10px] mt-1.5 hover:text-slate-600 transition-colors cursor-default underline decoration-slate-200">用户协议与隐私条款</p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex gap-4 max-w-md mx-auto z-50">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 bg-fuhung-blue text-white font-semibold py-4 rounded-xl shadow-lg shadow-fuhung-blue/20 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-xl">share</span>
          分享报告
        </button>
      </div>


    </div>
  );
};

export default AnalysisView;
