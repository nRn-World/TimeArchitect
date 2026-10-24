# Architecture

## Summary

Time Architect is a dependency-free web game built from ES modules:

- **Domain**: a pure, deterministic, tick-based simulation (`src/core/`).
- **Presentation**: a procedural isometric canvas renderer (`src/render/scene.js`) plus DOM screens
  and HUD (`src/ui/screens.js`, `styles.css`).
- **Application**: a small controller (`src/game.js`) that owns the session, persistence, locale, audio,
  selection and event wiring.
- **Content**: data-only level definitions (`src/data/levels.js`) and locale dictionaries.

No framework, no bundler, no runtime package. The same files run from any static host.

## Module map

```
src/main.js            boot + service worker registration
src/game.js            session controller, screen router, HUD updates, input actions
src/core/level.js      ASCII → tiles, control map, walkability, phase windows
src/core/sim.js        state, actions, tick, collision, win, drone positions, preview
src/core/solver.js     A* solvability / par search over the simulation
src/core/save.js       versioned localStorage save + rolling backup + validation
src/core/i18n.js       locale registry, interpolation, fallbacks
src/core/audio.js      WebAudio ambient pad + synthesized effects
src/core/input.js      keyboard and gamepad bindings
src/core/math.js       clock math, easing, deterministic hash
src/render/scene.js    camera, tiles, objects, particles, hit testing
src/ui/screens.js      screen/modal/HUD markup
src/data/levels.js     campaign content
src/data/locales/*.js  complete translations
```

## Determinism

The simulation is a pure function of `(level, state, action)`:

```js
applyAction(level, state, action) -> { state, ok, events }
```

- `state` holds player position/facing, per-object `phases`, per-object `rates`, collected anchors,
  move count and terminal flags (`won`, `dead`, `failReason`).
- A **move** or **wait** advances the clock exactly one tick. Setting a rate never advances the clock.
- One object may be paused at a time; attempting a second freeze is rejected with a `singleFreeze`
  reason.
- After a successful move the player collects anchors. If all are collected the run wins immediately
  (no further tick), so a win cannot be stolen by a hazard on the same tick.
- Otherwise the tick advances every phase by its own rate (mod period) and checks:
  1. the player is standing on a controlled tile that is now closed → `fell` (bridge) or `sealed` (gate);
  2. a drone's new tile equals the player's tile → `drone`.
- Illegal moves (walls, void, closed gates, inactive bridges, drones) are rejected and change nothing.

The renderer never mutates state. `previewTick` produces a read-only prediction for the "show the
next tick" accessibility option.

## Level model

Levels are ASCII maps plus objects:

| Char | Meaning |
| --- | --- |
| `#` | wall |
| `.` | floor |
| `S` | start |
| `A` | anchor |
| `~` | void |
| `B` | bridge (must be controlled by a dial) |
| `G` | gate (must be controlled by a dial) |
| `D` | dial pedestal (blocking) |

Dials declare `period`, initial `phase`, `openWhen` (phase list) and the tiles they control.
Drones declare a looping `path`; the phase indexes into the path. `parseLevel` validates map widths,
unknown characters, duplicate object IDs, duplicate control tiles, and that bridge/gate controls match
the map. Parsed levels are frozen.

## Solver and quality gates

`src/core/solver.js` runs a weighted A* over `(position, phases, rates, collected)` with a Manhattan
heuristic toward the nearest remaining anchor. Rate edits cost 0, moves cost 1. The campaign report
and tests use the `{pause, play}` rate subset for tractability; rewind and fast-forward can only
shorten routes, never lengthen the verified ones.

`tests/levels.test.mjs` asserts for every chamber:

1. it is solvable;
2. the published par equals the found move count;
3. it is **not** solvable without time manipulation (a second search with time controls disabled).

This guarantees the campaign actually exercises the core mechanic.

## Rendering

- 2:1 isometric projection with `TW=96`, `TH=48`, wall height 66 world units.
- The camera fits the chamber into the canvas with padding, clamped to `0.34–1.5`.
- Tiles and objects are merged into one depth-sorted list by `x+y`, with objects offset half a depth.
- Art is procedural: stone gradients, brass edges, clock rings, energy bars, crystal facets, hooded
  Architect, rotating halos, ground shadows, dust motes, particles and expanding rings.
