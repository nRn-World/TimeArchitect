# Release checklist

## Code and content

- [x] `npm test` passes (20/20: simulation, campaign, solver, localization, assets)
- [x] `node tools/solve.mjs` proves all 12 chambers solvable at par and impossible without time control
- [x] No TODO/FIXME or placeholder screens in shipped code
- [x] No secrets, keys, tokens or store credentials in the tree
- [x] No analytics, ads, trackers or remote calls in the runtime
- [x] Save schema versioned with backup, validation and recovery (tested with a corrupted save)
- [x] Service-worker cache name is content-hashed at build time (never hand-edited)
- [x] Manifest name, icons, theme and start URL correct

## Localization

- [x] Seven locales with identical key sets and placeholder consistency
- [x] Level titles, subtitles and hints translated
- [x] Arabic `dir=rtl`, logical layout and mirrored controls verified
- [x] Flags stored locally, unmodified, credited in THIRD_PARTY_NOTICES
- [ ] Native-speaker proofread (human)
- [ ] Store listing copy proofread per locale (human)

## Accessibility

- [x] Reduced motion, high contrast, larger targets, haptics, hint toggle, next-tick ghosts
- [x] Colour-independent signals and labelled controls
- [x] Keyboard and gamepad paths; on-screen pad for touch
- [x] Focus outlines, semantic buttons, slider roles, safe-area insets
- [ ] Screen-reader pass on VoiceOver/TalkBack (human)
- [ ] 200% OS font scaling on real devices (human)

## Web build

- [x] First launch, language screen, title, map, how-to, settings, credits, privacy
- [x] Chambers 1–3 played end to end: win at par, gate death + undo, drone death, freeze conflict
- [x] Pause → settings → back keeps state; Arabic and Japanese layouts verified
- [x] No console errors; service worker active and shell precached
- [x] Desktop 950×987 and phone 390×844 without overflow

## Android

- [x] `npm run build:web` → `cap sync android` → `gradlew assembleDebug` succeeds
- [x] `aapt dump badging`: `com.nrnworld.timearchitect`, 1.1.0 (2), target 36, min 23
- [x] Fresh install and cold start on Pixel 8 Pro (API 35) emulator
- [x] Language screen, title, chamber 1, object selection, rate change and pad movement verified
- [x] Adaptive icon + splash generated from original art and packaged
- [x] Overlay scrim and hint placement verified on a tall phone
- [x] Release AAB builds (`bundleRelease`)
- [ ] Release AAB **signed** with the owner's keystore
- [ ] Real mid-range device test (thermals, battery, 60 fps)
- [ ] Full 12-chamber playthrough on device
- [ ] TalkBack pass and font scaling

## iOS

- [x] Capacitor iOS project, AppIcon set and splash generated
- [x] `npm run ios:sync` copies the current build
- [ ] CocoaPods install and Xcode archive (macOS required)
- [ ] TestFlight on a physical iPhone and iPad
- [ ] App Store Connect metadata, privacy answers, screenshots

## Store submission (owner)

- [ ] Signed AAB uploaded to Play Console, internal testing install verified
- [ ] Data safety: no data collected; ads: no; content rating: Everyone / PEGI 3
- [ ] Store listing text, feature graphic and ≥ 4 screenshots per device class
- [ ] Privacy policy published at a stable HTTPS URL
- [ ] Price and launch discount decided
- [ ] Commercial license decision for store distribution
- [ ] Purchases created and verified in sandbox **if** monetization is enabled
- [ ] `app-ads.txt` published **if** ads are ever enabled

## Definition of done

A release counts as shipped only when the store reports the build as live, a fresh install from that
store completes chamber 1 on a real phone, and no blocker crash is open.
