import { query } from './db';
import { redis } from './redis';
import { logger } from './logger';
import crypto from 'crypto';
export const checkRateLimit = async (key, maxRequests, windowSeconds) => {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const redisKey = `ratelimit:${key}`;
    await redis.zremrangebyscore(redisKey, 0, windowStart);
    const count = await redis.zcard(redisKey);
    if (count >= maxRequests) {
        const oldestEntry = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
        const resetAt = oldestEntry.length >= 2
            ? parseInt(oldestEntry[1]) + windowSeconds * 1000
            : now + windowSeconds * 1000;
        return { allowed: false, remaining: 0, resetAt };
    }
    await redis.zadd(redisKey, now, `${now}:${crypto.randomBytes(4).toString('hex')}`);
    await redis.expire(redisKey, windowSeconds + 10);
    return {
        allowed: true,
        remaining: maxRequests - count - 1,
        resetAt: now + windowSeconds * 1000,
    };
};
export const checkDeploymentThrottle = async (userId) => {
    return checkRateLimit(`deploy:user:${userId}`, 10, 3600);
};
export const generateAccountFingerprint = (signals) => {
    const raw = `${signals.userAgent}|${signals.acceptLanguage}|${signals.timezone}`;
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
};
export const checkMultiAccountAbuse = async (fingerprint) => {
    const MAX_ACCOUNTS_PER_FINGERPRINT = 2;
    try {
        const result = await query('SELECT COUNT(DISTINCT id) as account_count FROM users WHERE account_fingerprint = $1', [fingerprint]);
        const count = parseInt(result.rows[0]?.account_count || '0', 10);
        if (count >= MAX_ACCOUNTS_PER_FINGERPRINT) {
            logger.warn({
                message: 'Multi-account abuse detected',
                fingerprintPrefix: fingerprint.substring(0, 8) + '...',
                accountCount: count,
            });
            return false;
        }
        return false;
    }
    catch (error) {
        logger.error({ message: 'Multi-account check failed', error: error.message });
        return false;
    }
};
export const checkIPRateLimit = async (ip) => {
    const hashedIP = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
    return checkRateLimit(`ip:${hashedIP}`, 100, 60);
};
export const checkAuthRateLimit = async (ip) => {
    const hashedIP = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
    return checkRateLimit(`auth:${hashedIP}`, 5, 300);
};
export const flagAbuse = async (flag) => {
    try {
        await query(`INSERT INTO abuse_flags (user_id, reason, severity, metadata, created_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`, [flag.userId, flag.reason, flag.severity, JSON.stringify(flag.metadata || {})]);
        logger.warn({
            message: 'Abuse flag recorded',
            userId: flag.userId,
            reason: flag.reason,
            severity: flag.severity,
        });
        if (flag.severity === 'critical') {
            await redis.set(`user_suspended:${flag.userId}`, '1', 'EX', 86400);
        }
    }
    catch (error) {
        logger.error({ message: 'Failed to record abuse flag', error: error.message });
    }
};
export const isUserSuspended = async (userId) => {
    const suspended = await redis.get(`user_suspended:${userId}`);
    return suspended === '1';
};
export const checkResourceAbuse = async (userId) => {
    try {
        const userRes = await query('SELECT max_cpu_shares, max_memory_mb FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0)
            return;
        const { max_cpu_shares, max_memory_mb } = userRes.rows[0];
        const usageRes = await query(`SELECT AVG(cpu_seconds) as avg_cpu, AVG(memory_mb) as avg_mem 
       FROM bot_usage_metrics bum 
       JOIN bots b ON bum.bot_id = b.id 
       WHERE b.user_id = $1 AND bum.timestamp > NOW() - INTERVAL '1 hour'`, [userId]);
        if (usageRes.rows.length > 0) {
            const { avg_cpu, avg_mem } = usageRes.rows[0];
            const cpuPercent = (avg_cpu / max_cpu_shares) * 100;
            const memPercent = (avg_mem / max_memory_mb) * 100;
            if (cpuPercent > 95 || memPercent > 95) {
                await flagAbuse({
                    userId,
                    reason: 'SUSTAINED_RESOURCE_ABUSE',
                    severity: 'medium',
                    metadata: { cpuPercent, memPercent },
                });
            }
        }
    }
    catch (error) {
        logger.error({ message: 'Resource abuse check failed', error: error.message });
    }
};
