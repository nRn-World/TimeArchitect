// Level parsing and static tile definitions.
// Pure module: no DOM, no globals. Shared by the game, tests and the solver.
import { mod } from './math.js';
export { mod };

export const TILE = Object.freeze({
  FLOOR: 0,
  WALL: 1,
  VOID: 2,
  ANCHOR: 3,
  GATE: 4,
  BRIDGE: 5,
  PEDESTAL: 6,
  START: 7
});

const CHAR_TILE = {
  '#': TILE.WALL,
  '.': TILE.FLOOR,
  '~': TILE.VOID,
  A: TILE.ANCHOR,
  S: TILE.START,
  G: TILE.GATE,
  B: TILE.BRIDGE,
  D: TILE.PEDESTAL
};

export const RATE_VALUES = Object.freeze([-1, 0, 1, 2]);

const DIRECTIONS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
});

export const DIRS = DIRECTIONS;

/**
 * Turns a level definition (ASCII map + object list) into an immutable,
 * pre-indexed level object ready for simulation and rendering.
 */
export function parseLevel(def) {
  if (!def || !def.id) throw new Error('Level needs an id');
  const rows = def.map;
  if (!Array.isArray(rows) || rows.length < 3) throw new Error(`Level ${def.id}: map too small`);
  const w = rows[0].length;
  const h = rows.length;
  if (rows.some((row) => row.length !== w)) throw new Error(`Level ${def.id}: map rows must share width`);

  const base = new Uint8Array(w * h);
  const anchors = [];
  let start = null;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const char = rows[y][x];
      const tile = CHAR_TILE[char];
      if (tile === undefined) throw new Error(`Level ${def.id}: unknown map char "${char}" at ${x},${y}`);
      if (tile === TILE.START) {
        if (start) throw new Error(`Level ${def.id}: more than one start`);
        start = { x, y };
        base[y * w + x] = TILE.FLOOR;
      } else {
        base[y * w + x] = tile;
        if (tile === TILE.ANCHOR) anchors.push({ x, y, index: anchors.length });
      }
    }
  }
  if (!start) throw new Error(`Level ${def.id}: missing start tile "S"`);

  const objects = (def.objects || []).map((obj, index) => {
    if (!Number.isInteger(obj.period) || obj.period < 2) throw new Error(`Level ${def.id}: object ${obj.id} needs period >= 2`);
    const period = obj.period;
    const phase = mod(obj.phase ?? 0, period);
    const rate = RATE_VALUES.includes(obj.rate ?? 1) ? (obj.rate ?? 1) : 1;
    if (obj.kind === 'dial') {
      if (!Array.isArray(obj.openWhen) || obj.openWhen.length === 0) {
        throw new Error(`Level ${def.id}: dial ${obj.id} needs openWhen`);
      }
      const controls = (obj.controls || []).map((c) => ({ x: c.x, y: c.y, kind: c.kind }));
      if (controls.length === 0) throw new Error(`Level ${def.id}: dial ${obj.id} controls no tiles`);
      return {
        id: obj.id,
        kind: 'dial',
        index,
        x: obj.x,
        y: obj.y,
        period,
        phase,
        rate,
        controllable: obj.controllable !== false,
        openWhen: obj.openWhen.slice().sort((a, b) => a - b),
        controls
      };
    }
    if (obj.kind === 'drone') {
      if (!Array.isArray(obj.path) || obj.path.length < 2) throw new Error(`Level ${def.id}: drone ${obj.id} needs a path`);
      return {
        id: obj.id,
        kind: 'drone',
        index,
        period,
        phase,
        rate,
        controllable: obj.controllable !== false,
        path: obj.path.map((p) => ({ x: p.x, y: p.y }))
      };
    }
    throw new Error(`Level ${def.id}: unknown object kind ${obj.kind}`);
  });

  const controlMap = new Map();
  const usedIds = new Set();
  for (const obj of objects) {
    if (usedIds.has(obj.id)) throw new Error(`Level ${def.id}: duplicate object id ${obj.id}`);
    usedIds.add(obj.id);
    if (obj.kind === 'dial') {
      for (const c of obj.controls) {
        const tile = base[c.y * w + c.x];
        const expected = c.kind === 'bridge' ? TILE.BRIDGE : TILE.GATE;
        if (tile !== expected) {
          throw new Error(`Level ${def.id}: dial ${obj.id} controls ${c.kind} at ${c.x},${c.y} but the map does not match`);
        }
        const key = c.y * w + c.x;
        if (controlMap.has(key)) throw new Error(`Level ${def.id}: tile ${c.x},${c.y} is controlled twice`);
        controlMap.set(key, { index: obj.index, kind: c.kind });
      }
    }
  }

  return Object.freeze({
    id: def.id,
    index: def.index ?? 0,
    titleKey: def.titleKey,
    subtitleKey: def.subtitleKey,
    hintKey: def.hintKey,
    palette: def.palette || 'ink',
    w,
    h,
    base,
    anchors,
    start,
    objects,
    controlMap,
    par: def.par ?? 0
  });
}

export function tileAt(level, x, y) {
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return TILE.VOID;
  return level.base[y * level.w + x];
}

export function isAligned(level, state, x, y) {
  return level.controlMap.get(y * level.w + x);
}

/** True when the dial that owns a tile currently has a phase inside its open window. */
export function controlledTileOpen(level, state, x, y) {
  const control = level.controlMap.get(y * level.w + x);
  if (!control) return false;
  const obj = level.objects[control.index];
  return obj.openWhen.includes(state.phases[control.index]);
}

export function isWalkable(level, state, x, y) {
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return false;
  const tile = level.base[y * level.w + x];
  if (tile === TILE.FLOOR || tile === TILE.ANCHOR || tile === TILE.START) return true;
  if (tile === TILE.GATE || tile === TILE.BRIDGE) return controlledTileOpen(level, state, x, y);
  return false;
}
