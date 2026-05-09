import { query } from '../lib/db';
import { redis } from '../lib/redis';
import Docker from 'dockerode';
import { logger } from '../lib/logger';
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });
export const startIntegrityDaemon = () => {
    logger.info({ message: 'Self-Healing Integrity Daemon Online.' });
    const runCheck = async () => {
        try {
            const dbBots = await query("SELECT id, status, current_version FROM bots WHERE deleted_at IS NULL");
            const dbMap = new Map(dbBots.rows.map(b => [b.id, b]));
            const dbDeleteSnapshot = await query("SELECT id FROM bots WHERE deleted_at IS NOT NULL");
            const deletedDbMap = new Set(dbDeleteSnapshot.rows.map(b => b.id));
            const containers = await docker.listContainers({ all: true });
            for (const container of containers) {
                const botId = container.Labels['com.wolfhosting.botid'];
                if (!botId)
                    continue;
                if (!dbMap.has(botId) || deletedDbMap.has(botId)) {
                    logger.warn({ message: 'Integrity: Ghost Sandbox identified natively. Forcing Extinction.', botId, containerId: container.Id });
                    const orphan = docker.getContainer(container.Id);
                    await orphan.remove({ force: true });
                }
            }
            for (const [botId, botMeta] of Array.from(dbMap.entries())) {
                if (botMeta.status === 'RUNNING') {
                    const targetActiveSuffix = await redis.get(`bot_deployment_color:${botId}`) || 'blue';
                    const expectedContainerName = `/bot-${botId}_${targetActiveSuffix}`;
                    const isPhysicallyAlive = containers.find(c => c.Names.includes(expectedContainerName) && (c.State === 'running' || c.State === 'restarting'));
                    if (!isPhysicallyAlive) {
                        logger.error({ message: 'Integrity: Matrix breakdown. Postgres reflects RUNNING but Engine reflects NULL. Mutating PG state.', botId });
                        await query('UPDATE bots SET status = $1 WHERE id = $2 AND current_version = $3', ['FAILED', botId, botMeta.current_version]);
                        await redis.publish(`bot_status_${botId}`, JSON.stringify({ status: 'FAILED' }));
                    }
                }
            }
        }
        catch (err) {
            logger.error({ message: 'Integrity Daemon encountered fatal mapping exception', error: err.message });
        }
        finally {
            setTimeout(runCheck, 5000);
        }
    };
    runCheck();
};
