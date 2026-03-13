import './StatsBar.css';

export default function StatsBar({ stats }) {
  const items = [
    {
      label: 'Currently Waiting',
      value: stats.currently_waiting ?? 0,
      icon: '⏳',
      accent: 'primary',
    },
    {
      label: 'Avg Wait Time',
      value: `${stats.average_wait ?? 0}m`,
      icon: '🕐',
      accent: 'secondary',
    },
    {
      label: 'Completed Today',
      value: stats.completed ?? 0,
      icon: '✅',
      accent: 'success',
    },
    {
      label: 'Total Patients',
      value: stats.total_patients ?? 0,
      icon: '👥',
      accent: 'info',
    },
  ];

  return (
    <div className="stats-bar">
      {items.map((item) => (
        <div key={item.label} className={`stat-card glass-card-static stat-${item.accent}`}>
          <div className="stat-icon">{item.icon}</div>
          <div className="stat-content">
            <span className="stat-value">{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
