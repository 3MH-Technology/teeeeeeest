import { Pool } from 'pg';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://wolf:secretpassword@localhost:5432/wolfhosting',
});
pool.on('error', (err) => {
    console.error('Unexpected DB error on idle client', err);
    process.exit(-1);
});
export const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
};
export const withTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
};
export const getActiveBotsForUser = async (userId) => {
    return query('SELECT * FROM bots WHERE user_id = $1 AND deleted_at IS NULL', [userId]);
};
export const logAudit = async (traceId, action, userId, botId = null, details = {}) => {
    await query('INSERT INTO audit_logs (trace_id, action, user_id, bot_id, details) VALUES ($1, $2, $3, $4, $5)', [traceId, action, userId, botId, JSON.stringify(details)]);
};
export default pool;
