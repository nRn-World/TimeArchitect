import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, TILE, controlledTileOpen, isWalkable } from '../src/core/level.js';
import { applyAction, createState, droneTiles, previewTick, stateKey, collectedCount } from '../src/core/sim.js';
import { solve } from '../src/core/solver.js';

const level = parseLevel({
  id: 'test',
  map: ['######', '#S...#', '##B###', '##B###', '#..A.#', '######'],
  objects: [
    {
      id: 'd1',
      kind: 'dial',
      x: 1,
      y: 1,
      period: 4,
      phase: 0,
      rate: 1,
      openWhen: [0, 1],
      controls: [
        { x: 2, y: 2, kind: 'bridge' },
        { x: 2, y: 3, kind: 'bridge' }
      ]
    }
  ]
});

test('level parses tiles, start and anchors', () => {
  assert.equal(level.w, 6);
  assert.equal(level.h, 6);
  assert.deepEqual(level.start, { x: 1, y: 1 });
  assert.equal(level.anchors.length, 1);
  assert.equal(level.base[2 * level.w + 2], TILE.BRIDGE);
  assert.equal(level.base[0], TILE.WALL);
});

test('controlled tiles follow the dial window', () => {
  const state = createState(level);
  assert.equal(controlledTileOpen(level, state, 2, 2), true);
  state.phases[0] = 2;
  assert.equal(controlledTileOpen(level, state, 2, 2), false);
  assert.equal(isWalkable(level, state, 2, 2), false);
});

test('walking advances every clock by its rate', () => {
  let state = createState(level);
  const result = applyAction(level, state, { type: 'move', dir: 'right' });
  assert.equal(result.ok, true);
  assert.equal(result.state.px, 2);
  assert.equal(result.state.phases[0], 1);
  assert.equal(result.state.moves, 1);

  const paused = applyAction(level, result.state, { type: 'setRate', id: 'd1', rate: 0 });
  assert.equal(paused.ok, true);
  const waited = applyAction(level, paused.state, { type: 'wait' });
  assert.equal(waited.state.phases[0], 1, 'paused dial does not advance');
  assert.equal(waited.state.moves, 2);
});

test('only one object may be paused at a time', () => {
  const multi = parseLevel({
    id: 'multi',
    map: ['#####', '#S..#', '#...#', '#####'],
    objects: [
      { id: 'a', kind: 'drone', period: 2, phase: 0, rate: 1, path: [{ x: 1, y: 2 }, { x: 2, y: 2 }] },
      { id: 'b', kind: 'drone', period: 2, phase: 0, rate: 1, path: [{ x: 3, y: 2 }, { x: 3, y: 1 }] }
    ]
  });
  let state = createState(multi);
  const first = applyAction(multi, state, { type: 'setRate', id: 'a', rate: 0 });
  assert.equal(first.ok, true);
  const second = applyAction(multi, first.state, { type: 'setRate', id: 'b', rate: 0 });
  assert.equal(second.ok, false);
  assert.equal(second.events[0].type, 'reject');
  assert.equal(second.events[0].reason, 'singleFreeze');
});

test('a chrono tile closing beneath the player unmakes them', () => {
  let state = createState(level);
  state = applyAction(level, state, { type: 'setRate', id: 'd1', rate: 1 }).state;
  state = applyAction(level, state, { type: 'move', dir: 'right' }).state; // (2,1) phase 1
  state = applyAction(level, state, { type: 'move', dir: 'down' }).state; // (2,2) phase 2 -> closes
  assert.equal(state.dead, true);
  assert.equal(state.failReason, 'fell');
});

test('drones unmake the player and block entry', () => {
  const droneLevel = parseLevel({
    id: 'drone',
    map: ['#####', '#S..#', '#...#', '#####'],
    objects: [
      {
        id: 'p',
        kind: 'drone',
        period: 4,
        phase: 0,
        rate: 1,
        path: [
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 1, y: 2 },
          { x: 1, y: 1 }
        ]
      }
    ]
  });
  const state = createState(droneLevel);
  assert.deepEqual(droneTiles(droneLevel, state)[0], { x: 2, y: 1, index: 0 });
  const blocked = applyAction(droneLevel, state, { type: 'move', dir: 'right' });
  assert.equal(blocked.ok, false);
  const after = applyAction(droneLevel, state, { type: 'wait' }).state;
  assert.deepEqual(droneTiles(droneLevel, after)[0], { x: 2, y: 2, index: 0 });
});

test('anchors are collected and win the chamber', () => {
  const simple = parseLevel({
    id: 'simple',
    map: ['#####', '#SA.#', '#####'],
    objects: []
  });
  const state = createState(simple);
  const result = applyAction(simple, state, { type: 'move', dir: 'right' });
  assert.equal(result.state.won, true);
  assert.equal(collectedCount(result.state), 1);
});

test('preview reports the next drone positions without mutating state', () => {
  const state = createState(level);
  const preview = previewTick(level, state);
  assert.equal(preview.phases[0], 1);
  assert.equal(state.phases[0], 0);
});

test('solver proves the sample chamber solvable', () => {
  const result = solve(level, { maxStates: 50000, weight: 1, rates: [0, 1] });
  assert.equal(result.solved, true);
  assert.ok(result.moves > 0);
});

test('state keys are stable and complete', () => {
  const state = createState(level);
  const key = stateKey(state);
  assert.equal(key, stateKey(createState(level)));
  const moved = applyAction(level, state, { type: 'move', dir: 'right' }).state;
  assert.notEqual(key, stateKey(moved));
});
