import { query } from '../lib/db';
import { redis } from '../lib/redis';
import Docker from 'dockerode';
import { logger } from '../lib/logger';
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });
export const startStateReconciliationEngine = () => {
    setInterval(async () => {
        try {
            await redis.set('system:reconciliation_state', 'RECOVERING');
            const dbBots = await query("SELECT id, status, current_version FROM bots WHERE deleted_at IS NULL");
            const dbMap = new Map(dbBots.rows.map(b => [b.id, b]));
            const cachedKeys = await redis.keys('bot_state_cache:*');
            for (const key of cachedKeys) {
                const botId = key.split(':')[1];
                if (!dbMap.has(botId)) {
                    await redis.del(key);
                }
            }
            const containers = await docker.listContainers({ all: true });
            const pids = new Set(containers.map(c => c.Id));
            for (const container of containers) {
                const botId = container.Labels['com.wolfhosting.botid'];
                if (!botId)
                    continue;
                if (!dbMap.has(botId)) {
                    logger.warn({ message: 'State Anomaly: DB Mismatch. Exterminating phantom docker container.', botId, containerId: container.Id });
                    const orphan = docker.getContainer(container.Id);
                    await orphan.remove({ force: true });
                }
            }
            for (const [botId, botMeta] of Array.from(dbMap.entries())) {
                if (botMeta.status === 'RUNNING') {
                    const targetActiveSuffix = await redis.get(`bot_deployment_color:${botId}`) || 'blue';
                    const expectedContainerName = `/bot-${botId}_${targetActiveSuffix}`;
                    const isAlive = containers.find(c => c.Names.includes(expectedContainerName) && c.State === 'running');
                    if (!isAlive) {
                        logger.error({ message: 'State Anomaly: DB RUNNING but missing physically. Updating DB to FAILED.', botId });
                        await query('UPDATE bots SET status = $1 WHERE id = $2 AND current_version = $3', ['FAILED', botId, botMeta.current_version]);
                    }
                }
            }
            await redis.set('system:reconciliation_state', 'HEALTHY');
        }
        catch (err) {
            await redis.set('system:reconciliation_state', 'DEGRADED');
            logger.error({ message: 'Reconciliation Engine Crashed', error: err.message });
        }
    }, 60000);
};
