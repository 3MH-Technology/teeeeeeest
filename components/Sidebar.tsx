'use client';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, FolderOpen, BookOpen, Settings, Shield, LogOut, Users } from 'lucide-react';
import ar from '@/lib/i18n';
const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: ar.nav.dashboard },
    { href: '/dashboard/bots', icon: Bot, label: ar.nav.bots },
    { href: '/templates', icon: FolderOpen, label: ar.nav.templates },
    { href: '/community', icon: Users, label: ar.nav.community },
    { href: '/docs', icon: BookOpen, label: ar.nav.docs },
    { href: '/dashboard/settings', icon: Settings, label: ar.nav.settings },
];
export default function Sidebar() {
    const pathname = usePathname();
    return (<aside className="sidebar" id="sidebar-nav">
      <div className="sidebar-brand">
        <h1>{ar.brand}</h1>
        <div className="version">VERSION {ar.version} · {ar.brandSub}</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (<a key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>
            <item.icon size={18}/>
            {item.label}
          </a>))}
      </nav>

      <div className="sidebar-footer">
        <div className="trust-shield" style={{ marginBottom: '0.75rem' }}>
          <Shield size={14}/>
          <span className="trust-dot"/>
          التشفير نشط · العزل مفعّل
        </div>
        <a href="/auth" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--wolf-text-muted)' }}>
          <LogOut size={14}/>
          {ar.nav.logout}
        </a>
      </div>
    </aside>);
}
