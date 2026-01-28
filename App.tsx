
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { AppTab, ArtworkAnalysis, UserProfile } from './types';
import { FEATURED_ARTWORKS, GLOBAL_ANALYSES } from './constants';
import BottomNav from './components/BottomNav';
import AnalysisView from './components/AnalysisView';
import { authAPI, analysisAPI } from './services/apiService';

const Logo: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const iconSize = size === 'md' ? 'size-11' : 'size-9';
  const fSize = size === 'md' ? 'text-2xl' : 'text-xl';
  const titleSize = size === 'md' ? 'text-xl' : 'text-lg';
  const subtitleSize = 'text-[10px]';

  return (
    <div className="flex items-center gap-3">
      <div className={`${iconSize} bg-[#001A41] rounded-[12px] flex items-center justify-center shrink-0 shadow-sm`}>
        <span className={`${fSize} text-white font-cal font-bold italic leading-none`}>F</span>
      </div>
      <div className="flex flex-col justify-center leading-none text-left">
        <span className={`${titleSize} text-[#001A41] font-cal font-bold tracking-tight`}>FUHUNG</span>
        <span className={`${subtitleSize} text-slate-400 font-bold tracking-[0.15em] uppercase mt-0.5`}>Art Analysis</span>
      </div>
    </div>
  );
};

type AuthView = 'login' | 'register' | 'reset-password' | 'none';

