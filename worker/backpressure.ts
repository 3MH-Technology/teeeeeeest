import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import fs from 'fs';
export const executePredictiveOverloadCheck = async () => {
    let limiterMax = 50;
    try {
        let memoryPressure = 0;
        if (fs.existsSync('/proc/pressure/memory')) {
            const memData = fs.readFileSync('/proc/pressure/memory', 'utf-8');
            const match = memData.match(/some avg10=([\d.]+)/);
            if (match)
                memoryPressure = parseFloat(match[1]);
        }
        let ioPressure = 0;
        if (fs.existsSync('/proc/pressure/io')) {
            const ioData = fs.readFileSync('/proc/pressure/io', 'utf-8');
            const match = ioData.match(/some avg10=([\d.]+)/);
            if (match)
                ioPressure = parseFloat(match[1]);
        }
        if (memoryPressure > 10.0 || ioPressure > 25.0) {
            logger.warn({ message: 'PREDICTIVE OVERLOAD: Memory/IO Thrash detected natively. Applying severe limits.' });
            await redis.set('system:reconciliation_state', 'OVERLOADED');
            limiterMax = 0;
        }
        else if (memoryPressure > 5.0 || ioPressure > 15.0) {
            await redis.set('system:reconciliation_state', 'DEGRADED');
            limiterMax = 3;
        }
        else {
            const currentState = await redis.get('system:reconciliation_state');
            if (currentState !== 'HEALTHY') {
                await redis.set('system:reconciliation_state', 'HEALTHY');
            }
        }
    }
    catch (e) {
    }
    return limiterMax;
};
