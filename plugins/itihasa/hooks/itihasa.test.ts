import { expect, test } from 'claude-code/testing'

import { makeColors } from './make-colors.js'
import { DEFAULT_ID, THEMES, parseArgs, readScene, sceneName } from './themes.js'

// The Svg element refuses a source over this many characters.
const LIMIT = 131072

test('every scene is a safe SVG under the size limit', async () => {
  for (const t of THEMES) {
    for (const svg of [t.STILL, t.MOTION]) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.length < LIMIT).toBe(true)
      expect(/<script|<image|<foreignObject|https?:\/\/(?!www\.w3\.org)/i.test(svg)).toBe(false)
    }
    // The still version carries no animation at all; the motion one stops for reduced motion.
    expect(/animation|@keyframes/.test(t.STILL)).toBe(false)
    expect(t.MOTION.includes('prefers-reduced-motion')).toBe(true)
  }
})

test('every palette paints on Desktop', async () => {
  for (const t of THEMES) {
    const { problems } = makeColors(t.palette)
    expect(problems.filter(p => p.startsWith("Desktop won't paint"))).toEqual([])
    expect(t.tint).toBe(t.palette.dark?.gray?.anchors?.['surface-0'])
  }
})

test('arguments name a theme, a mode, both, or off', async () => {
  expect(parseArgs('')).toEqual({ kind: 'list' })
  expect(parseArgs('off')).toEqual({ kind: 'off' })
  expect(parseArgs('motion')).toEqual({ kind: 'show', motion: true })
  expect(parseArgs('nataraja moving')).toEqual({ kind: 'show', id: 'nataraja', motion: true })
  expect(parseArgs('Shiva still')).toEqual({ kind: 'show', id: 'nataraja', motion: false })
  expect(parseArgs('kaliya')).toEqual({ kind: 'unknown', word: 'kaliya' })
  expect(readScene(sceneName('nataraja', true))?.motion).toBe(true)
  expect(readScene('snow-pines')).toBe(undefined)
})

// Records the looks the plugin sets, standing in for the engine.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type On = (event: string, hook: (...a: any[]) => unknown) => unknown

function engine(on: On, stored: unknown, attached = true, themes = true) {
  const sets: Array<{ backdrop?: { scene?: string } }> = []
  const store = new Map<string, unknown>(stored === undefined ? [] : [['last', stored]])
  on('command.register', (_: unknown, e: { name: string }) => ({ value: { command: e.name } }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: store.get(e.key) }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  // themes = false stands in for a build whose theme.set throws (Claude Code before 2.1.324).
  if (themes)
    on('theme.set', (_: unknown, e: { backdrop?: { scene?: string } }) => {
      sets.push(e)
      return {
        value: attached
          ? { isDrawn: true, requestId: 'backdrop' }
          : { isDrawn: false, requestId: 'backdrop', reason: 'no attached desktop or mobile client draws themes yet' },
      }
    })
  on('theme.clear', () => ({ value: { isDrawn: false, reason: 'cleared' } }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  return { sets, store }
}

test('a session starts on the default theme, still', async ($, on) => {
  const { sets } = engine(on as never, undefined)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.map(s => s.backdrop?.scene)).toEqual([sceneName(DEFAULT_ID, false)])
})

test('a session starts on the last theme, still, and not at all after off', async ($, on) => {
  const { sets, store } = engine(on as never, 'nataraja')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.at(-1)?.backdrop?.scene).toBe('nataraja-still')

  await $.command.run({ command: 'itihasa', args: 'motion' } as never)
  expect(sets.at(-1)?.backdrop?.scene).toBe('nataraja-motion')

  await $.command.run({ command: 'itihasa', args: 'off' } as never)
  expect(store.get('last')).toBe('off')
  const before = sets.length
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.length).toBe(before)
})

test('a theme set before the app attaches still counts, and says it will appear', async ($, on) => {
  const { sets, store } = engine(on as never, undefined, false)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const out = (await $.command.run({ command: 'itihasa', args: 'nataraja live' } as never)) as { text: string }
  expect(sets.at(-1)?.backdrop?.scene).toBe('nataraja-motion')
  expect(store.get('last')).toBe('nataraja')
  expect(out.text.startsWith('Nataraja, moving.')).toBe(true)
})

test('a theme.set that throws answers the command with the reason, and keeps the last theme', async ($, on) => {
  const { store } = engine(on as never, 'adiyogi', true, false)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const out = (await $.command.run({ command: 'itihasa', args: 'nataraja' } as never)) as { text: string }
  expect(out.text.includes('theme.set')).toBe(true)
  expect(store.get('last')).toBe('adiyogi')
})
