// Cliente de la API pública que usa la web de la FNB (plataforma OW Basket).
import type { MatchRow } from './kit.ts';

export const FNB_CLUB_ID = process.env.FNB_CLUB_ID || '69';
export const FNB_API_BASE =
  process.env.FNB_API_BASE || 'https://esb.optimalwayconsulting.com/fnb/1/k1tEpEWUQKXh9qMvJVS2sWofAvrICVb1';

/** Mes en que empieza la temporada (agosto). La API pide solo el mes y responde con la temporada en curso. */
const SEASON_MONTHS = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];

export type FnbMatch = Record<string, any>;

/** La API responde unas veces JSON y otras JSON en base64. */
export function decodeFnb(text: string): any {
  const t = text.trim();
  try { return JSON.parse(t); } catch { /* base64 */ }
  const bin = typeof atob === 'function' ? atob(t) : Buffer.from(t, 'base64').toString('binary');
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function fetchMonth(month: number, fetchImpl: typeof fetch = fetch): Promise<FnbMatch[]> {
  const url = `${FNB_API_BASE}/Match/getMatchClubMonth/${FNB_CLUB_ID}/${month}/T`;
  const res = await fetchImpl(url, { cache: 'no-store', headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`FNB mes ${month}: HTTP ${res.status}`);
  const j = decodeFnb(await res.text());
  if (j?.result && j.result !== 'OK') throw new Error(`FNB mes ${month}: ${j.message || j.result}`);
  const md = j?.messageData ?? [];
  return (Array.isArray(md) ? md : Object.values(md)).filter((m: any) => m && m.idMatch && m.matchDay);
}

/** Descarga la temporada completa. Devuelve los partidos y si todos los meses respondieron bien. */
export async function fetchSeason(fetchImpl: typeof fetch = fetch) {
  const results = await Promise.allSettled(SEASON_MONTHS.map((m) => fetchMonth(m, fetchImpl)));
  const errors: string[] = [];
  const byId = new Map<string, FnbMatch>();
  for (const r of results) {
    if (r.status === 'fulfilled') r.value.forEach((m) => byId.set(String(m.idMatch), m));
    else errors.push(String(r.reason?.message ?? r.reason));
  }
  return { matches: [...byId.values()], complete: errors.length === 0, errors };
}

const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? null : String(v).trim() || null);

export function normalizeFnb(m: FnbMatch, clubId = FNB_CLUB_ID): Omit<MatchRow, 'removed'> & { season: string | null } {
  const home = String(m.idLocalClub) === String(clubId);
  const [date, time = '00:00:00'] = String(m.matchDay).trim().split(' ');
  return {
    id: String(m.idMatch),
    season: str(m.season),
    local_dt: `${date}T${time.slice(0, 5)}:00`,
    time_tbd: time.startsWith('00:00'),
    category: (str(m.nameCategorySigned) ?? str(m.nameCategory) ?? '').replace(/\s+/g, ' '),
    competition: str(m.nameCompetition),
    group_name: str(m.nameGroup),
    is_home: home,
    our_team_id: str(home ? m.idLocalTeam : m.idVisitorTeam),
    our_team_name: str(home ? m.nameLocalTeam : m.nameVisitorTeam) ?? 'SAN CERNIN',
    rival_team_id: str(home ? m.idVisitorTeam : m.idLocalTeam),
    rival_name: (str(home ? m.nameVisitorTeam : m.nameLocalTeam) ?? 'Rival').replace(/\s+/g, ' '),
    rival_club_name: str(home ? m.nameVisitorTeamOrganization : m.nameLocalTeamOrganization),
    rival_shirt_raw: str(home ? m.shirtColorVisitorTeam : m.shirtColorLocalTeam),
    rival_pants_raw: str(home ? m.pantsColorVisitorTeam : m.pantsColorLocalTeam),
    field_name: str(m.nameField),
    field_town: str(m.nameTown),
    field_address: str(m.adressField),
    lat: num(m.latitudeField),
    lng: num(m.longitudeField),
    local_score: num(m.localScore),
    visitor_score: num(m.visitorScore),
  };
}
