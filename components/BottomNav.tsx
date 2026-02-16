import React from 'react';
import { AppTab } from '../types';

interface BottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: AppTab.HOME, label: '首页', icon: 'home' },
    { id: AppTab.DISCOVER, label: '发现', icon: 'explore' },
    { id: AppTab.EXHIBITIONS, label: '展览', icon: 'museum' }, // Added Exhibition tab
    { id: AppTab.PROFILE, label: '我的', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 pt-3 pb-8 flex items-center justify-around z-50 max-w-md mx-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-1 transition-colors active:scale-95 ${currentTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <span className={`material-symbols-outlined text-[24px] ${currentTab === tab.id ? 'fill-current' : ''}`}>
            {tab.icon}
          </span>
          <span className={`text-[10px] ${currentTab === tab.id ? 'font-bold' : 'font-medium'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
