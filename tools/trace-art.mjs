// Turns a photo or drawing into a few flat SVG layers a scene can colour.
//
//   node tools/trace-art.mjs sources/nataraja/trace.json
//
// The config (JSON) names:
//   source      the image, relative to the config file
//   id          art name; writes plugins/itihasa/hooks/scenes/art/<id>.js
//   crop        optional "WxH+X+Y" in source pixels, applied before anything else
//   flip        optional true: mirror left-right after the crop (regions below are
//               then measured on the mirrored image)
//   height      trace height in px (smaller = fewer characters)
//   mask        how to cut the subject from its background:
//               { "channel": "chroma" | "dark", "threshold": percent }
//               chroma: the subject is coloured and the background grey (bronze on grey)
//               dark:   the subject is darker than the background (ink on paper)
//               or { "fx": "<ImageMagick -fx rule, true on the subject>" }
//               add "solid": true to keep only the largest piece and fill its holes;
//               "keep" and "holes" (fractions of the working area, default 0.05
//               and 0.01) set how small a piece is dropped and a hole is filled;
//               "close" (default 2) is the radius that joins nearby pieces first
//   tones       lighter layers inside the subject: [{ "name", "above": percent of gray }]
//   parts       small layers outside the mask, each found by its own colour rule
//               inside a region of the cropped source:
//               [{ "name", "region": "WxH+X+Y", "fx": "<-fx rule>" }]
//               region is optional (default: the whole image). Instead of fx, a
//               part can take "lines": percent, which keeps pen lines (pixels
//               darker than their blurred surroundings by that much; "blur"
//               sets the radius, default 5). "clip": true keeps a part inside
//               the mask. "smooth": radius rounds a part off (fewer, larger
//               shapes) and "turdsize" overrides potrace's speck size for it.
//   turdsize, opttolerance, alphamax   potrace settings (fewer, smoother curves when larger)
//   unit        potrace's output grid, steps per pixel (default 10; 2 writes far
//               fewer digits at half-pixel precision)
//   credit      one line for the module header (title, museum, licence)
//
// Needs ImageMagick (`magick`) and potrace. Work files go to work/<id>/ (git-ignored).

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = resolve(process.argv[2] ?? '')
const cfg = JSON.parse(readFileSync(configPath, 'utf8'))
const src = resolve(dirname(configPath), cfg.source)
const work = resolve(root, 'work', cfg.id)
mkdirSync(work, { recursive: true })

const run = (cmd, args) => execFileSync(cmd, args, { cwd: work, stdio: ['ignore', 'pipe', 'inherit'] })
const H = cfg.height
const big = Math.round(H * 1.4)

// 0. The source, cropped if asked.
let input = src
if (cfg.crop || cfg.flip) {
  run('magick', [src, ...(cfg.crop ? ['-crop', cfg.crop, '+repage'] : []), ...(cfg.flip ? ['-flop'] : []), 'source.png'])
  input = 'source.png'
}

// 1. Gray and (for chroma masks) colourfulness, at a working size.
run('magick', [input, '-resize', `x${big}`, '-colorspace', 'Gray', 'gray.png'])
if (cfg.mask.fx) {
  run('magick', [input, '-resize', `x${big}`, '-fx', cfg.mask.fx, '-colorspace', 'Gray', 'key.png'])
} else if (cfg.mask.channel === 'chroma') {
  run('magick', [input, '-resize', `x${big}`, '-colorspace', 'HCL', '-channel', 'G', '-separate', '+channel', '-auto-level', 'key.png'])
} else {
  run('magick', ['gray.png', '-negate', 'key.png'])
}

// 2. The subject's silhouette: white where the subject is. A "solid" mask
// keeps only the largest piece and fills the holes inside it.
const solid = cfg.mask.solid
  ? [
      '-define', `connected-components:area-threshold=${Math.round(big * big * (cfg.mask.keep ?? 0.05))}`,
      '-define', 'connected-components:mean-color=true', '-connected-components', '8',
      '-negate',
      '-define', `connected-components:area-threshold=${Math.round(big * big * (cfg.mask.holes ?? 0.01))}`,
      '-define', 'connected-components:mean-color=true', '-connected-components', '8',
      '-negate',
    ]
  : []
run('magick', [
  'key.png', '-threshold', `${cfg.mask.fx ? 50 : cfg.mask.threshold}%`,
  '-morphology', 'Close', `Disk:${cfg.mask.close ?? 2}`, '-morphology', 'Open', 'Disk:1.5',
  ...solid,
  '-resize', `x${H}`, '-threshold', '50%', 'base.png',
])

