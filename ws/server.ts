import { Server } from 'socket.io';
import { createServer } from 'http';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
const httpServer = createServer((req, res) => {
    if (req.url === '/healthz') {
        res.writeHead(200);
        res.end('OK');
    }
});
const io = new Server(httpServer, {
    cors: { 
        origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',') : ['http://localhost:3000'],
        credentials: true
    }
});
const subscribedBots = new Map();
import jwt from 'jsonwebtoken';
import { query } from '../lib/db';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) return next(new Error('Authentication error'));
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        socket.data.userId = decoded.userId;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});
io.on('connection', (socket) => {
    logger.info({ message: 'Client WS connected', socketId: socket.id, userId: socket.data.userId });
    socket.on('subscribe_bot', async (data) => {
        const { botId, lastMessageId = '0-0' } = data;
        try {
            const botRes = await query('SELECT id FROM bots WHERE id = $1 AND user_id = $2', [botId, socket.data.userId]);
            if (botRes.rows.length === 0) {
                return socket.emit('error', { message: 'Unauthorized or Bot not found' });
            }
            socket.join(`bot_${botId}`);
            logger.info({ message: 'Socket joined bot stream', socketId: socket.id, botId });
        try {
            const messages = await redis.xread('BLOCK', 0, 'STREAMS', `bot_stream:${botId}`, lastMessageId);
            if (messages && messages[0]) {
                const [, streamMessages] = messages[0];
                for (const [id, [, payload]] of streamMessages) {
                    socket.emit('status_update', { messageId: id, data: JSON.parse(payload) });
                }
            }
        }
        catch (err) {
            logger.error({ message: 'Redis Stream read error', error: err });
        }
    });
});
const pollStreams = async () => {
    while (true) {
        try {
            const activeRooms = Array.from(io.sockets.adapter.rooms.keys()).filter(r => r.startsWith('bot_'));
            if (activeRooms.length > 0) {
                const streams = activeRooms.map(r => r.replace('bot_', 'bot_stream:'));
                const ids = streams.map(() => '$');
                const results = await redis.xread('BLOCK', 5000, 'STREAMS', ...streams, ...ids);
                if (results) {
                    for (const result of results) {
                        const streamName = result[0];
                        const messages = result[1];
                        const botId = streamName.replace('bot_stream:', '');
                        for (const [id, [, payload]] of messages) {
                            io.to(`bot_${botId}`).emit('status_update', { messageId: id, data: JSON.parse(payload) });
                        }
                    }
                }
            }
            else {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        catch (err) {
        }
    }
};
pollStreams();
httpServer.listen(3001, () => {
    logger.info({ message: 'WebSocket server v0.4 listening on 3001 with stream recovery' });
});
process.on('SIGTERM', () => {
    io.close();
    redis.quit();
    process.exit(0);
});
