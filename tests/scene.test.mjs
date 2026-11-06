import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from '../src/render/scene.js';
import { LEVEL_DEFS } from '../src/data/levels.js';
import { parseLevel } from '../src/core/level.js';
import { createState, previewTick } from '../src/core/sim.js';

globalThis.window = { devicePixelRatio: 1 };
globalThis.ResizeObserver = class { observe() {} };
const gradient = { addColorStop() {} };
const ctx = new Proxy({}, { get(target, name) { return name === 'createLinearGradient' || name === 'createRadialGradient' ? () => gradient : (target[name] ?? (() => {})); }, set(target, name, value) { target[name] = value; return true; } });
function makeScene(width, height) {
  const canvas = { getContext: () => ctx, getBoundingClientRect: () => ({ width, height, left: 0, top: 0 }) };
  return new Scene(canvas);
}

test('top-down renderer maps visible tile centers to the same grid coordinates', () => {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const scene = makeScene(width, height);
    for (const [index, def] of LEVEL_DEFS.entries()) {
      const level = parseLevel({ ...def, index });
      const state = createState(level);
      scene.load(level, state);
      const { ox, oy, scale } = scene.camera;
      assert.ok(ox >= 0 && oy >= 0);
      const center = (x, y) => [ox + (x + .5) * 64 * scale, oy + (y + .5) * 64 * scale];
      assert.deepEqual(scene.cellAt(...center(state.px, state.py)), { x: state.px, y: state.py });
      const dial = level.objects.find(obj => obj.kind === 'dial');
      assert.equal(scene.hitTest(...center(dial.x, dial.y)), dial.id);
      const before = JSON.stringify(state);
      scene.setSelection(dial.id);
      scene.setHighlight(dial.controls.map(tile => tile.y * level.w + tile.x));
      scene.setGhosts(previewTick(level, state));
      scene.render();
      assert.equal(JSON.stringify(state), before);
    }
  }
});