// 3. Lighter tones inside the silhouette.
for (const tone of cfg.tones ?? []) {
  run('magick', [
    'gray.png', '-blur', '0x1.2', '-resize', `x${H}`, '-threshold', `${tone.above}%`,
    'base.png', '-compose', 'Multiply', '-composite', '-morphology', 'Open', 'Disk:1', `${tone.name}.png`,
  ])
}

// 3b. Parts: each found by its own colour rule inside its region, on a black
// canvas the size of the source, then brought to the trace size.
const full = run('magick', ['identify', '-format', '%w %h', input]).toString().trim().split(' ').map(Number)
for (const part of cfg.parts ?? []) {
  const clip = [
    ...(part.clip ? ['base.png', '-compose', 'Multiply', '-composite'] : []),
    ...(part.smooth ? ['-morphology', 'Close', `Disk:${part.smooth}`, '-morphology', 'Open', `Disk:${part.smooth}`] : []),
  ]
  if (part.lines !== undefined) {
    run('magick', [
      'gray.png', '(', 'gray.png', '-blur', `0x${part.blur ?? 5}`, ')', '-compose', 'Minus_Dst', '-composite',
      '-level', `0,${part.lines}%`, '-threshold', '50%',
      '-resize', `x${H}`, '-threshold', '50%', ...clip, `${part.name}.png`,
    ])
    if (part.region) {
      const [, w, h, x, y] = /^(\d+)x(\d+)\+(\d+)\+(\d+)$/.exec(part.region).map(Number)
      const k = H / full[1]
      const box = [x, y, x + w, y + h].map(v => Math.round(v * k)).join(',')
      run('magick', [`${part.name}.png`, '(', '+clone', '-fill', 'black', '-colorize', '100',
        '-fill', 'white', '-draw', `rectangle ${box}`, ')', '-compose', 'Multiply', '-composite', `${part.name}.png`])
    }
    continue
  }
  const [, w, h, x, y] = /^(\d+)x(\d+)\+(\d+)\+(\d+)$/.exec(part.region ?? `${full[0]}x${full[1]}+0+0`).map(Number)
  run('magick', [
    '-size', `${full[0]}x${full[1]}`, 'xc:black',
    '(', input, '-crop', `${w}x${h}+${x}+${y}`, '+repage', '-fx', part.fx, '-colorspace', 'Gray',
    '-morphology', 'Open', 'Disk:1', ')',
    '-geometry', `+${x}+${y}`, '-composite',
    '-resize', `x${H}`, '-threshold', '50%', ...clip, `${part.name}.png`,
  ])
}

// 4. Trace each layer, keeping potrace's own transform and path.
const size = run('magick', ['identify', '-format', '%w %h', 'base.png']).toString().trim().split(' ').map(Number)
const layers = {}
const names = ['base', ...(cfg.tones ?? []).map(t => t.name), ...(cfg.parts ?? []).map(p => p.name)]
for (const name of names) {
  run('magick', [`${name}.png`, '-negate', `${name}.pbm`])
  run('potrace', [
    `${name}.pbm`, '-s', '--flat',
    '--turdsize', String((cfg.parts ?? []).find(p => p.name === name)?.turdsize ?? cfg.turdsize ?? 12),
    '--alphamax', String(cfg.alphamax ?? 1.1),
    '--opttolerance', String(cfg.opttolerance ?? 0.5),
    '--unit', String(cfg.unit ?? 10),
    '-o', `${name}.svg`,
  ])
  const svg = readFileSync(resolve(work, `${name}.svg`), 'utf8')
  const g = /<g transform="([^"]+)"[^>]*>([\s\S]*?)<\/g>/.exec(svg)
  const d = [...g[2].matchAll(/ d="([^"]+)"/g)].map(m => m[1].replace(/\s+/g, ' ').trim()).join(' ')
  layers[name] = { transform: g[1], d }
}

// 5. A module the scene imports.
const out = resolve(root, 'plugins/itihasa/hooks/scenes/art', `${cfg.id}.js`)
mkdirSync(dirname(out), { recursive: true })
const body =
  `// Generated by tools/trace-art.mjs from ${cfg.source}; do not edit by hand.\n` +
  `// ${cfg.credit}\n\n` +
  `export const ART = ${JSON.stringify({ w: size[0], h: size[1], layers })}\n`
writeFileSync(out, body)
writeFileSync(out.replace(/\.js$/, '.d.ts'),
  `export const ART: { w: number; h: number; layers: Record<string, { transform: string; d: string }> }\n`)

const sizes = Object.entries(layers).map(([k, v]) => `${k} ${v.d.length}`).join(', ')
console.log(`${out}\n  ${size[0]}x${size[1]}, path characters: ${sizes}, total ${body.length}`)
