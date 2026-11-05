// Camiseta y pantalón dibujados en SVG con los colores indicados.
export function Shirt({ colors, size = 30 }: { colors: string[]; size?: number }) {
  const f1 = colors[0] ?? '#E5E7EB';
  const f2 = colors[1];
  const id = `g${f1.slice(1)}${f2?.slice(1) ?? ''}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {f2 && (
        <defs>
          <linearGradient id={id} x1="0" x2="1"><stop offset="50%" stopColor={f1} /><stop offset="50%" stopColor={f2} /></linearGradient>
        </defs>
      )}
      <path d="M22 6 L8 14 L12 28 L18 25 L18 58 L46 58 L46 25 L52 28 L56 14 L42 6 Q38 13 32 13 Q26 13 22 6 Z"
        fill={f2 ? `url(#${id})` : f1} stroke="#334155" strokeWidth={2.2} strokeLinejoin="round" />
    </svg>
  );
}

export function Shorts({ color, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 64 48" aria-hidden="true">
      <path d="M10 4 L54 4 L58 44 L38 44 L32 22 L26 44 L6 44 Z" fill={color ?? '#E5E7EB'} stroke="#334155" strokeWidth={2.2} strokeLinejoin="round" />
    </svg>
  );
}
