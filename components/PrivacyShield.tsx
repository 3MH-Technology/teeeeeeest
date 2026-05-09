'use client';
import { ShieldCheck, EyeOff, Trash2, Lock } from 'lucide-react';
export default function PrivacyShield() {
    const guarantees = [
        { icon: <EyeOff size={18}/>, text: 'Zero Telemetry' },
        { icon: <ShieldCheck size={18}/>, text: 'Isolated Containers' },
        { icon: <Trash2 size={18}/>, text: 'Auto-Purge Logs (7 Days)' },
        { icon: <Lock size={18}/>, text: 'AES-256-GCM Encryption' },
    ];
    return (<div id="privacy-shield-section">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {guarantees.map((g, i) => (<div key={i} className="panel flex items-center gap-3" style={{ padding: '0.75rem 1rem' }}>
            <span className="text-trust flex items-center justify-center">{g.icon}</span>
            <span className="font-mono text-secondary" style={{ fontSize: '0.8rem', direction: 'ltr' }}>{g.text}</span>
          </div>))}
      </div>
    </div>);
}
