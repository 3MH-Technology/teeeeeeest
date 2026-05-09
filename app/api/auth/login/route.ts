import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { checkAuthRateLimit, isUserSuspended } from '@/lib/anti-abuse';
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
        const result = await query('SELECT id, email, password_hash, is_suspended FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'بريد إلكتروني أو كلمة مرور خاطئة' }, { status: 401 });
        }
        const user = result.rows[0];
        if (user.is_suspended || await isUserSuspended(user.id)) {
            return NextResponse.json({ error: 'حسابك معلق مؤقتاً. تواصل مع الدعم.' }, { status: 403 });
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return NextResponse.json({ error: 'بريد إلكتروني أو كلمة مرور خاطئة' }, { status: 401 });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        logger.info({ message: 'User logged in', userId: user.id });
        return NextResponse.json({
            success: true,
            token,
            user: { id: user.id, email: user.email },
            redirect: '/dashboard',
        });
    }
    catch (error) {
        logger.error({ message: 'Login failed', error: error.message });
        return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 });
    }
}
