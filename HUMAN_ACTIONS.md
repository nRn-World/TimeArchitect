# Human-only actions

Everything that could be built, run and verified without your accounts is done: the game, the
Android APK/AAB, the iOS project, icons, splash, tests and documentation. The steps below need your
identity, money, signing key or legal judgement. They are ordered; nothing here is claimed as done.

## 1. Own the signing key (Android)

- Create a keystore **outside the repository** and back it up twice:
  `keytool -genkeypair -v -keystore ~/keys/time-architect.jks -alias timearchitect -keyalg RSA -keysize 4096 -validity 10000`
- Put the four values in `android/keystore.properties` (already git-ignored) as described in
  [BUILDING.md](BUILDING.md).
- Run `npm run android:bundle`; the output is `android/app/build/outputs/bundle/release/app-release.aab`.
- If you ever lose this key you cannot update the existing Play listing — you would have to publish a
  new app with a new application ID.

## 2. Google Play Console

1. Create a Play Console developer account (one-time USD 25) and accept the latest policies.
2. Create the app: name **Time Architect**, default language English, app (not game? choose **Game**),
   free, category **Puzzle**, contact email `bynrnworld@gmail.com`.
3. Upload the AAB to **Internal testing** first. Complete:
   - Store listing (copy in `docs/STORE_LISTING.md`, icon, feature graphic 1024×500, at least 4 phone
     screenshots; 7 recommended, see §6).
   - App content: privacy policy URL, app access (no login), ads (**No ads**), content rating
     questionnaire (expect Everyone / PEGI 3), target audience (13+ or 18+; **not** child-directed),
     data safety (**no data collected**, no data shared).
   - Government apps: no. Financial features: no. Health: no.
4. Roll out to internal testing, install from the Play link on a real phone, and complete one full
   chamber. Then promote to closed → open → production (first production review can take days).
5. If purchases are enabled (§5), create the two in-app products **before** the first review and
   submit them with the build.

## 3. App Store Connect (requires a Mac + Apple Developer Program, USD 99/year)

1. Enrol in the Apple Developer Program; accept the agreements and complete tax/banking.
2. In Xcode open `ios/App/App.xcworkspace`, set your team, and let automatic signing create the
   provisioning profile for `com.nrnworld.timearchitect`.
3. Register the bundle ID and create the app in App Store Connect (name, primary language, SKU).
4. Upload with Xcode (Product → Archive → Distribute) or `xcrun altool`/`notarytool`. Test through
   TestFlight on a physical iPhone and iPad.
5. Fill in App Privacy (**Data Not Collected**), age rating 4+, category Puzzle, support URL, privacy
   policy URL, and the same screenshots (6.7", 6.5" and 12.9" sizes).
6. Apple requires a paid apps agreement even for a free download with in-app purchases. Complete it,
   then create the two non-consumables in App Store Connect → Features → In-App Purchases.
7. Submit for review with a note that the game needs no account and is fully playable offline.

## 4. Make it a real product decision: the license

The repository license is **non-commercial**. Publishing a monetized app under it is a conflict.
Only you can choose:

- **Option A (recommended for a commercial launch):** keep the public repository under the
  non-commercial license and grant yourself (the copyright holder) a separate commercial license for
  the store builds. Add a one-paragraph `COMMERCIAL_LICENSE.md` naming nRnWorld as the licensor.
- **Option B:** dual-license — non-commercial for the public source, commercial builds distributed
  only as binaries.
- **Option C:** replace the license with a commercial EULA for the shipped app.

Have a lawyer review whichever you choose. The current text is in [LICENSE](LICENSE).

## 5. Turn on purchases (only after the accounts exist)

The shipped game is complete and unlocked; no billing SDK is present. To monetize as designed in
[docs/MONETIZATION.md](docs/MONETIZATION.md):

1. Create the products:
   - Play: `com.nrnworld.timearchitect.full_campaign` ($3.99), `com.nrnworld.timearchitect.atelier` ($1.99)
   - App Store: `com.nrnworld.timearchitect.fullcampaign`, `com.nrnworld.timearchitect.atelier`
2. Add a billing plugin (RevenueCat is the least work across both stores, and keeps receipt
   validation server-side) or implement Play Billing + StoreKit 2 directly.
3. Implement the `entitlements` seam and chapter gating described in §3 of the monetization doc;
   keep the free chapters I–II.
4. Test in sandbox: purchase, cancel, pending, restore after reinstall, refund/revocation.
5. Never hardcode prices; display the store's localized price. Provide **Restore purchases**.

## 6. Store assets and screenshots

- Use the running app on a real phone. Capture: language screen, chamber 1 with a frozen bridge,
  chamber 6 with two patrols, the chamber map, the win screen, settings, and Arabic + Japanese.
- `screenshots/android-*.png` in this repository are emulator captures from the build (Pixel 8 Pro,
  1344×2992) and can seed the Play listing after cropping the status bar if desired.
- Trailer: 20–30 s, show the freeze → cross → gate closes beat. No voice-over needed.

## 7. Support surface

- Publish the privacy policy at a stable HTTPS URL (the text in `PRIVACY.md` is ready) and use it in
  both stores.
- A one-page site with the support email and the game description helps review and ASO.
- If ads are ever enabled: publish `app-ads.txt` at the site root and add the UMP consent flow.

## 8. Final pre-submission checks only you can do

- Play a full 12-chamber run on a mid-range Android phone and an iPhone.
- Verify Arabic right-to-left and Japanese line breaking on a small screen with someone who reads them.
- Confirm the app name is not trademarked in your target markets.
- Decide the price and the launch discount.
- Approve the store listing text, screenshots and the content rating answers.

Nothing in this repository claims any of the above has been completed.
