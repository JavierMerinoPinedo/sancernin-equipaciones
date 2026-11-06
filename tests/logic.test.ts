import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseColors, isBlue, describeColors } from '../lib/colors.ts';
import { computeKit, type MatchRow } from '../lib/kit.ts';
import { decodeFnb, normalizeFnb } from '../lib/fnb.ts';
import { diffMatches } from '../lib/diff.ts';
import { buildIcs } from '../lib/ics.ts';
import { startOfWeek, addDays, isoDate } from '../lib/dates.ts';
import { project, rubberband, stepSpring } from '../lib/spring.ts';
import { buildAlerts, whenLabel } from '../lib/alerts.ts';

// Partido real de la FNB (6/11/2026, Peralta – San Cernin), recortado
const RAW = {
  idMatch: '55629', season: '2026', nameCategorySigned: 'Senior Masculino 2ª Aut', nameCompetition: 'Fase Previa', nameGroup: 'Grupo 1',
  idLocalClub: '137', idLocalTeam: '12051', nameLocalTeam: 'CBP SELCO ELECTRONICA', nameLocalTeamOrganization: 'CLUB DEPORTIVO BALONCESTO PERALTA',
  shirtColorLocalTeam: '#FFFFFF', pantsColorLocalTeam: '#FFFFFF',
  idVisitorClub: '69', idVisitorTeam: '11728', nameVisitorTeam: 'SAN CERNIN', shirtColorVisitorTeam: '#000080', pantsColorVisitorTeam: '#000080',
  matchDay: '2026-11-06 20:00:00', nameField: 'PDVO. MUN. PERALTA', adressField: 'RIO 51', nameTown: 'Peralta',
  latitudeField: '42.337231', longitudeField: '-1.800825', localScore: null, visitorScore: null,
};

test('colores de la FNB', () => {
  assert.deepEqual(parseColors('#000080'), ['#000080']);
  assert.deepEqual(parseColors('AZUL'), ['#1D4ED8']);
  assert.deepEqual(parseColors('#008000/#000000'), ['#008000', '#000000']);
  assert.deepEqual(parseColors('AMARILLO-NEGRO'), ['#FFFF00', '#000000']);
  assert.deepEqual(parseColors('Verde'), ['#008000']);
  assert.deepEqual(parseColors(''), []);
  for (const b of ['#000080', '#0000FF', '#87CEEB', '#1D4ED8']) assert.ok(isBlue(b), b);
  for (const n of ['#FFFFFF', '#000000', '#008000', '#FF0000', '#800000', '#808080', '#FFA500']) assert.ok(!isBlue(n), n);
  assert.equal(describeColors(parseColors('#008000/#000000')), 'Verde / Negro');
});

test('regla de equipación', () => {
  const k = (is_home: boolean, shirt: string | null) => computeKit({ is_home, rival_shirt_raw: shirt, rival_pants_raw: null });
  assert.equal(k(true, '#0000FF').white, false);            // en casa siempre azul
  assert.equal(k(true, '#0000FF').note?.tone, 'info');      // aviso: cambian ellos
  assert.equal(k(false, '#0000FF').white, true);            // fuera vs azul → blanco
  assert.equal(k(false, 'AZUL').white, true);
  assert.equal(k(false, '#87CEEB').white, true);            // celeste también
  assert.equal(k(false, '#FFFFFF').white, false);           // fuera vs blanco → azul
  assert.equal(k(false, '#008000/#000000').white, false);
  assert.equal(k(false, null).note?.tone, 'warn');          // sin dato
  // corrección manual del club prevalece
  assert.equal(computeKit({ is_home: false, rival_shirt_raw: '#FFFFFF', rival_pants_raw: null }, { rival_team_id: 'x', rival_name: 'X', shirt: '#000080', pants: null }).white, true);
});

test('normaliza un partido real y decodifica base64', () => {
  const b64 = Buffer.from(JSON.stringify({ result: 'OK', messageData: [RAW] })).toString('base64');
  const j = decodeFnb(b64);
  const m = normalizeFnb(j.messageData[0], '69');
  assert.equal(m.is_home, false);
  assert.equal(m.local_dt, '2026-11-06T20:00:00');
  assert.equal(m.time_tbd, false);
  assert.equal(m.our_team_id, '11728');
  assert.equal(m.rival_name, 'CBP SELCO ELECTRONICA');
  assert.equal(m.rival_shirt_raw, '#FFFFFF');
  assert.equal(m.lat, 42.337231);
  assert.equal(normalizeFnb({ ...RAW, matchDay: '2027-03-06 00:00:00' }, '69').time_tbd, true);
});

