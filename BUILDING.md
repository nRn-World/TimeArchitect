# Building and running

Time Architect ships two ways from one codebase:

- **Web / PWA** — the repository root is a complete static site. No build step, no dependencies.
- **Native shells** — Capacitor 7 wraps the same build into an Android app (`android/`) and an iOS
  app (`ios/`). `tools/build-web.mjs` assembles `dist/` (only runtime files, with a content-hashed
  service-worker cache name) and commits nothing.

## Requirements

| Task | Requirement |
| --- | --- |
| Web | Node.js 20+ (verified on Node 24.14.1) |
| Icons | Python 3.10+ with Pillow (`pip install pillow`) — only to regenerate art |
| Android | JDK **17–21** (verified on Android Studio JBR 21), Android SDK with platforms 36 and build-tools 36 |
| iOS | macOS with Xcode 15+, CocoaPods, an Apple Developer account |

> Gradle 8.11 does not support JDK 25. On a machine with several JDKs, point `JAVA_HOME` at a JDK 21
> before running Gradle: `export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"`.

## Web

```bash
npm run dev          # http://127.0.0.1:4173
npm test             # unit + campaign + solver + localization (20 tests)
npm run solve        # campaign report: par, solvability, time-control necessity
```

`npm run dev` binds to loopback. Override with `PORT` / `HOST`.

Any static host works (Cloudflare Pages, Netlify, S3 + CDN, nginx). Serve `index.html`, `src/`,
`assets/`, `styles.css`, `manifest.webmanifest`, `service-worker.js` over HTTPS.

## Android

```bash
npm install                     # once; installs Capacitor
npm run native:sync             # build dist/ and copy it into both native projects
npm run android:debug           # debug APK
npm run android:bundle          # release AAB (signed if keystore.properties exists)
```

Outputs:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

Install and inspect on a device or emulator:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.nrnworld.timearchitect/.MainActivity
adb logcat | grep -i capacitor
```

Configuration:

- Application ID `com.nrnworld.timearchitect`, minSdk 23, compile/target SDK 36, version 1.1.0 (code 2).
- The WebView loads from `https://localhost` via Capacitor's asset handler. There is no dev server
  and **no network request** during play; the INTERNET permission exists because Capacitor's scheme
  handler requires it.
- `capacitor.config.json` sets the background colour, disables mixed content and debugging in
  release. Enable `webContentsDebuggingEnabled` only in a local debug variant.
- `@capacitor/app` (7.x) supplies the Android back-button listener. Back closes a dialog, pauses a
  running chamber, or leaves a menu; at the title it minimises instead of killing the app.
- The manifest requests `VIBRATE` so the haptics setting works in the WebView, and nothing else.
- The app is edge-to-edge; safe-area insets are respected by the UI.

### Release signing (owner-only)

1. Create a keystore **outside the repository**:
   ```bash
   keytool -genkeypair -v -keystore ~/keys/time-architect.jks -alias timearchitect \
     -keyalg RSA -keysize 4096 -validity 10000
   ```
2. Create `android/keystore.properties` (git-ignored):
   ```properties
   storeFile=/absolute/path/time-architect.jks
   storePassword=…
   keyAlias=timearchitect
   keyPassword=…
   ```
3. `npm run android:bundle`. Without the file the AAB builds unsigned, which Play Console rejects —
   that is intentional, so a missing key fails at upload rather than silently shipping a debug key.
4. Back up the keystore and passwords. Losing them prevents updates to the same listing.

Bump `versionCode` (integer, always increasing) and `versionName` in `android/app/build.gradle`
for every upload.

### Icons and splash

```bash
python tools/make-icons.py      # assets/icon.png (1024²), assets/splash.png (2732²)
npx @capacitor/assets generate --android --ios \
  --iconBackgroundColor "#071018" --splashBackgroundColor "#05080e"
```

The generator is deterministic Pillow code: brass bezel, frozen pointer, cyan core. Keep the
`android/app/src/main/res/mipmap-*` and iOS `AppIcon.appiconset` in sync by re-running both commands.

## iOS

```bash
npm install
npm run ios:sync                # build dist/ and copy into ios/App/App/public
npm run ios:open                # opens Xcode
```

In Xcode: select the `App` scheme and a simulator or device, set a development team, then build.
CocoaPods must be installed (`sudo gem install cocoapods` or `brew install cocoapods`); the
`Podfile` is checked in and `npx cap sync ios` installs pods. A Mac is required — this repository
was prepared but **not built for iOS** in the current environment (Windows).

Set `CFBundleDisplayName` = `Time Architect`, bundle id `com.nrnworld.timearchitect`, version 1.0.0
(build 1), and an App Store icon without transparency (already generated).

## Cache busting

`tools/build-web.mjs` rewrites the service-worker cache name to a hash of the built files on every
run. The service worker is network-first, so an app update shows the new build immediately instead of
serving the previous release from the WebView cache. Do not hand-edit `dist/`.

If you change anything in the runtime, run `npm run native:sync` before building the app; the native
projects contain a copy of `dist/`.

## Tests and QA

See `RELEASE_CHECKLIST.md`. Minimum gate before a store upload:

```bash
npm test
npm run solve
npm run native:sync && npm run android:debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk   # fresh install
adb shell pm clear com.nrnworld.timearchitect                      # then relaunch
```

## Project conventions

- ES modules, no bundler, no transpilation.
- Pure domain code in `src/core`; no DOM access there.
- All user-facing strings live in `src/data/locales/*.js`.
- New levels go in `src/data/levels.js` and must pass the solver tests (solvable, par matches, and
  not solvable without time control).
- New locales need a dictionary with the exact English key set, a flag in `assets/flags/`, a
  `LOCALES` entry and a `DICTS` import.
