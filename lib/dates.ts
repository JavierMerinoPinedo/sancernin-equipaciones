// Las fechas de los partidos son "hora de Madrid" sin zona (timestamp without time zone).
// Trabajamos siempre con sus componentes para no depender de la zona horaria del servidor.

export interface LocalDate { y: number; m: number; d: number }
export interface LocalDateTime extends LocalDate { hh: number; mi: number }

const pad = (n: number) => String(n).padStart(2, '0');

export function parseLocal(s: string): LocalDateTime {
  const r = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(s);
  if (!r) {
    const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (!d) throw new Error('Fecha no válida: ' + s);
    return { y: +d[1], m: +d[2], d: +d[3], hh: 0, mi: 0 };
  }
  return { y: +r[1], m: +r[2], d: +r[3], hh: +r[4], mi: +r[5] };
}

export const isoDate = (x: LocalDate) => `${x.y}-${pad(x.m)}-${pad(x.d)}`;
export const isoLocal = (x: LocalDateTime) => `${isoDate(x)}T${pad(x.hh)}:${pad(x.mi)}:00`;
export const hhmm = (x: LocalDateTime) => `${pad(x.hh)}:${pad(x.mi)}`;

/** Fecha de hoy en Madrid. */
export function todayMadrid(now = new Date()): LocalDate {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => +(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get('year'), m: get('month'), d: get('day') };
}

// Aritmética de días usando UTC para evitar saltos de horario de verano
const toUtc = (x: LocalDate) => Date.UTC(x.y, x.m - 1, x.d);
const fromUtc = (t: number): LocalDate => { const d = new Date(t); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; };

export const addDays = (x: LocalDate, n: number) => fromUtc(toUtc(x) + n * 864e5);
export const weekday = (x: LocalDate) => (new Date(toUtc(x)).getUTCDay() + 6) % 7; // 0 = lunes
export const startOfWeek = (x: LocalDate) => addDays(x, -weekday(x));
export const diffDays = (a: LocalDate, b: LocalDate) => Math.round((toUtc(a) - toUtc(b)) / 864e5);
export const sameDay = (a: LocalDate, b: LocalDate) => a.y === b.y && a.m === b.m && a.d === b.d;

export function parseDateParam(s: string | undefined | null): LocalDate | null {
  if (!s) return null;
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return r ? { y: +r[1], m: +r[2], d: +r[3] } : null;
}

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

export const weekdayName = (x: LocalDate) => WEEKDAYS[weekday(x)];
export const monthName = (m: number) => MONTHS[m - 1];
export const fmtLong = (x: LocalDate) => `${weekdayName(x)}, ${x.d} de ${MONTHS[x.m - 1]}`;
export const fmtShort = (x: LocalDate) => `${x.d} ${MONTHS_SHORT[x.m - 1]}`;
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
