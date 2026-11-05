import 'server-only';
import { createAdminClient } from './supabase/admin.ts';
import { fetchSeason, normalizeFnb } from './fnb.ts';
import { diffMatches, type Existing } from './diff.ts';
import { isoDate, todayMadrid } from './dates.ts';

export interface SyncResult { ok: boolean; matches: number; changes: number; complete: boolean; errors: string[] }

/** Descarga la temporada de la FNB, guarda los partidos y registra los cambios. */
export async function runSync(trigger: 'cron' | 'manual'): Promise<SyncResult> {
  const db = createAdminClient();
  const { data: run } = await db.from('sync_runs').insert({ trigger }).select('id').single();
  const finish = async (patch: Record<string, unknown>) => {
    if (run?.id) await db.from('sync_runs').update({ finished_at: new Date().toISOString(), ...patch }).eq('id', run.id);
  };

  try {
    const season = await fetchSeason();
    if (!season.matches.length && !season.complete) throw new Error(season.errors.join(' · ') || 'Sin respuesta de la FNB');

    const incoming = season.matches.map((m) => normalizeFnb(m));
    const existing: Existing[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db
        .from('matches')
        .select('id, local_dt, time_tbd, is_home, rival_name, rival_shirt_raw, field_name, removed')
        .range(from, from + 999);
      if (error) throw error;
      existing.push(...(data as Existing[]));
      if (!data || data.length < 1000) break;
    }

    const today = isoDate(todayMadrid());
    const { changes, removedIds } = diffMatches(existing, incoming, today, season.complete, existing.length === 0);
    const now = new Date().toISOString();

    for (let i = 0; i < incoming.length; i += 500) {
      const chunk = incoming.slice(i, i + 500).map((m) => ({ ...m, removed: false, last_seen_at: now, updated_at: now }));
      const { error } = await db.from('matches').upsert(chunk, { onConflict: 'id' });
      if (error) throw error;
    }
    if (removedIds.length) {
      const { error } = await db.from('matches').update({ removed: true, updated_at: now }).in('id', removedIds);
      if (error) throw error;
    }
    if (changes.length) {
      const { error } = await db.from('match_changes').insert(changes.map((c) => ({ ...c, changed_at: now })));
      if (error) throw error;
    }

    const res: SyncResult = { ok: true, matches: incoming.length, changes: changes.length, complete: season.complete, errors: season.errors };
    await finish({ ok: true, matches_seen: res.matches, changes: res.changes, error: season.errors.join(' · ') || null });
    return res;
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    await finish({ ok: false, error: msg });
    return { ok: false, matches: 0, changes: 0, complete: false, errors: [msg] };
  }
}
