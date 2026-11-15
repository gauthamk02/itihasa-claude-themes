// Varanasi: the ghats of Kashi at dusk, seen from the Ganga. The river front is
// traced from Edward Lear's 1873 watercolour of Benares (art/varanasi-ghats.js),
// mirrored so the city stands on the right and the open river runs off to the
// left: a dark silhouette of the ghats, Lear's ochre washes, the red spires,
// and his pen lines drawn in gold. The river below holds the ghats' reflection
// and a scatter of floating diyas.
//
// Motion (5 fps, one clock): the diyas flicker. The ghats never move.

import { ART as GHATS } from './art/varanasi-ghats.js'
import { FPS, doc, fill, jumps, pin, r1, seeded } from '../kit.js'

const rand = seeded(1873)

const C = {
  skyTop: '#0b0d1f',
  skyMid: '#231c38',
  skyLow: '#5a3034',
  river: '#140f1c',
  riverDeep: '#08070d',
  star: '#e6e1f0',
  // The ghats: Lear's paper is gone; what was dark ink is now gold on dusk.
  ghatBase: '#3a2922',
  ghatWash: '#56392a',
  ghatRed: '#a14c37',
  ghatInk: '#cfae76',
  diya: '#ffd27a',
  mist: '#7a5f72',
}

const LAYERS = Object.entries(GHATS.layers)
  .map(([name, l]) => `<g id="g-${name}" transform="${l.transform}"><path d="${l.d}"/></g>`)
  .join('')

const GHAT_ART =
  `<g id="ghats">` +
  `<use href="#g-base" fill="${C.ghatBase}"/><use href="#g-wash" fill="${C.ghatWash}"/>` +
  `<use href="#g-red" fill="${C.ghatRed}"/><use href="#g-ink" fill="${C.ghatInk}"/>` +
  `</g>`

const DEFS =
  `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="${C.skyTop}"/><stop offset="0.45" stop-color="${C.skyMid}"/>` +
  `<stop offset="0.72" stop-color="${C.skyLow}"/><stop offset="0.72" stop-color="${C.river}"/>` +
  `<stop offset="1" stop-color="${C.riverDeep}"/>` +
  `</linearGradient>` +
  `<radialGradient id="diyaglow">` +
  `<stop offset="0" stop-color="${C.diya}" stop-opacity="0.5"/><stop offset="1" stop-color="${C.diya}" stop-opacity="0"/>` +
  `</radialGradient>` +
  // Mist on the water: a band of haze across the whole window, thickest at the
  // waterline (72%), softening the bank where the ghats meet the river.
  `<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0.56" stop-color="${C.mist}" stop-opacity="0"/>` +
  `<stop offset="0.69" stop-color="${C.mist}" stop-opacity="0.42"/>` +
  `<stop offset="0.72" stop-color="${C.mist}" stop-opacity="0.5"/>` +
  `<stop offset="0.76" stop-color="${C.mist}" stop-opacity="0.26"/>` +
  `<stop offset="0.84" stop-color="${C.mist}" stop-opacity="0"/>` +
  `</linearGradient>` +
  // The crop's straight cut is on the left after the mirror, facing the open
  // river: darken the mask towards it so the city trails off into the haze.
  `<linearGradient id="xfade" x1="0" y1="0" x2="1" y2="0">` +
  `<stop offset="0" stop-color="#000"/><stop offset="0.18" stop-color="#000" stop-opacity="0"/>` +
  `</linearGradient>` +
  `<mask id="gmask" maskUnits="userSpaceOnUse" x="0" y="0" width="${GHATS.w}" height="${GHATS.h}">` +
  `<rect width="${GHATS.w}" height="${GHATS.h}" fill="#fff"/>` +
  `<rect width="${GHATS.w}" height="${GHATS.h}" fill="url(#xfade)"/>` +
  `</mask>` +
  // The reflection: strongest at the waterline, gone halfway down.
  `<linearGradient id="rfade" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="#fff" stop-opacity="0.3"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/>` +
  `</linearGradient>` +
  `<mask id="rmask" maskUnits="userSpaceOnUse" x="0" y="${GHATS.h}" width="${GHATS.w}" height="${GHATS.h}">` +
  `<rect y="${GHATS.h}" width="${GHATS.w}" height="${GHATS.h}" fill="url(#rfade)"/>` +
  `<rect y="${GHATS.h}" width="${GHATS.w}" height="${GHATS.h}" fill="url(#xfade)"/>` +
  `</mask>` +
  LAYERS +
  GHAT_ART

