import { redis } from './redis';
import { query } from './db';
import { logger } from './logger';
import crypto from 'crypto';
export const acquireLock = async (resourceKey, ttlSeconds = 30) => {
    const lockId = crypto.randomUUID();
    const redisResult = await redis.set(`lock:${resourceKey}`, lockId, 'EX', ttlSeconds, 'NX');
    if (redisResult === 'OK') {
        return lockId;
    }
    try {
        await query('CREATE TABLE IF NOT EXISTS global_locks (id VARCHAR(255) PRIMARY KEY, lock_id VARCHAR(255), expires_at TIMESTAMP)');
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        const dbRes = await query('INSERT INTO global_locks (id, lock_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET lock_id = $2, expires_at = $3 WHERE global_locks.expires_at < NOW() RETURNING id', [resourceKey, lockId, expiresAt]);
        if (dbRes.rows.length > 0) {
            return lockId;
        }
    }
    catch (e) {
    }
    logger.warn({ message: 'Mutex Lock Acquisiton Denied', resourceKey });
    return null;
};
export const releaseLock = async (resourceKey, lockId) => {
    const currentRedisLock = await redis.get(`lock:${resourceKey}`);
    if (currentRedisLock === lockId) {
        await redis.del(`lock:${resourceKey}`);
    }
    try {
        await query('DELETE FROM global_locks WHERE id = $1 AND lock_id = $2', [resourceKey, lockId]);
    }
    catch (e) { }
};
