const iconPalette = {
  'text-reading': { fg: '#375a7f', bg: 'rgba(55, 90, 127, 0.13)' },
  'text-listening': { fg: '#5b7c73', bg: 'rgba(91, 124, 115, 0.13)' },
  'text-primary': { fg: '#005c73', bg: 'rgba(0, 92, 115, 0.13)' },
  'text-success': { fg: '#6b8b67', bg: 'rgba(107, 139, 103, 0.13)' },
};

export default function ScoreCard({ title, value, subtitle, icon: Icon, color, trend }) {
  const palette = iconPalette[color] || { fg: '#66645f', bg: 'rgba(102, 100, 95, 0.13)' };

  return (
    <div className="card-surface rounded-2xl border border-border/70 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary mb-1">{title}</p>
          <p className={`text-3xl font-semibold ${color || 'text-text'}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: palette.bg }}>
            <Icon size={22} style={{ color: palette.fg }} />
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