const App: React.FC = () => {
  // Initialize Auth State from Local Storage (Optimistic UI)
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('auth_token'));

  const savedProfile = localStorage.getItem('user_profile');
  const initialProfile = savedProfile ? JSON.parse(savedProfile) : {
    name: '张艺术',
    phone: '138****0000',
    avatar: 'https://picsum.photos/seed/user-main/200/200'
  };

  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.HOME);
  const [analysis, setAnalysis] = useState<ArtworkAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('none');
  const [searchQuery, setSearchQuery] = useState('');

  // Registration & Login State
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [regForm, setRegForm] = useState({ phone: '', password: '', agreed: false });
  const [resetForm, setResetForm] = useState({ phone: '', newPassword: '', confirmPassword: '' });

  // User Profile State
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  // Records state
  const [myAnalyses, setMyAnalyses] = useState<ArtworkAnalysis[]>([]);
  const [discoverAnalyses, setDiscoverAnalyses] = useState<ArtworkAnalysis[]>([]);
  const [featuredAnalyses, setFeaturedAnalyses] = useState<ArtworkAnalysis[]>([]);
  // Removed isInitializing state

  // Data Refresh Helpers
  const refreshUserAnalyses = async () => {
    try {
      const analyses = await analysisAPI.getMyAnalyses();
      setMyAnalyses(analyses);
    } catch (err) {
      console.error("Failed to fetch my analyses", err);
    }
  };

  const refreshDiscover = async () => {
    try {
      const analyses = await analysisAPI.discover(undefined, 20, 'latest');
      setDiscoverAnalyses(analyses);
    } catch (err) {
      console.error("Failed to fetch discover analyses", err);
    }
  };

  const refreshFeatured = async () => {
    try {
      // 获取精选分析（世界级名画/S级作品随机展示）
      const analyses = await analysisAPI.discover(undefined, 20, 'featured');
      setFeaturedAnalyses(analyses);
    } catch (err) {
      console.error("Failed to fetch featured analyses", err);
    }
  };

  // Fetch Data on Mount
  useEffect(() => {
    const initApp = async () => {
      // Background fetch public data (non-blocking)
      refreshDiscover();
      refreshFeatured();

      const token = localStorage.getItem('auth_token');
      // 1. 如果有 Token，尝试验证并更新最新的用户信息
      if (token) {
        try {
          const user = await authAPI.getMe();
          const newProfile = {
            name: user.name,
            phone: user.phone,
            avatar: user.avatar || profile.avatar
          };
          setProfile(newProfile);
          // Update cache
          localStorage.setItem('user_profile', JSON.stringify(newProfile));
          setIsLoggedIn(true);

          // 2. 获取用户分析记录
          await refreshUserAnalyses();
        } catch (error) {
          console.error("Session restore failed", error);
          // Only clear session if token is invalid (401/403), but for simplicity clear on any error during init
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_profile');
          setIsLoggedIn(false);
        }
      }
    };

    initApp();
  }, []); // Run once on mount

  // Filtered analyses for the discover tab
  const filteredDiscoverAnalyses = useMemo(() => {
    // Determine source: if search query exists or we have API data, use it.
    // Otherwise fallback to GLOBAL constants only if API is empty (though API should return data)
    let source = discoverAnalyses.length > 0 ? discoverAnalyses : GLOBAL_ANALYSES;

    if (!searchQuery.trim()) return source;

    const query = searchQuery.toLowerCase();
    return source.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.artist.toLowerCase().includes(query) ||
        item.style.toLowerCase().includes(query)
    );
  }, [searchQuery, discoverAnalyses]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUploadTrigger = () => {
    if (!isLoggedIn) {
      setAuthView('login');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const { analysisAPI } = await import('./services/apiService');
      const result = await analysisAPI.analyze(file);
      setAnalysis(result);
      setMyAnalyses(prev => [result, ...prev]);
    } catch (error) {
      console.error("Analysis failed", error);
      alert(error instanceof Error ? error.message : "分析失败，请重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await authAPI.login(loginForm);
      const newProfile = {
        name: result.user.name,
        phone: result.user.phone,
        avatar: result.user.avatar || profile.avatar
      };
      setProfile(newProfile);
      localStorage.setItem('user_profile', JSON.stringify(newProfile));
      setIsLoggedIn(true);
      setAuthView('none');
      // Login success: Fetch User Data!
      refreshUserAnalyses();
    } catch (error) {
      alert(error instanceof Error ? error.message : "登录失败，请检查手机号和密码");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.agreed) {
      alert("请阅读并同意用户协议");
      return;
    }
    try {
      await authAPI.register(regForm);
      setAuthView('login');
      alert("注册成功，请登录");
    } catch (error) {
      alert(error instanceof Error ? error.message : "注册失败，请重试");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }
    try {
      await authAPI.resetPassword({
        phone: resetForm.phone,
        new_password: resetForm.newPassword
      });
      setAuthView('login');
      alert("密码重置成功，请使用新密码登录");
    } catch (error) {
      alert(error instanceof Error ? error.message : "密码重置失败，请重试");
    }
  };

  const isSaved = (id: number) => {
    return myAnalyses.some(a => a.id === id);
  };

  const toggleSaveAnalysis = (art: ArtworkAnalysis) => {
    if (!isLoggedIn) {
      setAuthView('login');
      return;
    }

    if (isSaved(art.id)) {
      setMyAnalyses(prev => prev.filter(a => a.id !== art.id));
    } else {
      setMyAnalyses(prev => [art, ...prev]);
    }
  };

  const renderAuth = () => {
    if (authView === 'login') {
      return (
        <div className="fixed inset-0 z-[200] bg-white animate-fade-in flex flex-col px-8 pt-20 max-w-md mx-auto">
          <button onClick={() => setAuthView('none')} className="absolute top-12 left-6 material-symbols-outlined text-slate-400">close</button>
          <div className="mb-12 flex flex-col items-center">
            <Logo size="md" />
            <p className="text-slate-400 text-sm mt-4 font-medium uppercase tracking-widest">会员登录</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">手机号</label>
              <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20" placeholder="您的手机号码" value={loginForm.phone} onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">密码</label>
                <button type="button" onClick={() => setAuthView('reset-password')} className="text-[10px] text-primary font-bold hover:underline uppercase">忘记密码?</button>
              </div>
              <input type="password" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20" placeholder="请输入密码" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">登录 FUHUNG</button>
            <div className="text-center">
              <p className="text-slate-400 text-xs">还没有账户? <button type="button" onClick={() => setAuthView('register')} className="text-primary font-bold hover:underline">立即注册</button></p>
            </div>
          </form>
        </div>
      );
    }

    if (authView === 'register') {
      return (
        <div className="fixed inset-0 z-[200] bg-white animate-fade-in flex flex-col px-8 pt-20 max-w-md mx-auto">
          <button onClick={() => setAuthView('login')} className="absolute top-12 left-6 material-symbols-outlined text-slate-400">arrow_back</button>
          <div className="mb-10 flex flex-col items-center">
            <Logo size="md" />
            <p className="text-slate-400 text-sm mt-4 font-medium uppercase tracking-widest">加入 FUHUNG 会员</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">手机号</label>
              <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" placeholder="11位手机号" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">设置密码</label>
              <input type="password" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" placeholder="6-16位字符" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} required />
            </div>
            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="reg-agree" className="rounded text-primary border-slate-200" checked={regForm.agreed} onChange={e => setRegForm({ ...regForm, agreed: e.target.checked })} required />
              <label htmlFor="reg-agree" className="text-xs text-slate-500">同意 <button type="button" onClick={() => setShowAgreement(true)} className="text-primary hover:underline">《用户协议与隐私政策》</button></label>
            </div>
            <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-md active:scale-95 transition-all">完成注册</button>
            <p className="text-center text-xs text-slate-400 mt-4">已有账户? <button type="button" onClick={() => setAuthView('login')} className="text-primary font-bold hover:underline">返回登录</button></p>
          </form>
        </div>
      );
    }

    if (authView === 'reset-password') {
      return (
        <div className="fixed inset-0 z-[200] bg-white animate-fade-in flex flex-col px-8 pt-20 max-w-md mx-auto">
          <button onClick={() => setAuthView('login')} className="absolute top-12 left-6 material-symbols-outlined text-slate-400">arrow_back</button>
          <div className="mb-10 flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-primary mb-4">lock_reset</span>
            <h3 className="text-xl font-bold text-slate-900">重置您的密码</h3>
            <p className="text-slate-400 text-sm mt-2">请输入注册手机号进行重置</p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">注册手机号</label>
              <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" placeholder="11位手机号码" value={resetForm.phone} onChange={e => setResetForm({ ...resetForm, phone: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">新密码</label>
              <input type="password" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" placeholder="请输入新密码" value={resetForm.newPassword} onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">确认新密码</label>
              <input type="password" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" placeholder="再次输入新密码" value={resetForm.confirmPassword} onChange={e => setResetForm({ ...resetForm, confirmPassword: e.target.value })} required />
            </div>
            <button type="submit" className="w-full bg-fuhung-blue text-white py-4 rounded-xl font-bold shadow-md active:scale-95 transition-all mt-4">确认修改</button>
          </form>
        </div>
      );
    }
    return null;
  };

  const renderHome = () => (
    <div className="px-6 pt-10 pb-24 max-w-md mx-auto animate-fade-in">
      <header className="flex items-center justify-between mb-8">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <button className="text-slate-400" onClick={() => setCurrentTab(AppTab.DISCOVER)}>
            <span className="material-symbols-outlined text-2xl">search</span>
          </button>
        </div>
      </header>

      <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-3">
        探索艺术价值
      </h1>
      <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-[280px]">
        基于 AI 视觉识别技术，为您解析每一件艺术作品的深度内涵与资产价值。
      </p>

      <div className="relative mb-12">
        <div
          className="group relative flex flex-col items-center justify-center border border-slate-100 bg-white rounded-[2rem] p-12 transition-all active:scale-[0.98] hover:bg-slate-50 cursor-pointer shadow-sm shadow-slate-200/50"
          onClick={handleFileUploadTrigger}
        >
          <div className="size-16 rounded-full bg-fuhung-light-blue border border-fuhung-blue/5 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-3xl">add_a_photo</span>
          </div>
          <button className="px-10 py-3.5 bg-primary text-white rounded-full font-medium shadow-lg shadow-blue-500/20 active:bg-blue-700 transition-all text-sm mb-2">
            {isAnalyzing ? '正在专业分析...' : '上传或扫描作品'}
          </button>
          <span className="text-slate-400 text-[10px] tracking-wider uppercase font-bold">Expert AI Analysis</span>
          <input type="file" id="fileInput" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>
        {!isLoggedIn && (
          <div className="absolute -top-3 -right-3 bg-fuhung-blue text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">会员专享</div>
        )}
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">精选发现</h2>
          <button onClick={() => setCurrentTab(AppTab.DISCOVER)} className="text-primary text-sm font-medium hover:underline">查看更多</button>
        </div>

        <div className="masonry-container">
          {featuredAnalyses.map((art) => (
            <div key={art.id} className="masonry-item group cursor-pointer" onClick={() => setAnalysis(art)}>
              <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-transform active:scale-95 mb-2 bg-slate-50">
                <img
                  alt={art.title}
                  className="w-full h-auto object-cover"
                  src={art.imageUrl}
                  crossOrigin="anonymous"
                  loading="lazy"
                />
                <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[8px] text-white fill-white">favorite</span>
                  <span className="text-[9px] font-bold text-white uppercase tracking-tighter">{art.likes}</span>
                </div>
              </div>
              <div className="px-1 mb-4">
                <h3 className="font-bold text-slate-900 text-[13px] leading-tight line-clamp-1">{art.title}</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">{art.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="w-full py-8 flex flex-col items-center justify-center bg-transparent">
        <button onClick={() => setShowAgreement(true)} className="text-slate-400 text-[10px] hover:text-slate-600 transition-colors underline decoration-slate-300">用户协议与隐私条款</button>
        <p className="text-slate-300 text-[9px] mt-2 uppercase tracking-widest">© 2026 FUHUNG AI Art</p>
      </footer>
    </div>
  );



  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {analysis ? (
        <AnalysisView
          analysis={analysis}
          onBack={() => setAnalysis(null)}
          isSaved={isSaved(analysis.id)}
          onToggleSave={() => toggleSaveAnalysis(analysis)}
        />
      ) : (
        <>
          {currentTab === AppTab.HOME && renderHome()}
          {currentTab === AppTab.DISCOVER && (
            <div className="animate-fade-in max-w-md mx-auto min-h-screen bg-slate-50 p-4 pb-32">
              <header className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md pt-12 pb-4 px-2">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">发现杰作</h1>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                  <input
                    type="text"
                    placeholder="搜索艺术品、艺术家或流派..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/10 outline-none text-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 hover:text-slate-500"
                    >
                      close
                    </button>
                  )}
                </div>
              </header>

              <div className="masonry-container px-2 mt-6">
                {filteredDiscoverAnalyses.length > 0 ? (
                  filteredDiscoverAnalyses.map(item => (
                    <div key={item.id} className="masonry-item bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-transform active:scale-[0.98]" onClick={() => setAnalysis(item)}>
                      <img src={item.imageUrl} className="w-full h-auto object-cover" crossOrigin="anonymous" loading="lazy" />
                      <div className="p-3">
                        <p className="text-xs font-bold truncate text-slate-900">{item.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.artist}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-20 text-center flex flex-col items-center">
                    <span className="material-symbols-outlined text-slate-200 text-5xl mb-4">search_off</span>
                    <p className="text-slate-400 text-sm">未找到相关艺术作品</p>
                    <button onClick={() => setSearchQuery('')} className="mt-4 text-primary text-xs font-bold uppercase tracking-wider">清除搜索</button>
                  </div>
                )}
              </div>

              {/* Discover Page Footer */}
              <footer className="w-full py-16 flex flex-col items-center justify-center bg-transparent">
                <div className="mb-6 opacity-40 scale-75">
                  <Logo size="sm" />
                </div>
                <button onClick={() => setShowAgreement(true)} className="text-slate-400 text-[10px] hover:text-slate-600 transition-colors underline decoration-slate-300">用户协议与隐私条款</button>
                <p className="text-slate-300 text-[9px] mt-2 uppercase tracking-widest">© 2026 FUHUNG AI Art</p>
              </footer>
            </div>
          )}
          {currentTab === AppTab.PROFILE && (
            <div className="animate-fade-in max-w-md mx-auto min-h-screen p-8">
              <div className="flex items-center gap-4 mt-12 mb-12">
                <img src={profile.avatar} className="size-20 rounded-full border-4 border-slate-50 shadow-inner" />
                <div>
                  <h2 className="text-2xl font-bold">{isLoggedIn ? profile.name : '游客用户'}</h2>
                  <p className="text-slate-400 text-sm">{isLoggedIn ? profile.phone : '登录后解锁更多功能'}</p>
                </div>
              </div>
              <div className="space-y-4">
                {!isLoggedIn ? (
                  <button onClick={() => setAuthView('login')} className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20">立即登录</button>
                ) : (
                  <>
                    <div className="mt-8 mb-8">
                      <div className="flex items-center gap-2 mb-4 px-2">
                        <span className="material-symbols-outlined text-primary">collections_bookmark</span>
                        <h3 className="text-lg font-bold text-slate-800">我的收藏</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">{myAnalyses.length}</span>
                      </div>

                      {myAnalyses.length === 0 ? (
                        <div className="p-10 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                          <span className="material-symbols-outlined text-slate-300 text-4xl">folder_open</span>
                          <p className="text-xs text-slate-400">暂无收藏或分析记录</p>
                        </div>
                      ) : (
                        <div className="masonry-container px-1">
                          {myAnalyses.map(item => (
                            <div key={item.id} className="masonry-item bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-transform active:scale-[0.98] mb-3" onClick={() => setAnalysis(item)}>
                              <img src={item.imageUrl} className="w-full h-auto object-cover" crossOrigin="anonymous" loading="lazy" />
                              <div className="p-3">
                                <p className="text-xs font-bold truncate text-slate-900">{item.title}</p>
                                <p className="text-[10px] text-slate-400 truncate">{item.artist}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => { authAPI.logout(); setIsLoggedIn(false); }} className="w-full py-4 text-red-500 font-bold border border-red-50 px-4 rounded-xl active:bg-red-50/50 transition-colors">退出登录</button>
                  </>
                )}
              </div>
            </div>
          )}
          <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
        </>
      )}

      {renderAuth()}

      {isAnalyzing && (
        <div className="fixed inset-0 z-[300] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="relative size-32 mb-8">
            <div className="absolute inset-0 border-4 border-blue-50 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary animate-pulse">auto_awesome</span>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-slate-900 font-bold text-xl tracking-tight">正在进行专家级多维解析...</p>
            <p className="text-slate-400 text-sm max-w-[240px] mx-auto">20年经验艺术专家正在审阅，为您提供投资决策参考</p>
          </div>
        </div>
      )}

      {showAgreement && (
        <div className="fixed inset-0 z-[400] bg-black/60 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] max-w-sm w-full max-h-[70vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">用户协议与隐私条款</h3>
              <button onClick={() => setShowAgreement(false)} className="material-symbols-outlined text-slate-400">close</button>
            </div>
            <div className="p-8 overflow-y-auto text-sm text-slate-600 leading-relaxed space-y-4 flex-1">
              <p>欢迎您注册成为FUHUNG ART ANALYSIS（以下简称“本网站”）会员。本综合条款包含《用户协议》《隐私条款》《知识产权条款》三部分内容，是您与本网站运营方（以下简称“我方”）之间关于您使用本网站服务所订立的具有法律约束力的协议。请您在注册前仔细阅读、充分理解本条款全部内容，尤其是加粗标注的关键条款。您点击“我已阅读并同意本综合条款”并完成注册，即视为您已完整阅读、理解并接受本条款的全部约定，包括我方对条款的后续修改与更新。若您不同意本条款任何内容，请立即停止注册及使用本网站服务。</p>

              <h4 className="font-bold text-slate-900 text-base pt-2">第一部分 用户协议</h4>

              <h5 className="font-bold text-slate-800">一、会员资格与账户使用</h5>
              <p>1.1 您确认，在注册成为本网站会员时，您已年满18周岁，具备完全民事行为能力，能够独立承担民事责任。若您为未成年人或无/限制民事行为能力人，请勿注册使用本网站服务；若您擅自注册，由此产生的一切法律责任由您及您的监护人承担。</p>
              <p>1.2 您应按照注册页面提示提供真实、准确、完整的个人信息（包括但不限于姓名、手机号码、电子邮箱等），并保证信息的持续有效性。若您提供的信息虚假、有误或不完整，我方有权拒绝为您提供服务，或暂停、终止您的会员账户，由此产生的损失由您自行承担。</p>
              <p>1.3 您的会员账户由您自行设置并保管登录密码，您应对账户及密码的安全性负责，禁止向任何第三方泄露账户信息或授权第三方使用您的账户。因您自身疏忽导致账户被盗用、冒用所产生的一切行为及后果，均由您承担，我方不承担任何责任。</p>
              <p>1.4 您确认，账户仅限您本人使用，未经我方书面同意，不得转借、出租、出售或与他人共享账户。若我方发现账户存在异常使用或违规共享情况，有权随时暂停、终止账户使用，且无需承担任何赔偿责任。</p>

              <h5 className="font-bold text-slate-800">二、服务内容与使用规范</h5>
              <p>2.1 本网站为会员提供艺术品照片上传、AI自动分析、生成分析报告等核心服务（以下简称“核心服务”）。我方有权根据业务发展调整服务内容、功能模块及服务规则，调整后将通过网站公告、站内信等方式通知您，您继续使用服务即视为接受该等调整。</p>
              <p>2.2 您在使用核心服务时，应保证上传的艺术品照片清晰、真实，且您有权合法上传该等照片（包括但不限于您为照片所涉艺术品的所有权人，或已获得所有权人合法授权）。您不得上传任何违反法律法规、公序良俗或本条款约定的内容，包括但不限于：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>违反国家法律法规、政策规定的内容（如危害国家安全、泄露国家秘密、宣扬恐怖主义、极端主义、淫秽色情、赌博、暴力等）；</li>
                <li>侵犯第三方知识产权、肖像权、名誉权、隐私权等合法权益的内容；</li>
                <li>虚假、欺诈、误导性的内容，或与艺术品无关的垃圾信息、广告信息；</li>
                <li>其他可能损害我方或第三方合法权益的内容。</li>
              </ul>
              <p>2.3 您理解并认可，本网站提供的AI分析报告是基于算法模型、公开数据及您上传的照片信息生成的参考性意见，不构成专业的艺术品鉴定结论、价值评估或交易建议。您应自行判断报告的参考价值，据此作出的任何决策及产生的风险，均由您自行承担，我方不承担任何法律责任。</p>
              <p>2.4 您在使用本网站服务过程中，应遵守法律法规及互联网公序良俗，不得实施任何损害本网站系统安全、干扰服务正常运行的行为，包括但不限于：恶意攻击、侵入网站系统；篡改、窃取网站数据；使用非法软件或插件使用服务；其他破坏网络安全及服务秩序的行为。</p>

              <h5 className="font-bold text-slate-800">三、免责声明与责任限制</h5>
              <p>3.1 我方将尽合理努力保障网站服务的正常运行，但不保证服务的不间断性、稳定性及准确性，因技术故障、网络拥堵、服务器维护、不可抗力（包括但不限于地震、台风、火灾、水灾、战争、政府制裁、电力故障等）或其他非我方可控因素导致服务中断、延迟或错误的，我方不承担赔偿责任。</p>
              <p>3.2 对于您因使用本网站服务、依赖AI分析报告或账户被盗用、冒用等产生的任何直接或间接损失，我方不承担赔偿责任，除非该等损失系因我方故意或重大过失导致。</p>
              <p>3.3 您确认，因您违反本条款约定（包括但不限于上传侵权内容、违规使用账户、破坏服务秩序等）给我方或第三方造成损失的，您应承担全部赔偿责任，包括但不限于赔偿金、诉讼费、律师费、差旅费等相关费用。</p>

              <h5 className="font-bold text-slate-800">四、账户的暂停与终止</h5>
              <p>4.1 您可随时申请注销会员账户，注销后您将无法再使用本网站服务，我方将按照本条款隐私条款约定处理您的个人信息。</p>
              <p>4.2 若您存在违反本条款约定的行为，我方有权根据违规情节轻重，采取警告、暂停服务、限制账户功能、终止账户等措施，且无需提前通知您，由此产生的损失由您自行承担。</p>
              <p>4.3 账户终止后，本条款中关于知识产权保护、隐私信息保密、免责声明、争议解决等具有持续性的条款仍然有效。</p>

              <h4 className="font-bold text-slate-900 text-base pt-4 border-t border-slate-100">第二部分 隐私条款</h4>

              <h5 className="font-bold text-slate-800">一、个人信息的收集与使用</h5>
              <p>1.1 为向您提供服务及保障服务安全，我方将依法收集您在注册及使用服务过程中提供的个人信息，包括但不限于：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>注册信息：您主动提供的姓名、手机号码、电子邮箱、登录密码等；</li>
                <li>服务相关信息：您上传的艺术品照片、照片相关描述信息（如艺术品名称、年代、材质等）、AI分析报告的查看及使用记录；</li>
                <li>设备及日志信息：您使用本网站服务时的设备型号、IP地址、浏览器类型、访问时间、操作记录等（该等信息将进行匿名化处理，不直接关联您的身份信息）。</li>
              </ul>
              <p>1.2 我方收集您的个人信息仅用于以下目的，且严格遵循“最小必要”原则：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>为您提供核心服务（如艺术品AI分析、生成报告、账户管理等）；</li>
                <li>保障服务安全，防范账户被盗用、欺诈等风险；</li>
                <li>优化服务质量，根据您的使用习惯改进AI算法及服务功能；</li>
                <li>按照法律法规要求或您的同意，向您发送服务通知、活动信息等（您可随时取消订阅）。</li>
              </ul>
              <p>1.3 未经您的明确同意，我方不会将您的个人信息用于本条款约定以外的其他目的，也不会向任何第三方出售、出租、出借您的个人信息，法律法规另有规定的除外。</p>

              <h5 className="font-bold text-slate-800">二、个人信息的存储与保护</h5>
              <p>2.1 我方将采用符合行业标准的安全技术措施（包括但不限于数据加密、访问权限控制、安全审计等）存储您的个人信息，防止信息被泄露、篡改、丢失或滥用。</p>
              <p>2.2 您的个人信息存储期限将严格遵循法律法规要求，仅保留为提供服务所必需的最短时间。服务终止或账户注销后，我方将在合理期限内对您的个人信息进行匿名化处理或安全删除，法律法规另有规定的除外。</p>
              <p>2.3 您有权查询、更正、补充您的个人信息，也有权申请删除您的个人信息（法律法规规定需留存的除外）。您可通过网站客服渠道提交相关申请，我方将在合理时间内予以处理并反馈。</p>

              <h5 className="font-bold text-slate-800">三、第三方信息共享</h5>
              <p>3.1 我方仅在以下情况下可能共享您的个人信息，且将采取必要措施保障您的信息安全：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>获得您的明确同意后，向第三方共享；</li>
                <li>为履行法律法规义务、应对司法机关调查或维护公共利益，向有权机关提供；</li>
                <li>向为我方提供技术支持、服务器托管等服务的第三方共享（该等第三方仅能在服务范围内使用您的信息，且需承担保密义务）。</li>
              </ul>
              <p>3.2 我方将对第三方的信息使用行为进行监督，确保其遵守法律法规及本条款约定，若第三方违反约定泄露您的信息，我方将追究其法律责任，并协助您维护合法权益。</p>

              <h4 className="font-bold text-slate-900 text-base pt-4 border-t border-slate-100">第三部分 知识产权条款</h4>

              <h5 className="font-bold text-slate-800">一、我方知识产权</h5>
              <p>1.1 本网站的全部内容及技术成果（包括但不限于网站软件、AI算法模型、界面设计、文字内容、图片、logo、商标、服务名称等）的知识产权均归我方所有，受《著作权法》《商标法》《专利法》等法律法规保护。</p>
              <p>1.2 未经我方书面许可，您不得擅自复制、传播、修改、改编、翻译、出租、出售本网站的任何内容或技术成果，也不得实施任何侵犯我方知识产权的行为。</p>

              <h5 className="font-bold text-slate-800">二、您上传内容的知识产权</h5>
              <p>2.1 您确认，您上传至本网站的艺术品照片及相关描述信息（以下简称“上传内容”）的知识产权（包括但不限于著作权、所有权等）归您或原始权利人所有。您上传该等内容即视为您保证：您已获得上传内容的合法授权，有权将其上传至本网站用于接受服务，且上传行为不侵犯任何第三方的知识产权或其他合法权益。</p>
              <p>2.2 您授予我方一项全球性、非排他性、免费的、不可撤销的许可使用权，许可我方为提供核心服务之目的，对上传内容进行必要的处理（包括但不限于压缩、裁剪、识别、存储等），该许可使用权在您的账户存续期间及服务终止后合理期限内持续有效，法律法规另有规定的除外。</p>
              <p>2.3 您同意，我方有权将匿名化、去标识化后的上传内容用于AI算法模型的训练、优化及服务质量改进（该等处理后的数据不关联您的身份信息，且不得用于其他商业目的）。若您不同意该等使用，可通过客服渠道书面申请取消，我方将停止相关使用。</p>

              <h5 className="font-bold text-slate-800">三、AI分析报告的知识产权</h5>
              <p>3.1 本网站基于您的上传内容及AI算法生成的分析报告（以下简称“报告内容”），其知识产权归我方所有。您作为报告的获取方，仅有权在合法使用范围内（如个人参考、非商业用途）获取和使用该报告，不得擅自复制、传播、出售、改编报告内容，也不得将报告用于任何违法或侵权行为。</p>
              <p>3.2 您确认，报告内容是AI基于现有数据及算法生成的参考性意见，不构成对艺术品知识产权的确认或认可，您因使用报告内容产生的任何知识产权纠纷，均由您自行承担责任，我方不承担任何责任。</p>

              <h5 className="font-bold text-slate-800">四、知识产权侵权处理</h5>
              <p>4.1 若您发现本网站内容或服务侵犯了您的知识产权，或其他会员上传的内容侵犯了您的合法权益，您可向我方提交书面投诉材料（包括但不限于身份证明、侵权事实证明、权利归属证明等），我方将在收到投诉后及时核查处理，并根据核查结果采取删除侵权内容、暂停侵权账户服务等措施。</p>
              <p>4.2 若因您违反本条款约定，上传侵权内容或侵犯我方及第三方知识产权，您应承担全部法律责任，包括但不限于赔偿损失、消除影响等。我方有权终止您的账户，并保留追究您法律责任的权利。</p>

              <h4 className="font-bold text-slate-900 text-base pt-4 border-t border-slate-100">第四部分 其他条款</h4>
              <p>1. 本条款的订立、效力、履行、解释及争议解决均适用中华人民共和国法律。</p>
              <p>2. 因本条款引起的或与本条款相关的任何争议，双方应首先通过友好协商解决；协商不成的，任何一方均有权向我方所在地有管辖权的人民法院提起诉讼。</p>
              <p>3. 我方有权根据法律法规变化、业务发展需要对本条款进行修改与更新，修改后的条款将通过网站首页公告、站内信等方式通知您。您在条款修改后继续使用本网站服务，即视为您接受修改后的条款；若您不同意修改后的条款，应立即停止使用服务并注销账户。</p>
              <p>4. 本条款未尽事宜，由双方另行协商确定；若本条款任何条款被认定为无效或不可执行，不影响其他条款的效力。</p>
              <p>5. 您确认，在注册前已仔细阅读并完全理解本条款全部内容，尤其是加粗标注的关键条款，并同意受本条款约束。</p>
              <p>（本条款自您点击“同意”并完成注册之日起生效）</p>

              <p className="font-bold text-right pt-4">FUHUNG ART ANALYSIS<br />2026年1月</p>
            </div>
            <div className="p-6 border-t border-slate-100">
              <button onClick={() => setShowAgreement(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-bold">我知道了</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
