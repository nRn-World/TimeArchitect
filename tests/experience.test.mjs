import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_DEFS } from '../src/data/levels.js';
import { parseLevel } from '../src/core/level.js';
import { createState, previewAction, applyAction } from '../src/core/sim.js';
import { makeT } from '../src/core/i18n.js';
import { hudObjects, titleScreen, modalFail } from '../src/ui/screens.js';
import { defaultSave } from '../src/core/save.js';

test('action forecasts agree with the simulation and never mutate state', () => {
  for (const [index, def] of LEVEL_DEFS.entries()) {
    const level = parseLevel({ ...def, index });
    const state = createState(level);
    const before = JSON.stringify(state);
    for (const action of [{ type: 'wait' }, ...['up', 'down', 'left', 'right'].map(dir => ({ type: 'move', dir }))]) {
      const result = applyAction(level, state, action);
      const expected = !result.ok ? 'blocked' : result.state.dead ? 'danger' : 'safe';
      assert.equal(previewAction(level, state, action), expected);
    }
    assert.equal(JSON.stringify(state), before);
  }
});

test('new home, mechanism guidance and recovery are rendered in Swedish', () => {
  const level = parseLevel({ ...LEVEL_DEFS[0], index: 0 });
  const save = defaultSave();
  const app = { t: makeT('sv'), locale: 'sv', save, level, state: createState(level), selected: level.objects[0].id, history: [createState(level)] };
  assert.match(titleScreen(app), /Börja ditt äventyr/);
  assert.match(hudObjects(app), /phase-track__current/);
  assert.match(hudObjects(app), /Stängd|Öppen/);
  app.state.dead = true;
  app.state.failReason = 'fell';
  assert.match(modalFail(app), /ångra ditt senaste steg/);
});
