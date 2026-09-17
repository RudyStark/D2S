export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Maps v from [a, b] to [0, 1], clamped. */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** C2-continuous ease; zero velocity and acceleration at both ends. */
export const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/**
 * Monotone cubic Hermite interpolation (Fritsch–Carlson) over non-uniform stamps.
 * C1-continuous, never overshoots between keys — ideal for camera channels.
 */
export class MonotoneCurve {
  private readonly xs: number[];
  private readonly ys: number[];
  private readonly ms: number[];

  constructor(xs: number[], ys: number[]) {
    const n = xs.length;
    this.xs = xs;
    this.ys = ys;
    const d: number[] = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    const ms = new Array<number>(n);
    ms[0] = d[0] ?? 0;
    ms[n - 1] = d[n - 2] ?? 0;
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) {
        ms[i] = 0;
      } else {
        const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
        const w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]);
        ms[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    // Flat ends: the sequence starts and settles at rest.
    ms[0] = 0;
    ms[n - 1] = 0;
    this.ms = ms;
  }

  at(x: number) {
    const { xs, ys, ms } = this;
    const n = xs.length;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * ms[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * ms[i + 1]
    );
  }
}
