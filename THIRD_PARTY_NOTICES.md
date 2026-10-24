# Third-party notices

Time Architect's code, art direction, procedural visuals and audio are original works by nRnWorld.
The project has **no runtime software dependencies**. The following third-party assets are included.

## Flag icons

Seven authentic flag SVGs are stored locally in `assets/flags/`. They are reproductions of national
flags, which are in the **public domain** (official symbols, not copyrightable). The SVG files were
downloaded from Wikimedia Commons, which publishes them as public domain / CC0-compatible.

| Locale | File | Source |
| --- | --- | --- |
| English (United Kingdom) | `assets/flags/gb.svg` | <https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_United_Kingdom_(3-5).svg> |
| Swedish | `assets/flags/se.svg` | <https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Sweden.svg> |
| Turkish | `assets/flags/tr.svg` | <https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Turkey.svg> |
| Spanish | `assets/flags/es.svg` | <https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Spain.svg> |
| Arabic (Saudi Arabia) | `assets/flags/sa.svg` | <https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Saudi_Arabia.svg> |
| French | `assets/flags/fr.svg` | <https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_France.svg> |
| Japanese | `assets/flags/jp.svg` | <https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Japan.svg> |

The flags are shown only as a small visual aid next to the language name in its own script. No flag
was generated, traced or recolored by this project. See `assets/flags/SOURCES.md` for the retrieval
note.

## Fonts

No font files are bundled or downloaded. The UI uses the operating system's system font stacks,
including platform serif faces for display headings. This keeps the build offline-capable and avoids
font licensing.

## Audio

All ambience and sound effects are synthesized at runtime with the Web Audio API from original
parameters. No recordings, samples or third-party sound libraries are used.

## Software

No third-party JavaScript libraries, engines, analytics, ad SDKs or font services are included.
Node.js is used only for the development server and tests.
