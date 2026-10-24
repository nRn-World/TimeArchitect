# Monetization and launch plan

Status: **design + store configuration. No billing SDK is wired in this build, and the game ships
fully unlocked.** Real purchases need the owner's Play Console / App Store Connect accounts, a
merchant profile and tax details, which cannot be created from a code agent. This document is the
build-ready specification for the moment those accounts exist.

## 1. The model

A calm, handcrafted puzzle game competes on quality, not on pressure. The revenue model therefore
avoids energy timers, loot boxes, forced ads and pay-to-win:

| Layer | What the player gets | Price (USD) | Why it works |
| --- | --- | --- | --- |
| Free download | Chapters I–II (chambers 1–6), all accessibility features, 7 languages, no ads | 0 | Enough content to judge quality and rate the game well. |
| **Full Campaign** (non-consumable) | Chambers 7–12, the three-clock finale, the ending and the Archivist's notes | **$3.99** (tier 2) | One honest unlock; the demo is generous, so conversion is from goodwill, not frustration. |
| **Atelier Pack** (non-consumable) | 5 extra palettes, 3 clock-skin sets, a photo mode with the chamber seal | **$1.99** | Cosmetic only; never affects difficulty or solutions. |
| Rewarded ad (optional) | Watch one ad to reveal the next step of a chamber's hint | 0 | Never required: hints are free after three attempts. |

Launch decision: **ship without ads.** Ads add consent flow, data-safety wording and review risk,
and they depress retention for a premium-feeling puzzler. The rewarded slot stays designed but dark
until the owner explicitly enables it; the placement is non-exclusive by construction.

## 2. Product IDs

| Store | Product ID | Type | Title |
| --- | --- | --- | --- |
| Google Play | `com.nrnworld.timearchitect.full_campaign` | One-time product | Full Campaign |
| Google Play | `com.nrnworld.timearchitect.atelier` | One-time product | Atelier Pack |
| App Store | `com.nrnworld.timearchitect.fullcampaign` | Non-consumable | Full Campaign |
| App Store | `com.nrnworld.timearchitect.atelier` | Non-consumable | Atelier Pack |

Rules:

- Never hardcode prices in the UI. Read the localized price from the store and show it verbatim.
- Always provide **Restore purchases**; both stores require it for non-consumables.
- Keep a local `entitlements` record in the save file, but treat the store receipt as the source of
  truth. Server validation (Play Developer API / App Store Server API) is the v2 upgrade.
- No account is needed to play or to restore. Do not add one just for payments.

## 3. Gating design (what changes in code)

The build stays intact and unlocked today. When billing is added:

1. Add a tiny `src/core/entitlements.js` that exposes `has(entitlement)` and emits changes. The save
   file persists only a cache of the last verified state.
2. Wrap the chapter map's sealed chambers: `full_campaign` unlocks chapters III–IV. The chamber data
   already supports `unlockAfter`, so content does not need to change.
3. Put the purchase surface behind one screen component reused by Play Billing, StoreKit and a
   future web build. Never call store APIs from game logic.
4. On purchase success, unlock immediately, play the win sting, and persist. On failure, keep the
   game playable and show a retry — never loop a purchase sheet.
5. Test with the stores' sandbox accounts: buy, cancel, pending, restore on a fresh install, and a
   refund that revokes the entitlement.

The free/paid split is a data decision: chambers carry a `tier: 'free' | 'campaign'` field, and the
gate reads it. Adding a new free chamber later is a one-line data change.

## 4. Pricing

- Full Campaign: $3.99 US / €3.99 / 45 SEK / ₺99 / ¥600 / 45 AED. Use the store's automatic
  regional pricing, then hand-check the four largest markets.
- Atelier Pack: $1.99, positioned as a tip rather than a necessity.
- Launch window: 25% off Full Campaign for the first 14 days, announced in the store description.
- No subscription. A puzzle campaign has a finish line; subscriptions on finite content generate
  refunds and one-star reviews.

## 5. Revenue reality check

Industry conversion for a well-liked premium puzzle demo is roughly **2–4% of installs**, with the
Atelier Pack adding 15–20% on top of that. Using conservative numbers:

| Installs | Conversion | Buyers | Net per sale* | Gross |
| --- | --- | --- | --- | --- |
| 10,000 | 2.5% | 250 | ~$2.79 | ~$700 |
| 50,000 | 3.0% | 1,500 | ~$2.79 | ~$4,200 |
| 250,000 | 3.0% | 7,500 | ~$2.79 | ~$20,900 |

\*After the 30% store fee; excludes tax and refunds. The point is not the exact figure, it is that a
$3.99 puzzler needs **reach**, not a higher price. Budget the marketing effort accordingly.

With a rewarded-ad variant enabled later, a typical eCPM of $8–15 and one optional view per player
per session adds cents, not dollars, per user. Do not design the game around it.

## 6. Launch plan

1. **Soft launch** (2 weeks, Sweden + Philippines + Mexico): verify crash-free rate, D1 retention and
   the first-chamber completion rate. Target: ≥ 99.5% crash-free, ≥ 45% of installs finish chamber 1.
2. **ASO**: title + short description in all seven languages (see `STORE_LISTING.md`), screenshots
   with a readable caption, a 30-second trailer showing a bridge freeze-and-cross.
3. **Creators**: send 20 keys to puzzle/relaxation channels; the hook is "one rule, twelve chambers".
4. **Featured pitch**: Play Console "Editorial" form and App Store "Featuring" nomination, both with
   the trailer and the accessibility story.
5. **Post-launch**: one free chamber every six weeks keeps the store page fresh; the Atelier Pack
   funds it.

## 7. Metrics that matter

- First-session completion of chamber 1 (tutorial quality).
- Chamber 7 arrival rate (paywall exposure) and paywall → purchase conversion.
- Refund rate per store (< 2% is healthy for premium puzzle).
- Crash-free sessions and cold start time (< 2.5 s to the language screen on a mid-range phone).
- Store rating after 7 days (> 4.4 target).

Analytics must be opt-in where the law requires it, must never include the save file, and must not
be added before the privacy policy is updated. The shipped build contains **no analytics SDK**.

## 8. Legal and store paperwork

- New: `app-ads.txt` on the studio site if ads are ever enabled.
- Play Console: Data safety (no data collected; no ads), content rating (Everyone / PEGI 3), IAP
  declaration, account deletion not applicable (no accounts).
- App Store: App Privacy "Data Not Collected", age rating 4+, "Made for Kids" **no** (the game is
  family friendly but not child-directed, which keeps ad and consent rules simple).
- Update `PRIVACY.md` if a billing provider or analytics service is added; both process purchase
  identifiers.
- The current `LICENSE` is non-commercial. **A commercial store release requires the owner to grant
  themselves a commercial license** (or replace the license for the shipping build); the
  non-commercial text stays for the public source repository if that is the intent. This is a legal
  decision only the owner can make — see `HUMAN_ACTIONS.md`.
