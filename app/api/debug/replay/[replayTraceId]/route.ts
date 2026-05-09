import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: any) {
    const userId = verifyAuth(req);
    if (!userId || userId !== 1) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const traceId = params.replayTraceId;
        const auditLogs = await query('SELECT user_id, action, details, created_at FROM audit_logs WHERE trace_id = $1 ORDER BY created_at ASC', [traceId]);
        if (auditLogs.rows.length === 0) {
            return NextResponse.json({ error: 'Crash sequence unaccounted/missing trace markers.' }, { status: 404 });
        }
        const reconstructionSequence = auditLogs.rows.map(row => ({
            timestamp: row.created_at,
            actor: row.user_id,
            operation: row.action,
            execution_frame: row.details
        }));
        const deploymentPath = reconstructionSequence.find(seq => seq.operation.includes('CONTAINER_STARTED_BG'));
        const failurePath = reconstructionSequence.find(seq => seq.operation === 'PROCESSOR_FAILED');
        const executionStatus = failurePath ? 'FAILED' : 'SUCCESS';
        return NextResponse.json({
            trace: traceId,
            forensic_state: executionStatus,
            reconstructed_execution_block: reconstructionSequence,
            crash_report: failurePath ? failurePath.execution_frame : null,
            active_snapshot: deploymentPath ? deploymentPath.execution_frame : null
        });
    }
    catch (error) {
        return NextResponse.json({ error: 'System block corrupted during log synthesis loop.' }, { status: 500 });
    }
}
