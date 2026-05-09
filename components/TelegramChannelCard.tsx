'use client';
import { ExternalLink } from 'lucide-react';
export default function TelegramChannelCard({ title, description, url, icon }) {
    return (<a href={url} target="_blank" rel="noopener noreferrer" className="panel telegram-card" style={{
            display: 'flex',
            flexDirection: 'column',
            textDecoration: 'none',
            height: '100%',
        }}>
      <div className="flex justify-between items-start mb-3">
        <div style={{ color: 'var(--wolf-gold)' }}>
          {icon}
        </div>
        <ExternalLink size={16} style={{ color: 'var(--wolf-text-muted)' }}/>
      </div>
      <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--wolf-text)' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--wolf-text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', flex: 1 }}>
        {description}
      </p>
    </a>);
}
