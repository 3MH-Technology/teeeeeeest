'use client';
import { useState } from 'react';
import { X, Terminal, Shield } from 'lucide-react';
import ar from '@/lib/i18n';
export default function CreateBotModal({ onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('python');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/bots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, token }),
            });
            if (res.ok) {
                onSuccess();
                onClose();
            }
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="modal-overlay" id="create-bot-modal">
      <div className="modal-content" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--wolf-border)', background: 'var(--wolf-bg-surface)' }}>
          <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Terminal size={16}/>
            {ar.bot.createTitle}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.2rem' }} id="modal-close-btn">
            <X size={16}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label font-mono">{ar.bot.name}</label>
            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. production-bot-01" required id="bot-name-input" style={{ direction: 'ltr', textAlign: 'left' }}/>
          </div>

          <div className="form-group">
            <label className="form-label font-mono">{ar.bot.type}</label>
            <select className="form-control" value={type} onChange={(e) => setType(e.target.value)} id="bot-runtime-select" style={{ direction: 'ltr', textAlign: 'left' }}>
              <option value="python">Python 3.10 (Alpine)</option>
              <option value="php">PHP 8.2 (CLI)</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <div className="flex justify-between items-end mb-1">
              <label className="form-label font-mono mb-0">{ar.bot.envVars}</label>
              <span className="text-trust flex items-center gap-1" style={{ fontSize: '0.75rem' }}>
                <Shield size={12}/>
                AES-256-GCM
              </span>
            </div>
            <textarea className="form-control" value={`TELEGRAM_TOKEN=${token}`} onChange={(e) => {
            const val = e.target.value;
            const match = val.match(/TELEGRAM_TOKEN=(.*)/);
            if (match)
                setToken(match[1].trim());
            else
                setToken('');
        }} placeholder="TELEGRAM_TOKEN=" required id="bot-token-input" rows={3} style={{ resize: 'none', direction: 'ltr', textAlign: 'left', lineHeight: '1.5' }}/>
            <p className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
              Secret variables are encrypted instantly at rest.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--wolf-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="deploy-bot-btn">
              {loading ? <span className="font-mono">Processing...</span> : ar.bot.deployBtn}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
