# Changelog

## 1.1.0 — 2026-10-24

Native release: the same campaign, now packaged for Android and iOS.

### Native shells
- Capacitor 7 Android and iOS projects with application id `com.nrnworld.timearchitect`.
- Original adaptive icon, round icon, monochrome-safe splash and iOS AppIcon set, generated from
  `tools/make-icons.py` and applied with `@capacitor/assets`.
- Android: compile/target SDK 36, min SDK 23, edge-to-edge, release signing hook via a git-ignored
  `android/keystore.properties`; unsigned AAB builds are refused at upload by design.
- `tools/build-web.mjs` assembles `dist/`, fingerprints the service-worker cache name and is wired
  into `npm run native:sync`.
- `npm run android:debug`, `android:bundle`, `ios:sync` and `ios:open` documented in `BUILDING.md`.

### Fixed
- **Android back button crashed the UI.** `App.addListener()` returns a handle, not a promise; calling
  `.catch()` on it threw during boot and left the game without its HUD. Back now pauses, closes a
  dialog, or leaves the menu, and never drops the player out of a run.
- Haptics did nothing on Android because the VIBRATE permission was missing.
- The object strip lost its scroll position when selecting a mechanism on a chamber with more than
  three clocks, hiding the chip the player just picked.
- Dialog overlays rendered as a black wall on Android; the chamber now stays visible behind them.
- The previous release could be served from the WebView cache on the first launch after an update.
  The service worker is now network-first with an offline fallback and a per-build cache name.
- The hint card overlapped the object strip and time controls on tall phones; it now sits under the
  stat bar.
- Menus fought with the live chamber for attention; overlay screens now dim and blur the scene.
- Gradle failed on JDK 25; the required JDK 17–21 is detected and documented.

### Responsive and launch fixes
- Desktop camera no longer clips the chamber walls; the board is framed with breathing room at
  1280×820 and 1024×768.
- Phones at 320–420 px get a labelled 2×2 time cluster so rewind, pause, play and fast-forward all
  stay on screen; movement targets are 44 px tall.
- Arabic keeps the physical pad and time order (left/right, rewind → fast) instead of mirroring them.
- Short landscape viewports dock the hint as a compact side card instead of covering the board.
- Styled thin scrollbars replace the default white browser bar in menus and the chamber map.
- A branded boot layer plus Android 12 splash theme remove the black frame between launch and title.
- Desktop players see a compact keyboard legend in the HUD.

### Visual polish
- Official nRnWorld studio mark on the credits screen.
- A hand-drawn inline SVG icon set replaces every text glyph in the HUD (undo, restart, hint, pause,
  rewind, play, fast, arrows, dial, drone, lock).
- Installable PWA icon set at 192/512 px plus a 180 px Apple touch icon.
- Floor light pools around live anchors, dials and drones.
- Brass rim light on wall edges and a soft slab shadow under the chamber.
- Glassier HUD chips, a hairline under the top bar and deeper control shadows.
- Ambient clockwork halo and rings behind the title, and a matching boot screen using the app icon.

## 1.0.0 — 2026-10-24

First complete release of the web/PWA edition.

### Campaign
- Twelve handcrafted chambers with a tutorial curve, escalating clockwork and a finale.
- Five palettes, per-chamber hints, par targets, unlock progression and an ending.
- Solver-proven solvability and time-control necessity for every chamber.

### Mechanics
- Per-object rewind, pause, play and fast-forward.
- Single-freeze rule with clear feedback.
- Chrono gates and bridges that unmake the Architect when they close underfoot.
- Patrolling drones that block tiles and kill on contact.
- Free undo, instant restart, tick counter and par.

### Presentation
- Original isometric canvas renderer: stone chambers, brass clockwork, cyan chrono light.
- Particle and ring effects, ground shadows, dust, halos, animated dials.
- Responsive camera for phone, tablet and desktop; quality tiers and reduced motion.

### Shell
- First-launch language screen and in-game language settings.
- Title, chamber map, how-to, settings, credits, privacy, pause, failure, completion and ending.
- HUD with object strip, phase readout, rate controls and optional next-tick ghosts.

### Systems
- Seven complete locales (English, Swedish, Turkish, Spanish, Arabic RTL, French, Japanese) with
  local public-domain flags.
- Versioned save with rolling backup, validation and recovery; reset progress.
- Synthesized ambient score and effects; haptics.
- Keyboard, pointer swipe/tap, on-screen pad and gamepad input.
- PWA manifest, original icon and offline service worker.

### Quality
- 18 automated tests covering simulation, campaign, solver, localization and assets.
- No runtime dependencies, no analytics, no ads, no accounts.
