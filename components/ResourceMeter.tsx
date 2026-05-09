'use client';
export default function ResourceMeter({ label, current, max, unit = '' }) {
    const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    const fillClass = percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'safe';
    return (<div className="meter-container" id={`meter-${label.replace(/\s/g, '-')}`}>
      <div className="meter-header">
        <span className="meter-label">{label}</span>
        <span className="meter-value">
          {current}{unit} / {max}{unit}
        </span>
      </div>
      <div className="meter-track">
        <div className={`meter-fill ${fillClass}`} style={{ width: `${percentage}%` }} role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={max}/>
      </div>
    </div>);
}
