// Writes each theme's STILL and MOTION scenes to tools/preview/<id>-still.svg
// and <id>-motion.svg, and warns when one is over Claude Code's limit.
//
//   node tools/render-scenes.mjs                         every theme in the registry
//   node tools/render-scenes.mjs plugins/itihasa/hooks/scenes/nataraja.js   one scene module

import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// The Svg element's `source` is at most 131072 characters (claude-code.d.ts, SvgProps).
const LIMIT = 131072

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, 'preview')
const args = process.argv.slice(2)

const themes = args.length
  ? await Promise.all(args.map(async p => (await import(pathToFileURL(resolve(p)).href)).THEME))
  : (await import(pathToFileURL(resolve(here, '../plugins/itihasa/hooks/themes.js')).href)).THEMES

let failed = false
for (const theme of themes) {
  for (const [mode, svg] of [['still', theme.STILL], ['motion', theme.MOTION]]) {
    const file = `${out}/${theme.id}-${mode}.svg`
    writeFileSync(file, svg)
    const big = svg.length > LIMIT
    failed ||= big
    console.log(`${file}  ${svg.length} chars${big ? `  TOO BIG: over ${LIMIT}` : ''}`)
  }
}
process.exit(failed ? 1 : 0)
