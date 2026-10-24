# Risk register

| ID | Risk | Likelihood | Impact | Mitigation / status |
| --- | --- | --- | --- | --- |
| R1 | Brief targets Android/Godot; build is web/PWA | Certain | High | Documented in PLAN, RELEASE_REPORT and HUMAN_ACTIONS; no false Android claims. Owner decides on wrapper. |
| R2 | AdMob/UMP absent | Certain | Medium (store monetization) | Web build is ad-free by design and playable offline; ad integration deferred with the Android package. |
| R3 | Levels may be unsolvable or solvable without time control | Medium | High | A* proof per level and an explicit no-time-control search in tests; level geometry reworked until both pass. |
| R4 | Puzzle difficulty collapses if spans can be idled across | High if unhandled | High | Controlled tiles kill on close; spans require 3+ consecutive open phases or a freeze. |
| R5 | Unlimited freezing trivializes puzzles | High if unhandled | Medium | Only one object may be paused; enforced in sim with user feedback. |
| R6 | Arabic RTL layout breaks | Medium | Medium | Logical CSS properties, `dir=rtl`, overflow checks at phone and desktop widths. Native proofread pending. |
| R7 | Translation quality issues | Medium | Medium | Authored per locale with consistent placeholders; key-parity tests. Native-speaker proofread listed as human action. |
| R8 | Corrupt or partial saves lose progress | Low | Medium | Versioned schema, normalization, rolling backup, fallback defaults, reset action. |
| R9 | Service worker serves stale assets | Medium | Low | Network-first navigations, versioned cache name, documented bump procedure. |
| R10 | Canvas performance on low-end devices | Medium | Medium | Quality tiers, particle caps, DPR clamp, reduced-motion path, no per-frame allocation-heavy effects. Real-device measurement pending. |
| R11 | Gamepad mapping varies by browser | Medium | Low | Standard-mapping assumptions documented; keyboard/touch are primary. |
| R12 | Custom license rejected by a store or lawyer | Medium | High | License explicitly non-OSI, recommends legal review; owner decision required. |
| R13 | Missing accessibility on screen readers | Medium | Medium | Semantic buttons, switch roles, labels, focus outlines; no automated screen-reader pass performed. |
| R14 | Local flags could be considered decorative inaccuracies | Low | Low | Files unmodified from Wikimedia public domain, documented in THIRD_PARTY_NOTICES. |
| R15 | Third-party asset licensing | Low | Low | Only public-domain flags; all other art and audio original and generated. |
| R16 | Accidental secret or analytics inclusion | Low | High | No dependencies, no SDKs, no network calls; repository scan performed. |
