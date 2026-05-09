'use client';
import { useState } from 'react';
import { Search, Star, Download, Code, ShoppingCart, Wrench, BookOpen } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ar from '@/lib/i18n';
const TEMPLATES = [
    {
        id: 1,
        name: 'Echo Bot',
        nameAr: 'بوت الصدى',
        descAr: 'بوت بسيط يعيد إرسال كل رسالة — مثالي للمبتدئين لفهم كيف يعمل البوت.',
        type: 'python',
        category: 'telegram',
        verified: true,
        uses: 234,
    },
    {
        id: 2,
        name: 'Store Bot',
        nameAr: 'بوت المتجر',
        descAr: 'بوت متجر إلكتروني مع كتالوج منتجات وسلة مشتريات وإشعارات الطلبات.',
        type: 'python',
        category: 'ecommerce',
        verified: true,
        uses: 189,
    },
    {
        id: 3,
        name: 'Reminder Bot',
        nameAr: 'بوت التذكير',
        descAr: 'بوت تذكيرات يومية مع جدولة المهام وإشعارات تيليقرام.',
        type: 'python',
        category: 'utility',
        verified: false,
        uses: 97,
    },
    {
        id: 4,
        name: 'Quiz Bot',
        nameAr: 'بوت الاختبارات',
        descAr: 'بوت اختبارات تعليمية مع نظام نقاط ولوحة متصدرين.',
        type: 'python',
        category: 'education',
        verified: true,
        uses: 156,
    },
    {
        id: 5,
        name: 'Webhook Relay',
        nameAr: 'بوت الإشعارات',
        descAr: 'يستقبل webhook ويرسل إشعارات لقناة تيليقرام — مثالي للمراقبة.',
        type: 'php',
        category: 'utility',
        verified: false,
        uses: 65,
    },
    {
        id: 6,
        name: 'Welcome Bot',
        nameAr: 'بوت الترحيب',
        descAr: 'يرحب بالأعضاء الجدد في المجموعة مع رسائل مخصصة وقواعد.',
        type: 'python',
        category: 'telegram',
        verified: true,
        uses: 312,
    },
];
const categoryIcons = {
    telegram: <Code size={14}/>,
    ecommerce: <ShoppingCart size={14}/>,
    utility: <Wrench size={14}/>,
    education: <BookOpen size={14}/>,
};
export default function TemplatesPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const categories = Object.entries(ar.templates.categories);
    const filtered = TEMPLATES.filter(t => {
        const matchesSearch = t.nameAr.includes(search) || t.descAr.includes(search);
        const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
        return matchesSearch && matchesCategory;
    });
    return (<div className="app-layout" id="templates-page">
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '900px' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{ar.templates.title}</h1>
          <p className="text-secondary mb-6" style={{ fontSize: '0.9rem' }}>{ar.templates.subtitle}</p>

          
          <div className="flex gap-3 mb-6 flex-wrap">
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{
            position: 'absolute', right: '0.75rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--wolf-text-muted)'
        }}/>
              <input type="text" className="form-control" placeholder={ar.templates.search} value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} id="template-search"/>
            </div>
            <div className="flex gap-2">
              {categories.map(([key, label]) => (<button key={key} className={`btn ${activeCategory === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveCategory(key)} style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                  {label}
                </button>))}
            </div>
          </div>

          
          <div className="bot-grid">
            {filtered.map((template) => (<div key={template.id} className="panel" id={`template-${template.id}`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 style={{ fontSize: '1rem' }}>{template.nameAr}</h3>
                  {template.verified && (<span className="badge badge-verified">
                      <Star size={10}/>
                      {ar.templates.verified}
                    </span>)}
                </div>
                <p className="text-secondary mb-4" style={{ fontSize: '0.85rem', lineHeight: '1.7' }}>
                  {template.descAr}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center" style={{ fontSize: '0.75rem', color: 'var(--wolf-text-muted)' }}>
                    {categoryIcons[template.category]}
                    <span>{template.type === 'python' ? 'بايثون' : 'PHP'}</span>
                    <span>·</span>
                    <Download size={12}/>
                    <span>{template.uses}</span>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    {ar.templates.useTemplate}
                  </button>
                </div>
              </div>))}
          </div>

          {filtered.length === 0 && (<div className="text-center" style={{ padding: '3rem 0', color: 'var(--wolf-text-muted)' }}>
              {ar.common.noResults}
            </div>)}
        </div>
      </main>
    </div>);
}
