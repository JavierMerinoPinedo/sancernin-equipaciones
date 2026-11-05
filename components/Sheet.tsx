'use client';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { project, rubberband, stepSpring } from '@/lib/spring.ts';

/**
 * Hoja inferior que sigue al dedo. Toda la animación parte de la posición real en
 * pantalla, así que se puede agarrar o invertir en cualquier momento. Se dibuja en
 * <body> para no depender de los contextos de apilado de la tarjeta que la abre.
 */
export default function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const m = useRef({ x: 0, v: 0, height: 0, raf: 0, fresh: true, drag: null as null | { grab: number; samples: { y: number; t: number }[] } });

  const paint = () => {
    const { x, height } = m.current;
    if (sheet.current) sheet.current.style.transform = `translate3d(0,${x}px,0)`;
    if (scrim.current) scrim.current.style.opacity = String(Math.max(0, Math.min(1, 1 - x / (height || 1))));
  };

  const animate = (target: number, damping: number, response: number, done?: () => void) => {
    const s = m.current;
    cancelAnimationFrame(s.raf);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      s.x = target; s.v = 0;
      const closing = target > 0;
      paint();
      const fade = sheet.current?.animate([{ opacity: closing ? 1 : 0 }, { opacity: closing ? 0 : 1 }], { duration: 200 });
      if (done) { if (fade) fade.onfinish = done; else done(); }
      return;
    }
    let last = performance.now();
    const frame = (now: number) => {
      stepSpring(s, target, damping, response, Math.min((now - last) / 1000, 1 / 20));
      last = now;
      const closing = target > 0;
      if ((closing && s.x >= target) || (Math.abs(s.x - target) < 0.5 && Math.abs(s.v) < 8)) {
        s.x = closing ? Math.min(s.x, target) : target; s.v = 0;
        paint();
        done?.();
        return;
      }
      paint();
      s.raf = requestAnimationFrame(frame);
    };
    s.raf = requestAnimationFrame(frame);
  };

  useEffect(() => {
    if (open && !mounted) { opener.current = document.activeElement as HTMLElement | null; setMounted(true); }
  }, [open, mounted]);

  useLayoutEffect(() => {
    const s = m.current;
    if (!mounted || !sheet.current) return;
    s.height = sheet.current.offsetHeight;
    if (open) {
      if (s.fresh) { s.x = s.height; s.v = 0; s.fresh = false; paint(); sheet.current.focus({ preventScroll: true }); }
      animate(0, 1, 0.35);
    } else {
      animate(s.height, 1, 0.3, () => { s.fresh = true; setMounted(false); opener.current?.focus({ preventScroll: true }); });
    }
  }, [open, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current(); };
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { root.style.overflow = previous; window.removeEventListener('keydown', onKey); cancelAnimationFrame(m.current.raf); };
  }, [mounted]);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelAnimationFrame(s.raf);
    s.v = 0;
    s.drag = { grab: e.clientY - s.x, samples: [{ y: e.clientY, t: e.timeStamp }] };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    if (!s.drag) return;
    const raw = e.clientY - s.drag.grab;
    s.x = raw >= 0 ? raw : -rubberband(-raw, s.height);
    s.drag.samples = [...s.drag.samples, { y: e.clientY, t: e.timeStamp }].filter((p) => e.timeStamp - p.t < 100);
    paint();
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    if (!s.drag) return;
    const first = s.drag.samples[0];
    const elapsed = (e.timeStamp - first.t) / 1000;
    s.v = elapsed > 0 ? (e.clientY - first.y) / elapsed : 0;
    s.drag = null;
    // Se decide por dónde acabaría el gesto, no por dónde se ha soltado
    if (s.x + project(s.v) > s.height / 2) close.current();
    else animate(0, 0.8, 0.3);
  };

  if (!mounted) return null;
  return createPortal(
    <>
      <div ref={scrim} className="backdrop" onClick={onClose} />
      <div ref={sheet} className="sheet" role="dialog" aria-modal="true" tabIndex={-1}>
        <div className="grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><i /></div>
        <div className="sheet-body">{children}</div>
      </div>
    </>,
    document.body,
  );
}
