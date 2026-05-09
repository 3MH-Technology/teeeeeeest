'use client';
import { useState, useEffect } from 'react';
import { Terminal, Activity, Server, Database, Play, Square, RotateCcw, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ar from '@/lib/i18n';
export default function DashboardPage() {
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [maxBots, setMaxBots] = useState(3);
    const [metrics, setMetrics] = useState({ cpuUsage: 0, memUsage: 0 });
    const fetchBots = async () => {
        try {
            const res = await fetch('/api/bots');
            const data = await res.json();
            setBots(data.bots || []);
            if (data.maxBots)
                setMaxBots(data.maxBots);
            if (data.metrics)
                setMetrics(data.metrics);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchBots();
        const interval = setInterval(fetchBots, 5000);
        return () => clearInterval(interval);
    }, []);
    const activeCount = bots.filter(b => b.status === 'RUNNING').length;
    return (<div className="app-layout" id="dashboard-page">
      <Sidebar />
      <main className="main-content">
        <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid var(--wolf-border)', paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem' }}>{ar.infra.overview}</h1>
          </div>
          <a href="/dashboard/bots/new" className="btn btn-primary btn-sm">
            {ar.infra.newDeployment}
          </a>
        </div>

        
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="panel flex items-center gap-4" style={{ padding: '1rem' }}>
            <Server size={20} className="text-muted"/>
            <div>
              <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{ar.infra.activeDeployments}</div>
              <div className="font-mono" style={{ fontSize: '1.2rem' }}>{activeCount} / {maxBots}</div>
            </div>
          </div>
          <div className="panel flex items-center gap-4" style={{ padding: '1rem' }}>
            <Activity size={20} className="text-muted"/>
            <div>
              <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{ar.infra.cpuUsage}</div>
              <div className="font-mono" style={{ fontSize: '1.2rem' }}>{Number(metrics.cpuUsage).toFixed(2)}s</div>
            </div>
          </div>
          <div className="panel flex items-center gap-4" style={{ padding: '1rem' }}>
            <Database size={20} className="text-muted"/>
            <div>
              <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{ar.infra.memoryUsage}</div>
              <div className="font-mono" style={{ fontSize: '1.2rem' }}>{Number(metrics.memUsage).toFixed(2)}MB</div>
            </div>
          </div>
        </div>

        
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="panel-header" style={{ padding: '1rem', marginBottom: 0, borderBottom: '1px solid var(--wolf-border)' }}>
            <h2 className="panel-title">
              <Terminal size={16}/>
              {ar.infra.totalDeployments}
            </h2>
          </div>
          
          {loading ? (<div className="empty-infra">
              <span className="font-mono">{ar.common.loading}</span>
            </div>) : bots.length === 0 ? (<div className="empty-infra">
              <div className="mb-4 text-muted">{ar.infra.noDeployments}</div>
              <a href="/dashboard/bots/new" className="btn btn-secondary btn-sm">
                {ar.infra.startDeploying}
              </a>
            </div>) : (<table className="infra-table">
              <thead>
                <tr>
                  <th>{ar.infra.status}</th>
                  <th>{ar.bot.name}</th>
                  <th>{ar.bot.type}</th>
                  <th>{ar.infra.container}</th>
                  <th style={{ textAlign: 'left' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {bots.map((bot) => (<tr key={bot.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`status-dot ${bot.status.toLowerCase()}`}/>
                        <span className="font-mono" style={{ fontSize: '0.75rem' }}>{bot.status}</span>
                      </div>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 500 }}>{bot.name}</td>
                    <td className="font-mono text-secondary" style={{ fontSize: '0.8rem' }}>{bot.type}</td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                      {bot.container_id ? bot.container_id.substring(0, 12) : '-'}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-secondary btn-sm" title={ar.infra.logs}>
                          <Terminal size={14}/>
                        </button>
                        {bot.status === 'RUNNING' ? (<>
                            <button className="btn btn-secondary btn-sm" title={ar.infra.restart}>
                              <RotateCcw size={14}/>
                            </button>
                            <button className="btn btn-secondary btn-sm" title="إيقاف">
                              <Square size={14}/>
                            </button>
                          </>) : (<button className="btn btn-secondary btn-sm" title={ar.infra.restart}>
                            <Play size={14}/>
                          </button>)}
                        <button className="btn btn-danger btn-sm" title={ar.infra.delete}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>)}
        </div>
      </main>
    </div>);
}
