import { isBlue, parseColors } from './colors.ts';

export const OUR_BLUE = { name: 'Azul', hex: '#0B1F5C' } as const;
export const OUR_WHITE = { name: 'Blanco', hex: '#FFFFFF' } as const;
export type KitColor = typeof OUR_BLUE | typeof OUR_WHITE;

export interface MatchRow {
  id: string;
  local_dt: string;
  time_tbd: boolean;
  category: string;
  competition: string | null;
  group_name: string | null;
  is_home: boolean;
  our_team_id: string | null;
  our_team_name: string;
  rival_team_id: string | null;
  rival_name: string;
  rival_club_name: string | null;
  rival_shirt_raw: string | null;
  rival_pants_raw: string | null;
  field_name: string | null;
  field_town: string | null;
  field_address: string | null;
  lat: number | null;
  lng: number | null;
  local_score: number | null;
  visitor_score: number | null;
  removed: boolean;
}

export interface Override {
  rival_team_id: string;
  rival_name: string | null;
  shirt: string;
  pants: string | null;
}

export interface Kit {
  shirt: KitColor;
  pants: KitColor;
  white: boolean;
  rivalShirt: string[];
  rivalPants: string[];
  rivalFromOverride: boolean;
  note: { text: string; tone: 'info' | 'warn' } | null;
}

/**
 * Regla del club:
 *  - En casa: azul / azul.
 *  - Fuera: si el local viste camiseta azul → blanco / azul; si no → azul / azul.
 */
export function computeKit(m: Pick<MatchRow, 'is_home' | 'rival_shirt_raw' | 'rival_pants_raw'>, ov?: Override | null): Kit {
  const rivalShirt = ov ? [ov.shirt.toUpperCase()] : parseColors(m.rival_shirt_raw);
  const rivalPants = ov?.pants ? [ov.pants.toUpperCase()] : parseColors(m.rival_pants_raw);
  const rivalBlue = rivalShirt.some(isBlue);
  let note: Kit['note'] = null;
  let white = false;
  if (m.is_home) {
    if (rivalBlue) note = { text: 'El visitante también viste de azul: le toca cambiar a ellos.', tone: 'info' };
  } else if (rivalBlue) {
    white = true;
  } else if (!rivalShirt.length) {
    note = { text: 'La FNB no tiene el color del rival. Indícalo para confirmar la equipación.', tone: 'warn' };
  }
  return {
    shirt: white ? OUR_WHITE : OUR_BLUE,
    pants: OUR_BLUE,
    white,
    rivalShirt,
    rivalPants,
    rivalFromOverride: !!ov,
    note,
  };
}

export const kitLabel = (k: Kit) => `${k.shirt.name} / ${k.pants.name}`;
