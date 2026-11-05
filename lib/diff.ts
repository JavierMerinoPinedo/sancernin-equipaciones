// Comparación entre lo que hay en la base de datos y lo que llega de la FNB.
import type { MatchRow } from './kit.ts';

export type Incoming = Omit<MatchRow, 'removed'> & { season: string | null };
export type Existing = Pick<MatchRow, 'id' | 'local_dt' | 'time_tbd' | 'is_home' | 'rival_name' | 'rival_shirt_raw' | 'field_name' | 'removed'>;

export interface Change { match_id: string; field: string; old_value: string | null; new_value: string | null }

const fecha = (m: Pick<MatchRow, 'local_dt' | 'time_tbd'>) => {
  const [d, t] = m.local_dt.split('T');
  const [y, mo, da] = d.split('-');
  return `${da}/${mo}/${y} ${m.time_tbd ? 'hora por confirmar' : t.slice(0, 5)}`;
};

/**
 * @param today fecha de hoy (YYYY-MM-DD): solo se avisan cambios de partidos de hoy en adelante.
 * @param complete si la descarga de la FNB fue completa (si no, no se marcan partidos como eliminados).
 * @param firstRun en la primera carga no se generan avisos de "nuevo".
 */
export function diffMatches(existing: Existing[], incoming: Incoming[], today: string, complete: boolean, firstRun: boolean) {
  const prev = new Map(existing.map((e) => [e.id, e]));
  const seen = new Set<string>();
  const changes: Change[] = [];
  const upcoming = (dt: string) => dt.slice(0, 10) >= today;

  for (const n of incoming) {
    seen.add(n.id);
    const o = prev.get(n.id);
    if (!o) {
      if (!firstRun && upcoming(n.local_dt)) changes.push({ match_id: n.id, field: 'nuevo', old_value: null, new_value: fecha(n) });
      continue;
    }
    if (!upcoming(n.local_dt) && !upcoming(o.local_dt)) continue;
    if (o.removed) changes.push({ match_id: n.id, field: 'restaurado', old_value: null, new_value: fecha(n) });
    if (o.local_dt.slice(0, 16) !== n.local_dt.slice(0, 16) || o.time_tbd !== n.time_tbd)
      changes.push({ match_id: n.id, field: 'fecha', old_value: fecha(o), new_value: fecha(n) });
    if ((o.field_name ?? '') !== (n.field_name ?? ''))
      changes.push({ match_id: n.id, field: 'pabellon', old_value: o.field_name, new_value: n.field_name });
    if (o.rival_name !== n.rival_name)
      changes.push({ match_id: n.id, field: 'rival', old_value: o.rival_name, new_value: n.rival_name });
    if ((o.rival_shirt_raw ?? '') !== (n.rival_shirt_raw ?? ''))
      changes.push({ match_id: n.id, field: 'color_rival', old_value: o.rival_shirt_raw, new_value: n.rival_shirt_raw });
    if (o.is_home !== n.is_home)
      changes.push({ match_id: n.id, field: 'local_visitante', old_value: o.is_home ? 'local' : 'visitante', new_value: n.is_home ? 'local' : 'visitante' });
  }

  const removedIds: string[] = [];
  if (complete) {
    for (const o of existing) {
      if (!seen.has(o.id) && !o.removed && upcoming(o.local_dt)) {
        removedIds.push(o.id);
        changes.push({ match_id: o.id, field: 'eliminado', old_value: fecha(o), new_value: null });
      }
    }
  }
  return { changes, removedIds };
}

export const CHANGE_LABEL: Record<string, string> = {
  nuevo: 'Partido nuevo',
  restaurado: 'Vuelve al calendario',
  fecha: 'Cambio de fecha/hora',
  pabellon: 'Cambio de pabellón',
  rival: 'Cambio de rival',
  color_rival: 'El rival cambia de color',
  local_visitante: 'Cambio local/visitante',
  eliminado: 'Eliminado del calendario',
};
