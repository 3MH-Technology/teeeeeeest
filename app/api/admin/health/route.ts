import { NextResponse } from 'next/server';
import os from 'os';
import { query } from '@/lib/db';
import { botQueue } from '@/lib/queue';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const userId = verifyAuth(req);
    // Only allow user 1 (Admin) to view sensitive system health
    if (!userId || userId !== 1) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeBots = await query("SELECT count(*) FROM bots WHERE status = 'RUNNING' AND deleted_at IS NULL");
    const workerCounts = await botQueue.getJobCounts();
    return NextResponse.json({
        system: {
            cpuLoad: os.loadavg()[0],
            totalMem: os.totalmem(),
            freeMem: os.freemem(),
            uptime: process.uptime()
        },
        queue: {
            active: workerCounts.active,
            waiting: workerCounts.waiting,
            failed: workerCounts.failed
        },
        db: {
            activeBots: parseInt(activeBots.rows[0].count, 10)
        }
    });
}
