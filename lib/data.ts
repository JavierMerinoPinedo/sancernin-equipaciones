import 'server-only';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from './supabase/admin.ts';
import type { MatchRow, Override } from './kit.ts';

export interface ChangeRow { id: number; match_id: string; changed_at: string; field: string; old_value: string | null; new_value: string | null }
export interface Team { id: string; name: string; category: string; label: string }
export interface ChangeFeedRow { id: number; changed_at: string; field: string; old_value: string | null; new_value: string | null; match: MatchRow | null }
export interface SyncRun { started_at: string; finished_at: string; ok: boolean; matches_seen: number | null; changes: number | null; error: string | null; trigger: string }

/**
 * Los datos son iguales para todo el club y solo cambian con la carga diaria o
 * al corregir un color, así que se comparten entre usuarios y peticiones.
 * Se invalidan con revalidateTag(DATA_TAG); REVALIDATE es solo una red de seguridad.
 * Los cargadores lanzan el error para que un fallo puntual no quede cacheado como
 * "sin datos". Quien los llame debe haber pasado por requirePageUser().
 */
export const DATA_TAG = 'club-data';
const REVALIDATE = 3600;
const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) =>
  unstable_cache(fn, [key], { tags: [DATA_TAG], revalidate: REVALIDATE });

const MATCH_COLUMNS = 'id, local_dt, time_tbd, category, competition, group_name, is_home, our_team_id, our_team_name, rival_team_id, rival_name, rival_club_name, rival_shirt_raw, rival_pants_raw, field_name, field_town, field_address, lat, lng, local_score, visitor_score, removed';

export const loadRange = cached(async (fromIso: string, toIsoExcl: string, team?: string | null) => {
  let q = createAdminClient().from('matches').select(MATCH_COLUMNS).eq('removed', false).gte('local_dt', fromIso).lt('local_dt', toIsoExcl).order('local_dt').limit(2000);
  if (team) q = q.eq('our_team_id', team);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as MatchRow[];
}, 'range');

const overridesList = cached(async () => {
  const { data, error } = await createAdminClient().from('rival_overrides').select('rival_team_id, rival_name, shirt, pants');
  if (error) throw error;
  return (data ?? []) as Override[];
}, 'overrides');

export async function loadOverrides() {
  return new Map((await overridesList()).map((o) => [o.rival_team_id, o]));
}

export const loadTeams = cached(async (): Promise<Team[]> => {
  const { data, error } = await createAdminClient().from('matches').select('our_team_id, our_team_name, category').eq('removed', false).limit(5000);
  if (error) throw error;
  const map = new Map<string, Team>();
  for (const r of (data ?? []) as { our_team_id: string | null; our_team_name: string; category: string }[]) {
    if (!r.our_team_id || map.has(r.our_team_id)) continue;
    const cat = r.category.replace(/^JDN - /, '');
    map.set(r.our_team_id, { id: r.our_team_id, name: r.our_team_name, category: r.category, label: `${cat} · ${r.our_team_name}` });
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
}, 'teams');

// La clave es el día de corte: el resultado sirve para cualquier semana que se consulte ese día
const changesSince = cached(async (sinceIso: string) => {
  const { data, error } = await createAdminClient().from('match_changes').select('*').gte('changed_at', sinceIso).neq('field', 'nuevo').order('changed_at', { ascending: false }).limit(5000);
  if (error) throw error;
  return (data ?? []) as ChangeRow[];
}, 'changes-since');

/** Cambios de los últimos días para un conjunto de partidos. */
export async function loadRecentChanges(ids: string[], days = 7) {
  const out = new Map<string, ChangeRow[]>();
  if (!ids.length) return out;
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const wanted = new Set(ids);
  for (const c of await changesSince(since)) {
    if (wanted.has(c.match_id)) out.set(c.match_id, [...(out.get(c.match_id) ?? []), c]);
  }
  return out;
}

export const loadChangeFeed = cached(async (sinceIso: string) => {
  const { data, error } = await createAdminClient()
    .from('match_changes')
    .select('id, changed_at, field, old_value, new_value, match:matches(id, local_dt, time_tbd, category, our_team_name, rival_name, is_home, removed)')
    .gte('changed_at', sinceIso)
    .order('changed_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as ChangeFeedRow[];
}, 'change-feed');

export const lastSync = cached(async () => {
  const { data, error } = await createAdminClient().from('sync_runs').select('*').not('finished_at', 'is', null).order('started_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as SyncRun | null;
}, 'last-sync');
