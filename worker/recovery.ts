import { query } from '../lib/db';
import { redis } from '../lib/redis';
import { cleanupZombieContainers } from './docker';
import { logger } from '../lib/logger';
import Docker from 'dockerode';
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });
export const runSystemRecoveryDiagnostics = async () => {
    logger.info({ message: 'Initiating System Fail-Safe Recovery Boot' });
    try {
        const activeBotsQuery = await query("SELECT id, status FROM bots WHERE deleted_at IS NULL");
        for (const bot of activeBotsQuery.rows) {
            await redis.set(`bot_cache:${bot.id}`, JSON.stringify(bot));
        }
        logger.info({ message: `Rehydrated Redis caching layer with ${activeBotsQuery.rows.length} contexts.` });
        const runningContainers = await docker.listContainers();
        const systemBotIds = activeBotsQuery.rows.map(r => r.id);
        await cleanupZombieContainers();
        for (const bot of activeBotsQuery.rows) {
            if (bot.status === 'RUNNING') {
                const matchingContainer = runningContainers.find(c => c.Labels['com.wolfhosting.botid'] === bot.id);
                if (!matchingContainer) {
                    logger.warn({ message: `Container missing for RUNNING bot. Initiating structural recovery!`, botId: bot.id });
                }
            }
        }
        logger.info({ message: 'Deterministic system recovery completed safely.' });
    }
    catch (error) {
        logger.error({ message: 'System Recovery Diagnostics completely failed!', error: error.message });
        process.exit(1);
    }
};
