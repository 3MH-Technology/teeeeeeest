import { Worker } from 'bullmq';
import { stopBotContainer } from './docker';
import { executeBlueGreenDeployment } from './deployment';
import { startMetricsCollector } from './metrics';
import { startStateReconciliationEngine } from './reconciliation';
import { trackDeploymentVersion, executeRollback } from './versioning';
import { startKeyRotationDaemon } from '../lib/kms';
import { executePredictiveOverloadCheck } from './backpressure';
import { publishOrderedEvent } from './events';
import { redis } from '../lib/redis';
import { query, logAudit } from '../lib/db';
import { logger } from '../lib/logger';
const processJob = async (job) => {
    const { action, botId, userId, traceId } = job.data;
    const idempotencyKey = `job_complete:${job.id}`;
    if (await redis.setnx(idempotencyKey, '1') === 0)
        return;
    await redis.expire(idempotencyKey, 86400);
    logger.info({ message: `Executing System Job Trace`, action, botId, traceId });
    let currentVersion = 1;
    try {
        if (action === 'deploy') {
            const res = await query('SELECT type, encrypted_env FROM bots WHERE id = $1', [botId]);
            if (res.rows.length === 0)
                throw new Error('Bot Context Disconnected');
            currentVersion = await trackDeploymentVersion(botId, traceId);
            await publishOrderedEvent(userId.toString(), botId, { type: 'status', state: 'PROCESSING_DEPLOY' }, traceId);
            const activeContainerTarget = await executeBlueGreenDeployment(botId, res.rows[0].type, res.rows[0].encrypted_env, userId, traceId);
            await query('UPDATE bots SET status = $1, container_id = $2 WHERE id = $3', ['RUNNING', activeContainerTarget, botId]);
            await logAudit(traceId, `CONTAINER_STABILIZED_BG`, userId, botId);
            await publishOrderedEvent(userId.toString(), botId, { type: 'status', state: 'RUNNING' }, traceId);
        }
        else if (action === 'delete' || action === 'stop') {
            const activeColor = await redis.get(`bot_deployment_color:${botId}`) || 'blue';
            await stopBotContainer(`${botId}_${activeColor}`);
            const newStatus = action === 'delete' ? 'DELETED' : 'STOPPED';
            await query(`UPDATE bots SET status = $1 ${action === 'delete' ? ', deleted_at = CURRENT_TIMESTAMP' : ''} WHERE id = $2`, [newStatus, botId]);
            await publishOrderedEvent(userId.toString(), botId, { type: 'status', state: newStatus }, traceId);
        }
    }
    catch (error) {
        logger.error({ message: `Primary Processor Crash`, action, traceId, error: error.message });
        await logAudit(traceId, 'PROCESSOR_FAILED', userId, botId, { error: error.message });
        await publishOrderedEvent(userId.toString(), botId, { type: 'error', state: 'FAILED', error: error.message }, traceId);
        if (action === 'deploy') {
            await executeRollback(botId, currentVersion);
        }
        throw error;
    }
};
const worker = new Worker('bot-operations', processJob, {
    connection: redis,
    concurrency: 10
});
setInterval(async () => {
    try {
        const limitCount = await executePredictiveOverloadCheck();
        if (limitCount === 0 && !worker.isPaused()) {
            await worker.pause();
            logger.warn({ message: 'Execution throttled to 0%. Hardware Queue frozen.' });
        }
        else if (limitCount > 0 && worker.isPaused()) {
            await worker.resume();
            logger.info({ message: 'Hardware Restored. Queue resumed.' });
        }
    }
    catch (err) { }
}, 5000);
import { startLogMinimizationDaemon } from '../lib/privacy';
const bootstrap = async () => {
    logger.info({ message: 'Bootstrapping Wolf Hosting v0.4 — Arabic Developer Platform...' });
    startKeyRotationDaemon();
    startMetricsCollector();
    startStateReconciliationEngine();
    startLogMinimizationDaemon();
    logger.info({ message: 'Production Determinism Model is Locked.' });
};
bootstrap();
const shutdown = async (signal) => {
    await worker.close();
    await redis.quit();
    process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
