export default function ProbabilityGauge({ probability, label, confidence }) {
  const getColor = (p) => {
    if (p >= 70) return { ring: '#10b981', bg: '#d1fae5', text: 'text-success' };
    if (p >= 40) return { ring: '#f59e0b', bg: '#fef3c7', text: 'text-warning' };
    return { ring: '#ef4444', bg: '#fee2e2', text: 'text-danger' };
  };

  const { ring, bg, text } = getColor(probability);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (probability / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={bg}
            strokeWidth="10"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${text}`}>{probability}%</span>
          <span className="text-xs text-text-secondary">달성 확률</span>
        </div>
      </div>
      {label && <p className="mt-2 text-sm font-medium text-text">{label}</p>}
      {confidence && (
        <p className="text-xs text-text-secondary">
          신뢰도: {confidence === 'high' ? '높음' : confidence === 'medium' ? '보통' : '낮음'}
        </p>
      )}
    </div>
  );
}
