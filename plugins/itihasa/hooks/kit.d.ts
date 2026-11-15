/** Ticks per second for every moving layer. */
export const FPS: number
/** Rounds to one decimal and drops a trailing ".0". */
export function r1(n: number): string
/** A small deterministic random. */
export function seeded(seed: number): () => number
/** The CSS `animation` value for one stepped loop on the shared clock. */
export function stepped(name: string, seconds: number): string
/** The CSS `animation` value for a loop that jumps between keyframes, holding each. */
export function jumps(name: string, seconds: number): string
/** A path through points. */
export function poly(points: Array<[number, number]>, close?: boolean): string
/** Points along a Catmull-Rom curve through `points`. */
export function spline(points: Array<[number, number]>, n?: number): Array<[number, number]>
/** A tapering tube along a curve: outline, centre line, and rungs across it. */
export function tube(
  points: Array<[number, number]>,
  w0: number,
  w1: number,
  opts?: { n?: number; every?: number },
): { outline: string; center: string; rungs: string }
/** The whole SVG document; motionCss only goes into the motion version. */
export function doc(parts: { motion: boolean; css?: string; motionCss?: string; defs?: string; body: string }): string
/** A full-window layer, cropped so it always fills. */
export function fill(w: number, h: number, inner: string): string
/** A subject pinned inside a box of the window. */
export function pin(
  box: { x?: string; y?: string; width?: string; height?: string; w: number; h: number; align?: string; cls?: string },
  inner: string,
): string
