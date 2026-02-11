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
      {/* Desktop top nav */}
      <nav className="hidden md:block bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <span className="text-xl font-bold text-primary">IELTS</span>
              <span className="text-sm text-text-secondary">Progress Tracker</span>
            </Link>
            <div className="flex gap-1">
              {links.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
                    location.pathname === to
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-gray-100 hover:text-text'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile/iPad bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-end justify-around px-2 pt-1.5 pb-1.5">
          {links.map(({ to, icon: Icon, label, isMain }) => {
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
                    <Icon size={26} className="text-white" />
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
                className={`flex flex-col items-center py-1.5 px-3 rounded-lg no-underline transition-colors min-w-[56px] active:bg-gray-100 ${
                  active ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
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
