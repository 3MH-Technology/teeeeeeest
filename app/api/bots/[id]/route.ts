import { NextResponse } from 'next/server';
import { botQueue } from '@/lib/queue';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: any) {
    const userId = verifyAuth(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const res = await query('SELECT id, name, type, status FROM bots WHERE id = $1 AND user_id = $2', [params.id, userId]);
    if (res.rows.length === 0)
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ bot: res.rows[0] });
}

export async function DELETE(req: Request, { params }: any) {
    const userId = verifyAuth(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const res = await query('SELECT id FROM bots WHERE id = $1 AND user_id = $2', [params.id, userId]);
    if (res.rows.length === 0)
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await botQueue.add('delete', {
        action: 'delete',
        botId: params.id,
        userId: userId
    });
    return NextResponse.json({ success: true, message: 'Deletion queued' });
}
