import crypto from 'crypto';
import { redis } from './redis';
import { getActiveKey } from './kms';
export const signInternalRequest = async (payload) => {
    const internalSecret = await getActiveKey();
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const dataString = JSON.stringify(payload) + timestamp + nonce;
    const signature = crypto.createHmac('sha256', internalSecret || '').update(dataString).digest('hex');
    return {
        'x-wolf-signature': signature,
        'x-wolf-timestamp': timestamp,
        'x-wolf-nonce': nonce
    };
};
export const verifyInternalRequest = async (payload, signature, timestamp, nonce) => {
    const internalSecret = await getActiveKey();
    const timeDiff = Date.now() - parseInt(timestamp, 10);
    if (timeDiff > 30 * 1000 || timeDiff < -5000)
        return false;
    const nonceExists = await redis.setnx(`nonce:${nonce}`, '1');
    if (nonceExists === 0)
        return false;
    await redis.expire(`nonce:${nonce}`, 35);
    const dataString = JSON.stringify(payload) + timestamp + nonce;
    const expectedSignature = crypto.createHmac('sha256', internalSecret || '').update(dataString).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};
