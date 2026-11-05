import { NextResponse, type NextRequest } from 'next/server';
import { runSync } from '@/lib/sync.ts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Vercel Cron llama a esta ruta una vez al día (ver vercel.json) con
// "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const result = await runSync('cron');
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
