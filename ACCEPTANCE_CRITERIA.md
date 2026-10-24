# Acceptance criteria

Status is based on executed checks; see `RELEASE_REPORT.md` for raw evidence and limitations.

| # | Criterion | Result |
| --- | --- | --- |
| 1 | A complete campaign exists with a tutorial curve and ending | Pass — 12 chambers, hint cards, finale, ending screen |
| 2 | Core mechanic: individual objects can be rewound, paused, played and accelerated | Pass — 4 rates per object, verified in simulation and UI |
| 3 | Puzzles are deterministic | Pass — pure `(level, state, action)` simulation, no randomness in rules |
| 4 | Every chamber is solvable | Pass — A* proof for all 12 |
| 5 | Every chamber requires time manipulation | Pass — all 12 unsolvable with time controls disabled |
| 6 | Published par matches the solver optimum under pause/play | Pass — asserted in tests |
| 7 | Failure and retry are fast and fair | Pass — free undo, restart, fail modal with reason |
| 8 | Progress and settings persist; corrupt saves recover | Pass — versioned save, backup, validation; manual corruption test not run (unit-level normalize) |
| 9 | First launch offers language selection with names in own script and authentic flags | Pass — 7 locales, local public-domain SVGs |
| 10 | Arabic is true RTL | Pass — `dir=rtl`, logical CSS, no horizontal overflow at 390×844 / 950×987 |
| 11 | All user-facing text is externalized and complete | Pass — key/placeholder parity test across 7 locales |
| 12 | Accessibility: reduced motion, high contrast, large targets, haptics, color-independent signals | Pass — settings toggle classes/options; icons and labels carry meaning |
| 13 | Keyboard, touch and gamepad input | Pass — keyboard and touch verified in browser; gamepad implemented, not hardware-tested |
| 14 | Adaptive phone/tablet/desktop layout | Pass — 390×844 and 950×987 verified, no overflow |
| 15 | Offline-capable after first load | Pass — service worker active and shell precached; offline navigation not simulated |
| 16 | Original visual identity; no copied assets | Pass — all rendering procedural; flags are the only third-party visuals |
| 17 | Original audio, no unlicensed recordings | Pass — runtime synthesis only |
| 18 | Save data never leaves the device; no tracking | Pass — code review; no network calls at runtime |
| 19 | Build/tests reproducible from a clean checkout | Pass — no dependencies, 20/20 tests on Node 24 |
| 20 | Required documentation, license and notices | Pass — all files present |
| 21 | Android AAB, signing, Play Console, AdMob/UMP | Not done — documented human actions |
| 22 | Real-device performance on mid-range Android | Not measured — out of scope for this environment |

## Definition of done (this build)

A clean checkout serves the game, all automated tests pass, the campaign is solvable, all seven
languages render, and the documented limitations are accurate. Items 21–22 are explicitly excluded
from this build's definition of done and listed for the owner.
