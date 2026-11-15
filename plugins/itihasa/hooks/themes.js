// The registry: every theme in the collection, and the small parsing the
// /itihasa command needs. Each theme lives in scenes/<id>.js and exports THEME.

import { THEME as nataraja } from './scenes/nataraja.js'

export const THEMES = [nataraja]

export const DEFAULT_ID = 'nataraja'

export function findTheme(id) {
  return THEMES.find(t => t.id === id)
}

function byWord(word) {
  return THEMES.find(t => t.id === word || t.aliases.includes(word))
}

export function parseArgs(args) {
  const words = args.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return { kind: 'list' }
  if (words.length === 1 && (words[0] === 'off' || words[0] === 'none')) return { kind: 'off' }

  const out = { kind: 'show' }
  for (const word of words) {
    if (['motion', 'moving', 'move', 'animated', 'animate', 'live'].includes(word)) out.motion = true
    else if (['still', 'static', 'stop', 'pause'].includes(word)) out.motion = false
    else {
      const theme = byWord(word)
      if (theme === undefined) return { kind: 'unknown', word }
      out.id = theme.id
    }
  }
  return out
}

export function sceneName(id, motion) {
  return `${id}-${motion ? 'motion' : 'still'}`
}

export function readScene(scene) {
  const m = /^(.+)-(still|motion)$/.exec(scene)
  if (m === null) return undefined
  const theme = findTheme(m[1])
  return theme === undefined ? undefined : { theme, motion: m[2] === 'motion' }
}
