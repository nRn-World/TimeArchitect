# Release report — Time Architect 1.1.0

Date: 2026-10-24
Studio: nRnWorld <bynrnworld@gmail.com>
Delivered: web/PWA, Android app (debug APK + release AAB), iOS project
SPDX: `LicenseRef-nRnWorld-Educational-1.0`

## Versions and toolchain

| Item | Version |
| --- | --- |
| Game | 1.1.0 (versionCode 2) |
| Application ID | `com.nrnworld.timearchitect` |
| Capacitor | 7.6.9 (core, cli, android, ios) |
| Capacitor Splash Screen | 7.0.5 |
| Android Gradle Plugin / Gradle | 8.7.2 / 8.11.1 |
| JDK used for Gradle | 21.0.10 (Android Studio JBR) |
| Android SDK | compile/target 36, min 23, build-tools 36.0.0 |
| Emulator | Pixel 8 Pro, API 35, 1344×2992 |
| Node.js | v24.14.1 |
| Save schema | 2 |
| Service worker | network-first, cache name hashed per build (last: `time-architect-c43ab7f587d7`) |
| APK / AAB size | 7.9 MB debug / 5.7 MB release (unsigned) |
| Final dist fingerprint | `time-architect-c43ab7f587d7` |

## Commands executed (final state)

```bash
npm test                                   # 20 tests
node tools/make-icons.py                   # icon + splash
npx @capacitor/assets generate --android --ios   # 87 Android + 10 iOS assets
npm run build:web                          # dist/, 37 files, 941 KiB
npx cap sync android && npx cap sync ios
cd android && ./gradlew assembleDebug bundleRelease
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.nrnworld.timearchitect/.MainActivity
```

`npm test`: **20 tests, 20 pass, 0 fail** (12.9 s), including solver proof for all twelve chambers.
The full campaign was also replayed in Chromium through `tools/route.mjs`: chamber 1 at par (11) and
the finale at par (21), including the ending screen.

## What was verified on Android

- Fresh install (`adb install -r`) and cold start reach the language screen in the WebView; all seven
  locales and their flag assets load from the APK (Capacitor logs each local asset request).
- Language selection persists; the title screen shows *Begin a new journey*, *Enter the chambers*,
  *How to play*, *Settings*, *Credits*, *Privacy* and the studio credit.
- Chamber 1 loads with the HUD, chamber title, ticks, par, anchor counter, object chip and time
  controls. The scene renders the bridge, dial, drone, walls and the Architect's glow.
- Selecting the Chrono dial by tapping its chip changes its state to **Rewind · 3/4** and highlights
  the matching rate button; tapping the rate button changes it to **Play · 1/4**.
- On-screen pad movement advances ticks (observed 0 → 2), moves the Architect and advances the
  bridge phase.
- Layout at 1344×2992: hint card sits under the stat bar, object chip and rate controls are visible
  and do not overlap; there is no horizontal overflow. A scrim + blur separates menus from the
  chamber. On compact widths the time controls form a labelled 2×2 cluster so all four actions stay
  on screen; the physical pad keeps 44 px targets.
- Cold start: Android 12 system splash is on-brand, then the web boot layer holds the brand until the
  title screen is painted. The former black frame between splash and game is gone (checked at 1 s,
  3 s and 5 s after a cold start).
- Adaptive icon and splash were generated from original art (`assets/icon.png`,
  `assets/splash.png`); no stock or third-party artwork is used.
- `aapt dump badging` confirms package `com.nrnworld.timearchitect`, version 1.1.0 (2), target SDK 36,
  min SDK 23, only `INTERNET` permission.

## Bugs found while playing the native build

1. **Back button blanked the game.** `nativeApp.addListener(...).catch` threw at boot because
   Capacitor 7 returns a listener handle. The language screen never rendered and the app showed only
   the chamber. Fixed with a synchronous handle plus a guarded call; back now pauses, closes dialogs
   and returns to the menu.
2. **Haptics were dead on Android** — `android.permission.VIBRATE` was missing.
3. **The object strip reset to the first chip** whenever a mechanism was selected, and four chips
   overflowed 366 px without an affordance. Scroll position is preserved, the selected chip is
   scrolled into view, and the strip has snap points and edge fades.
4. **Dialog overlays turned the chamber black** on the WebView. Modal scrims are now a single layer
   and the scene stays visible.
5. All HUD glyphs were replaced with an SVG icon set, and the official nRnWorld mark now appears in
   Credits.

## What was fixed during native verification

1. **Menu legibility** — the live chamber showed through the language and title screens. Added a
   dark scrim with backdrop blur whenever an overlay screen is open, both in the native app and web.
2. **Hint overlap** — the hint card covered the object chips on tall phones. Moved it under the stat
   bar; the control deck is now always visible.
