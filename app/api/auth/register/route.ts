import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { checkAuthRateLimit, generateAccountFingerprint, checkMultiAccountAbuse } from '@/lib/anti-abuse';
import { logger } from '@/lib/logger';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';
export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimit = await checkAuthRateLimit(ip);
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'تجاوزت الحد المسموح. حاول بعد قليل.' }, { status: 429 });
        }
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل' }, { status: 400 });
        }
        const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً' }, { status: 409 });
        }
        const userAgent = req.headers.get('user-agent') || '';
        const acceptLang = req.headers.get('accept-language') || '';
        const timezone = req.headers.get('x-timezone') || 'unknown';
        const fingerprint = generateAccountFingerprint({ userAgent, acceptLanguage: acceptLang, timezone });
        const isAbuse = await checkMultiAccountAbuse(fingerprint);
        if (isAbuse) {
            return NextResponse.json({ error: 'تم اكتشاف نشاط مشبوه. تواصل مع الدعم إذا كنت تعتقد أن هذا خطأ.' }, { status: 403 });
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await query('INSERT INTO users (email, password_hash, account_fingerprint) VALUES ($1, $2, $3) RETURNING id', [email.toLowerCase(), passwordHash, fingerprint]);
        const userId = result.rows[0].id;
        const token = jwt.sign({ userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });
        logger.info({ message: 'New user registered', userId });
        return NextResponse.json({
            success: true,
            token,
            user: { id: userId, email: email.toLowerCase() },
            redirect: '/onboarding',
        });
    }
    catch (error) {
        logger.error({ message: 'Registration failed', error: error.message });
        return NextResponse.json({ error: 'حدث خطأ في التسجيل' }, { status: 500 });
    }
}
