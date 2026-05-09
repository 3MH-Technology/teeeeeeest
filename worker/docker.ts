import Docker from 'dockerode';
import { logger } from '../lib/logger';
import { query } from '../lib/db';
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });
const TARGET_IMAGES = ['wolf-bot-python', 'wolf-bot-php'];
export const prePullImages = async () => {
    logger.info({ message: 'Pre-pulling base images or verifying existence', images: TARGET_IMAGES });
    for (const image of TARGET_IMAGES) {
        try {
            await docker.getImage(image).inspect();
            logger.info({ message: `Image ${image} verified` });
        }
        catch {
            logger.warn({ message: `Image ${image} missing. Ensure you run docker build in templates!` });
        }
    }
};
export const cleanupZombieContainers = async () => {
    logger.info({ message: 'Sweeping for zombie containers...' });
    const containers = await docker.listContainers({ all: true });
    if (containers.length === 0) return;
    
    const botIdsInUse = containers.map(c => c.Labels['com.wolfhosting.botid']).filter(Boolean);
    if (botIdsInUse.length === 0) return;
    
    const res = await query('SELECT id FROM bots WHERE id = ANY($1) AND deleted_at IS NOT NULL', [botIdsInUse]);
    const deletedIds = res.rows.map(r => r.id);
    for (const container of containers) {
        const botId = container.Labels['com.wolfhosting.botid'];
        if (botId && deletedIds.includes(botId)) {
            try {
                const c = docker.getContainer(container.Id);
                await c.remove({ force: true });
                logger.info({ message: 'Force removed zombie container', botId, containerId: container.Id });
            }
            catch (err) {
                logger.error({ message: 'Failed to remove zombie', botId, error: err.message });
            }
        }
    }
};
export const createBotContainer = async (botId, type, env, userId) => {
    const imageName = type === 'python' ? 'wolf-bot-python' : 'wolf-bot-php';
    const containerName = `bot-${botId}`;
    const envVars = Object.entries(env).map(([key, value]) => `${key}=${value}`);
    const networkName = `wolf_user_${userId}`;
    
    try {
        await docker.getNetwork(networkName).inspect();
    } catch {
        await docker.createNetwork({ Name: networkName, Driver: 'bridge' });
    }

    const container = await docker.createContainer({
        Image: imageName,
        name: containerName,
        Env: envVars,
        Labels: {
            'com.wolfhosting.userid': userId.toString(),
            'com.wolfhosting.botid': botId,
        },
        HostConfig: {
            Memory: 128 * 1024 * 1024,
            CpuShares: 512,
            NetworkMode: networkName,
            RestartPolicy: {
                Name: 'on-failure',
                MaximumRetryCount: 3
            },
            Privileged: false,
            ReadonlyRootfs: true,
            CapDrop: ['ALL'],
            SecurityOpt: ['no-new-privileges:true'],
        }
    });
    
    try {
        const net = docker.getNetwork('wolf_bots');
        await net.connect({ Container: container.id });
    } catch (e: any) {
        logger.warn({ message: 'Could not attach to wolf_bots', error: e.message });
    }

    await container.start();
    return container.id;
};
export const stopBotContainer = async (botId) => {
    try {
        const container = docker.getContainer(`bot-${botId}`);
        await container.stop();
    }
    catch (error) {
        if (error.statusCode !== 304 && error.statusCode !== 404) {
            throw error;
        }
    }
};
export const deleteBotContainer = async (botId) => {
    try {
        const container = docker.getContainer(`bot-${botId}`);
        await container.remove({ force: true });
    }
    catch (error) {
        if (error.statusCode !== 404) {
            throw error;
        }
    }
};
export const reloadNginx = async () => {
    try {
        const container = docker.getContainer('wolf_nginx');
        await container.kill({ signal: 'SIGHUP' });
        logger.info({ message: 'Nginx reloaded successfully via SIGHUP' });
    }
    catch (err) {
        logger.error({ message: 'Failed to reload Nginx container', error: err.message });
    }
};
