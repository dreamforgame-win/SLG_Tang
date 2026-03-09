import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/conquest');
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-between bg-background-dark group/design-root overflow-hidden font-display">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAqWKqk-VrdSwbLrovRmkK2jXcjcu_P_8Fk5Vp0RgqJvlBE1GFpcUODfpCstQsHcmdPSMMxQqrIqkwCwJdYMDjZ3-jIQ4a0kZ1NHkREj8P35rdUCQGxpD_-XIPI131ZtNRL7Y-BrwiOs50UBujjFVVa5RInNLMyYkvADP1uz3g5-llFbqour-8EY4sSbauOxfue0mmSOAzmca6nH8Sj9sp2A9J4lDZV3jX1utQqqnPiv1-Mtfv3g0Cof7nTywbm43bhq0qQ--onZg')" }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 gradient-overlay"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="size-10 flex items-center justify-center bg-primary rounded-lg jade-border">
            <span className="material-symbols-outlined text-white">castle</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-gold font-bold">Tang Dynasty SLG</span>
            <span className="text-white text-sm font-medium opacity-80">v1.0.8 Global</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center rounded-full size-10 bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-primary/20 transition-all">
            <span className="material-symbols-outlined">language</span>
          </button>
          <button className="flex items-center justify-center rounded-full size-10 bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-primary/20 transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="flex items-center justify-center rounded-full size-10 bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-primary/20 transition-all">
            <span className="material-symbols-outlined">person</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4 text-center">
        <div className="mb-2">
          <span className="text-gold tracking-[0.5em] text-lg uppercase font-bold opacity-90 drop-shadow-md">盛世繁华 剑指长安</span>
        </div>
        <h1 className="calligraphy-title text-7xl md:text-9xl text-white font-black mb-12 tracking-tighter">
          <span className="text-primary">大唐</span>荣耀
        </h1>
        
        <div className="flex flex-col gap-6 items-center w-full max-w-xs">
          <button 
            onClick={handleStartGame}
            className="group relative w-full h-16 flex items-center justify-center overflow-hidden rounded-lg jade-border bg-primary silk-texture cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="relative z-10 text-white text-2xl font-black tracking-[0.3em] drop-shadow-lg">开始游戏</span>
          </button>
          
          <div className="flex gap-4 w-full">
            <button className="flex-1 h-12 rounded-lg bg-black/60 border border-gold/30 backdrop-blur-md text-gold text-sm font-bold flex items-center justify-center gap-2 hover:bg-gold/10 transition-colors">
              <span className="material-symbols-outlined text-sm">storage</span>
              <span>长安-12区</span>
            </button>
            <button className="w-12 h-12 rounded-lg bg-black/60 border border-gold/30 backdrop-blur-md text-gold flex items-center justify-center hover:bg-gold/10 transition-colors">
              <span className="material-symbols-outlined">swap_horiz</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
              <span className="material-symbols-outlined text-primary">campaign</span>
              <div className="flex flex-col text-left">
                <p className="text-xs text-slate-400">最新公告</p>
                <p className="text-sm text-white truncate max-w-[120px]">万国来朝版本开启...</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
              <span className="material-symbols-outlined text-gold">card_giftcard</span>
              <div className="flex flex-col text-left">
                <p className="text-xs text-slate-400">福利中心</p>
                <p className="text-sm text-white">上线领取玄甲骑</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex gap-6 text-slate-400 text-xs font-medium uppercase tracking-widest">
            <a className="hover:text-primary transition-colors" href="#">用户协议</a>
            <a className="hover:text-primary transition-colors" href="#">隐私政策</a>
            <a className="hover:text-primary transition-colors" href="#">联系客服</a>
          </div>
          <p className="text-[10px] text-slate-500 text-center md:text-right">
            © 2024 大唐荣耀工作室 版权所有 | 抵制不良游戏 拒绝盗版游戏 注意自我保护 谨防上当受骗
          </p>
        </div>
      </footer>
      
      {/* Bottom Pattern */}
      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none opacity-40">
        <div 
          className="h-full w-full bg-repeat-x bg-bottom" 
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDcUiTNne4aWxyz9-U_dV0EvzbJQiI0SB3FGJklUfGsLTTmvaWQ0UmIyohb-4USk1tANbo60ARGXHo4hHgPbh_xXBqKRQUuKw4ZZylElBbh2JVPC3faJWJLoVqsNVm7F8IbsVNJpfbxYomwv7ZzC1Wx5a64RYyAwpWPHpn-g0_HTzOmR6w9S_NyjZ5flsq9tMeC8efW9Cy21aEY4jp1XOrLOIc7xfG0Ze7zZhOlhZrnS7Y5nxmJwDWfH7b1yyOYFp-WcL-aQHbWHQ')",
            filter: "invert(1)"
          }}
        ></div>
      </div>
    </div>
  );
}
