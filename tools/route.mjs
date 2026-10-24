// Prints the exact action sequence that solves a chamber, for QA replay.
// Same search space as src/core/solver.js, but keeps parent pointers so the
// route can be replayed in the running game.
//
// Usage: node tools/route.mjs c01
import { LEVEL_DEFS } from '../src/data/levels.js';
import { parseLevel } from '../src/core/level.js';
import { applyAction, createState, stateKey } from '../src/core/sim.js';

const MOVE_DIRS = ['up', 'down', 'left', 'right'];

class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(node) {
    const items = this.items;
    items.push(node);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent].f <= items[i].f) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let best = i;
        if (left < items.length && items[left].f < items[best].f) best = left;
        if (right < items.length && items[right].f < items[best].f) best = right;
        if (best === i) break;
        [items[best], items[i]] = [items[i], items[best]];
        i = best;
      }
    }
    return top;
  }
}

function heuristic(level, state) {
  let best = Infinity;
  for (let i = 0; i < level.anchors.length; i += 1) {
    if (state.got[i]) continue;
    const anchor = level.anchors[i];
    const distance = Math.abs(anchor.x - state.px) + Math.abs(anchor.y - state.py);
    if (distance < best) best = distance;
  }
  return Number.isFinite(best) ? best : 0;
}

function route(level, { maxStates = 1000000, rates = [0, 1] } = {}) {
  const start = createState(level);
  const startKey = stateKey(start);
  const best = new Map([[startKey, 0]]);
  const parent = new Map();
  const heap = new MinHeap();
  heap.push({ state: start, g: 0, f: heuristic(level, start) });
  let expanded = 0;

  while (heap.size > 0) {
    const node = heap.pop();
    const key = stateKey(node.state);
    if (best.get(key) !== node.g) continue;
    if (node.state.won) {
      const actions = [];
      let cursor = key;
      while (parent.has(cursor)) {
        const step = parent.get(cursor);
        actions.push(step.action);
        cursor = step.from;
      }
      actions.reverse();
      return { solved: true, actions, ticks: node.g, expanded };
    }
    if (expanded >= maxStates) return { solved: false, expanded };

    const relax = (nextState, action, cost) => {
      const nextKey = stateKey(nextState);
      const nextG = node.g + cost;
      const known = best.get(nextKey);
      if (known !== undefined && known <= nextG) return;
      best.set(nextKey, nextG);
      parent.set(nextKey, { from: key, action });
      heap.push({ state: nextState, g: nextG, f: nextG + heuristic(level, nextState) });
    };

    expanded += 1;

    for (const obj of level.objects) {
      if (obj.controllable === false) continue;
      for (const rate of rates) {
        if (node.state.rates[obj.index] === rate) continue;
        const action = { type: 'setRate', id: obj.id, rate };
        const attempt = applyAction(level, node.state, action);
        if (attempt.ok) relax(attempt.state, action, 0);
      }
    }

    for (const dir of MOVE_DIRS) {
      const action = { type: 'move', dir };
      const attempt = applyAction(level, node.state, action);
      if (attempt.ok) relax(attempt.state, action, 1);
    }

    const wait = { type: 'wait' };
    const attempt = applyAction(level, node.state, wait);
    if (attempt.ok) relax(attempt.state, wait, 1);
  }

  return { solved: false, expanded };
}

const id = process.argv[2];
if (id) {
  const def = LEVEL_DEFS.find((candidate) => candidate.id === id);
  if (!def) {
    console.error(`Unknown chamber: ${id}`);
    process.exitCode = 1;
  } else {
    const level = parseLevel(def);
    const result = route(level);
    if (!result.solved) {
      console.error(`No route found for ${id}`);
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify({ id, ticks: result.ticks, expanded: result.expanded, actions: result.actions }, null, 2));
    }
  }
} else {
  for (const def of LEVEL_DEFS) {
    const level = parseLevel(def);
    const result = route(level);
    console.log(`${def.id} ${result.solved ? `${result.actions.length} actions / ${result.ticks} ticks` : 'NO ROUTE'}`);
  }
}