test('detección de cambios', () => {
  const inc = normalizeFnb(RAW, '69');
  const ex = { id: inc.id, local_dt: '2026-11-06T19:00:00', time_tbd: false, is_home: false, rival_name: inc.rival_name, rival_shirt_raw: '#000080', field_name: inc.field_name, removed: false };
  const gone = { ...ex, id: '999', local_dt: '2026-11-20T10:00:00' };
  const past = { ...ex, id: '998', local_dt: '2026-10-01T10:00:00' };
  const r = diffMatches([ex, gone, past], [inc], '2026-11-05', true, false);
  const fields = r.changes.map((c) => `${c.match_id}:${c.field}`).sort();
  assert.deepEqual(fields, ['55629:color_rival', '55629:fecha', '999:eliminado']);
  assert.deepEqual(r.removedIds, ['999']);
  // descarga incompleta: no se elimina nada
  assert.deepEqual(diffMatches([ex, gone], [inc], '2026-11-05', false, false).removedIds, []);
  // primera carga: sin avisos de nuevos
  assert.equal(diffMatches([], [inc], '2026-11-05', true, true).changes.length, 0);
  assert.equal(diffMatches([], [inc], '2026-11-05', true, false).changes[0].field, 'nuevo');
});

test('calendario .ics', () => {
  const m = { ...normalizeFnb(RAW, '69'), removed: false } as MatchRow;
  const tbd = { ...m, id: '2', local_dt: '2026-11-07T00:00:00', time_tbd: true, rival_shirt_raw: '#0000FF' } as MatchRow;
  const late = { ...m, id: '3', local_dt: '2026-11-07T23:00:00', rival_shirt_raw: '#0000FF' } as MatchRow;
  const ics = buildIcs([m, tbd, late], new Map(), 'San Cernin', new Date('2026-11-05T10:00:00Z'));
  assert.match(ics, /DTSTART;TZID=Europe\/Madrid:20261106T200000/);
  assert.match(ics, /DTEND;TZID=Europe\/Madrid:20261106T213000/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261107\r\nDTEND;VALUE=DATE:20261108/);
  assert.match(ics, /DTEND;TZID=Europe\/Madrid:20261108T003000/);
  assert.match(ics, /SUMMARY:🔵 CBP SELCO ELECTRONICA vs SAN CERNIN/);
  assert.ok(ics.includes('⚪'));
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line);
});

test('semanas', () => {
  const thu = { y: 2026, m: 11, d: 5 };
  assert.equal(isoDate(startOfWeek(thu)), '2026-11-02');
  assert.equal(isoDate(addDays({ y: 2026, m: 12, d: 28 }, 7)), '2027-01-04');
  assert.equal(isoDate(startOfWeek({ y: 2026, m: 11, d: 8 })), '2026-11-02'); // domingo
});

test('física de las hojas', () => {
  const settle = (damping: number) => {
    const s = { x: 300, v: 0 };
    let min = s.x;
    for (let i = 0; i < 120; i++) { stepSpring(s, 0, damping, 0.3, 1 / 60); min = Math.min(min, s.x); }
    return { s, min };
  };
  assert.ok(Math.abs(settle(1).s.x) < 0.5);           // llega al destino
  assert.ok(settle(1).min >= -0.5);                   // sin rebote
  assert.ok(settle(0.8).min < -0.5);                  // con rebote
  assert.ok(project(1000) > 400);                     // un gesto rápido llega lejos
  assert.equal(rubberband(0, 400), 0);
  assert.ok(rubberband(400, 400) < 150);              // cuanto más se estira, menos sigue
});

test('avisos', () => {
  const today = { y: 2026, m: 11, d: 6 };
  const base = { removed: false, time_tbd: false, is_home: false, rival_team_id: null, rival_pants_raw: null, local_score: null } as unknown as MatchRow;
  const mk = (id: string, date: string, x: Partial<MatchRow>) => ({ ...base, id, local_dt: `${date}T12:00:00`, ...x }) as MatchRow;
  const a = buildAlerts([
    mk('pasado', '2026-11-05', { rival_shirt_raw: '#0000FF' }),
    mk('jugado', '2026-11-07', { rival_shirt_raw: '#0000FF', local_score: 50 }),
    mk('blanco', '2026-11-07', { rival_shirt_raw: '#0000FF' }),
    mk('lejos', '2026-12-20', { rival_shirt_raw: '#0000FF' }),
    mk('fuera-plazo', '2027-02-01', { rival_shirt_raw: '#0000FF' }),
    mk('sin-color', '2026-11-08', { rival_shirt_raw: null, time_tbd: true }),
    mk('sin-color-lejos', '2026-12-01', { rival_shirt_raw: null }),
    mk('casa', '2026-11-08', { is_home: true, rival_shirt_raw: '#0000FF' }),
  ], new Map(), today);
  assert.deepEqual(a.white.map((x) => x.m.id), ['blanco', 'lejos']);
  assert.deepEqual(a.unknown.map((x) => x.m.id), ['sin-color']);
  assert.deepEqual(a.tbd.map((x) => x.m.id), ['sin-color']);
  assert.equal(a.count, 2);                                 // un partido con dos avisos cuenta una vez
  assert.equal(a.white[0].when, 'Mañana');
  assert.equal(whenLabel(0), 'Hoy');
  assert.equal(whenLabel(5), 'En 5 días');
  const ov = new Map([['r', { rival_team_id: 'r', rival_name: 'R', shirt: '#FF0000', pants: null }]]);
  assert.equal(buildAlerts([mk('corregido', '2026-11-07', { rival_team_id: 'r', rival_shirt_raw: '#0000FF' })], ov, today).white.length, 0);
});
