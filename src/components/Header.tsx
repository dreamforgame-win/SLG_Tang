import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function Header() {
  const location = useLocation();
  const { generals } = useGame();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const hasAvailablePoints = generals.some(g => (g.availablePoints || 0) > 0);

  return (
    <header className="flex items-center justify-between border-b border-primary/20 px-4 lg:px-10 py-4 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4 text-primary">
        <div className="size-8 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">castle</span>
        </div>
        <div>
          <h2 className="text-slate-100 text-xl font-bold leading-tight tracking-wider uppercase">大唐荣耀</h2>
          <p className="text-[10px] text-primary font-medium tracking-[0.2em]">战略演武 · 盛世长歌</p>
        </div>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <nav className="hidden md:flex items-center gap-9">
          <Link 
            to="/formation" 
            className={`text-sm font-medium transition-colors ${isActive('/formation') ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-slate-400 hover:text-slate-100'}`}
          >
            排兵布阵
          </Link>
          <Link 
            to="/gallery" 
            className={`relative text-sm font-medium transition-colors ${isActive('/gallery') ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-slate-400 hover:text-slate-100'}`}
          >
            名将图鉴
            {hasAvailablePoints && (
              <div className="absolute -top-1 -right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            )}
          </Link>
          <Link 
            to="/conquest" 
            className={`text-sm font-medium transition-colors ${isActive('/conquest') ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-slate-400 hover:text-slate-100'}`}
          >
            征战天下
          </Link>
        </nav>
        <div 
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary/30" 
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC26LIrrHiyZfnnJatMk-tNFN7aHrmVp86hQkWXFKqTQyOGZ2L2OlYs0890qfAuYyanP9OSr0O4FeM0giV9RNZ_frzRRHJ9OKk-xGZ4Z1SQAWZ1vzrqBHtMEMEU8_lohZhlankK6pKeyY_m4KqI0uQT63Nl_QTUF8d-gkTlBq0kOFKXBJ_N8biSkVa1elkP2WlcKYCDCpLXLVxDOseAQyGgFX5pGDp2AniEUYkAlzGTUYH7vcs4NyvwDq4-8KRH0Dm5KAhOCl8UJg")' }}
        ></div>
      </div>
    </header>
  );
}
