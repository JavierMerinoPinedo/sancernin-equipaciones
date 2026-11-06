'use client';
import { useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { rubberband, stepSpring } from '@/lib/spring.ts';

const TRIGGER = 72;   // px de recorrido visible para recargar
const SLOP = 10;      // px antes de considerar que es un tirón
const MIN_SPIN = 500; // ms mínimos de giro: confirma que la recarga ha ocurrido

/** Tirar hacia abajo desde arriba del todo vuelve a pedir los datos de la página. */
export default function PullToRefresh({ onRefresh }: { onRefresh: () => void }) {
  const router = useRouter();
  const [refreshing, start] = useTransition();
  const icon = useRef<HTMLDivElement>(null);
  const s = useRef({ x: 0, v: 0, raf: 0, from: null as number | null });

  const paint = () => {
    const { x } = s.current;
    const el = icon.current;
    if (!el) return;
    el.style.transform = `translate(-50%,${x - 44}px)`;
    el.style.opacity = String(Math.min(1, x / 32));
    el.style.setProperty('--turn', `${(x / TRIGGER) * 270}deg`);
  };

  const settle = (target: number) => {
    const m = s.current;
    cancelAnimationFrame(m.raf);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { m.x = target; m.v = 0; paint(); return; }
    let last = performance.now();
    const frame = (now: number) => {
      stepSpring(m, target, 1, 0.3, Math.min((now - last) / 1000, 1 / 20));
      last = now;
      if (Math.abs(m.x - target) < 0.5 && Math.abs(m.v) < 8) { m.x = target; m.v = 0; paint(); return; }
      paint();
      m.raf = requestAnimationFrame(frame);
    };
    m.raf = requestAnimationFrame(frame);
  };

  useEffect(() => {
    if (!refreshing && s.current.x > 0 && s.current.from === null) settle(0);
  }, [refreshing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m = s.current;
    const onStart = (e: TouchEvent) => {
      // Con una hoja abierta el gesto es suyo
      if (window.scrollY > 0 || e.touches.length !== 1 || document.querySelector('.sheet')) { m.from = null; return; }
      cancelAnimationFrame(m.raf);
      m.from = e.touches[0].clientY - rubberbandInverse(m.x);
    };
    const onMove = (e: TouchEvent) => {
      if (m.from === null) return;
      const pull = e.touches[0].clientY - m.from;
      if (pull < SLOP || window.scrollY > 0) { if (m.x) { m.x = 0; paint(); } return; }
      if (e.cancelable) e.preventDefault();
      m.x = rubberband(pull - SLOP, 320, 0.8);
      paint();
    };
    const onEnd = () => {
      if (m.from === null) return;
      m.from = null;
      if (m.x >= TRIGGER) {
        settle(TRIGGER * 0.8);
        onRefresh();
        start(async () => { router.refresh(); await new Promise((r) => setTimeout(r, MIN_SPIN)); });
      } else settle(0);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      cancelAnimationFrame(m.raf);
    };
  }, [onRefresh, router]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div ref={icon} className={`ptr ${refreshing ? 'on' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 0 8 8" /></svg>
      </div>
      <span className="sr" role="status">{refreshing ? 'Actualizando…' : ''}</span>
    </>
  );
}

// Recorrido del dedo que corresponde a una posición, para retomar el tirón sin salto
const rubberbandInverse = (x: number) => (x ? (320 * x) / (0.8 * 320 - x) + SLOP : 0);
