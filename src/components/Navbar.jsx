import { createElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, PlusCircle, TrendingUp, AlertTriangle, Home } from 'lucide-react';

const links = [
  { to: '/', icon: Home, label: '대시보드' },
  { to: '/sessions', icon: BarChart3, label: '기록' },
  { to: '/add', icon: PlusCircle, label: '추가', isMain: true },
  { to: '/analysis', icon: TrendingUp, label: '분석' },
  { to: '/patterns', icon: AlertTriangle, label: '패턴' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <>
      <nav className="hidden md:block border-b border-border/70 shadow-[0_6px_24px_rgba(35,30,26,0.06)] sticky top-0 z-50 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(248, 247, 245, 0.92)' }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-end gap-2 no-underline">
              <span className="text-2xl font-semibold text-primary">IELTS</span>
              <span className="text-sm text-text-secondary pb-0.5">Progress Tracker</span>
            </Link>
            <div className="flex gap-1">
              {links.map(({ to, icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium no-underline transition-all duration-300 ${
                    location.pathname === to
                      ? 'bg-primary text-white shadow-[0_8px_20px_rgba(0,92,115,0.3)]'
                      : 'text-text-secondary hover:bg-card hover:text-text'
                  }`}
                >
                  {createElement(icon, { size: 16 })}
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 shadow-[0_-4px_20px_rgba(26,21,17,0.08)]"
        style={{ backgroundColor: 'rgba(248, 247, 245, 0.96)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-end justify-around px-2 pt-1.5 pb-1.5">
          {links.map(({ to, icon, label, isMain }) => {
            const active = location.pathname === to;

            if (isMain) {
              return (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center no-underline -mt-5"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    active ? 'bg-primary' : 'bg-primary-light'
                  }`}>
                    {createElement(icon, { size: 26, className: 'text-white' })}
                  </div>
                  <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-primary' : 'text-text-secondary'}`}>
                    {label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center py-1.5 px-3 rounded-lg no-underline transition-colors min-w-[56px] active:bg-card ${
                  active ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                {createElement(icon, { size: 22, strokeWidth: active ? 2.5 : 1.8 })}
                <span className={`text-[10px] mt-0.5 ${active ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
