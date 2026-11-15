import type { makeColors } from './make-colors.js'

export type Palette = Parameters<typeof makeColors>[0]

/** One theme: its palette, its two scenes, and the words that name it. */
export type Theme = {
  /** The name typed after /itihasa, and the scene-name prefix. */
  id: string
  /** Other words that pick it (/itihasa shiva). */
  aliases: string[]
  label: string
  /** One line for the list. */
  story: string
  palette: Palette
  /** The glass tint over panels: the palette's surface-0. */
  tint: string
  alt: { still: string; motion: string }
  STILL: string
  MOTION: string
}

export const THEMES: Theme[]
export const DEFAULT_ID: string

export type Parsed =
  | { kind: 'list' }
  | { kind: 'off' }
  | { kind: 'show'; id?: string; motion?: boolean }
  | { kind: 'unknown'; word: string }

/** Reads what follows /itihasa. */
export function parseArgs(args: string): Parsed
/** The theme with this id, or undefined. */
export function findTheme(id: unknown): Theme | undefined
/** The backdrop scene name for a theme in one mode. */
export function sceneName(id: string, motion: boolean): string
/** Splits a scene name back into theme and mode, or undefined if it is not ours. */
export function readScene(scene: string): { theme: Theme; motion: boolean } | undefined
