import { redis } from '../lib/redis';
import Docker from 'dockerode';
import { logger } from '../lib/logger';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createBotContainer, deleteBotContainer, reloadNginx } from './docker';
import { acquireLock, releaseLock } from '../lib/mutex';
import { createDeploymentSnapshot, validateSnapshotCommit } from './snapshot';
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });
export const executeBlueGreenDeployment = async (botId, type, encryptedEnv, userId, traceId) => {
    const lockId = await acquireLock(`deploy_gate:${botId}`, 300);
    if (!lockId) {
        logger.error({ message: 'Safety Gate Blocked: Mutex Lock unattainable. Aborting execution.', botId, traceId });
        throw new Error('Concurrent state mutation guard triggered. Deployment aborted.');
    }
    const activeColor = await redis.get(`bot_deployment_color:${botId}`) || 'blue';
    const targetColor = activeColor === 'blue' ? 'green' : 'blue';
    let newContainerSuffix = `${botId}_${targetColor}`;
    try {
        const preSnapshot = await createDeploymentSnapshot(botId, encryptedEnv, targetColor);
        let iv = Buffer.alloc(16, 0);
        let envData = encryptedEnv;
        if (encryptedEnv.includes(':')) {
            const parts = encryptedEnv.split(':');
            iv = Buffer.from(parts[0], 'hex');
            envData = parts[1];
        }
        const decipher = crypto.createDecipheriv('aes-256-cbc', process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', iv);
        let decryptedEnv = decipher.update(envData, 'hex', 'utf8');
        decryptedEnv += decipher.final('utf8');
        const envs = JSON.parse(decryptedEnv);
        logger.info({ message: `Executing Atomic Shift Phase`, targetColor, botId, traceId });
        await createBotContainer(newContainerSuffix, type, envs, userId);
        const targetContainer = docker.getContainer(newContainerSuffix);
        let isReady = false;
        let attempts = 0;
        while (!isReady && attempts < 5) {
            attempts++;
            await new Promise(r => setTimeout(r, 2000));
            try {
                const meta = await targetContainer.inspect();
                if (!meta.State.Running)
                    throw new Error('Container unexpectedly hit EXIT state');
                const stats = await targetContainer.stats({ stream: false });
                const memMb = stats.memory_stats.usage / (1024 * 1024);
                if (memMb > 100)
                    throw new Error(`Memory boundary broken natively: ${memMb.toFixed(2)}MB`);
                isReady = true;
            }
            catch (err) { }
        }
        if (!isReady) {
            throw new Error(`Probe validation cycle failed. Rejection imminent.`);
        }
        const isCommitValid = await validateSnapshotCommit(preSnapshot);
        if (!isCommitValid) {
            throw new Error('Deployment Rollback: Mutative drift identified natively across Post-Validation parameters.');
        }
        const confPath = path.join('/app/nginx-conf', `${botId}.conf`);
        const content = `location /webhook/${botId} {\n    resolver 127.0.0.11 valid=30s;\n    set $backend "http://bot-${newContainerSuffix}:80";\n    proxy_pass $backend;\n    proxy_connect_timeout 5s;\n}`;
        fs.writeFileSync(confPath, content);
        await reloadNginx();
        if (activeColor !== targetColor) {
            await deleteBotContainer(`${botId}_${activeColor}`);
        }
        await redis.set(`bot_deployment_color:${botId}`, targetColor);
        return newContainerSuffix;
    }
    catch (executionCrash) {
        logger.error({ message: 'Execution logic block crashed! Exterminating target payloads natively.', error: executionCrash.message, botId });
        await deleteBotContainer(newContainerSuffix);
        throw executionCrash;
    }
    finally {
        await releaseLock(`deploy_gate:${botId}`, lockId);
    }
};
