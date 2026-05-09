'use client';
import { Shield, Lock, Eye, EyeOff, Server } from 'lucide-react';
export function TrustBadge({ variant = 'inline' }) {
    if (variant === 'inline') {
        return (<div className="trust-shield" id="trust-badge-inline">
        <Shield size={14}/>
        <span className="trust-dot"/>
        محمي ومشفر
      </div>);
    }
    return (<div className="card card-trust" id="trust-badge-card">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={20} style={{ color: 'var(--wolf-trust-green)' }}/>
        <h3 style={{ color: 'var(--wolf-trust-green)', fontSize: '1rem' }}>حالة الأمان</h3>
      </div>
      <div className="flex flex-col gap-3">
        <TrustItem icon={<Lock size={14}/>} label="التشفير" status="AES-256-GCM نشط"/>
        <TrustItem icon={<Server size={14}/>} label="العزل" status="حاوية مستقلة لكل بوت"/>
        <TrustItem icon={<EyeOff size={14}/>} label="الخصوصية" status="بدون تتبع أو تحليلات"/>
        <TrustItem icon={<Eye size={14}/>} label="الشفافية" status="استخدام موارد مرئي"/>
      </div>
    </div>);
}
function TrustItem({ icon, label, status }) {
    return (<div className="flex items-center gap-3" style={{ fontSize: '0.85rem' }}>
      <div style={{ color: 'var(--wolf-trust-green)', flexShrink: 0 }}>{icon}</div>
      <div className="flex-1">
        <span style={{ color: 'var(--wolf-text-secondary)' }}>{label}</span>
      </div>
      <span style={{ color: 'var(--wolf-trust-green)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
        {status}
      </span>
    </div>);
}
export default TrustBadge;
