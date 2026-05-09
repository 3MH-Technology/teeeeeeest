'use client';
import { useState, useEffect } from 'react';
import { Activity, Server, Users, Database, AlertTriangle, Shield } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ar from '@/lib/i18n';
export default function AdminDashboard() {
    const [health, setHealth] = useState(null);
    useEffect(() => {
        fetch('/api/admin/health')
            .then(res => res.json())
            .then(data => setHealth(data))
            .catch(() => { });
    }, []);
    return (<div className="app-layout" id="admin-page">
      <Sidebar />
      <main className="main-content">
        <div className="flex items-center gap-3 mb-6">
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-sm)',
            background: 'var(--wolf-danger-dim)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }}>
            <Shield size={20} style={{ color: 'var(--wolf-danger)' }}/>
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem' }}>{ar.admin.title}</h1>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Wolf Hosting VERSION 0.4</p>
          </div>
        </div>

        {health ? (<>
            
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <AdminStatCard icon={<Server size={20}/>} label={ar.admin.cpuLoad} value={`${health.system?.cpuLoad?.toFixed(1) || 0}%`} color="var(--wolf-gold)"/>
              <AdminStatCard icon={<Database size={20}/>} label={ar.admin.freeMemory} value={`${((health.system?.freeMem || 0) / 1024 / 1024).toFixed(0)} MB`} color="var(--wolf-trust-green)"/>
              <AdminStatCard icon={<Users size={20}/>} label={ar.admin.totalBots} value={`${health.db?.activeBots || 0}`} color="var(--wolf-info)"/>
            </div>

            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="panel">
                <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '1rem', color: 'var(--wolf-gold)' }}>
                  <Activity size={18}/>
                  {ar.admin.redisQueue}
                </h3>
                <div className="flex flex-col gap-3">
                  <QueueRow label={ar.admin.activeWorkers} value={health.queue?.active || 0}/>
                  <QueueRow label={ar.admin.waitingJobs} value={health.queue?.waiting || 0}/>
                  <QueueRow label={ar.admin.failedJobs} value={health.queue?.failed || 0} danger/>
                </div>
              </div>

              <div className="panel">
                <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '1rem', color: 'var(--wolf-danger)' }}>
                  <AlertTriangle size={18}/>
                  {ar.admin.abuseFlags}
                </h3>
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                  نظام مراقبة الإساءة يعمل تلقائياً. يتم تعليق الحسابات الحرجة فقط مع مراجعة بشرية.
                </p>
                <div className="trust-shield mt-4" style={{ justifyContent: 'center' }}>
                  <span className="trust-dot"/>
                  النظام يعمل بشكل طبيعي
                </div>
              </div>
            </div>
          </>) : (<div className="flex items-center justify-center" style={{ padding: '3rem', color: 'var(--wolf-text-muted)' }}>
            <div className="spinner" style={{ marginLeft: '0.5rem' }}/>
            {ar.admin.loading}
          </div>)}
      </main>
    </div>);
}
function AdminStatCard({ icon, label, value, color }) {
    return (<div className="panel" style={{ padding: '1rem' }}>
      <div className="flex items-center gap-3">
        <div style={{ color }}>{icon}</div>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--wolf-text-muted)' }}>{label}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}</div>
        </div>
      </div>
    </div>);
}
function QueueRow({ label, value, danger }) {
    return (<div className="flex justify-between items-center" style={{ fontSize: '0.88rem' }}>
      <span className="text-secondary">{label}</span>
      <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: danger ? 'var(--wolf-danger)' : 'var(--wolf-text)'
        }}>
        {value}
      </span>
    </div>);
}
