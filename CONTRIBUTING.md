# Contributing

New themes are the most welcome contribution. Bug fixes, better tracing and performance work are welcome
too. This guide takes a theme from a source image to a merged pull request.

**Use whatever tools you like.** The scripts in `tools/` are helpers that made the existing themes. You
don't have to use them. What a theme has to meet is in [Requirements](#requirements). Everything else in
this guide is a suggested route.

## What fits

- Hindu iconography and sacred places: deities and their forms, scenes from the Itihasas and Puranas,
  temples, ghats and tirthas.
- Treat the subject with respect. No parody, and nothing a devotee would find degrading.
- Base the figure on an existing image you are allowed to use (see step 2). We trace ours, because
  hand-written SVG figures have looked poor every time.
- One theme per pull request.

Not sure an idea fits? Open an issue with the **Theme idea** template before you start.

## Requirements

A pull request that adds a theme must meet all of these. `claude plugin test plugins/itihasa` checks the
ones marked ✓.

**The scene**

- ✓ Each SVG (still and motion) is under **131,072 characters** (128 KiB). Claude Code refuses anything
  larger.
- ✓ Self-contained: no `<script>`, `<image>`, `<foreignObject>` or external URLs. CSS animation only.
- ✓ The still version has no `animation` or `@keyframes` at all.
- ✓ The motion version stops under `prefers-reduced-motion`.
- The figure stays whole and readable from a wide desktop window down to a phone-sized one.

**The plugin**

- The theme is a module in `plugins/itihasa/hooks/scenes/<id>.js` that exports a `THEME`, with a `.d.ts`
  next to it, and is added to `THEMES` in [`themes.js`](plugins/itihasa/hooks/themes.js). See step 4 for
  the fields.
- ✓ The palette passes `makeColors` with no problem starting `Desktop won't paint`, and `tint` equals its
  `surface-0`.
- `claude plugin validate plugins/itihasa` and `claude plugin test plugins/itihasa` pass.

**Performance**

- The motion version adds no more than about **10 points** of whole-GPU use over the backdrop being off, in
  the desktop app. Put your numbers in the pull request.

**Attribution**

- The source image is public domain, CC0, CC BY or your own photo, and is credited in `CREDITS.md` (step 6).

### Performance guidelines

These are how the existing themes stay inside the GPU budget. Break one if you can show your numbers are
still within budget.

- Animate in `steps()` at 10 fps or less, with every layer on the same ticks. No independent twinkle timers.
- Move a few small elements (embers, diyas, stars), not the figure. Prefer `<circle>` and simple paths over
  text and filters.
- Don't use `@media` aspect-ratio rules that swap copies with `display:none`. They froze all motion in the
  desktop app once.
- Keep the panel glass a flat tint, not blur. Blur over a moving picture is redone on every frame.

## 1. Set up

You need macOS with the Claude desktop app (Claude Code 2.1.324 or later; check with `claude --version`).
Node.js 20 or later runs the helper scripts.

Fork the repo on GitHub, then clone your fork and install the plugin from it:

```bash
git clone https://github.com/<you>/itihasa-claude-themes.git
```

```bash
cd itihasa-claude-themes && git checkout -b theme/<id>
```

```bash
claude plugin marketplace add "$PWD"
```

```bash
claude plugin install itihasa@itihasa-claude-themes
```

Claude Code now reads the plugin from your folder. After each edit, run `/reload-plugins` in the app.

## 2. Find a source image you may use

This step decides whether the theme can be merged at all.

**Good sources:** public-domain paintings and prints, museum open-access images released as CC0 (the Met,
the Cleveland Museum of Art, the Art Institute of Chicago, the Rijksmuseum), Wikimedia Commons files marked
public domain, CC BY images (you must carry their credit line), or a photograph you took yourself.

**Not allowed:** images from search results, shopping listings, wallpaper sites, stock photos, screenshots
of films or TV, AI-generated images, and photos of modern statues or artworks whose maker hasn't released
them. A statue being old doesn't make a recent photo of it free: check the photo's licence.

Pick a high-resolution image with a clear subject on a plain or contrasting background. Bronzes on grey and
ink on paper trace best.

Save it in `sources/<id>/` with a descriptive file name, for example
`sources/kaliya/met-12345-krishna-kaliya.jpg`. `<id>` is the lowercase name people will type after
`/itihasa`.

## 3. Turn it into SVG paths

Any tracer works: Inkscape's **Trace Bitmap**, potrace on its own, Illustrator's Image Trace, or your own
pipeline. Aim for a few flat layers (a silhouette plus one or two lighter tones) rather than many small
shapes, and keep an eye on the character count.

