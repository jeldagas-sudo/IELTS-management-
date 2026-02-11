export default function ScoreCard({ title, value, subtitle, icon: Icon, color, trend }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color || 'text-text'}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${color ? `bg-${color}/10` : 'bg-gray-100'}`}>
            <Icon size={22} className={color || 'text-text-secondary'} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`mt-3 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)} band/day
        </div>
      )}
    </div>
  );
}
