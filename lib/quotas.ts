import { query } from './db';
import { logger } from './logger';
export const checkTenantQuotas = async (userId) => {
    try {
        const userRes = await query('SELECT max_bots FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0)
            throw new Error('User not found');
        const maxBots = userRes.rows[0].max_bots;
        const botsRes = await query('SELECT COUNT(*) as bot_count FROM bots WHERE user_id = $1 AND deleted_at IS NULL', [userId]);
        const currentBots = parseInt(botsRes.rows[0].bot_count, 10);
        if (currentBots >= maxBots) {
            logger.warn({ message: 'Quota exceeded', userId, currentBots, maxBots });
            return false;
        }
        return true;
    }
    catch (error) {
        logger.error({ message: 'Quota check failed', error: error.message });
        throw error;
    }
};
