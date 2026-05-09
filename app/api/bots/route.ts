import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { botQueue } from '@/lib/queue';
import { withTransaction, logAudit, query } from '@/lib/db';
import { requestLogger, logger } from '@/lib/logger';
import { checkTenantQuotas } from '@/lib/quotas';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const userId = verifyAuth(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const traceId = uuidv4();
    requestLogger(req as any, traceId);
    try {
        const isUnderQuota = await checkTenantQuotas(userId);
        if (!isUnderQuota) {
            await logAudit(traceId, 'QUOTA_REJECTED', userId, null);
            return NextResponse.json({ error: 'You have reached your maximum active bot quota. Upgrade your tier.' }, { status: 429 });
        }
        const { name, type, token } = await req.json();
        if (!name || !type || !token) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (type === 'python' || type === 'php') {
            const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
            if (!tgRes.ok) {
                return NextResponse.json({ error: 'Invalid Telegram token' }, { status: 400 });
            }
        }
        const botId = crypto.randomBytes(8).toString('hex');
        
        // Fix: Use random IV for AES-256-CBC
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', iv);
        let encryptedEnv = cipher.update(JSON.stringify({ BOT_TOKEN: token }), 'utf8', 'hex');
        encryptedEnv += cipher.final('hex');
        const finalEncryptedEnv = iv.toString('hex') + ':' + encryptedEnv;

        await withTransaction(async (client: any) => {
            await client.query('INSERT INTO bots (id, user_id, name, type, status, encrypted_env) VALUES ($1, $2, $3, $4, $5, $6)', [botId, userId, name, type, 'CREATING', finalEncryptedEnv]);
            await client.query('INSERT INTO audit_logs (trace_id, action, user_id, bot_id) VALUES ($1, $2, $3, $4)', [traceId, 'BOT_CREATION_INITIATED', userId, botId]);
        });
        await botQueue.add('deploy', {
            action: 'deploy',
            botId,
            userId,
            traceId
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 }
        });
        return NextResponse.json({ success: true, bot: { id: botId, name, type, status: 'CREATING', traceId } });
    }
    catch (error: any) {
        logger.error({ message: 'API Error', traceId, error: error.message });
        return NextResponse.json({ error: 'Failed to deploy' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const userId = verifyAuth(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const botsRes = await query('SELECT id, name, type, status, container_id, current_version, created_at FROM bots WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC', [userId]);
        const userRes = await query('SELECT max_bots FROM users WHERE id = $1', [userId]);
        const maxBots = userRes.rows[0]?.max_bots || 3;
        const cpuRes = await query("SELECT sum(cpu_seconds) as total_cpu FROM bot_usage_metrics WHERE timestamp > NOW() - INTERVAL '5 minutes' AND bot_id IN (SELECT id FROM bots WHERE user_id = $1)", [userId]);
        const memRes = await query("SELECT sum(memory_mb) as total_mem FROM bot_usage_metrics WHERE timestamp > NOW() - INTERVAL '5 minutes' AND bot_id IN (SELECT id FROM bots WHERE user_id = $1)", [userId]);
        const metrics = {
            cpuUsage: cpuRes.rows[0]?.total_cpu || 0,
            memUsage: memRes.rows[0]?.total_mem || 0
        };
        return NextResponse.json({ bots: botsRes.rows, maxBots, metrics });
    }
    catch (error: any) {
        logger.error({ message: 'API Error', error: error.message });
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
