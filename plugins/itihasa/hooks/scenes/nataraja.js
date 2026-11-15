// Nataraja: Shiva's dance inside the ring of fire, as a Chola bronze in
// firelight. The figure is traced from a public-domain photograph (see
// art/nataraja.js for the source and licence) into three bronze tones.
//
// Motion (5 fps, one clock): embers rise from the flame tips. The ring keeps
// a steady, light orange glow (it used to flare, which read as flashing), and
// the figure itself never moves.

import { ART } from './art/nataraja.js'
import { FPS, doc, pin, r1, seeded, stepped } from '../kit.js'

const rand = seeded(1008)

const C = {
  ground: '#120c08',
  base: '#5c3b1f',
  mid: '#a8743a',
  high: '#f0c878',
  fire: '#ff8a3d',
  flame: '#ff9a3c',
  ember: '#ffd27a',
}

// The ring of fire in the art's own coordinates, measured on the trace: the
// flame tips sit 245 to 290 from the centre, the ring itself just inside.
const RING = { cx: 311, cy: 377, inner: 205, outer: 296 }

// Each traced layer once, unfilled, so it can be drawn in more than one colour.
const LAYERS = Object.entries(ART.layers)
  .map(([name, l]) => `<g id="n-${name}" transform="${l.transform}"><path d="${l.d}"/></g>`)
  .join('')

const BRONZE =
  `<g id="nataraja">` +
  `<use href="#n-base" fill="${C.base}"/><use href="#n-mid" fill="${C.mid}"/><use href="#n-high" fill="${C.high}"/>` +
  `</g>`

// Embers: each starts at a flame tip on the upper part of the ring and climbs
// on its own path (one of three drifts), staggered so some are always in the
// air. Durations and delays are whole ticks, so they stay on the one clock.
const EMBERS = 20
const DRIFTS = ['ember-l', 'ember-r', 'ember-s']
const LIFE = [3.2, 4, 4.8] // seconds: 16, 20, 24 ticks

function embers() {
  let out = ''
  for (let i = 0; i < EMBERS; i++) {
    const a = Math.PI * (0.02 + rand() * 0.96)
    const r = 255 + rand() * 40
    const x = RING.cx + Math.cos(a) * r
    const y = RING.cy - Math.sin(a) * r
    const life = LIFE[i % LIFE.length]
    const delay = -Math.round(rand() * life * FPS) / FPS
    out +=
      `<circle class="${DRIFTS[i % DRIFTS.length]}" cx="${r1(x)}" cy="${r1(y)}" r="${r1(2.6 + rand() * 2.6)}" ` +
      `style="${stepped(DRIFTS[i % DRIFTS.length], life)};animation-delay:${r1(delay)}s"/>`
  }
  return `<g fill="${C.ember}">${out}</g>`
}

function placed(box, motion) {
  const glow = `<circle class="glow" cx="${RING.cx}" cy="${RING.cy}" r="${RING.outer + 70}" fill="url(#fire)"/>`
  // The flames: the silhouette again in orange, only inside the ring's band.
  const flames = `<use class="flames" href="#n-base" fill="${C.flame}" mask="url(#band)"/>`
  return pin(
    { ...box, w: ART.w, h: ART.h },
    glow + `<use href="#nataraja"/>` + (motion ? flames + embers() : ''),
  )
}

