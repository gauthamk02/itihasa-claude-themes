// Nataraja: Shiva's dance inside the ring of fire, as a Chola bronze in
// firelight. The figure is traced from a public-domain photograph (see
// art/nataraja.js for the source and licence) into three bronze tones.
//
// Motion (5 fps, one clock): the flames on the ring flare and fade in orange,
// the firelight behind the ring breathes, and embers rise from the flame tips.
// The figure itself never moves.

import { ART } from './art/nataraja.js'
import { doc, jumps, pin, r1, seeded, stepped } from '../kit.js'

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

// Embers start at the flame tips on the upper half of the ring.
function embers() {
  let out = ''
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (0.05 + rand() * 0.9)
    const r = 250 + rand() * 45
    const x = RING.cx + Math.cos(a) * r
    const y = RING.cy - Math.sin(a) * r
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(2 + rand() * 2.4)}" fill-opacity="${r1(0.55 + rand() * 0.45)}"/>`
  }
  return `<g class="embers" fill="${C.ember}">${out}</g>`
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

const CSS =
  `.narrow{display:none}` +
  `@media (max-aspect-ratio:3/4){.wide{display:none}.narrow{display:inline}}`

// Every keyframe sits on a 0.4 s step (two ticks): flames flare and fade over
// 2 s, the glow breathes over 1.6 s, embers rise in steps over 6 s.
const MOTION_CSS =
  `.flames{${jumps('flare', 2)}}` +
  `.glow{${jumps('breathe', 1.6)}}` +
  `.embers{${stepped('rise', 6)}}` +
  `@keyframes flare{0%{opacity:.15}20%{opacity:.55}40%{opacity:.3}60%{opacity:.65}80%{opacity:.4}}` +
  `@keyframes breathe{0%{opacity:.45}25%{opacity:1}50%{opacity:.7}75%{opacity:.95}}` +
  `@keyframes rise{from{transform:translateY(0);opacity:1}to{transform:translateY(-130px);opacity:0}}`

function build(motion) {
  return doc({
    motion,
    css: CSS,
    motionCss: MOTION_CSS,
    defs: DEFS,
    body:
      `<rect width="100%" height="100%" fill="${C.ground}"/>` +
      `<rect width="100%" height="100%" fill="url(#warm)"/>` +
      placed({ x: '48%', y: '5%', width: '50%', height: '93%', align: 'xMaxYMax', cls: 'wide' }, motion) +
      placed({ x: '0', y: '34%', width: '100%', height: '64%', align: 'xMidYMax', cls: 'narrow' }, motion),
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
