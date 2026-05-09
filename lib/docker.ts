import Docker from 'dockerode';
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });
export const startBotContainer = async (id, type, env) => {
    const imageName = type === 'python' ? 'wolf-bot-python' : 'wolf-bot-php';
    const envVars = Object.entries(env).map(([key, value]) => `${key}=${value}`);
    try {
        const container = await docker.createContainer({
            Image: imageName,
            name: `wolf-bot-${id}`,
            Env: envVars,
            HostConfig: {
                Memory: 128 * 1024 * 1024,
                CpuShares: 512,
                NetworkMode: 'wolf_network',
                RestartPolicy: {
                    Name: 'unless-stopped',
                }
            }
        });
        await container.start();
        return true;
    }
    catch (error) {
        console.error('Failed to start container:', error);
        return false;
    }
};
export const stopBotContainer = async (id) => {
    try {
        const container = docker.getContainer(`wolf-bot-${id}`);
        await container.stop();
        return true;
    }
    catch (error) {
        console.error('Failed to stop container:', error);
        return false;
    }
};
export const deleteBotContainer = async (id) => {
    try {
        const container = docker.getContainer(`wolf-bot-${id}`);
        await container.remove({ force: true });
        return true;
    }
    catch (error) {
        console.error('Failed to remove container:', error);
        return false;
    }
};
export const getContainerLogs = async (id) => {
    try {
        const container = docker.getContainer(`wolf-bot-${id}`);
        const logs = await container.logs({ stdout: true, stderr: true, tail: 100 });
        return logs.toString('utf-8');
    }
    catch (error) {
        return 'Failed to fetch logs or container not found.';
    }
};
export const getContainerStatus = async (id) => {
    try {
        const container = docker.getContainer(`wolf-bot-${id}`);
        const data = await container.inspect();
        return data.State.Running ? 'running' : 'stopped';
    }
    catch (error) {
        return 'stopped';
    }
};
