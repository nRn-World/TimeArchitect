// Deterministic simulation of a Time Architect chamber.
// One player move (or wait) advances the world clock by exactly one tick.
// Time controls change an object's rate and never advance the clock.
import { DIRS, TILE, controlledTileOpen, isWalkable, mod, tileAt } from './level.js';

export const TIME_ACTIONS = Object.freeze({
  rewind: -1,
  pause: 0,
  play: 1,
  fast: 2
});

export function createState(level) {
  return {
    px: level.start.x,
    py: level.start.y,
    facing: 'down',
    phases: level.objects.map((o) => o.phase),
    rates: level.objects.map((o) => o.rate),
    got: level.anchors.map(() => false),
    moves: 0,
    dead: false,
    won: false,
    failReason: null
  };
}

export function cloneState(state) {
  return {
    px: state.px,
    py: state.py,
    facing: state.facing,
    phases: state.phases.slice(),
    rates: state.rates.slice(),
    got: state.got.slice(),
    moves: state.moves,
    dead: state.dead,
    won: state.won,
    failReason: state.failReason
  };
}

export function collectedCount(state) {
  return state.got.reduce((sum, flag) => sum + (flag ? 1 : 0), 0);
}

/** Positions occupied by drones for the current phases. */
export function droneTiles(level, state) {
  const result = [];
  level.objects.forEach((obj, index) => {
    if (obj.kind !== 'drone') return;
    const step = mod(state.phases[index], obj.path.length);
    result.push({ x: obj.path[step].x, y: obj.path[step].y, index });
  });
  return result;
}

/** Advances every clock by its own rate. No collision handling. */
export function advancePhases(level, state) {
  for (let i = 0; i < level.objects.length; i += 1) {
    const obj = level.objects[i];
    state.phases[i] = mod(state.phases[i] + state.rates[i], obj.period);
  }
}

/** Read-only prediction of the next clock tick, used by the UI ghost overlay. */
export function previewTick(level, state) {
  const next = cloneState(state);
  advancePhases(level, next);
  return { phases: next.phases, drones: droneTiles(level, next) };
}

export function activeBridges(level, state) {
  const tiles = [];
  level.controlMap.forEach((control, key) => {
    if (control.kind !== 'bridge') return;
    const obj = level.objects[control.index];
    if (!obj.openWhen.includes(state.phases[control.index])) return;
    tiles.push({ x: key % level.w, y: Math.floor(key / level.w) });
  });
  return tiles;
}

function collect(level, state, events) {
  level.anchors.forEach((anchor, index) => {
    if (state.got[index]) return;
    if (anchor.x !== state.px || anchor.y !== state.py) return;
    state.got[index] = true;
    events.push({ type: 'collect', index, x: anchor.x, y: anchor.y });
  });
}

function tick(level, state, events) {
  advancePhases(level, state);
  events.push({ type: 'tick', phases: state.phases.slice() });

  // A chrono tile that closes beneath the Architect unmakes them.
  const standingOn = tileAt(level, state.px, state.py);
  if ((standingOn === TILE.GATE || standingOn === TILE.BRIDGE) && !controlledTileOpen(level, state, state.px, state.py)) {
    state.dead = true;
    state.failReason = standingOn === TILE.BRIDGE ? 'fell' : 'sealed';
    events.push({ type: 'fail', reason: state.failReason });
    return;
  }

  const drones = droneTiles(level, state);
  const hit = drones.find((d) => d.x === state.px && d.y === state.py);
  if (hit) {
    state.dead = true;
    state.failReason = 'drone';
    events.push({ type: 'fail', reason: 'drone', objectIndex: hit.index });
  }
}

export function isSolved(state) {
  return state.won;
}

/**
 * Applies one action.
 * @returns {{state: object, ok: boolean, events: Array}}
 * ok=false means the action was rejected and the state is unchanged.
 */
export function applyAction(level, state, action) {
  if (!action || state.won || state.dead) return { state, ok: false, events: [] };

  if (action.type === 'setRate') {
    const index = level.objects.findIndex((o) => o.id === action.id);
    if (index < 0) return { state, ok: false, events: [] };
    const target = level.objects[index];
    if (target.controllable === false) return { state, ok: false, events: [{ type: 'reject', reason: 'locked', index }] };
    if (![-1, 0, 1, 2].includes(action.rate)) return { state, ok: false, events: [] };
    if (state.rates[index] === action.rate) return { state, ok: false, events: [] };
    if (action.rate === 0) {
      const alreadyHeld = level.objects.some(
        (obj, i) => i !== index && obj.controllable !== false && state.rates[i] === 0
      );
      if (alreadyHeld) {
        return { state, ok: false, events: [{ type: 'reject', reason: 'singleFreeze', index }] };
      }
    }
    const next = cloneState(state);
    next.rates[index] = action.rate;
    return { state: next, ok: true, events: [{ type: 'rate', index, rate: action.rate }] };
  }

  if (action.type === 'move') {
    const dir = DIRS[action.dir];
    if (!dir) return { state, ok: false, events: [] };
    const nx = state.px + dir.x;
    const ny = state.py + dir.y;
    const events = [];
    if (!isWalkable(level, state, nx, ny)) {
      return { state, ok: false, events: [{ type: 'bump', dir: action.dir, x: nx, y: ny }] };
    }
    if (droneTiles(level, state).some((d) => d.x === nx && d.y === ny)) {
      return { state, ok: false, events: [{ type: 'bump', dir: action.dir, x: nx, y: ny, hazard: true }] };
    }
    const next = cloneState(state);
    const from = { x: next.px, y: next.py };
    next.px = nx;
    next.py = ny;
    next.facing = action.dir;
    next.moves += 1;
    events.push({ type: 'step', from, to: { x: nx, y: ny } });
    collect(level, next, events);
    if (next.got.every(Boolean)) {
      next.won = true;
      events.push({ type: 'win' });
      return { state: next, ok: true, events };
    }
    tick(level, next, events);
    return { state: next, ok: true, events };
  }

  if (action.type === 'wait') {
    const next = cloneState(state);
    next.moves += 1;
    const events = [{ type: 'wait' }];
    tick(level, next, events);
    return { state: next, ok: true, events };
  }

  return { state, ok: false, events: [] };
}

/** Compact key for solver visited sets. */
export function stateKey(state) {
  return `${state.px},${state.py}|${state.phases.join('.')}|${state.rates.join('.')}|${state.got.map((g) => (g ? 1 : 0)).join('')}`;
}

export function describeTile(level, x, y) {
  return tileAt(level, x, y) === TILE.BRIDGE ? 'bridge' : 'tile';
}
