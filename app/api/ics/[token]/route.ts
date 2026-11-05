import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin.ts';
import { buildIcs } from '@/lib/ics.ts';
import { addDays, isoDate, todayMadrid } from '@/lib/dates.ts';
import type { MatchRow, Override } from '@/lib/kit.ts';

export const dynamic = 'force-dynamic';

// Suscripción de calendario. Las apps de calendario no inician sesión, así que
// cada usuario tiene un token secreto propio (tabla profiles).
export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const clean = token.replace(/\.ics$/, '');
  if (!/^[0-9a-f-]{36}$/i.test(clean)) return new NextResponse('No encontrado', { status: 404 });

  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('user_id').eq('calendar_token', clean).maybeSingle();
  if (!profile) return new NextResponse('No encontrado', { status: 404 });

  const team = req.nextUrl.searchParams.get('team');
  const from = isoDate(addDays(todayMadrid(), -60));
  let q = db.from('matches').select('*').eq('removed', false).gte('local_dt', `${from}T00:00:00`).order('local_dt');
  if (team) q = q.eq('our_team_id', team);
  const [{ data: matches }, { data: ov }] = await Promise.all([q.limit(2000), db.from('rival_overrides').select('*')]);
  const overrides = new Map((ov as Override[] | null ?? []).map((o) => [o.rival_team_id, o]));
  const list = (matches as MatchRow[] | null) ?? [];
  const name = team && list[0] ? `${list[0].our_team_name} · ${list[0].category.replace(/^JDN - /, '')}` : 'San Cernin · Partidos';

  return new NextResponse(buildIcs(list, overrides, name), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'inline; filename="san-cernin.ics"',
      'cache-control': 'private, max-age=900',
    },
  });
}
