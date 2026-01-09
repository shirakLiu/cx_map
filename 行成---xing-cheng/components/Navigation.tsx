import React from 'react';
import { TabView } from '../types';

interface NavigationProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: TabView.MAP, icon: '🗺️', label: '地图' },
    { id: TabView.TASKS, icon: '📜', label: '任务' },
    { id: TabView.MUSEUM, icon: '🏛️', label: '博物馆' },
    { id: TabView.TRADE, icon: '⚖️', label: '市集' },
    { id: TabView.PROFILE, icon: '👤', label: '我的' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-earth-800 text-earth-100 pb-safe pt-2 border-t-4 border-gold-500 shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full transition-all duration-300 ${
                isActive ? 'text-gold-400 -translate-y-1' : 'text-earth-200 opacity-70'
              }`}
            >
              <span className="text-2xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
      {/* Safe Area for iPhone Home Indicator */}
      <div className="h-4 w-full bg-earth-800"></div> 
    </div>
  );
};

export default Navigation;