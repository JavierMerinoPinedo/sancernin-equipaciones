// Física de las hojas inferiores: muelle interrumpible, proyección de la inercia
// y resistencia en los bordes.

export interface SpringState { x: number; v: number }

/**
 * Avanza el muelle `dt` segundos hacia `target`.
 * `damping` 1 = sin rebote; <1 = rebota. `response` = rapidez en segundos.
 */
export function stepSpring(s: SpringState, target: number, damping: number, response: number, dt: number) {
  const k = (2 * Math.PI / response) ** 2;
  const c = 2 * damping * Math.sqrt(k);
  // Pasos fijos: la integración no depende de la frecuencia de la pantalla
  for (let left = dt; left > 0; left -= 1 / 240) {
    const h = Math.min(left, 1 / 240);
    s.v += (-k * (s.x - target) - c * s.v) * h;
    s.x += s.v * h;
  }
}

/** Distancia que recorrería un gesto con esa velocidad (px/s) si siguiera por inercia. */
export const project = (velocity: number, deceleration = 0.998) =>
  (velocity / 1000) * deceleration / (1 - deceleration);

/** Cuanto más se pasa del límite, menos sigue al dedo. */
export const rubberband = (overshoot: number, dimension: number, constant = 0.55) =>
  (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
