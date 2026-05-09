'use client';
import { Play, Square, Trash2, Terminal, RotateCcw } from 'lucide-react';
import ar from '@/lib/i18n';
export default function BotCard({ bot, onRefresh }) {
    const isRunning = bot.status?.toUpperCase() === 'RUNNING';
    const toggleStatus = async () => {
        const action = isRunning ? 'stop' : 'start';
        await fetch(`/api/bots/${bot.id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        });
        onRefresh();
    };
    const deleteBot = async () => {
        if (!confirm('Are you sure you want to delete this deployment?'))
            return;
        await fetch(`/api/bots/${bot.id}`, { method: 'DELETE' });
        onRefresh();
    };
    return (<div className="panel" id={`bot-card-${bot.id}`}>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="flex items-center gap-2" style={{ fontSize: '1rem' }}>
            {bot.name}
            <span className={`status-dot ${bot.status.toLowerCase()}`} title={bot.status}/>
          </h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--wolf-text-secondary)', marginTop: '0.25rem' }}>
            {bot.type} · v{bot.current_version || 1}
          </div>
        </div>
      </div>

      
      <div style={{
            fontSize: '0.75rem',
            color: 'var(--wolf-text-muted)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '1.25rem',
            direction: 'ltr',
            textAlign: 'left'
        }}>
        ID: {bot.id.substring(0, 16)}...
      </div>

      
      <div className="flex gap-2">
        <button onClick={toggleStatus} className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'} flex-1`} id={`bot-toggle-${bot.id}`}>
          {isRunning ? <Square size={14}/> : <Play size={14}/>}
          {isRunning ? 'إيقاف' : 'تشغيل'}
        </button>
        <button className="btn btn-secondary" title={ar.infra.logs} id={`bot-logs-${bot.id}`}>
          <Terminal size={14}/>
        </button>
        <button className="btn btn-secondary" title={ar.infra.restart} id={`bot-rollback-${bot.id}`}>
          <RotateCcw size={14}/>
        </button>
        <button className="btn btn-danger" onClick={deleteBot} title={ar.infra.delete} id={`bot-delete-${bot.id}`}>
          <Trash2 size={14}/>
        </button>
      </div>
    </div>);
}
