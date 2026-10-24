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
| Android Gradle Plugin / Gradle | 8.7.2 / 8.11.1 |
| JDK used for Gradle | 21.0.10 (Android Studio JBR) |
| Android SDK | compile/target 36, min 23, build-tools 36.0.0 |
| Emulator | Pixel 8 Pro, API 35, 1344×2992 |
| Node.js | v24.14.1 |
| Save schema | 2 |
| Service worker | network-first, cache name hashed per build (last: `time-architect-d1fa1054ef6e`) |
| APK / AAB size | 7.4 MB debug / 5.5 MB release (unsigned) |
| Final dist fingerprint | `time-architect-f7c7a4467c42` |

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
  chamber.
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

## Repository

The project lives inside a larger local folder that is not a dedicated Git repository, so nothing was
committed or pushed. No keystore, store credentials, ad IDs or analytics keys exist in the tree;
`dist/`, `android/app/build/`, `android/local.properties`, `ios/App/Pods` and `*.keystore` are
git-ignored for the day this becomes its own repository.

## Known limitations

- Par values are optimal for the pause/play subset; rewind/fast-forward can beat par and the UI simply
  reports a better result.
- The generated icon uses a raster emblem; for a future brand pass, export the same design from a
  vector master at 4096².
- The game is fully playable offline, but the web build still requires HTTPS for the service worker.
