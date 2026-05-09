'use client';
import { useState } from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import ar from '@/lib/i18n';
import Sidebar from '@/components/Sidebar';
export default function NewDeploymentPage() {
    const [name, setName] = useState('');
    const [type, setType] = useState('python');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/bots', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, type, token }),
            });
            if (res.ok) {
                window.location.href = '/dashboard';
            }
            else {
                const data = await res.json();
                setError(data.error || 'Failed to deploy');
            }
        }
        catch (err) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="app-layout" id="new-deployment-page">
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="flex items-center gap-4 mb-8">
            <a href="/dashboard" className="btn btn-ghost" style={{ padding: '0.5rem' }}>
              <ArrowRight size={20}/>
            </a>
            <h1 style={{ fontSize: '1.25rem' }}>{ar.bot.createTitle}</h1>
          </div>

          <div className="panel">
            {error && (<div className="alert alert-danger mb-6 p-4 rounded bg-red-900 text-red-100 font-mono text-sm border border-red-700">
                {error}
              </div>)}
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-6">
                <label className="form-label font-mono">{ar.bot.name}</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. production-bot-01" required id="bot-name-input"/>
              </div>

              <div className="form-group mb-6">
                <label className="form-label font-mono">{ar.bot.type}</label>
                <select className="form-control" value={type} onChange={(e) => setType(e.target.value)} id="bot-runtime-select">
                  <option value="python">Python 3.10 (Alpine)</option>
                  <option value="php">PHP 8.2 (CLI)</option>
                </select>
              </div>

              <div className="form-group mb-8">
                <div className="flex justify-between items-end mb-2">
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
        }} placeholder="TELEGRAM_TOKEN=" required id="bot-token-input" rows={4} style={{ resize: 'none', lineHeight: '1.6' }}/>
                <p className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                  Secret variables are encrypted instantly at rest.
                </p>
              </div>

              <div className="flex justify-end pt-6" style={{ borderTop: '1px solid var(--wolf-border)' }}>
                <button type="submit" className="btn btn-primary" disabled={loading} id="deploy-bot-btn">
                  {loading ? <span className="font-mono">Processing...</span> : ar.bot.deployBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>);
}
