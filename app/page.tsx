'use client';
import { Terminal, Shield, Lock, Server, ArrowLeft, Command } from 'lucide-react';
import ar from '@/lib/i18n';
export default function LandingPage() {
    const t = ar.landing;
    return (<div id="landing-page" style={{ padding: '0 2rem' }}>
      
      <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 0',
            borderBottom: '1px solid var(--wolf-border)',
            marginBottom: '4rem'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
          <Terminal size={20} style={{ color: 'var(--wolf-text)' }}/>
          <span>{ar.brand}</span>
          <span className="font-mono text-muted" style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem', border: '1px solid var(--wolf-border-subtle)', borderRadius: '4px' }}>
            v{ar.version}
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <a href="/auth" style={{ fontSize: '0.85rem' }}>{ar.nav.login}</a>
          <a href="/auth?register=1" className="btn btn-primary btn-sm">{ar.nav.register}</a>
        </div>
      </nav>

      
      <header style={{ maxWidth: '800px', margin: '0 auto 6rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
          {t.hero}
        </h1>
        <p className="text-secondary" style={{ fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          {t.heroSub}
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/auth?register=1" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            {t.cta}
            <ArrowLeft size={16}/>
          </a>
          <a href="https://t.me/EQJ_1" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
            المجتمع على تليقرام
          </a>
        </div>
      </header>

      
      <section style={{ maxWidth: '800px', margin: '0 auto 6rem' }}>
        <div className="terminal-block" style={{ borderTop: '4px solid var(--wolf-text)' }}>
          <div className="terminal-line">
            <span className="text-gold">~</span>
            <span className="terminal-msg">wolf deploy ./bot --type=python</span>
          </div>
          <div className="terminal-line mt-2">
            <span className="terminal-time">→</span>
            <span className="text-muted">Analyzing environment...</span>
          </div>
          <div className="terminal-line">
            <span className="terminal-time">→</span>
            <span className="text-muted">Encrypting secrets (AES-256-GCM)...</span>
          </div>
          <div className="terminal-line">
            <span className="terminal-time">→</span>
            <span className="text-trust">Container started: bot_8f2a9</span>
          </div>
        </div>
      </section>

      
      <section style={{ maxWidth: '1000px', margin: '0 auto 6rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem', borderBottom: '1px solid var(--wolf-border)', paddingBottom: '1rem' }}>
          {t.featuresTitle}
        </h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          <div>
            <Server size={20} className="mb-2 text-gold"/>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{t.privacy}</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{t.privacyDesc}</p>
          </div>
          <div>
            <Lock size={20} className="mb-2 text-trust"/>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{t.encryption}</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{t.encryptionDesc}</p>
          </div>
          <div>
            <Shield size={20} className="mb-2 text-gold"/>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{t.noTracking}</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{t.noTrackingDesc}</p>
          </div>
          <div>
            <Command size={20} className="mb-2 text-trust"/>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{t.terminal}</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{t.terminalDesc}</p>
          </div>
        </div>
      </section>

      
      <footer style={{
            borderTop: '1px solid var(--wolf-border)',
            padding: '2rem 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--wolf-text-muted)'
        }}>
        <div>{ar.brand} © 2026</div>
        <div className="flex gap-4">
          <a href="https://t.me/j49_c" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            Developed by @j49_c
          </a>
        </div>
      </footer>
    </div>);
}