// A few stars high in the sky, in a 1600 x 1000 field cropped to fill.
function stars() {
  let out = ''
  for (let i = 0; i < 22; i++) {
    const x = rand() * 1600
    const y = Math.pow(rand(), 1.8) * 420
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.7 + rand() * 1.2)}" opacity="${r1(0.3 + rand() * 0.5)}"/>`
  }
  return fill(1600, 1000, `<g fill="${C.star}">${out}</g>`)
}

// Floating diyas on the river, set adrift from the ghats on the right and
// thinning out as they drift left.
const DIYAS = 16
const FLICKER = 4 // seconds: 20 ticks

function diyas(motion) {
  let out = ''
  for (let i = 0; i < DIYAS; i++) {
    const x = 1520 - Math.pow(rand(), 1.3) * 1400
    const y = 770 + rand() * 190
    const s = 0.6 + (y - 770) / 190 // nearer is bigger
    const delay = -Math.round(rand() * FLICKER * FPS) / FPS
    const style = motion ? ` style="${jumps('flicker', FLICKER)};animation-delay:${r1(delay)}s"` : ''
    out +=
      `<g${style}>` +
      `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(14 * s)}" fill="url(#diyaglow)"/>` +
      `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(2.2 * s)}" fill="${C.diya}"/>` +
      `</g>`
  }
  return fill(1600, 1000, out)
}

const MOTION_CSS = `@keyframes flicker{0%{opacity:1}25%{opacity:.7}50%{opacity:.95}75%{opacity:.6}}`

function build(motion) {
  // One copy of the ghats, its bank flush with the waterline (72%) against the
  // right edge; the reflection hangs below it and the mist lies over the seam. (No aspect-ratio @media swaps: those
  // froze Nataraja's motion in the app.)
  const ghats = pin(
    { x: '25%', y: '8%', width: '75%', height: '64%', w: GHATS.w, h: GHATS.h, align: 'xMaxYMax', spill: true },
    `<use href="#ghats" mask="url(#gmask)"/>` +
      `<g mask="url(#rmask)"><use href="#ghats" transform="translate(0 ${GHATS.h * 2}) scale(1 -1)"/></g>`,
  )
  return doc({
    motion,
    motionCss: MOTION_CSS,
    defs: DEFS,
    body:
      `<rect width="100%" height="100%" fill="url(#sky)"/>` +
      stars() +
      ghats +
      `<rect width="100%" height="100%" fill="url(#mist)"/>` +
      diyas(motion),
  })
}

export const THEME = {
  id: 'varanasi',
  aliases: ['kashi', 'benares', 'banaras', 'ghats', 'ganga'],
  label: 'Varanasi',
  story: 'The ghats of Kashi at dusk, seen from the Ganga',
  palette: {
    label: 'Varanasi',
    only: 'dark',
    roles: { accent: '#e2a85a', danger: '#e2604a', success: '#86b46c', warning: '#e8a23c', pro: '#b08ad8' },
    dark: {
      gray: {
        anchors: {
          'surface-0': '#110e17',
          'surface-1': '#16121c',
          'surface-2': '#1a1620',
          'surface-3': '#1e1924',
          'text-primary': '#efe7dc',
          'text-secondary': '#c2b6a6',
          'text-muted': '#8c8173',
        },
      },
    },
  },
  tint: '#110e17',
  alt: {
    still: 'The ghats of Varanasi at dusk in gold line-work after Edward Lear, on the right, with the river opening out to the left',
    motion: 'The ghats of Varanasi at dusk with floating diyas flickering on the river',
  },
  STILL: build(false),
  MOTION: build(true),
}
