import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyInternalRequest } from '@/lib/hmac';
export async function GET(req) {
    const signature = req.headers.get('x-wolf-signature');
    const timestamp = req.headers.get('x-wolf-timestamp');
    const nonce = req.headers.get('x-wolf-nonce');
    if (!signature || !timestamp || !nonce || !(await verifyInternalRequest({ query: 'prometheus_metrics' }, signature, timestamp, nonce))) {
        return new NextResponse('Unauthorized HMAC', { status: 401 });
    }
    const cpuRes = await query("SELECT sum(cpu_seconds) as total_cpu FROM bot_usage_metrics WHERE timestamp > NOW() - INTERVAL '5 minutes'");
    const memRes = await query("SELECT sum(memory_mb) as total_mem FROM bot_usage_metrics WHERE timestamp > NOW() - INTERVAL '5 minutes'");
    const activeBots = await query("SELECT count(*) as count FROM bots WHERE status = 'RUNNING' AND deleted_at IS NULL");
    const totalCpu = cpuRes.rows[0]?.total_cpu || 0;
    const totalMem = memRes.rows[0]?.total_mem || 0;
    const count = activeBots.rows[0]?.count || 0;
    const prometheusText = `
# HELP wolf_total_cpu_seconds Total CPU used across cluster in last 5m
# TYPE wolf_total_cpu_seconds gauge
wolf_total_cpu_seconds ${totalCpu}

# HELP wolf_cluster_memory_mb Total MB memory used across all actively metered bots
# TYPE wolf_cluster_memory_mb gauge
wolf_cluster_memory_mb ${totalMem}

# HELP wolf_active_bots Count of containers in RUNNING state
# TYPE wolf_active_bots gauge
wolf_active_bots ${count}
  `.trim();
    return new NextResponse(prometheusText, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
    });
}
