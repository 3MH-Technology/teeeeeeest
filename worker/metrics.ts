import { query } from '../lib/db';
import { redis } from '../lib/redis';
import Docker from 'dockerode';
import { logger } from '../lib/logger';
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });
export const startMetricsCollector = async () => {
    logger.info({ message: 'Initializing Immutable Docker Metrics Engine' });
    setInterval(async () => {
        try {
            const dbRes = await query("SELECT id FROM bots WHERE status = 'RUNNING'");
            const activeBots = dbRes.rows.map(r => r.id);
            let rawMetricTuples = [];
            for (const botId of activeBots) {
                try {
                    const container = docker.getContainer(`bot-${botId}`);
                    const stats = await container.stats({ stream: false });
                    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
                    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
                    let rawCpu = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 * stats.cpu_stats.online_cpus : 0.0;
                    const memoryMb = stats.memory_stats.usage / (1024 * 1024) || 0;
                    
                    // Use bot_usage_metrics as defined in schema.sql
                    // Calculate uptime_seconds (mocked for now as we don't track start time easily here)
                    await query('INSERT INTO bot_usage_metrics (bot_id, cpu_seconds, memory_mb, uptime_seconds) VALUES ($1, $2, $3, $4)', 
                        [botId, rawCpu / 100, memoryMb, 60]);

                    const alpha = 0.3;
                    const previousCpuStr = await redis.get(`ema:cpu:${botId}`);
                    const previousCpu = previousCpuStr ? parseFloat(previousCpuStr) : rawCpu;
                    const smoothedCpu = (rawCpu * alpha) + (previousCpu * (1 - alpha));
                    await redis.set(`ema:cpu:${botId}`, smoothedCpu.toString());
                    await redis.setex(`metrics:bot:${botId}`, 120, JSON.stringify({ cpu: smoothedCpu, memoryMb }));
                }
                catch (e) { }
            }
        }
        catch (err) { }
    }, 60000);
};
