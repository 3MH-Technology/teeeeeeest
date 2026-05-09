import { NextResponse } from 'next/server';
import { botQueue } from '@/lib/queue';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: any) {
    const userId = verifyAuth(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();
    const botId = params.id;
    
    const res = await query('SELECT id FROM bots WHERE id = $1 AND user_id = $2', [botId, userId]);
    if (res.rows.length === 0)
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    if (action === 'start' || action === 'stop') {
        await botQueue.add('action', {
            action,
            botId,
            userId
        });
        return NextResponse.json({ success: true, message: `Action ${action} queued successfully` });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
