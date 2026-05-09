'use client';
import { useState } from 'react';
import { Shield, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import ar from '@/lib/i18n';
export default function AuthPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (isRegister && password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }
        setLoading(true);
        try {
            const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                window.location.href = '/dashboard';
            }
            else {
                const data = await res.json();
                setError(data.error || 'حدث خطأ، حاول مرة أخرى');
            }
        }
        catch {
            setError('تعذر الاتصال بالخادم');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div id="auth-page">
      
      <div style={{
            padding: '1rem 2rem',
            borderBottom: '1px solid var(--wolf-border-subtle)',
            display: 'flex',
            justifyContent: 'center'
        }}>
        <a href="/" className="brand" style={{ fontSize: '1.2rem' }}>
          <Shield size={20} style={{ color: 'var(--wolf-gold)' }}/>
          {ar.brand}
        </a>
      </div>

      <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '0 1rem' }}>
        <div className="panel animate-fade">
          <h2>{isRegister ? ar.auth.registerTitle : ar.auth.loginTitle}</h2>
          <p className="text-center text-secondary mb-6" style={{ fontSize: '0.85rem' }}>
            {ar.brandSub}
          </p>

          
          <div className="text-trust flex items-start gap-2 mb-6" style={{ fontSize: '0.8rem', padding: '0.75rem', background: 'var(--wolf-trust-dim)', border: '1px solid var(--wolf-border)', borderRadius: 'var(--radius-sm)' }}>
            <ShieldCheck size={16} style={{ flexShrink: 0 }}/>
            <span>{ar.auth.privacyNotice}</span>
          </div>

          {error && (<div style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--wolf-danger-dim)',
                border: '1px solid rgba(229, 80, 80, 0.2)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--wolf-danger)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
            }}>
              {error}
            </div>)}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{ar.auth.email}</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ar.auth.emailPlaceholder} required id="auth-email" style={{ direction: 'ltr', textAlign: 'left' }}/>
            </div>

            <div className="form-group">
              <label className="form-label">{ar.auth.password}</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={ar.auth.passwordPlaceholder} required id="auth-password" style={{ direction: 'ltr', textAlign: 'left', paddingLeft: '2.5rem' }}/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--wolf-text-muted)',
            cursor: 'pointer'
        }}>
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {isRegister && (<div className="form-group">
                <label className="form-label">{ar.auth.confirmPassword}</label>
                <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={ar.auth.passwordPlaceholder} required id="auth-confirm-password" style={{ direction: 'ltr', textAlign: 'left' }}/>
              </div>)}

            <button type="submit" className="btn btn-primary mt-4" disabled={loading} style={{ width: '100%' }} id="auth-submit">
              {loading ? (<div className="spinner"/>) : isRegister ? ar.auth.registerBtn : ar.auth.loginBtn}
            </button>
          </form>

          <div className="text-center mt-6">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{
            background: 'none',
            border: 'none',
            color: 'var(--wolf-gold)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-body)'
        }}>
              {isRegister ? ar.auth.switchToLogin : ar.auth.switchToRegister}
            </button>
          </div>

          {isRegister && (<p className="text-center text-muted mt-4" style={{ fontSize: '0.75rem' }}>
              <Lock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '3px' }}/>
              {ar.auth.termsNotice}
            </p>)}
        </div>
      </div>
    </div>);
}
