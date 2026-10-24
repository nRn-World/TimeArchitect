# Plan

## Goal

Deliver a complete, polished time-manipulation puzzle game based on the Time Architect production
brief: a deterministic campaign about rewinding, pausing and fast-forwarding individual objects,
with onboarding, progression, accessibility, localization, persistence and a releasable repository.

## Platform decision

The brief specifies an Android build (Godot 4.x + GDScript, Play-ready AAB, AdMob/UMP). The build
machine has Java, Gradle and the Android SDK tools, but **no Godot editor or export templates**, and
no verified device/emulator pipeline. Producing an unverified Godot/Android package would violate the
brief's own rule against claiming untested results.

Decision: build the complete game as a **framework-free web/PWA application**, the highest-fidelity
implementation that can be built and *actually verified* in this environment:

- It runs on Android, iOS, desktop and tablets through a browser and installs as a PWA.
- It is fully offline after first load, meeting the brief's offline requirement.
- It keeps the full player fantasy, deterministic puzzle rules, campaign, tutorial, localization,
  accessibility, save safety and performance tiers.
- It ships with the required documentation, license and tests.

Android packaging, AdMob/UMP, signing and Play Console steps are documented as explicit human-only
actions in `HUMAN_ACTIONS.md` and are not claimed as done.

## Approach

Work in vertical slices that are always playable:

1. **Simulation kernel** — ASCII levels, dials, gates, bridges, drones, tick rules, deterministic
   state, undo snapshots.
2. **Verification harness** — A* solver proving solvability and time-control necessity; this drove
   level design more than any other tool.
3. **Content** — twelve chambers with a taught mechanic per act, tuned pars from the solver.
4. **Presentation** — isometric canvas renderer, palette system, effects, responsive camera.
5. **Shell** — screens, HUD, selection, time controls, pause, completion, failure, credits, privacy.
6. **Systems** — save versioning/backup/recovery, localization with RTL, audio synthesis, input
   (keyboard, touch, gamepad), settings and accessibility.
7. **Polish** — onboarding hint cards, par badges, unlock curve, ending, PWA, icon.
8. **Release engineering** — tests, campaign audit, documentation, license, notices, evidence.

## Key design decisions

- **Player moves advance time.** This turns timing into deliberate puzzle reasoning instead of
  reflex play, and makes undo meaningful.
- **Controlled tiles kill when they close underfoot.** Without this, spans could be crossed by
  idling inside them and the freeze mechanic would be decorative.
- **One freeze at a time.** Unlimited freezing trivializes every chamber. The limit turns multiple
  clocks into a scheduling problem.
- **Undo is free and unlimited.** Challenge comes from understanding, not from punishment.
- **No ads, no analytics, no accounts.** The brief requires the game to be enjoyable without
  advertising; the web build simply has none.
- **Seven full locales, not machine stubs.** All strings, level names and hints are translated;
  Arabic ships true RTL.

## Out of scope (reported, not faked)

- APK/AAB, Godot project, Play Console listing, signing keys.
- AdMob/UMP integration and its test matrix.
- Device-lab performance measurement on mid-range Android hardware.
- Store screenshots and localized store metadata beyond the provided listing draft.
