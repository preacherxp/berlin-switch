# Berlin switch

An interactive pixel-art Berlin day and night switch. No build step or dependencies.

[Live demo](https://preacherxp.github.io/berlin-switch/) · [60 fps MP4](berlin-day-night-60fps.mp4) · [Instagram 4:5 MP4](berlin-instagram-4x5-60fps.mp4) · [Instagram cover](berlin-instagram-cover.jpg) · Phase covers: [day](berlin-instagram-cover-1-daytime.jpg), [golden hour](berlin-instagram-cover-2-golden-hour.jpg), [signs on](berlin-instagram-cover-3-signs-coming-on.jpg), [night](berlin-instagram-cover-4-night.jpg), [dawn](berlin-instagram-cover-5-dawn.jpg), [morning](berlin-instagram-cover-6-morning.jpg)

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

The MP4 is a seven-second recording of the complete browser-rendered switch at 1600 × 1000 and 60 fps, including the moving glass lens. The Instagram MP4 is the same loop at 1080 × 1350 (4:5), its cover is a still from the night hold, and the six phase covers show the lens at rest at 12:00, 17:00, 18:45, 22:00, 06:00 and 08:30; all keep the whole switch inside the 3:4 profile-grid crop.
