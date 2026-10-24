# Contributing

Time Architect is source-available for non-commercial educational use. See `LICENSE`. Contributions
are accepted on the understanding that they are licensed under the same terms and that **By nRnWorld**
remains prominent.

## Before you start

- Run `npm test`; it must pass.
- Keep the simulation pure: `src/core` must not touch the DOM, storage or audio.
- Match the existing style: small ES modules, named exports, no dependencies.

## Adding a chamber

1. Create an ASCII map and objects in `src/data/levels.js`.
2. Use `dial`, `drone`, `bridges`, `gates` and `patrol` helpers.
3. Give the chamber a unique id (`c13`…), title/subtitle/hint keys and a palette.
4. Add all three keys to **every** locale file.
5. Run `node tools/solve.mjs` to learn the optimal move count and confirm time control is required.
6. Set `par` to the reported move count.
7. Run `npm test`. A chamber that is solvable without time control fails the suite by design.

## Adding a language

1. Copy `src/data/locales/en.js` and translate all values. Keep every `{placeholder}` exactly.
2. Register the locale in `LOCALES` and `DICTS` in `src/core/i18n.js`.
3. Add an unmodified public-domain flag to `assets/flags/`, then add it to
   `THIRD_PARTY_NOTICES.md`, `assets/flags/SOURCES.md` and the service-worker asset list.
4. Set the direction (`rtl` for Arabic, Hebrew, Persian, Urdu).
5. Verify key/placeholder parity with `npm test` and check layout at 390 px width.

## Pull requests

- Describe the player-facing change and the verification you ran.
- Include screenshots only if the visual language changed.
- Never add ads, analytics, trackers, remote fonts or network calls to the game runtime.
- Never commit secrets, keys or store credentials.

## Code of conduct

Be precise, be kind, critique the work rather than the person. Harassment or discrimination is not
welcome.
