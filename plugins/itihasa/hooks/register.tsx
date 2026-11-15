import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { DEFAULT_ID, THEMES, findTheme, parseArgs, readScene, sceneName } from './themes.js'
import type { Theme } from './themes.js'

// What the store keeps between sessions: the last theme picked, or 'off'.
const LAST = 'last'

// Each theme's colors, worked out once.
const COLORS = new Map(THEMES.map(t => [t.id, makeColors(t.palette)]))

function look(theme: Theme, motion: boolean): ThemeSetArgs {
  return {
    colors: COLORS.get(theme.id)!.theme,
    // No blur: blurring a moving backdrop redoes the blur on every frame.
    backdrop: { scene: sceneName(theme.id, motion), glass: { blur: 0, tint: theme.tint, opacity: 0.55 } },
    overrideColorScheme: 'dark',
  }
}

function list(current: string | undefined): string {
  const rows = THEMES.map(t => `${t.id === current ? '▸' : ' '} ${t.id.padEnd(12)} ${t.label}: ${t.story}`)
  return [
    'Themes (each starts still):',
    ...rows,
    '',
    '/itihasa <theme>   show a theme, still',
    '/itihasa motion    let the current theme move',
    '/itihasa still     hold it still again',
    '/itihasa off       take the backdrop off',
  ].join('\n')
}

export const register: Register = on => {
  // The theme on screen now; a reload starts it over, and session.start sets it.
  let current: string | undefined
  let moving = false

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'itihasa',
      description: 'Backdrops from the Hindu epics and Puranas',
      argumentHint: `[${THEMES.map(t => t.id).join('|')}|motion|still|off]`,
    })

    // A reload or --resume keeps no theme: set it again, always still.
    const last = await $.store.get(LAST)
    if (last === 'off') return next(e)
    const theme = findTheme(last) ?? findTheme(DEFAULT_ID)!

    const unpainted = COLORS.get(theme.id)!.problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) $.ui.toast(`${theme.label}: ${unpainted}`)

    const set = await $.theme.set(look(theme, false))
    if (set.isDrawn) {
      current = theme.id
      moving = false
    } else {
      $.ui.status(set.reason)
    }
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    // Leave other mods' backdrops, and surfaces that draw none, alone.
    if (e.props.plugin !== $.plugin.name) return next(e)
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const found = readScene(e.props.scene)
    if (found === undefined) return next(e)

    const { Svg } = $.ui.resolve(e)
    // Still: drawn as an image, which costs nothing after the first draw.
    return found.motion ? (
      <Svg source={found.theme.MOTION} alt={found.theme.alt.motion} isInteractive />
    ) : (
      <Svg source={found.theme.STILL} alt={found.theme.alt.still} />
    )
  })

  on('command.run', { command: 'itihasa' }, async ($, e) => {
    const parsed = parseArgs(e.args)

    if (parsed.kind === 'list') return { text: list(current) }
    if (parsed.kind === 'unknown') return { text: `No theme or mode called "${parsed.word}".\n\n${list(current)}` }

    if (parsed.kind === 'off') {
      await $.store.set(LAST, 'off')
      current = undefined
      await $.theme.clear()
      return { text: 'Backdrop off. /itihasa <theme> brings one back.' }
    }

    // A theme named alone starts still; a mode alone keeps the current theme.
    const id = parsed.id ?? current ?? ((await $.store.get(LAST)) as string | undefined)
    const theme = findTheme(id) ?? findTheme(DEFAULT_ID)!
    const motion = parsed.motion ?? (parsed.id === undefined ? moving : false)

    const set = await $.theme.set(look(theme, motion))
    if (!set.isDrawn) return { text: set.reason }
    current = theme.id
    moving = motion
    await $.store.set(LAST, theme.id)
    return { text: `${theme.label}, ${motion ? 'moving' : 'still'}.` }
  })
}
