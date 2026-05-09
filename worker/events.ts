import { redis } from '../lib/redis';
export const publishOrderedEvent = async (tenantId, botId, eventDetails, traceId) => {
    const sequenceId = await redis.incr(`tenant_event_sequence_counter:${tenantId}`);
    const immutablePayload = {
        seq: sequenceId,
        tenant_id: tenantId,
        bot_id: botId,
        trace_id: traceId,
        timestamp: Date.now(),
        ...eventDetails
    };
    await redis.xadd(`bot_stream:${botId}`, 'MAXLEN', '~', 2000, '*', 'event', JSON.stringify(immutablePayload));
    await redis.xadd(`tenant_stream:${tenantId}`, 'MAXLEN', '~', 50000, '*', 'event', JSON.stringify(immutablePayload));
    await redis.xadd(`global_observation_timeline`, 'MAXLEN', '~', 200000, '*', 'event', JSON.stringify(immutablePayload));
};