- Palettes: `ink`, `brass`, `verdant`, `ember`, `cosmic`; each chamber picks one.
- Quality tiers: `low` (no shadows/particles, DPR 1), `medium` (halved particles), `high` (all effects,
  DPR up to 2).
- Reduced motion disables ambient motion, particle spawning, camera shake and position easing.

## UI and input

`app.screen` selects the full-screen DOM screen; `app.modal` overlays pause/win/fail on top of the
HUD. Screens are pure HTML strings rebuilt on screen changes, while the HUD is updated in place with
a signature check to avoid needless reflows. A delegated click handler maps `data-action` attributes
to controller actions.

Inputs converge on the same actions: keyboard (`keydown`), pointer swipes/taps on the canvas, HUD
buttons, and gamepad polling. All mutation flows through `perform()`/`setRate()` so rules stay in one
place.

## Localization and RTL

`LOCALES` defines code, native name, flag file and direction. `makeT(code)` interpolates `{placeholders}`
with an English fallback. Switching locale updates `<html lang dir>` immediately and persists.

CSS uses logical properties (`inset-inline`, `margin-inline`, `padding-inline`) so Arabic mirrors
without a second stylesheet. Flags are local public-domain SVGs; the written language name is always
shown as well.

## Persistence

`src/core/save.js` stores one JSON document under `time-architect.save.v2` and keeps the previous
valid document under `...backup`. Loading:

1. parse and normalize the primary;
2. on failure parse and normalize the backup (`recovered: true`);
3. otherwise create defaults.

Settings are clamped and type-checked, progress maps are filtered, and `unlocked` is bounded to the
campaign length. Saves live only in `localStorage`; no data leaves the device.

## Audio

`Sound` lazily creates an `AudioContext` on the first user gesture, synthesizes a low ambient pad
(two sine drones, a triangle, a low-pass filter, slow LFO) and one-shot effects from oscillators and
generated noise. Music and effects have independent gains tied to settings.

## Offline / PWA

`manifest.webmanifest` makes the game installable. `service-worker.js` pre-caches the whole shell on
install, serves navigations and assets **network-first** with an offline cache fallback. This matters
inside the native shells: Capacitor serves the bundle from `https://localhost`, and a cache-first
worker would keep the previous release's JavaScript after an app update.

`tools/build-web.mjs` assembles `dist/` and rewrites `CACHE` to a SHA-256 prefix of the built files,
so every build invalidates old caches. Never hand-edit `dist/`.

## Native shells (Capacitor)

```
dist/  ──►  npx cap sync  ──►  android/app/src/main/assets/public/
                          └─►  ios/App/App/public/
```

- **Android**: Gradle project, application id `com.nrnworld.timearchitect`, compile/target SDK 36,
  min SDK 23, edge-to-edge. `android/app/build.gradle` reads `android/keystore.properties` for the
  release signing config; without it the AAB is unsigned. WebView debugging is off in release.
- **iOS**: Xcode project with the generated AppIcon and splash, `contentInset: never`,
  `limitsNavigationsToAppBoundDomains: true`.
- The game itself does not know it is native: no plugins, no bridge calls, no permissions beyond the
  WebView's. Anything native-specific belongs in a plugin, not in `src/core`.
- Icons and splash come from `tools/make-icons.py` (deterministic Pillow art) and are fanned out to
  all densities/stores by `@capacitor/assets`.
- Release flow and signing are documented in `BUILDING.md`; owner-only steps in `HUMAN_ACTIONS.md`.

## Testing

- `tests/core.test.mjs` — parsing, walkability, clock rates, single-freeze rule, gate/bridge death,
  drones, anchors/win, preview purity, solver sanity, state keys.
- `tests/levels.test.mjs` — campaign shape, parse integrity, solvability/par/time-necessity for all
  twelve chambers, dial pedestal placement, drone path bounds, locale key/placeholder parity, flag
  assets, level title/hint coverage.

`npm test` runs on Node's built-in test runner with no dependencies.
