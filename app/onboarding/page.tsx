'use client';
import { useState } from 'react';
import { Shield, Rocket, PartyPopper, ChevronLeft, ChevronRight } from 'lucide-react';
import ar from '@/lib/i18n';
const steps = [
    {
        icon: <Shield size={48} style={{ color: 'var(--wolf-gold)' }}/>,
        title: ar.onboarding.step1.title,
        desc: ar.onboarding.step1.desc,
    },
    {
        icon: <Shield size={48} style={{ color: 'var(--wolf-trust-green)' }}/>,
        title: ar.onboarding.step2.title,
        desc: ar.onboarding.step2.desc,
    },
    {
        icon: <Rocket size={48} style={{ color: 'var(--wolf-gold)' }}/>,
        title: ar.onboarding.step3.title,
        desc: ar.onboarding.step3.desc,
    },
    {
        icon: <PartyPopper size={48} style={{ color: 'var(--wolf-trust-green)' }}/>,
        title: ar.onboarding.step4.title,
        desc: ar.onboarding.step4.desc,
    },
];
export default function OnboardingPage() {
    const [current, setCurrent] = useState(0);
    const step = steps[current];
    const isLast = current === steps.length - 1;
    const next = () => {
        if (isLast) {
            window.location.href = '/dashboard';
        }
        else {
            setCurrent(c => c + 1);
        }
    };
    const prev = () => setCurrent(c => Math.max(0, c - 1));
    return (<div id="onboarding-page" style={{ maxWidth: '500px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
      <div className="panel animate-fade" key={current} style={{ padding: '3rem 2rem', marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>{step.icon}</div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.75rem', color: 'var(--wolf-gold)' }}>
          {step.title}
        </h1>
        <p className="text-secondary" style={{ fontSize: '1rem', lineHeight: '1.8', maxWidth: '400px', margin: '0 auto' }}>
          {step.desc}
        </p>
      </div>

      
      <div className="flex justify-center gap-2 mb-6">
        {steps.map((_, i) => (<div key={i} style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === current ? 'var(--wolf-text)' : 'var(--wolf-border)',
                transition: 'all 0.2s ease'
            }}/>))}
      </div>

      
      <div className="flex justify-center gap-3 mt-4">
        {current > 0 && (<button className="btn btn-secondary" onClick={prev} id="onboarding-prev">
            <ChevronRight size={16}/>
            {ar.onboarding.prev}
          </button>)}
        <button className="btn btn-primary" onClick={next} id="onboarding-next">
          {isLast ? ar.onboarding.finish : ar.onboarding.next}
          {!isLast && <ChevronLeft size={16}/>}
        </button>
      </div>

      {!isLast && (<button onClick={() => { window.location.href = '/dashboard'; }} style={{
                background: 'none', border: 'none', color: 'var(--wolf-text-muted)',
                cursor: 'pointer', marginTop: '1.5rem', fontSize: '0.82rem',
                fontFamily: 'var(--font-body)'
            }} id="onboarding-skip">
          {ar.onboarding.skip}
        </button>)}
    </div>);
}
