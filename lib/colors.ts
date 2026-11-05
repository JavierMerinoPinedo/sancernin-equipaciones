// Interpretación de los colores que guarda la FNB ("#000080", "AZUL", "#008000/#000000", "AMARILLO-NEGRO"...)

export const PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['Azul marino', '#000080'], ['Azul', '#1D4ED8'], ['Celeste', '#87CEEB'], ['Blanco', '#FFFFFF'],
  ['Negro', '#000000'], ['Rojo', '#FF0000'], ['Granate', '#800000'], ['Verde', '#008000'],
  ['Amarillo', '#FFFF00'], ['Naranja', '#FFA500'], ['Rosa', '#FFC0CB'], ['Morado', '#800080'],
  ['Gris', '#808080'], ['Burdeos', '#6B0F1A'], ['Turquesa', '#40E0D0'], ['Fucsia', '#FF00FF'],
];

const NAMES: Record<string, string> = {
  'AZUL': '#1D4ED8', 'AZUL MARINO': '#000080', 'MARINO': '#000080', 'CELESTE': '#87CEEB', 'AZUL CLARO': '#87CEEB',
  'BLANCO': '#FFFFFF', 'BLANCA': '#FFFFFF', 'NEGRO': '#000000', 'NEGRA': '#000000', 'ROJO': '#FF0000', 'ROJA': '#FF0000',
  'GRANATE': '#800000', 'BURDEOS': '#6B0F1A', 'VERDE': '#008000', 'AMARILLO': '#FFFF00', 'AMARILLA': '#FFFF00',
  'NARANJA': '#FFA500', 'ROSA': '#FFC0CB', 'MORADO': '#800080', 'LILA': '#C8A2C8', 'GRIS': '#808080',
  'TURQUESA': '#40E0D0', 'FUCSIA': '#FF00FF', 'DORADO': '#D4AF37', 'PLATA': '#C0C0C0',
};

const HEX_NAMES: Record<string, string> = {
  ...Object.fromEntries(PALETTE.map(([n, h]) => [h, n])),
  '#0000FF': 'Azul', '#000080': 'Azul marino', '#87CEEB': 'Celeste',
};

const HEX_RE = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

function normHex(t: string): string {
  let h = t.replace('#', '').toUpperCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return '#' + h;
}

/** Convierte el texto de la FNB en una lista de colores hex. Lista vacía = sin dato. */
export function parseColors(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const s = String(raw).trim();
  if (!s) return [];
  if (HEX_RE.test(s)) return [normHex(s)];
  const up = s.toUpperCase();
  if (NAMES[up]) return [NAMES[up]];
  return up
    .split(/\s*(?:\/|-|,|\+|\sY\s)\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (HEX_RE.test(p) ? normHex(p) : NAMES[p] ?? null))
    .filter((x): x is string => !!x);
}

export function hexToHsl(hex: string) {
  const h = normHex(hex).slice(1);
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let hue = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hue *= 60;
  }
  return { h: hue, s, l };
}

/** Azul en cualquier tono: marino, azul, celeste. */
export function isBlue(hex: string): boolean {
  const { h, s, l } = hexToHsl(hex);
  return h >= 185 && h <= 260 && s >= 0.3 && l >= 0.08 && l <= 0.88;
}

export function colorName(hex: string): string {
  const key = normHex(hex);
  if (HEX_NAMES[key]) return HEX_NAMES[key];
  const { h, s, l } = hexToHsl(key);
  if (l > 0.92) return 'Blanco';
  if (l < 0.1) return 'Negro';
  if (s < 0.15) return 'Gris';
  if (isBlue(key)) return 'Azul';
  if (h < 15 || h >= 345) return 'Rojo';
  if (h < 45) return 'Naranja';
  if (h < 70) return 'Amarillo';
  if (h < 170) return 'Verde';
  if (h < 185) return 'Turquesa';
  if (h < 300) return 'Morado';
  return 'Rosa';
}

export function describeColors(list: string[]): string {
  return list.length ? list.map(colorName).join(' / ') : 'Sin dato en la FNB';
}
