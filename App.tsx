
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
      const analyses = await analysisAPI.discover();
      setDiscoverAnalyses(analyses);
    } catch (err) {
      console.error("Failed to fetch discover analyses", err);
    }
  };

  // Fetch Data on Mount
  useEffect(() => {
    const initApp = async () => {
      // Background fetch public data (non-blocking)
      refreshDiscover();

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
          {GLOBAL_ANALYSES.slice(0, 4).map((art) => (
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
            <div className="p-8 overflow-y-auto text-sm text-slate-600 leading-relaxed space-y-4">
              <p>欢迎使用 FUHUNG AI 艺术分析服务。本应用利用人工智能技术为您提供艺术品识别与深度解析。解析结果仅供参考，不作为权威艺术鉴定依据。</p>
              <p>我们承诺保护您的隐私。您上传的照片仅用于即时分析，除非您主动分享或保存至画廊，否则我们不会公开您的作品。</p>
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