**Helper:** [`tools/trace-art.mjs`](tools/trace-art.mjs) does the whole pass from a JSON config. It needs
[ImageMagick](https://imagemagick.org/) and [potrace](https://potrace.sourceforge.net/)
(`brew install imagemagick potrace`). Start from `sources/nataraja/trace.json` (bronze on grey) or
`sources/varanasi/ghats.json` (ink and wash on paper); the comment at the top of the script documents every
field.

```bash
node tools/trace-art.mjs sources/<id>/trace.json
```

It writes `plugins/itihasa/hooks/scenes/art/<id>.js` and its `.d.ts`, with the `credit` line in the header,
and puts intermediate images in `work/<id>/` (git-ignored) for tuning. Lower `height`, higher `turdsize` and
`unit: 2` make the output smaller.

If you trace another way, commit the paths in whatever shape suits your scene, and note how you made them
in your pull request.

## 4. Write the scene

A scene module exports one `THEME`:

| Field | What it is |
|---|---|
| `id`, `aliases` | The name typed after `/itihasa`, and other words that pick it |
| `label`, `story` | Display name and the one line shown in `/itihasa` |
| `palette` | Input to `makeColors`: dark-only, with `surface-0..3` and text anchors and accent roles taken from your art |
| `tint` | The panel tint; must equal the palette's `surface-0` |
| `alt` | Screen-reader descriptions of the still and motion versions |
| `STILL`, `MOTION` | The two SVG strings |

The quickest start is to copy the closest existing scene, for example `scenes/varanasi.js` and its `.d.ts`,
then import your `THEME` in [`themes.js`](plugins/itihasa/hooks/themes.js) and append it to `THEMES`.

**Helper:** `plugins/itihasa/hooks/kit.js` has small functions the existing scenes share: `doc()` builds the
document and adds the reduced-motion rule, `stepped()` and `jumps()` keep animations on one 5 fps clock,
and `pin()` and `fill()` place layers without aspect-ratio media queries. Use them or write your own SVG.

## 5. Test it

**Required:**

```bash
claude plugin validate plugins/itihasa
```

```bash
claude plugin test plugins/itihasa
```

Then try it in the app: run `/reload-plugins`, `/itihasa <id>` and `/itihasa motion`. Check that the motion
actually moves in the app (not just in a browser), that chat text stays readable over the art, and that
`/itihasa still` and `/itihasa off` work.

Measure the GPU with the backdrop off and then with your theme in motion. Close video, games and other heavy
windows first. Activity Monitor's GPU History (Window → GPU History) works.

**Helpers:**

- `node tools/render-scenes.mjs` writes every theme's SVGs to `tools/preview/` and prints their sizes, so
  you can open them in a browser and resize the window from wide to phone-narrow.
- `tools/shoot.sh tools/preview/<id>-still.svg 1400 800 panels` screenshots a scene with stand-in chat
  panels on top (needs Google Chrome). Use `390 844` for a phone.
- `tools/sample-gpu.sh 30 off`, then `tools/sample-gpu.sh 30 motion`, samples whole-GPU use once a second
  and prints the mean, ready to paste into your pull request.

## 6. Add the attribution

A theme is not merged without these:

1. **`CREDITS.md`:** a new section from the template at the bottom of that file: source, licence, link to the
   page that states the licence, what you changed, and your name.
2. **The art file's header:** a comment naming the source and licence (the trace helper writes this from
   `credit`).
3. **`README.md`:** one row in the Themes table: copy an existing `<tr>`, point it at your screenshot, and
   keep the description and the motion line to one sentence each.

Add a screenshot of the theme in the desktop app to `docs/screenshots/<id>.jpg`: the app window only (no
menu bar or desktop), about 1800 px wide, JPEG under 300 KB.

## 7. Open a pull request

```bash
git add sources/<id> plugins/itihasa CREDITS.md README.md docs/screenshots/<id>.jpg
```

```bash
git commit -m "Add the <Label> theme, traced from <source>"
```

```bash
git push -u origin theme/<id>
```

Open a pull request against `main`. The template asks for screenshots at window and phone size, your GPU
numbers, the source's licence link, and your OS, chip and app version. Review checks the licence first, then
looks, then performance.

## Bugs and other changes

Report bugs with the **Bug report** issue template. For a fix, keep the pull request small, describe what
was broken and how you checked the fix, and run the tests above.

By contributing, you agree that your code is released under the MIT licence and that you have the right to
use the source image under the licence you state in `CREDITS.md`.