const DEFS =
  `<radialGradient id="fire">` +
  `<stop offset="0.5" stop-color="${C.fire}" stop-opacity="0"/>` +
  `<stop offset="0.78" stop-color="${C.fire}" stop-opacity="0.32"/>` +
  `<stop offset="1" stop-color="${C.fire}" stop-opacity="0"/>` +
  `</radialGradient>` +
  `<radialGradient id="warm" cx="0.75" cy="0.7" r="0.7">` +
  `<stop offset="0" stop-color="#3a2210" stop-opacity="0.55"/><stop offset="1" stop-color="#3a2210" stop-opacity="0"/>` +
  `</radialGradient>` +
  // A ring-shaped window onto the flames, soft at both edges.
  `<radialGradient id="bandfade" gradientUnits="userSpaceOnUse" cx="${RING.cx}" cy="${RING.cy}" r="${RING.outer + 10}">` +
  `<stop offset="${r1((RING.inner / (RING.outer + 10)) * 100) / 100}" stop-color="#fff" stop-opacity="0"/>` +
  `<stop offset="0.88" stop-color="#fff" stop-opacity="1"/>` +
  `<stop offset="1" stop-color="#fff" stop-opacity="1"/>` +
  `</radialGradient>` +
  `<linearGradient id="footfade" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.6" stop-color="#000" stop-opacity="1"/>` +
  `</linearGradient>` +
  `<mask id="band" maskUnits="userSpaceOnUse" x="0" y="0" width="${ART.w}" height="${ART.h}">` +
  `<rect width="${ART.w}" height="${ART.h}" fill="url(#bandfade)"/>` +
  // Fade out toward the pedestal, so only the ring flares.
  `<rect y="${RING.cy + 150}" width="${ART.w}" height="${ART.h - RING.cy - 150}" fill="url(#footfade)"/>` +
  `</mask>` +
  LAYERS +
  BRONZE


// One ember's climb: flares up, drifts, flickers and burns out.
const climb = (name, dx) =>
  `@keyframes ${name}{` +
  `0%{transform:translate(0,0);opacity:0}` +
  `8%{opacity:1}` +
  `35%{transform:translate(${r1(dx * 0.45)}px,-80px);opacity:.75}` +
  `50%{opacity:1}` +
  `70%{transform:translate(${r1(dx * 0.8)}px,-170px);opacity:.6}` +
  `100%{transform:translate(${dx}px,-250px);opacity:0}}`

// The flames hold one light opacity and the glow stays as in the still scene:
// only the embers move, each climbing in 5 fps steps.
const MOTION_CSS =
  `.flames{opacity:.3}` +
  climb('ember-l', -40) +
  climb('ember-r', 40) +
  climb('ember-s', 8)

function build(motion) {
  return doc({
    motion,
    motionCss: MOTION_CSS,
    defs: DEFS,
    body:
      `<rect width="100%" height="100%" fill="${C.ground}"/>` +
      `<rect width="100%" height="100%" fill="url(#warm)"/>` +
      // One copy of the figure, never a wide and a narrow copy swapped by an
      // aspect-ratio @media with display:none: in the Desktop app's frame that
      // swap left every animation in the scene frozen. "meet" in a box the
      // size of the right three-quarters of the window does the same job: a wide window
      // fits the figure to the height, against the right edge, clear of the
      // conversation; a tall one fits it to the width, along the bottom.
      placed({ x: '25%', y: '5%', width: '73%', height: '93%', align: 'xMaxYMax' }, motion),
  })
}

export const THEME = {
  id: 'nataraja',
  aliases: ['shiva', 'tandava'],
  label: 'Nataraja',
  story: "Shiva's cosmic dance in the ring of fire, as a Chola bronze",
  palette: {
    label: 'Nataraja',
    only: 'dark',
    roles: { accent: '#d6a14e', danger: '#e2604a', success: '#7fb36a', warning: '#e8a23c', pro: '#a58ad8' },
    dark: {
      gray: {
        anchors: {
          'surface-0': '#16100c',
          'surface-1': '#1b140f',
          'surface-2': '#1e1712',
          'surface-3': '#211913',
          'text-primary': '#f2e6d2',
          'text-secondary': '#cdb89c',
          'text-muted': '#988267',
        },
      },
    },
  },
  tint: '#16100c',
  alt: {
    still: 'A Chola bronze of Shiva as Nataraja dancing inside a ring of fire',
    motion: 'A Chola bronze of Shiva as Nataraja, with embers rising from the ring of fire',
  },
  STILL: build(false),
  MOTION: build(true),
}

