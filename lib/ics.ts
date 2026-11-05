import { computeKit, kitLabel, type MatchRow, type Override } from './kit.ts';
import { describeColors } from './colors.ts';
import { addDays, isoDate, parseLocal } from './dates.ts';

const pad = (n: number) => String(n).padStart(2, '0');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Parte las líneas a 75 octetos como pide RFC 5545. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > 74) { out.push(cur); cur = ' '; bytes = 1; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n');
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Madrid',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export function buildIcs(matches: MatchRow[], overrides: Map<string, Override>, calName: string, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//San Cernin//Equipaciones//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calName)}`, 'X-WR-TIMEZONE:Europe/Madrid', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H',
    ...VTIMEZONE,
  ];
  for (const m of matches) {
    const kit = computeKit(m, m.rival_team_id ? overrides.get(m.rival_team_id) : null);
    const dt = parseLocal(m.local_dt);
    const teams = m.is_home ? `${m.our_team_name} vs ${m.rival_name}` : `${m.rival_name} vs ${m.our_team_name}`;
    const icon = kit.white ? '⚪' : '🔵';
    const cat = m.category.replace(/^JDN - /, '');
    lines.push('BEGIN:VEVENT', `UID:partido-${m.id}@sancernin-equipaciones`, `DTSTAMP:${stamp}`);
    if (m.time_tbd) {
      const d = isoDate(dt).replace(/-/g, '');
      lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${isoDate(addDays(dt, 1)).replace(/-/g, '')}`);
    } else {
      const start = `${isoDate(dt).replace(/-/g, '')}T${pad(dt.hh)}${pad(dt.mi)}00`;
      const endMin = dt.hh * 60 + dt.mi + 90;
      const endDay = endMin >= 1440 ? addDays(dt, 1) : dt;
      const em = endMin % 1440;
      const end = `${isoDate(endDay).replace(/-/g, '')}T${pad(Math.floor(em / 60))}${pad(em % 60)}00`;
      lines.push(`DTSTART;TZID=Europe/Madrid:${start}`, `DTEND;TZID=Europe/Madrid:${end}`);
    }
    lines.push(
      `SUMMARY:${esc(`${icon} ${teams} · ${cat}`)}`,
      `LOCATION:${esc([m.field_name, m.field_address, m.field_town].filter(Boolean).join(', '))}`,
      `DESCRIPTION:${esc([
        `Equipación San Cernin: ${kitLabel(kit)} (camiseta / pantalón)`,
        `${m.is_home ? 'Local' : 'Visitante'} · ${m.category}${m.competition ? ' · ' + m.competition : ''}`,
        `Rival: ${describeColors(kit.rivalShirt)}${kit.rivalFromOverride ? ' (corregido por el club)' : ''}`,
        m.time_tbd ? 'Hora por confirmar en la FNB' : '',
      ].filter(Boolean).join('\n'))}`,
    );
    if (m.lat && m.lng) lines.push(`GEO:${m.lat};${m.lng}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
