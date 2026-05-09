'use client';
import Sidebar from '@/components/Sidebar';
import TelegramChannelCard from '@/components/TelegramChannelCard';
import ar from '@/lib/i18n';
import { MessageCircle, Code, Hash, Trophy, Medal } from 'lucide-react';

export default function CommunityHub() {
  const OFFICIAL_CHANNELS = [
    {
      title: ar.community.channels.official,
      description: ar.community.channels.officialDesc,
      url: 'https://t.me/EQJ_1',
      icon: <MessageCircle size={24}/>,
    },
    {
      title: ar.community.channels.python,
      description: ar.community.channels.pythonDesc,
      url: 'https://t.me/bshshshkk',
      icon: <Code size={24}/>,
    },
    {
      title: ar.community.channels.numbers,
      description: ar.community.channels.numbersDesc,
      url: 'https://t.me/BQBOOB',
      icon: <Hash size={24}/>,
    },
    {
      title: ar.community.channels.events,
      description: ar.community.channels.eventsDesc,
      url: 'https://t.me/O5O6J',
      icon: <Trophy size={24}/>,
    },
  ];

  const LEADERBOARD = [
    { name: '@dev_ahmed', score: 1250, badge: '🏆' },
    { name: '@python_master', score: 980, badge: '🥇' },
    { name: '@bot_creator', score: 850, badge: '🥈' },
    { name: '@arab_coder', score: 720, badge: '🥉' },
    { name: '@code_ninja', score: 640, badge: '⭐' },
  ];

  return (
    <div className="app-layout" id="community-page">
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '1000px' }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 style={{ fontSize: '1.6rem' }}>{ar.community.title}</h1>
            <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>Official</span>
          </div>
          <p className="text-secondary mb-8" style={{ fontSize: '0.95rem' }}>{ar.community.subtitle}</p>

          <section className="mb-10">
            <h2 className="mb-4" style={{ fontSize: '1.2rem', color: 'var(--wolf-gold)' }}>
              {ar.community.channelsTitle}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1.25rem'
            }}>
              {OFFICIAL_CHANNELS.map((channel, i) => (
                <TelegramChannelCard key={i} {...channel}/>
              ))}
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <section>
              <div className="panel" style={{ height: '100%' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Trophy size={20} style={{ color: 'var(--wolf-gold)' }}/>
                  <h2 style={{ fontSize: '1.1rem' }}>{ar.community.competitionsTitle}</h2>
                </div>
                <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>
                  {ar.community.competitionsSub}
                </p>
                <div style={{
                  background: 'var(--wolf-bg-void)',
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--wolf-border)',
                  textAlign: 'center'
                }}>
                  <p style={{ color: 'var(--wolf-gold)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    المسابقة القادمة: تحدي بوت الذكاء الاصطناعي
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                    اشترك الآن واربح جائزة مميزة. التفاصيل: راجع قناة الأحداث.
                  </p>
                  <a href="https://t.me/O5O6J" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    اشترك الآن
                  </a>
                </div>
              </div>
            </section>

            <section>
              <div className="panel" style={{ height: '100%' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Medal size={20} style={{ color: 'var(--wolf-trust-green)' }}/>
                  <h2 style={{ fontSize: '1.1rem' }}>{ar.community.leaderboardTitle}</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {LEADERBOARD.map((user, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'var(--wolf-bg-void)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--wolf-border)'
                    }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '1.2rem' }}>{user.badge}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', direction: 'ltr' }}>
                          {user.name}
                        </span>
                      </div>
                      <span style={{ color: 'var(--wolf-gold)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {user.score} pt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
