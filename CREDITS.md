# Credits

Every theme's figure is traced from an existing image. This file records where each image came from, its
licence, and what was changed. A theme without an entry here is not merged.

The code in this repository is MIT ([LICENSE](LICENSE)). The licence of each traced image is listed below
and applies to the art in that theme.

## Nataraja

- **Source:** *Shiva as Lord of Dance (Nataraja)*, Chola period, ca. late 11th century, copper alloy.
  The Metropolitan Museum of Art, 1987.80.1, Gift of R. H. Ellsworth Ltd., in honor of Susan Dillon, 1987.
- **Licence:** CC0, under the Met's Open Access policy.
- **Link:** <https://www.metmuseum.org/art/collection/search/39328>
- **Changes:** cut from its background, traced into three tone layers, recoloured, with a ring of fire and
  embers added.
- **Files:** `sources/nataraja/`, `plugins/itihasa/hooks/scenes/nataraja.js`
- **Added by:** Gautham

## Varanasi

- **Source:** Edward Lear, *Benares*, 14 December 1873, watercolour and ink.
- **Licence:** Public domain, via the Google Art Project.
- **Link:** <https://commons.wikimedia.org/wiki/File:Edward_Lear_-_Benares_-_Google_Art_Project.jpg>
- **Changes:** cropped, mirrored left to right, traced into four layers (silhouette, washes, red spires, pen
  lines), recoloured as gold on dusk, with a sky, river reflection and diyas added.
- **Files:** `sources/varanasi/`, `plugins/itihasa/hooks/scenes/varanasi.js`
- **Added by:** Gautham

## Adiyogi

- **Source:** a photograph of an Adiyogi bust.
- **Licence:** not confirmed. This is not a public-domain source.
- **Changes:** cut from its background, traced into tone layers with the moon and tilak as separate parts,
  recoloured, with a night sky added.
- **Files:** `sources/adiyogi/`, `plugins/itihasa/hooks/scenes/adiyogi.js`
- **Added by:** Gautham

## Template for a new theme

Copy this, fill in every line, and keep entries in the order themes were added.

```markdown
## <Theme label>

- **Source:** <artist or maker>, *<title>*, <date>, <medium>. <Museum or collection>, <accession number>.
- **Licence:** <Public domain | CC0 | CC BY 4.0 (credit line: ...) | your own photo, released under ...>
- **Link:** <URL of the page that states the licence, not just the image file>
- **Changes:** <cropped, mirrored, traced into N layers, recoloured, what you added>
- **Files:** `sources/<id>/`, `plugins/itihasa/hooks/scenes/<id>.js`
- **Added by:** <your name or GitHub handle>
```
