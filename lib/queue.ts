import { Queue } from 'bullmq';
import { redis } from './redis';
export const botQueue = new Queue('bot-operations', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 1000
    }
});
