// Nataraja: Shiva's dance inside the ring of fire, as a Chola bronze in
// firelight. The figure is traced from a public-domain photograph (see
// art/nataraja.js for the source and licence) into three bronze tones.
//
// Motion (5 fps, one clock): the firelight behind the ring flickers and a few
// embers rise. The bronze itself never moves.

import { ART } from './art/nataraja.js'
import { doc, jumps, pin, r1, seeded, stepped } from '../kit.js'

const rand = seeded(1008)

const C = {
  ground: '#120c08',
  base: '#5c3b1f',
  mid: '#a8743a',
  high: '#f0c878',
  fire: '#ff8a3d',
}

// The ring of fire in the art's own coordinates (measured on the trace).
const RING = { cx: 307, cy: 360, r: 285 }

function bronze() {
  const { base, mid, high } = ART.layers
  return (
    `<g transform="${base.transform}" fill="${C.base}"><path d="${base.d}"/></g>` +
    `<g transform="${mid.transform}" fill="${C.mid}"><path d="${mid.d}"/></g>` +
    `<g transform="${high.transform}" fill="${C.high}"><path d="${high.d}"/></g>`
  )
}

function embers() {
  let out = ''
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const x = RING.cx + Math.cos(a) * (RING.r + 10 + rand() * 30)
    const y = RING.cy + Math.sin(a) * (RING.r + 10 + rand() * 30) - 20
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(1.2 + rand() * 1.8)}" fill-opacity="${r1(0.35 + rand() * 0.4)}"/>`
  }
  return `<g class="embers" fill="${C.high}">${out}</g>`
}

// Everything inside one placement, drawn once in <defs> and placed twice.
const SUBJECT =
  `<g id="nataraja">` +
  bronze() +
  `</g>`

function placed(box) {
  // The glow and embers sit outside the shared group, so their animation runs on
  // ordinary elements rather than inside a <use> copy.
  const glow = `<circle class="glow" cx="${RING.cx}" cy="${RING.cy}" r="${RING.r + 60}" fill="url(#fire)"/>`
  return pin({ ...box, w: ART.w, h: ART.h }, glow + `<use href="#nataraja"/>` + embers())
}

const DEFS =
  `<radialGradient id="fire">` +
  `<stop offset="0.55" stop-color="${C.fire}" stop-opacity="0"/>` +
  `<stop offset="0.8" stop-color="${C.fire}" stop-opacity="0.22"/>` +
  `<stop offset="1" stop-color="${C.fire}" stop-opacity="0"/>` +
  `</radialGradient>` +
  `<radialGradient id="warm" cx="0.75" cy="0.7" r="0.7">` +
  `<stop offset="0" stop-color="#3a2210" stop-opacity="0.55"/><stop offset="1" stop-color="#3a2210" stop-opacity="0"/>` +
  `</radialGradient>` +
  SUBJECT

const CSS =
  `.narrow{display:none}` +
  `@media (max-aspect-ratio:3/4){.wide{display:none}.narrow{display:inline}}`

// Firelight: four held levels, each 0.4 s (two ticks). Embers: rise and fade
// in steps over 6 s.
const MOTION_CSS =
  `.glow{${jumps('flicker', 1.6)}}` +
  `.embers{${stepped('rise', 6)}}` +
  `@keyframes flicker{0%{opacity:.75}25%{opacity:1}50%{opacity:.85}75%{opacity:.95}}` +
  `@keyframes rise{from{transform:translateY(0);opacity:1}to{transform:translateY(-60px);opacity:0}}`

function build(motion) {
  return doc({
    motion,
    css: CSS,
    motionCss: MOTION_CSS,
    defs: DEFS,
    body:
      `<rect width="100%" height="100%" fill="${C.ground}"/>` +
      `<rect width="100%" height="100%" fill="url(#warm)"/>` +
      placed({ x: '48%', y: '5%', width: '50%', height: '93%', align: 'xMaxYMax', cls: 'wide' }) +
      placed({ x: '0', y: '34%', width: '100%', height: '64%', align: 'xMidYMax', cls: 'narrow' }),
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
    motion: 'A Chola bronze of Shiva as Nataraja, with firelight flickering behind the ring',
  },
  STILL: build(false),
  MOTION: build(true),
}
