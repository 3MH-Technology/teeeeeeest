import { query } from '../lib/db';
import { logger } from '../lib/logger';
import { stopBotContainer } from './docker';
export const trackDeploymentVersion = async (botId, traceId) => {
    const res = await query('SELECT current_version FROM bots WHERE id = $1', [botId]);
    const currentVersion = res.rows.length > 0 ? res.rows[0].current_version : 1;
    const newVersion = currentVersion + 1;
    await query('UPDATE bots SET current_version = $1 WHERE id = $2', [newVersion, botId]);
    await query('INSERT INTO bot_versions (bot_id, version_num, status) VALUES ($1, $2, $3)', [botId, newVersion, 'ACTIVE']);
    logger.info({ message: 'Deployment version advanced', botId, version: newVersion });
    return newVersion;
};
export const executeRollback = async (botId, failedVersion) => {
    logger.error({ message: 'Executing Automated Rollback', botId, failedVersion });
    await query('UPDATE bot_versions SET status = $1 WHERE bot_id = $2 AND version_num = $3', ['FAILED', botId, failedVersion]);
    const previous = failedVersion - 1;
    if (previous <= 0) {
        logger.warn({ message: 'No previous versions to rollback to, stopping container.', botId });
        await stopBotContainer(botId);
        return;
    }
    await query('UPDATE bot_versions SET status = $1 WHERE bot_id = $2 AND version_num = $3', ['ROLLED_BACK', botId, failedVersion]);
    await query('UPDATE bots SET current_version = $1 WHERE id = $2', [previous, botId]);
    logger.info({ message: 'Successfully rolled back to previous stable version', botId, version: previous });
};
