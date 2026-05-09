import winston from 'winston';
export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    defaultMeta: { service: 'wolf-hosting-v0.4' },
    transports: [
        new winston.transports.Console()
    ]
});
export const requestLogger = (req, traceId) => {
    logger.info({
        type: 'request',
        traceId,
        method: req.method,
        url: req.url || req.nextUrl?.pathname
    });
};