3. **Stale build after update** — the WebView's service worker served the previous release's JS/CSS
   on the first launch after an APK update. The build now rewrites the cache name to a content hash
   and the worker is network-first with an offline fallback.
4. **JDK 25 / Gradle incompatibility** — Gradle 8.11 fails with `Unsupported class file major
   version 69`. Documented and used JDK 21 (Android Studio JBR).
5. **Play target SDK** — moved compile/target from 35 to 36 for the current submission requirement.
6. **Release signing hook** — `android/app/build.gradle` reads `android/keystore.properties`
   (git-ignored) and builds an unsigned AAB when it is absent, so a missing key fails at upload
   instead of silently using a debug key.

## Quality pass after the first device review

The first native round looked right on a phone but did not hold up on every screen. These issues were
found by playing the production build at 320×568, 390×844, 844×390, 900×600, 1024×768 and 1280×820:

1. **Desktop camera cropped the chamber.** At 1280×820 the outermost walls ran off both sides and the
   board sat under the HUD. The camera now reserves the real wall thickness, keeps a tighter 18 px
   frame on phones, and caps the diorama scale at 1.05 so it reads as a framed tabletop on desktop.
2. **Small phones lost the fast-forward button.** A 3-wide pad plus four 52 px time buttons needed more
   width than a 320 px screen had. Below 420 px the time controls become a labelled 2×2 cluster; every
   control stays inside the screen at 320×568, and the pad rows are 44 px tall.
3. **RTL mirrored the physical pad.** The left arrow appeared on the right in Arabic. Pad and time
   controls now keep rewind → fast-forward and left/right in physical order, while the surrounding UI
   remains RTL.
4. **The hint card covered the play area in landscape.** Under 620 px of height it docks as a compact
   card on the inline-start side instead of spanning the board.
5. **Cold start showed a black frame.** A hash-stable boot layer now paints immediately and holds the
   wordmark until the first screen is laid out; Android 12+ gets an explicit dark splash theme and the
   Capacitor splash plugin holds it across the WebView boot.
6. **Default browser scrollbars broke the mood.** Menu and map scrolling now uses a thin brass thumb.
7. **Desktop players had no visible control legend.** A compact keyboard line sits between the object
   strip and the time controls on mouse/trackpad layouts.

The title screen also gained an ambient clockwork halo and rings so it no longer reads as an empty
black page. The boot mark is the same studio-produced app icon, not a stock asset.

## Web/PWA verification (earlier, still valid)

- Desktop 950×987 and phone 390×844, Chromium: first launch, language switch, chamber 1 solved at par
  (11), chamber 2 failure/undo, chamber 3 freeze conflict and drone death, pause/settings round-trip,
  Arabic RTL, Japanese HUD, corrupted-save recovery.
- Service worker active, shell precached; no console errors.

## Not delivered or not verified

| Item | Status |
| --- | --- |
| iOS build / TestFlight | **Not built** — requires macOS + Xcode; project and assets are prepared |
| Real-device testing | Not done; verification used a Pixel 8 Pro emulator |
| Signed AAB | **Unsigned** — needs the owner's keystore |
| Play Console / App Store Connect listings | Not created; copy and checklist provided |
| In-app purchases / paywall | Designed only; the shipped build is fully unlocked, no billing SDK |
| Ads / UMP consent | Intentionally absent; ad-free build |
| Store screenshots in all seven locales | Emulator captures exist for English; the rest need a real device |
| Native-speaker proofread | Not done; translations were authored for this build |
| Screen-reader audit | Semantic labels exist; no assistive-technology pass was run |
| Offline-with-network-disabled proof | Service worker is precached, but the network was not physically disabled during capture |
| Hub cover / store feature graphic | Hub cover generated from the game's own art; no 1024×500 store feature graphic yet |

## Repository and publishing

- Repository: <https://github.com/nRn-World/TimeArchitect> (`main`, release commit `bfab2f5`).
- Playable build: <https://nrnworld.one/TimeArchitect/> (GitHub Pages from `main`).
- Hub project page: <https://nrnworld.one/p/timearchitect/> with cover art, gallery, specs and
  download links; listed in the hub's sitemap, RSS feed and JSON-LD.
- Post-publish smoke test: production title screen, English locale, chamber 1 load, dial selection,
  pause (rate `0`) and an empty browser console were verified in Chromium at 390×844.

No keystore, store credentials, ad IDs or analytics keys exist in the tree; `dist/`,
`android/app/build/`, `android/local.properties`, `ios/App/Pods` and `*.keystore` are git-ignored.

## Known limitations

- Par values are optimal for the pause/play subset; rewind/fast-forward can beat par and the UI simply
  reports a better result.
- The generated icon uses a raster emblem; for a future brand pass, export the same design from a
  vector master at 4096².
- The game is fully playable offline, but the web build still requires HTTPS for the service worker.
