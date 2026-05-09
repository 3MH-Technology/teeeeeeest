import { query } from './db';
import { redis } from './redis';
import crypto from 'crypto';
import { logger } from './logger';
export const rotateServiceKeys = async () => {
    const newKey = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date();
    await query('CREATE TABLE IF NOT EXISTS service_keys (id SERIAL PRIMARY KEY, key_value VARCHAR(100), created_at TIMESTAMP)');
    await query('INSERT INTO service_keys (key_value, created_at) VALUES ($1, $2)', [newKey, timestamp]);
    await redis.set('active_service_key', newKey);
    logger.info({ message: 'Service Key Rotated Successfully' });
};
export const getActiveKey = async () => {
    let key = await redis.get('active_service_key');
    if (!key) {
        const dbRes = await query('SELECT key_value FROM service_keys ORDER BY created_at DESC LIMIT 1');
        if (dbRes.rows.length > 0) {
            key = dbRes.rows[0].key_value;
            if (key)
                await redis.set('active_service_key', key);
        }
        else {
            await rotateServiceKeys();
            key = await redis.get('active_service_key');
        }
    }
    return key;
};
export const startKeyRotationDaemon = () => {
    setInterval(async () => {
        try {
            await rotateServiceKeys();
        }
        catch (error) {
            logger.error({ message: 'Key Rotation Failed', error });
        }
    }, 30 * 60 * 1000);
};
