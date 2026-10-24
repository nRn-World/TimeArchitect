import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { LEVEL_DEFS } from '../src/data/levels.js';
import { parseLevel } from '../src/core/level.js';
import { solve } from '../src/core/solver.js';
import { createState } from '../src/core/sim.js';
import { DICTS, LOCALES, localeKeys, placeholdersOf } from '../src/core/i18n.js';
import { LEVEL_COUNT } from '../src/core/save.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const levels = LEVEL_DEFS.map((def, index) => parseLevel({ ...def, index }));

test('campaign ships twelve chambers', () => {
  assert.equal(LEVEL_DEFS.length, 12);
  assert.equal(LEVEL_COUNT, 12);
  assert.deepEqual(
    LEVEL_DEFS.map((def) => def.id),
    Array.from({ length: 12 }, (_, index) => `c${String(index + 1).padStart(2, '0')}`)
  );
});

test('every chamber parses and has an anchor and a start', () => {
  for (const level of levels) {
    assert.ok(level.w >= 7 && level.h >= 7, `${level.id} is too small`);
    assert.ok(level.anchors.length > 0, `${level.id} has no anchors`);
    assert.ok(level.objects.length > 0, `${level.id} has no clockwork`);
    const state = createState(level);
    assert.equal(state.got.length, level.anchors.length);
    assert.ok(level.par > 0, `${level.id} needs a par`);
  }
});

test('every chamber is solvable, par matches, and time control is required', () => {
  for (const level of levels) {
    const timed = solve(level, { allowTimeControls: true, maxStates: 1000000, weight: 1, rates: [0, 1] });
    assert.equal(timed.solved, true, `${level.id} is not solvable`);
    assert.equal(timed.moves, level.par, `${level.id} par should be ${timed.moves}`);
    const untimed = solve(level, { allowTimeControls: false, maxStates: 1000000 });
    assert.equal(untimed.solved, false, `${level.id} can be solved without manipulating time`);
  }
});

test('only one object starts paused across the campaign', () => {
  for (const level of levels) {
    const paused = level.objects.filter((obj) => obj.rate === 0).length;
    assert.ok(paused <= 1, `${level.id} starts with more than one paused object`);
  }
});

test('every locale defines every key with matching placeholders', () => {
  const keys = localeKeys();
  for (const locale of LOCALES) {
    const dict = DICTS[locale.code];
    assert.ok(dict, `missing dictionary for ${locale.code}`);
    for (const key of keys) {
      assert.equal(typeof dict[key], 'string', `${locale.code} is missing ${key}`);
      assert.ok(dict[key].trim().length > 0, `${locale.code} has an empty ${key}`);
      assert.deepEqual(placeholdersOf(dict[key]), placeholdersOf(DICTS.en[key]), `${locale.code} placeholder mismatch in ${key}`);
    }
    const extra = Object.keys(dict).filter((key) => !keys.includes(key));
    assert.deepEqual(extra, [], `${locale.code} has unknown keys`);
  }
});

test('every locale ships a local flag asset', () => {
  for (const locale of LOCALES) {
    const file = join(root, 'assets', 'flags', `${locale.flag}.svg`);
    assert.equal(existsSync(file), true, `missing flag ${file}`);
  }
});

test('locale metadata is complete and unique', () => {
  const codes = LOCALES.map((locale) => locale.code);
  assert.deepEqual(codes, ['en', 'sv', 'tr', 'es', 'ar', 'fr', 'ja']);
  assert.equal(new Set(codes).size, codes.length);
  const rtl = LOCALES.filter((locale) => locale.dir === 'rtl').map((locale) => locale.code);
  assert.deepEqual(rtl, ['ar']);
});

test('localized level titles and hints exist in every language', () => {
  for (const locale of LOCALES) {
    for (const level of levels) {
      assert.ok(DICTS[locale.code][level.titleKey], `${locale.code}: ${level.titleKey}`);
      assert.ok(DICTS[locale.code][level.subtitleKey], `${locale.code}: ${level.subtitleKey}`);
      assert.ok(DICTS[locale.code][level.hintKey], `${locale.code}: ${level.hintKey}`);
    }
  }
});

test('every dial stands on its pedestal and every pedestal has a dial', () => {
  for (const level of levels) {
    const dials = level.objects.filter((obj) => obj.kind === 'dial');
    for (const dial of dials) {
      const tile = level.base[dial.y * level.w + dial.x];
      assert.equal(tile, 6, `${level.id}: ${dial.id} is not on a pedestal tile`);
      assert.ok(dial.x >= 0 && dial.x < level.w && dial.y >= 0 && dial.y < level.h, `${level.id}: ${dial.id} is out of bounds`);
    }
    for (let y = 0; y < level.h; y += 1) {
      for (let x = 0; x < level.w; x += 1) {
        if (level.base[y * level.w + x] !== 6) continue;
        assert.ok(dials.some((dial) => dial.x === x && dial.y === y), `${level.id}: orphan pedestal at ${x},${y}`);
      }
    }
  }
});

test('drone paths stay inside the chamber', () => {
  for (const level of levels) {
    for (const obj of level.objects.filter((candidate) => candidate.kind === 'drone')) {
      assert.equal(obj.period, obj.path.length, `${level.id}: ${obj.id} period must match path length`);
      for (const cell of obj.path) {
        assert.ok(cell.x >= 0 && cell.x < level.w && cell.y >= 0 && cell.y < level.h, `${level.id}: ${obj.id} path leaves the map`);
      }
    }
  }
});
