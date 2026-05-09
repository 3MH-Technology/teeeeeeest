import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: any) {
    const userId = verifyAuth(req);
    if (!userId || userId !== 1) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const traceId = params.id;
        const auditLogs = await query('SELECT * FROM audit_logs WHERE trace_id = $1 ORDER BY created_at ASC', [traceId]);
        if (auditLogs.rows.length === 0) {
            return NextResponse.json({ error: 'Trace execution context not found.' }, { status: 404 });
        }
        return NextResponse.json({
            trace: traceId,
            replay_flow: auditLogs.rows.map(row => ({
                action: row.action,
                timestamp: row.created_at,
                details: row.details
            }))
        });
    }
    catch (error) {
        return NextResponse.json({ error: 'Failed to retrieve timeline' }, { status: 500 });
    }
}
