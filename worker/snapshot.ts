import { query } from '../lib/db';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
export const createDeploymentSnapshot = async (botId, encryptedEnv, targetColor) => {
    const res = await query('SELECT current_version FROM bots WHERE id = $1', [botId]);
    if (res.rows.length === 0)
        throw new Error('Cannot snapshot missing bot state');
    const crypto = await import('crypto');
    const envHash = crypto.createHash('sha256').update(encryptedEnv).digest('hex');
    const snapshot = {
        botId,
        version: res.rows[0].current_version,
        envHash,
        targetColor,
        timestamp: Date.now()
    };
    await redis.setex(`snapshot:intent:${botId}`, 3600, JSON.stringify(snapshot));
    return snapshot;
};
export const validateSnapshotCommit = async (preSnapshot) => {
    const res = await query('SELECT current_version, encrypted_env FROM bots WHERE id = $1', [preSnapshot.botId]);
    if (res.rows.length === 0)
        return false;
    const currentVersion = res.rows[0].current_version;
    if (currentVersion !== preSnapshot.version + 1) {
        logger.error({ message: 'Fail-Atomic Guarantee Broken: Version drifted concurrently during deployment block.', botId: preSnapshot.botId });
        return false;
    }
    const crypto = await import('crypto');
    const currentEnvHash = crypto.createHash('sha256').update(res.rows[0].encrypted_env).digest('hex');
    if (currentEnvHash !== preSnapshot.envHash) {
        logger.error({ message: 'Fail-Atomic Guarantee Broken: Payload modified concurrent to execution block.', botId: preSnapshot.botId });
        return false;
    }
    return true;
};
