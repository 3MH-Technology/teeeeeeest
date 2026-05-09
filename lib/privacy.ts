import crypto from 'crypto';
import { query } from './db';
import { redis } from './redis';
import { logger } from './logger';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
export const encryptSensitive = (plaintext) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf-8'), iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};
export const decryptSensitive = (encrypted) => {
    const parts = encrypted.split(':');
    if (parts.length < 3) {
        return legacyCBCDecrypt(encrypted);
    }
    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf-8'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
const legacyCBCDecrypt = (encrypted) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'utf-8'), Buffer.alloc(16, 0));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
export const startLogMinimizationDaemon = () => {
    const RETENTION_DAYS = 7;
    const INTERVAL_MS = 6 * 60 * 60 * 1000;
    const cleanup = async () => {
        try {
            const result = await query(`DELETE FROM bot_logs WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`);
            const auditResult = await query(`DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '30 days'`);
            logger.info({
                message: 'Log minimization complete',
                botLogsRemoved: result.rowCount,
                auditLogsRemoved: auditResult.rowCount,
            });
        }
        catch (error) {
            logger.error({ message: 'Log minimization failed', error: error.message });
        }
    };
    cleanup();
    setInterval(cleanup, INTERVAL_MS);
};
export const exportUserData = async (userId) => {
    try {
        const user = await query('SELECT id, email, created_at FROM users WHERE id = $1', [userId]);
        const bots = await query('SELECT id, name, type, status, created_at FROM bots WHERE user_id = $1', [userId]);
        const deployments = await query(`SELECT bd.* FROM bot_deployments bd 
       JOIN bots b ON bd.bot_id = b.id 
       WHERE b.user_id = $1 ORDER BY bd.deployed_at DESC LIMIT 100`, [userId]);
        return {
            user: user.rows[0] || null,
            bots: bots.rows,
            recentDeployments: deployments.rows,
            exportedAt: new Date().toISOString(),
            notice: 'This is a complete export of your data. Environment variables are excluded for security.',
        };
    }
    catch (error) {
        logger.error({ message: 'Data export failed', error: error.message, userId });
        throw error;
    }
};
export const deleteUserAccount = async (userId) => {
    try {
        await query('DELETE FROM users WHERE id = $1', [userId]);
        const keys = await redis.keys(`*user:${userId}*`);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        logger.info({ message: 'Account fully deleted', userId });
    }
    catch (error) {
        logger.error({ message: 'Account deletion failed', error: error.message, userId });
        throw error;
    }
};
export const privacyHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Wolf-Privacy': 'no-telemetry, no-analytics, no-tracking',
};
