# Time Architect — Art Bible

## Premise

A dark observatory built of stone and brass, where time is a physical material. The Architect moves
through chambers whose clockwork has seized. Each chamber is a still life of machinery: an obelisk
dial, an energy gate, a floating patrol. The visual language is **ink-stone + warm brass + cold
chrono light**, with one accent colour per chamber.

Nothing in the game is a photograph of an existing game. All shapes are original and drawn
procedurally at runtime.

## Shape language

- **Circles and arcs** — time, cycles, dials, halos, orbits, runes.
- **Diamonds** — isometric tiles, stepping stones, crystal anchors, facets.
- **Monoliths** — dials, gate pillars, wall blocks; tapered, never perfectly rectangular.
- **Hooded triangle** — the Architect; a soft cloak, no face, a single visor slit.
- **Orbs and rings** — drones; danger is round, hovering and quietly mechanical.

No character has a readable face. Silhouette and light carry identity.

## Materials

| Material | Reads as | Rendering |
| --- | --- | --- |
| Chamber stone | Basalt, matte, cool | Diamond gradient + thin inset rune line |
| Brass | Warm, aged, precise | Linear gradient, bright edge, tick marks |
| Chrono light | Cold cyan, weightless | Glow, thin arcs, dashed outlines |
| Anchor crystal | Warm amber, precious | Faceted gradient + halo rings |
| Void | Bottomless, silent | Near-black diamond with faint rim |
| Energy gate | Hostile, temporary | Vertical bars, bright header line |
| Drone shell | Oiled metal, dark | Radial gradient sphere with brass orbit ring |

Roughness is implied by contrast, not texture maps. No image assets are used.

## Palettes

Each chamber is assigned one palette; the accent shifts the whole scene:

- **ink** — cyan on blue-black basalt. The base identity; used for the first and mid chambers.
- **brass** — amber on warm umber. Mechanically precise, ceremonial.
- **verdant** — mint on deep green stone. Organic, overgrown observatory.
- **ember** — orange on oxidized red. Hostile, furnace-like.
- **cosmic** — violet on indigo. The finale; higher contrast halos and deeper shadows.

Rules: one accent per chamber, brass reserved for interactive time controls, red reserved for danger.
Never rely on colour alone — danger also has a shape (bars, orb, closing tile) and a label.

## Lighting

- Single implied key light from above-front; wall tops brightest, wall sides darker.
- Ground shadows are soft ellipses, never hard directional shadows.
- Emissive elements (dials, anchors, visors, gates) have a glow that is *local* and falls off fast.
- Vignette and a slowly rotating clock-ring backdrop keep the frame focused and alive.
- Quality tiers reduce glow, motes and particles, never the readability of rules.

## Camera and composition

- Fixed 2:1 isometric view, depth sorted by `x+y`.
- Chamber fits the viewport with padding; clamped scale keeps small levels from becoming huge.
- Player sits slightly above centre; HUD top/bottom keep clear of the play field on phones.
- Walls frame the play area; chasms and gate corridors form strong leading lines.
- No camera rotation or zoom: puzzles must read identically every time.

## Typography

- Display: platform serif (Iowan/Palatino/Georgia), high contrast against ink, used for chamber names,
  titles and numerals. Japanese and Arabic switch to appropriate system serif/sans stacks.
- UI: platform sans, uppercase eyebrows with wide tracking for section labels, tabular numerals for
  ticks and par.
- Never set critical instructions in all caps; letter-spaced labels are short and repeated by icons.

## HUD hierarchy

1. **Chamber identity** — number, name, subtitle.
2. **Run state** — ticks, par, anchors collected.
3. **Safety actions** — pause, undo, restart, hint.
4. **World objects** — horizontally scrollable strip with phase and rate per object.
5. **Time controls** — four large buttons; active rate is brass, disabled states are explicit.
6. **Movement** — on-screen pad on touch, keyboard hints on desktop.

The hint card is the only element allowed to overlap the board, and only until dismissed.

## VFX and animation

- **Step**: six sparks and a thin ground ring; no screen movement.
- **Collect**: crystal shards, two rings, brief warm flash, haptic pattern.
- **Fail**: red shards, expanding ring, short shake, red flash, pause before the modal.
- **Win**: three wide rings and a cyan flash; modal after 700 ms.
- **Ambient**: dust motes, rotating backdrop rings, drone bob, dial pointer, halo spin.
- **Reduced motion** removes shake, easing, motes, and particle spawns.

Animation is expressive but never hides the next tick: ghosts preview drone endpoints and closing
tiles when enabled.

## Iconography

- Dial: `◷` (circle with hands) / ring motif.
- Drone: `◉` (orb).
- Rewind / freeze / play / fast: `◀◀`, `❙❙`, `▶`, `▶▶` — always paired with a text label.
- Locked chamber: `⊘`.
- Pause / undo / restart use `⏸`, `↶`, `⟲` with accessible labels.

## Quality tiers and budgets

| Tier | DPR cap | Glow | Particles | Motes |
| --- | --- | --- | --- | --- |
| Low | 1.0 | off | off | off |
| Medium | 2.0 | limited | 50% | on |
| High | 2.0 | full | 100% | on |

Practical budgets for this renderer: ≤ 120 drawable tiles and objects, ≤ 90 live particles,
≤ 6 dynamic rings, one canvas, no image uploads, no per-frame gradient explosion beyond tiles
(9×9 to 9×12 chambers), target 60 fps at DPR 2 on a mid-range phone.

## Prohibited ambiguity

- Never use a colour-only signal for danger, openness or selection.
- Never place a control under the safe-area insets or over the chamber's interactive tiles.
- Never animate a tile silently changing state without a ghost or visual “closing” cue.
- Never copy or trace an existing game's character, level or UI.
- Never use emoji flags, generated flags or flags without the written language name.
