import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MatchRow, Override } from './kit.ts';

export interface ChangeRow { id: number; match_id: string; changed_at: string; field: string; old_value: string | null; new_value: string | null }
export interface Team { id: string; name: string; category: string; label: string }

export async function loadRange(db: SupabaseClient, fromIso: string, toIsoExcl: string, team?: string | null) {
  let q = db.from('matches').select('*').eq('removed', false).gte('local_dt', fromIso).lt('local_dt', toIsoExcl).order('local_dt').limit(2000);
  if (team) q = q.eq('our_team_id', team);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MatchRow[];
}

export async function loadOverrides(db: SupabaseClient) {
  const { data } = await db.from('rival_overrides').select('rival_team_id, rival_name, shirt, pants');
  return new Map(((data ?? []) as Override[]).map((o) => [o.rival_team_id, o]));
}

export async function loadTeams(db: SupabaseClient): Promise<Team[]> {
  const { data } = await db.from('matches').select('our_team_id, our_team_name, category').eq('removed', false).limit(5000);
  const map = new Map<string, Team>();
  for (const r of (data ?? []) as { our_team_id: string | null; our_team_name: string; category: string }[]) {
    if (!r.our_team_id || map.has(r.our_team_id)) continue;
    const cat = r.category.replace(/^JDN - /, '');
    map.set(r.our_team_id, { id: r.our_team_id, name: r.our_team_name, category: r.category, label: `${cat} · ${r.our_team_name}` });
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

/** Cambios de los últimos días para un conjunto de partidos. */
export async function loadRecentChanges(db: SupabaseClient, ids: string[], days = 7) {
  const out = new Map<string, ChangeRow[]>();
  if (!ids.length) return out;
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { data } = await db.from('match_changes').select('*').in('match_id', ids).gte('changed_at', since).order('changed_at', { ascending: false });
  for (const c of (data ?? []) as ChangeRow[]) {
    if (c.field === 'nuevo') continue;
    out.set(c.match_id, [...(out.get(c.match_id) ?? []), c]);
  }
  return out;
}

export async function lastSync(db: SupabaseClient) {
  const { data } = await db.from('sync_runs').select('*').not('finished_at', 'is', null).order('started_at', { ascending: false }).limit(1).maybeSingle();
  return data as { started_at: string; finished_at: string; ok: boolean; matches_seen: number | null; changes: number | null; error: string | null; trigger: string } | null;
}
