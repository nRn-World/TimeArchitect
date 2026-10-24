// Solvability and par search for Time Architect chambers.
// A* over (position, dial phases, rates, anchors). Rate edits cost nothing,
// moves and waits cost one tick. The Manhattan-to-nearest-anchor heuristic
// keeps the search focused on the remaining objective.
import { RATE_VALUES } from './level.js';
import { applyAction, createState, stateKey } from './sim.js';

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

/**
 * @returns {{solved: boolean, moves: number|null, expanded: number, exhausted: boolean}}
 */
export function solve(level, { allowTimeControls = true, maxStates = 400000, weight = 2, rates = RATE_VALUES } = {}) {
  const start = createState(level);
  if (start.got.every(Boolean)) return { solved: true, moves: 0, expanded: 0, exhausted: false };

  const startKey = stateKey(start);
  const dist = new Map([[startKey, 0]]);
  const heap = new MinHeap();
  heap.push({ state: start, g: 0, f: weight * heuristic(level, start) });
  let expanded = 0;

  while (heap.size > 0) {
    const node = heap.pop();
    const key = stateKey(node.state);
    if (dist.get(key) !== node.g) continue;

    if (node.state.won) return { solved: true, moves: node.g, expanded, exhausted: false };
    if (expanded >= maxStates) return { solved: false, moves: null, expanded, exhausted: true };
    expanded += 1;

    const relax = (nextState, cost) => {
      const nextKey = stateKey(nextState);
      const nextG = node.g + cost;
      const known = dist.get(nextKey);
      if (known !== undefined && known <= nextG) return;
      dist.set(nextKey, nextG);
      heap.push({ state: nextState, g: nextG, f: nextG + weight * heuristic(level, nextState) });
    };

    if (allowTimeControls) {
      for (const obj of level.objects) {
        if (obj.controllable === false) continue;
        for (const rate of rates) {
          if (node.state.rates[obj.index] === rate) continue;
          const attempt = applyAction(level, node.state, { type: 'setRate', id: obj.id, rate });
          if (attempt.ok) relax(attempt.state, 0);
        }
      }
    }

    for (const dir of MOVE_DIRS) {
      const attempt = applyAction(level, node.state, { type: 'move', dir });
      if (attempt.ok) relax(attempt.state, 1);
    }

    const wait = applyAction(level, node.state, { type: 'wait' });
    if (wait.ok) relax(wait.state, 1);
  }

  return { solved: false, moves: null, expanded, exhausted: false };
}
