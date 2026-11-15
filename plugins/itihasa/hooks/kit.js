// Shared pieces for every itihasa scene: rounding, a seeded random, stepped
// motion on one clock, and the document shell.
//
// Performance rules (see the repo README, "Performance"):
// - every animation steps FPS times a second, and every duration is a whole
//   number of ticks, so all layers change on the same frame;
// - the still version carries no animation CSS at all;
// - prefers-reduced-motion stops everything.

/** Ticks per second for every moving layer. */
export const FPS = 5

/** Rounds to one decimal and drops a trailing ".0". */
export const r1 = n => (Math.round(n * 10) / 10).toString()

/** A small deterministic random, so every load draws the same scene. */
export function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The CSS `animation` value for one stepped loop. Throws when the duration is
 * not a whole number of ticks, which would put the layer on its own clock.
 */
export function stepped(name, seconds) {
  const steps = seconds * FPS
  if (Math.abs(steps - Math.round(steps)) > 1e-9) {
    throw new Error(`${name}: ${seconds}s is not a whole number of ticks at ${FPS} fps`)
  }
  return `animation:${name} ${seconds}s steps(${Math.round(steps)}) infinite`
}

/**
 * The CSS `animation` value for a loop that jumps between keyframes, holding
 * each one. Put every keyframe on a multiple of one tick (1/FPS of a second)
 * so the jumps land on the shared clock.
 */
export function jumps(name, seconds) {
  stepped(name, seconds)
  return `animation:${name} ${seconds}s steps(1,end) infinite`
}

/** A path through points: [[x, y], ...]. `close` adds Z. */
export function poly(points, close = false) {
  return 'M' + points.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + (close ? 'Z' : '')
}

/** Points along a Catmull-Rom curve through `points`, `n` samples. */
export function spline(points, n = 32) {
  const out = []
  const p = (i) => points[Math.max(0, Math.min(points.length - 1, i))]
  const segs = points.length - 1
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * segs
    const i = Math.min(segs - 1, Math.floor(u))
    const t = u - i
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)]
    const f = (a, b, c, d) =>
      0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
    out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
  }
  return out
}

/**
 * A tapering tube along a curve through `points`: a body, a limb, a serpent.
 * Returns the closed outline, the centre line, and `rungs` (lines across the
 * tube, every `every` samples) for belly scales or bands.
 */
export function tube(points, w0, w1, { n = 32, every = 3 } = {}) {
  const c = spline(points, n)
  const left = []
  const right = []
  const rungs = []
  c.forEach(([x, y], k) => {
    const [ax, ay] = c[Math.max(0, k - 1)]
    const [bx, by] = c[Math.min(c.length - 1, k + 1)]
    const len = Math.hypot(bx - ax, by - ay) || 1
    const nx = -(by - ay) / len
    const ny = (bx - ax) / len
    const w = (w0 + (w1 - w0) * (k / (c.length - 1))) / 2
    left.push([x + nx * w, y + ny * w])
    right.push([x - nx * w, y - ny * w])
    if (k > 0 && k < c.length - 1 && k % every === 0) {
      rungs.push(`M${r1(x + nx * w * 0.8)} ${r1(y + ny * w * 0.8)}L${r1(x - nx * w * 0.8)} ${r1(y - ny * w * 0.8)}`)
    }
  })
  return {
    outline: poly([...left, ...right.reverse()], true),
    center: poly(c),
    rungs: rungs.join(''),
  }
}

/**
 * The whole SVG document.
 * - css: rules both versions need
 * - motionCss: animation rules and keyframes, only in the motion version
 */
export function doc({ motion, css = '', motionCss = '', defs = '', body }) {
  const reduced = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}'
  const style = css + (motion ? motionCss + reduced : '')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    (style ? `<style>${style}</style>` : '') +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    `</svg>`
  )
}

/** A full-window layer: viewBox w x h, cropped so it always fills. */
export function fill(w, h, inner) {
  return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`
}

/**
 * A subject pinned inside a box of the window and scaled to fit it.
 * x, y, width, height are window percentages ('52%'); align is an SVG
 * preserveAspectRatio alignment such as 'xMaxYMax'. `spill` lets glows drawn
 * around the subject reach past the box instead of being cut off at its edge.
 */
export function pin({ x = '0', y = '0', width = '100%', height = '100%', w, h, align = 'xMidYMax', cls = '', spill = false }, inner) {
  const c = cls ? ` class="${cls}"` : ''
  const o = spill ? ' overflow="visible"' : ''
  return `<svg${c} x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${align} meet"${o}>${inner}</svg>`
}
