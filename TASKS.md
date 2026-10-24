# Tasks

## Done

- [x] Deterministic tick simulation with per-object rewind / pause / play / fast
- [x] Single-freeze rule and rejection feedback
- [x] Gate, bridge, void, wall, anchor and pedestal tile model
- [x] Bridge/gate collapse death and drone contact death
- [x] Undo stack, restart, move counter, par
- [x] 12 handcrafted chambers with palettes, hints, unlock progression and finale
- [x] A* solver; every chamber proven solvable and impossible without time control
- [x] Isometric canvas renderer with procedural art, five palettes, depth sorting
- [x] Original effects: step ripples, collect burst, fail shatter, win rings, dust, halos
- [x] Responsive camera for phone, tablet and desktop
- [x] First-launch language screen, title, level map, how-to, settings, credits, privacy, ending
- [x] HUD: clock, par, anchors, undo, restart, pause, hint, object strip, time controls
- [x] Keyboard, swipe, tap selection, on-screen pad, gamepad
- [x] Seven complete locales, native language names and local public-domain flags
- [x] Arabic RTL via logical properties and `<html dir>`
- [x] Versioned save, rolling backup, validation, corruption recovery, reset
- [x] Settings: music, effects, reduced motion, high contrast, large targets, haptics, ghosts,
      hints, quality
- [x] Synthesized ambient score and SFX, haptics
- [x] PWA manifest, original icon, offline service worker
- [x] Unit, campaign, solver, localization and asset tests
- [x] README, architecture, plan, risks, acceptance, art bible, store copy, privacy, security,
      building, checklist, changelog, license and third-party notices
- [x] Browser verification at 950×987 and 390×844 (see RELEASE_REPORT.md)

## Done (native, 1.1.0)

- [x] Capacitor 7 Android and iOS projects, sync scripts and native build docs
- [x] Original adaptive icon, splash and iOS icon set
- [x] Android target SDK 36, version 1.0.0 (code 1), edge-to-edge
- [x] Release signing hook (`android/keystore.properties`, git-ignored)
- [x] Debug APK built, installed and played on a Pixel 8 Pro emulator
- [x] Release AAB built (unsigned until the owner provides a keystore)
- [x] Service-worker staleness fixed with a hashed cache name and network-first fetch
- [x] Mobile layout fixes: hint placement, overlay scrim, HUD spacing
- [x] Visual polish: light pools, rim light, slab shadow, glass HUD
- [x] Monetization, store-listing and human-action documentation

## Remaining (human-only)

- [ ] Create the Android signing keystore and rebuild the AAB signed
- [ ] Build and archive the iOS app on macOS (Xcode + Apple Developer Program)
- [ ] Create the Play Console and App Store Connect listings with the prepared copy and screenshots
- [ ] Decide the commercial license for store distribution (the repository license is non-commercial)
- [ ] Enable purchases (products, billing SDK, gating) per `docs/MONETIZATION.md`
- [ ] Capture store screenshots on real devices in all seven languages
- [ ] Native-speaker proofread of the seven locales (translations authored, not independently proofed)
- [ ] Full real-device playthrough of all twelve chambers on Android and iOS
- [ ] Publish repository / release artifacts under owner credentials
