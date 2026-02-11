import { Link, useLocation } from 'react-router-dom';
import { BarChart3, PlusCircle, TrendingUp, AlertTriangle, Home } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: '대시보드' },
    { to: '/add', icon: PlusCircle, label: '세션 추가' },
    { to: '/sessions', icon: BarChart3, label: '세션 기록' },
    { to: '/analysis', icon: TrendingUp, label: '성장 분석' },
    { to: '/patterns', icon: AlertTriangle, label: '오답 패턴' },
  ];

  return (
    <nav className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl font-bold text-primary">IELTS</span>
            <span className="text-sm text-text-secondary">Progress Tracker</span>
          </Link>
          <div className="flex gap-1">
            {links.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
                  location.pathname === to
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-gray-100 hover:text-text'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
