# Berlin switch

An interactive pixel-art Berlin day and night switch. No build step or dependencies.

[Live demo](https://preacherxp.github.io/berlin-switch/)

Drag to move through the hours. Tap or press Space to toggle. Use the arrow keys to step through time.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000.

## Use the switch

Copy `city-switch.js` and `berlin.js` into your site, then include:

```html
<script src="city-switch.js"></script>
<script src="berlin.js"></script>
<berlin-switch style="display: block; width: min(680px, 100%);"></berlin-switch>
```

The element exposes `checked`, `position`, and `jump(night)`. Listen for `change` events (`detail.night`) and `scrub` events (`detail.position`, `detail.hour`, `detail.dark`).

## Publishing

GitHub Pages serves the root of the `main` branch. Push changes to `main` to update the demo.

## Attribution

The engine is derived from `tokyo-switch.js`; the original idea is “住人のいるスイッチ” by @Lattice_Node ([original project](https://ludion.ai/p/toggle-daylight), MIT), as credited in the engine source.
