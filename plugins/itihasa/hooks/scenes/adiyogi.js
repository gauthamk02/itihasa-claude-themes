// Adiyogi: Shiva as the first yogi, eyes closed, the crescent moon in his
// hair, rising out of the bottom of the window under a night sky. The bust is
// traced from a photograph (see art/adiyogi.js and sources/adiyogi/) into
// three tones of dark stone, with the moon, the tilak and the earrings traced
// as their own layers so each can take its own colour.
//
// Motion (5 fps, one clock): the stars twinkle. Every star runs the same
// 6-second loop, offset by whole ticks; the figure and the glow never move.

import { ART } from './art/adiyogi.js'
import { FPS, doc, fill, jumps, pin, r1, seeded } from '../kit.js'

const rand = seeded(112)

const C = {
  skyTop: '#070912',
  skyLow: '#18203a',
  halo: '#8fa6d6',
  base: '#0a0d16',
  mid: '#1d2638',
  high: '#40506e',
  moon: '#efe4c4',
  tilak: '#f4f1ea',
  earrings: '#b06a3c',
  star: '#dfe6f5',
}

// The head's and the moon's centres in the art's own coordinates, measured on
// the trace.
const HEAD = { cx: 395, cy: 200 }
const MOON = { cx: 548, cy: 72 }

// Each traced layer once, unfilled, then the bust: stone tones, then the parts.
const LAYERS = Object.entries(ART.layers)
  .map(([name, l]) => `<g id="a-${name}" transform="${l.transform}"><path d="${l.d}"/></g>`)
  .join('')

const BUST =
  `<g id="adiyogi">` +
  `<use href="#a-base" fill="${C.base}"/><use href="#a-mid" fill="${C.mid}"/><use href="#a-high" fill="${C.high}"/>` +
  `<use href="#a-moon" fill="${C.moon}"/><use href="#a-tilak" fill="${C.tilak}"/><use href="#a-earrings" fill="${C.earrings}"/>` +
  `</g>`

// Stars over the whole window, in a 1600 x 1000 field that is cropped to fill.
// Most sit in the upper part; the bust covers whatever lands behind it.
const STARS = 34
const TWINKLE = 6 // seconds: 30 ticks

function stars(motion) {
  let out = ''
  for (let i = 0; i < STARS; i++) {
    const x = rand() * 1600
    const y = Math.pow(rand(), 1.6) * 760
    const r = 0.8 + rand() * 1.6
    const delay = -Math.round(rand() * TWINKLE * FPS) / FPS
    const style = motion ? ` style="${jumps('twinkle', TWINKLE)};animation-delay:${r1(delay)}s"` : ''
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" opacity="${r1(0.4 + rand() * 0.5)}"${style}/>`
  }
  return fill(1600, 1000, `<g fill="${C.star}">${out}</g>`)
}

const DEFS =
  `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="${C.skyTop}"/><stop offset="1" stop-color="${C.skyLow}"/>` +
  `</linearGradient>` +
  `<radialGradient id="halo">` +
  `<stop offset="0" stop-color="${C.halo}" stop-opacity="0.34"/>` +
  `<stop offset="0.55" stop-color="${C.halo}" stop-opacity="0.1"/>` +
  `<stop offset="1" stop-color="${C.halo}" stop-opacity="0"/>` +
  `</radialGradient>` +
  `<radialGradient id="moonglow">` +
  `<stop offset="0" stop-color="${C.moon}" stop-opacity="0.16"/><stop offset="1" stop-color="${C.moon}" stop-opacity="0"/>` +
  `</radialGradient>` +
  // The photograph cuts the left shoulder off square; fade that edge out.
  `<linearGradient id="edgefade" x1="0" y1="0" x2="1" y2="0">` +
  `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.12" stop-color="#fff" stop-opacity="1"/>` +
  `</linearGradient>` +
  `<mask id="edge" maskUnits="userSpaceOnUse" x="0" y="0" width="${ART.w}" height="${ART.h}">` +
  `<rect width="${ART.w}" height="${ART.h}" fill="url(#edgefade)"/>` +
  `</mask>` +
  LAYERS +
  BUST

// A star dims and comes back: held values, each on a whole tick of the loop.
const MOTION_CSS = `@keyframes twinkle{0%{opacity:.9}20%{opacity:.35}40%{opacity:.75}60%{opacity:.2}80%{opacity:.6}}`

function placed(box) {
  const halo = `<circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="330" fill="url(#halo)"/>`
  const moonglow = `<circle cx="${MOON.cx}" cy="${MOON.cy}" r="95" fill="url(#moonglow)"/>`
  return pin({ ...box, w: ART.w, h: ART.h, spill: true }, halo + moonglow + `<use href="#adiyogi" mask="url(#edge)"/>`)
}

function build(motion) {
  return doc({
    motion,
    motionCss: MOTION_CSS,
    defs: DEFS,
    body:
      `<rect width="100%" height="100%" fill="url(#sky)"/>` +
      stars(motion) +
      // One copy of the bust, flush with the bottom edge: a wide window fits it
      // to the height against the right edge, a tall one fits it to the width.
      // (No aspect-ratio @media swaps: those froze Nataraja's motion in the app.)
      placed({ x: '25%', y: '8%', width: '75%', height: '92%', align: 'xMaxYMax' }),
  })
}

export const THEME = {
  id: 'adiyogi',
  aliases: ['yogi', 'adinath'],
  label: 'Adiyogi',
  story: 'Shiva as the first yogi, eyes closed under the crescent moon',
  palette: {
    label: 'Adiyogi',
    only: 'dark',
    roles: { accent: '#c9b47e', danger: '#e2604a', success: '#7fb36a', warning: '#e8a23c', pro: '#9a8ad8' },
    dark: {
      gray: {
        anchors: {
          'surface-0': '#0b0e18',
          'surface-1': '#10131e',
          'surface-2': '#131722',
          'surface-3': '#161a26',
          'text-primary': '#e6e9f2',
          'text-secondary': '#b4bccd',
          'text-muted': '#7f889c',
        },
      },
    },
  },
  tint: '#0b0e18',
  alt: {
    still: 'A dark stone bust of Shiva as Adiyogi, eyes closed, a crescent moon in his hair, under a starry night sky',
    motion: 'A dark stone bust of Shiva as Adiyogi under a night sky with twinkling stars',
  },
  STILL: build(false),
  MOTION: build(true),
}
