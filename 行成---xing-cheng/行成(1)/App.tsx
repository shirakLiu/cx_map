import React, { useState, useEffect, useCallback } from 'react';
import { TabView, UserProfile, Achievement, GameState, ItemType, Rarity, Item } from './types';
import { ACHIEVEMENTS_DB, INITIAL_LAT, INITIAL_LNG, LEVEL_FORMULA, ITEMS_DB } from './constants';
import * as GameService from './services/gameService';
import * as GeminiService from './services/geminiService';

// Components
import Navigation from './components/Navigation';
import MapView from './components/MapView';

// Icons
const ICON_GEAR = (
  <svg xmlns="www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l-.527.738c.32.447.27.88-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-.88.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.774a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Helpers
const getRarityClass = (rarity: Rarity) => `rarity-${rarity}`;

const getRarityLabel = (rarity: Rarity) => {
  switch(rarity) {
    case 'common': return '凡品';
    case 'rare': return '精品';
    case 'epic': return '珍宝';
    case 'legendary': return '传世';
    default: return '未知';
  }
};

const App = () => {
  // State
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.MAP);
  const [user, setUser] = useState<UserProfile>(GameService.getInitialProfile());
  const [coords, setCoords] = useState({ lat: INITIAL_LAT, lng: INITIAL_LNG });
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isExcavating, setIsExcavating] = useState(false);
  const [excavationTime, setExcavationTime] = useState(0);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [oracleLore, setOracleLore] = useState<string>("");
  const [isOracleThinking, setIsOracleThinking] = useState(false);
  
  // New State for Item Detail Modal
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  
  // Trade Filter State
  const [marketFilter, setMarketFilter] = useState<Rarity | 'all'>('all');

  // Initialize
  useEffect(() => {
    const saved = GameService.loadGame();
    if (saved) {
      setUser(saved);
    } else {
      GameService.saveGame(user);
    }
  }, []);

  // Persistence Effect
  useEffect(() => {
    GameService.saveGame(user);
  }, [user]);

  // Level Up Check
  useEffect(() => {
    const correctLevel = GameService.calculateLevel(user.xp);
    if (correctLevel > user.level) {
      addNotification(`恭喜升级！当前等级: ${correctLevel}`);
      setUser(prev => ({ ...prev, level: correctLevel }));
    }
  }, [user.xp, user.level]);

  // Achievement Check Logic
  const checkAchievements = useCallback(() => {
    ACHIEVEMENTS_DB.forEach(ach => {
      if (user.unlockedAchievements.includes(ach.id)) return;

      let unlocked = false;

      // Location Trigger
      if (ach.targetLat && ach.targetLng && ach.triggerRadius) {
        const R = 6371e3; 
        const φ1 = coords.lat * Math.PI/180;
        const φ2 = ach.targetLat * Math.PI/180;
        const Δφ = (ach.targetLat-coords.lat) * Math.PI/180;
        const Δλ = (ach.targetLng-coords.lng) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        if (d <= ach.triggerRadius) unlocked = true;
      }

      // Special Trigger: Hometown (Residency > 5 years/1825 days)
      if (ach.id === 'hometown' && user.residenceDays >= 1825) {
        unlocked = true;
      }

      if (unlocked) {
        addNotification(`解锁成就: ${ach.title} [${getRarityLabel(ach.rarity)}]`);
        const newInventory = [...user.inventory];
        if (ach.rewardItem) newInventory.push(ach.rewardItem);
        
        setUser(prev => ({
          ...prev,
          xp: prev.xp + ach.rewardXp,
          inventory: newInventory,
          unlockedAchievements: [...prev.unlockedAchievements, ach.id]
        }));
      }
    });
  }, [coords, user.unlockedAchievements, user.inventory, user.residenceDays]);

  // Location Monitor
  useEffect(() => {
    checkAchievements();
  }, [coords, checkAchievements]);

  const addNotification = (msg: string) => {
    setNotifications(prev => [...prev, msg]);
    setTimeout(() => setNotifications(prev => prev.slice(1)), 3000);
  };

  // --- ACTIONS ---

  const startExcavation = () => {
    setIsExcavating(true);
    setExcavationTime(5); 
    const interval = setInterval(() => {
      setExcavationTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishExcavation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishExcavation = () => {
    setIsExcavating(false);
    // RNG Logic for Rarity
    // 60% Common, 30% Rare, 9% Epic, 1% Legendary
    const roll = Math.random() * 100;
    let selectedRarity: Rarity = 'common';
    if (roll > 99) selectedRarity = 'legendary';
    else if (roll > 90) selectedRarity = 'epic';
    else if (roll > 60) selectedRarity = 'rare';

    // Find items of this rarity
    const possibleItems = Object.values(ITEMS_DB).filter(i => i.rarity === selectedRarity);
    
    if (possibleItems.length > 0) {
      const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      addNotification(`考古发现: ${item.name} [${getRarityLabel(item.rarity)}]`);
      setUser(prev => ({ ...prev, inventory: [...prev.inventory, item.id], xp: prev.xp + 50 }));
    } else {
      addNotification("除了一堆泥土，什么也没发现...");
      setUser(prev => ({ ...prev, xp: prev.xp + 10 }));
    }
  };

  const consultOracle = async () => {
    setIsOracleThinking(true);
    setOracleLore("聆听地脉中...");
    const lore = await GeminiService.generateLocationLore(coords.lat, coords.lng);
    setOracleLore(lore);
    setIsOracleThinking(false);
  };

  const handleBuyItem = (item: Item) => {
    if (user.currency >= item.price) {
      setUser(prev => ({
        ...prev,
        currency: prev.currency - item.price,
        inventory: [...prev.inventory, item.id]
      }));
      addNotification(`购入: ${item.name}`);
    } else {
      addNotification("通宝不足！");
    }
  };

  // --- VIEWS ---

  const renderItemModal = () => {
    if (!viewingItem) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingItem(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
          <div className={`h-40 flex items-center justify-center text-7xl bg-gradient-to-br ${
            viewingItem.rarity === 'legendary' ? 'from-amber-100 to-amber-300' : 
            viewingItem.rarity === 'epic' ? 'from-purple-100 to-purple-300' :
            viewingItem.rarity === 'rare' ? 'from-blue-100 to-blue-300' :
            'from-gray-100 to-gray-300'
          }`}>
            <span className="drop-shadow-lg">{viewingItem.icon}</span>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-earth-900">{viewingItem.name}</h3>
              <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getRarityClass(viewingItem.rarity)} uppercase opacity-80`}>
                {getRarityLabel(viewingItem.rarity)}
              </span>
            </div>
            <div className="text-xs text-earth-500 mb-3 font-bold uppercase tracking-wider">{viewingItem.type === ItemType.BEAST ? '瑞兽 (Beast)' : '文物 (Artifact)'}</div>
            <p className="text-sm text-earth-700 mb-6 leading-relaxed">
              {viewingItem.description}
            </p>
            <button 
              onClick={() => setViewingItem(null)}
              className="w-full py-3 bg-earth-800 text-white rounded-xl text-sm font-bold hover:bg-earth-700 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDebugPanel = () => (
    <div className={`fixed top-16 right-4 p-4 bg-white/95 rounded-lg shadow-xl z-50 w-64 border border-earth-300 transition-transform ${isDebugOpen ? 'translate-x-0' : 'translate-x-[200%]'}`}>
      <h3 className="font-bold text-earth-800 border-b border-earth-200 pb-2 mb-2">🛠 天神模式 (Debug)</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-earth-600 block">纬度 (Lat)</label>
          <input 
            type="number" 
            step="0.0001"
            value={coords.lat} 
            onChange={(e) => setCoords({...coords, lat: parseFloat(e.target.value)})}
            className="w-full p-1 border rounded text-sm bg-earth-50"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-earth-600 block">经度 (Lng)</label>
          <input 
            type="number" 
            step="0.0001"
            value={coords.lng} 
            onChange={(e) => setCoords({...coords, lng: parseFloat(e.target.value)})}
            className="w-full p-1 border rounded text-sm bg-earth-50"
          />
        </div>
        <button 
          onClick={() => { setCoords({ lat: 39.9163, lng: 116.3972 }) }}
          className="w-full py-1 bg-gold-500 text-white rounded text-xs hover:bg-gold-600"
        >
          传送: 紫禁城
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => setUser(prev => ({...prev, xp: prev.xp + 500}))}
            className="flex-1 py-1 bg-stone-500 text-white rounded text-xs"
          >
            +500 阅历
          </button>
          <button 
            onClick={() => setUser(prev => ({...prev, currency: prev.currency + 1000}))}
            className="flex-1 py-1 bg-yellow-600 text-white rounded text-xs"
          >
            +1000 通宝
          </button>
        </div>
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className="w-full py-1 bg-red-500 text-white rounded text-xs mt-1"
        >
          重置存档
        </button>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="p-4 space-y-4 pt-8 pb-24">
      <h2 className="text-2xl font-bold text-earth-900 border-l-4 border-gold-500 pl-3">每日任务</h2>
      
      {/* Task 1 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-earth-200 rarity-common border-l-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-earth-800">日行三里 (凡品)</span>
          <span className="text-xs bg-earth-200 px-2 py-1 rounded text-earth-800">1.2 / 3.0 km</span>
        </div>
        <div className="w-full bg-earth-100 rounded-full h-2.5">
          <div className="bg-gold-500 h-2.5 rounded-full" style={{ width: '40%' }}></div>
        </div>
      </div>

      {/* Residency Check */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-earth-200 rarity-rare border-l-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-earth-800">安土重迁 (精品)</span>
          <button 
            onClick={() => {
               setUser(prev => ({...prev, residenceDays: prev.residenceDays + 1}));
               addNotification("签到成功！定居天数 +1");
            }}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            签到
          </button>
        </div>
        <p className="text-xs text-gray-500">当前城市定居: {user.residenceDays} 天</p>
      </div>
      
      {/* Excavation */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-earth-200 mt-6">
         <h3 className="font-semibold text-earth-800 mb-2">考古发掘</h3>
         <p className="text-sm text-earth-600 mb-4">当前区域灵气浓度: <span className="text-gold-600 font-bold">浓郁</span></p>
         {isExcavating ? (
           <div className="text-center py-4 bg-earth-50 rounded">
             <div className="text-3xl animate-pulse">⛏️</div>
             <div className="text-gold-600 font-bold mt-2">挖掘中... {excavationTime}s</div>
           </div>
         ) : (
           <button 
            onClick={startExcavation}
            className="w-full py-3 bg-earth-800 text-white rounded-lg font-bold shadow-md active:scale-95 transition-transform"
           >
             开始探索
           </button>
         )}
      </div>
    </div>
  );

  const renderMuseum = () => {
    const isPremium = user.level >= 10;
    const items = GameService.getUserItems(user.inventory);
    
    return (
      <div className={`min-h-screen p-4 pb-24 ${isPremium ? 'bg-stone-900 text-gold-400' : 'bg-earth-50 text-earth-900'}`}>
        <div className="pt-8 mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-widest uppercase">
            {isPremium ? '私人博物馆' : '个人藏品'}
          </h2>
          <p className="text-xs opacity-60 mt-1">{isPremium ? '尊贵馆长' : `等级 10 解锁博物馆外观 (当前: ${user.level})`}</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <div className="text-4xl mb-2">🕸️</div>
            <p>架上空空如也</p>
            <p className="text-sm">去外面的世界看看吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setViewingItem(item)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-center border-2 cursor-pointer transition-transform active:scale-95 hover:shadow-lg bg-white/5 ${getRarityClass(item.rarity)}`}
              >
                <div className="text-3xl mb-1">{item.icon}</div>
                <div className="text-[10px] font-bold truncate w-full">{item.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTrade = () => {
    const allMarketItems = Object.values(ITEMS_DB);
    const filteredItems = marketFilter === 'all' 
      ? allMarketItems 
      : allMarketItems.filter(i => i.rarity === marketFilter);

    return (
      <div className="p-4 pb-24 pt-8 flex flex-col h-screen">
        <h2 className="text-2xl font-bold text-earth-900 mb-4">市集</h2>
        
        {/* AI Oracle */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-4 text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-6xl">🔮</div>
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
            <span>天机阁 (AI)</span>
            {isOracleThinking && <span className="animate-spin text-sm">✨</span>}
          </h3>
          <p className="text-xs text-indigo-200 mb-3">向神灵询问此地的前世今生。</p>
          <div className="bg-black/30 p-3 rounded text-sm italic min-h-[60px] mb-3">
            "{oracleLore || "点击下方按钮，聆听历史的回响..."}"
          </div>
          <button 
            onClick={consultOracle}
            disabled={isOracleThinking}
            className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded text-sm font-bold transition-colors"
          >
            {isOracleThinking ? "推演天机中..." : "询问天机"}
          </button>
        </div>

        {/* Chat / Trade Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setMarketFilter(f)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors ${
                marketFilter === f 
                  ? 'bg-earth-800 text-white border-earth-800' 
                  : 'bg-white text-earth-600 border-earth-200'
              }`}
            >
              {f === 'all' ? '全部' : getRarityLabel(f)}
            </button>
          ))}
        </div>

        {/* Market List */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-20">
          {filteredItems.map(item => (
            <div key={item.id} className={`flex items-center p-3 rounded-lg border bg-white shadow-sm`}>
               <div 
                 onClick={() => setViewingItem(item)}
                 className={`w-12 h-12 flex items-center justify-center text-2xl rounded border-2 mr-3 cursor-pointer hover:bg-gray-50 active:scale-95 transition-transform ${getRarityClass(item.rarity)}`}
               >
                 {item.icon}
               </div>
               <div className="flex-1">
                 <div className="font-bold text-earth-900">{item.name}</div>
                 <div className="text-xs text-gray-500 truncate">{item.description}</div>
               </div>
               <button 
                onClick={() => handleBuyItem(item)}
                className="ml-2 px-3 py-1 bg-gold-500 text-white rounded text-xs font-bold whitespace-nowrap active:bg-gold-600"
               >
                 {item.price} 通宝
               </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="p-6 pt-12 pb-24">
       <div className="flex flex-col items-center mb-8">
         <div className="w-24 h-24 rounded-full bg-earth-300 border-4 border-white shadow-lg flex items-center justify-center text-4xl mb-4">
           🤠
         </div>
         <h2 className="text-2xl font-bold text-earth-900">{user.name}</h2>
         <div className="text-gold-600 font-bold">等级 {user.level}</div>
       </div>

       <div className="grid grid-cols-2 gap-4 mb-6">
         <div className="bg-white p-4 rounded-xl shadow-sm text-center border border-earth-100">
           <div className="text-xs text-earth-500 uppercase">阅历 (XP)</div>
           <div className="text-xl font-bold text-earth-800">{user.xp}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm text-center border border-earth-100">
           <div className="text-xs text-earth-500 uppercase">通宝</div>
           <div className="text-xl font-bold text-earth-800">{user.currency} 🟡</div>
         </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-earth-100 overflow-hidden mb-6">
         <div className="p-4 border-b border-earth-50">
           <h3 className="font-bold text-earth-800">行者档案</h3>
         </div>
         <div className="p-4 space-y-2 text-sm text-earth-600">
           <div className="flex justify-between">
             <span>成就解锁</span>
             <span className="font-bold">{user.unlockedAchievements.length}</span>
           </div>
           <div className="flex justify-between">
             <span>藏品数量</span>
             <span className="font-bold">{user.inventory.length}</span>
           </div>
           <div className="flex justify-between">
             <span>现居地定居</span>
             <span className="font-bold">{user.residenceDays} 天</span>
           </div>
         </div>
       </div>

       {/* Achievements List */}
       <h3 className="font-bold text-earth-800 mb-2 px-2">成就列表</h3>
       <div className="space-y-2">
         {ACHIEVEMENTS_DB.map(ach => {
           const unlocked = user.unlockedAchievements.includes(ach.id);
           return (
             <div key={ach.id} className={`p-3 rounded-lg border border-l-4 ${unlocked ? getRarityClass(ach.rarity) : 'bg-gray-100 border-gray-300 opacity-60'}`}>
               <div className="flex justify-between">
                 <span className="font-bold">{ach.title}</span>
                 <span className="text-xs px-2 rounded-full border border-current opacity-70">{getRarityLabel(ach.rarity)}</span>
               </div>
               <div className="text-xs mt-1">{ach.description}</div>
             </div>
           )
         })}
       </div>
    </div>
  );

  return (
    <div className="relative w-full h-full min-h-screen bg-earth-50 font-sans text-earth-900 overflow-hidden">
      
      {/* Header / Top Bar (Floating) */}
      <div className="absolute top-0 left-0 w-full p-4 z-40 pointer-events-none flex justify-between items-start bg-gradient-to-b from-white/80 to-transparent h-24">
        <h1 className="text-xl font-bold text-earth-900 drop-shadow-sm pointer-events-auto font-title tracking-widest">行成</h1>
        <button 
          onClick={() => setIsDebugOpen(!isDebugOpen)}
          className="p-2 bg-white/80 backdrop-blur rounded-full shadow-sm text-earth-600 pointer-events-auto hover:bg-earth-100"
        >
          {ICON_GEAR}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full h-full overflow-y-auto no-scrollbar">
        {currentTab === TabView.MAP && <MapView lat={coords.lat} lng={coords.lng} />}
        {currentTab === TabView.TASKS && renderTasks()}
        {currentTab === TabView.MUSEUM && renderMuseum()}
        {currentTab === TabView.TRADE && renderTrade()}
        {currentTab === TabView.PROFILE && renderProfile()}
      </div>

      {/* Overlays */}
      {renderDebugPanel()}
      {renderItemModal()}
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Toast Notifications */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-3/4 pointer-events-none">
        {notifications.map((msg, i) => (
          <div key={i} className="bg-earth-900/90 text-amber-50 px-4 py-2 rounded-lg shadow-lg text-sm text-center animate-bounce border border-gold-500">
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;