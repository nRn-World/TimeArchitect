// Handcrafted campaign content. Pure data: no DOM.
// Map legend: # wall, . floor, ~ void, S start, A anchor, G chrono gate, B chrono bridge, D dial pedestal.
//
// A dial's `openWhen` lists the phases during which its gates are passable / bridges are solid.
// Rates: -1 rewind, 0 pause, 1 play, 2 fast. Only one object may be paused at a time.
// A controlled tile that closes beneath the Architect unmakes them, so any span longer than
// the dial's open window must be frozen before it is crossed.

const dial = (id, x, y, period, phase, openWhen, controls) => ({
  id,
  kind: 'dial',
  x,
  y,
  period,
  phase,
  rate: 1,
  openWhen,
  controls
});

const drone = (id, phase, path) => ({
  id,
  kind: 'drone',
  period: path.length,
  phase,
  rate: 1,
  path: path.map(([x, y]) => ({ x, y }))
});

const line = (x1, y1, x2, y2) => {
  const points = [];
  if (y1 === y2) {
    const step = x2 >= x1 ? 1 : -1;
    for (let x = x1; x !== x2 + step; x += step) points.push([x, y1]);
  } else {
    const step = y2 >= y1 ? 1 : -1;
    for (let y = y1; y !== y2 + step; y += step) points.push([x1, y]);
  }
  return points;
};

const patrol = (from, to) => {
  const forward = line(from[0], from[1], to[0], to[1]);
  return forward.concat(forward.slice(1, -1).reverse());
};

const bridges = (cells) => cells.map(([x, y]) => ({ x, y, kind: 'bridge' }));
const gates = (cells) => cells.map(([x, y]) => ({ x, y, kind: 'gate' }));

export const LEVEL_DEFS = [
  {
    id: 'c01',
    titleKey: 'level.c01.title',
    subtitleKey: 'level.c01.subtitle',
    hintKey: 'hint.bridgeFreeze',
    palette: 'ink',
    par: 11,
    map: [
      '#########',
      '#S......#',
      '#.......#',
      '#.....D.#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#.......#',
      '#.....A.#',
      '#########'
    ],
    objects: [dial('d1', 6, 3, 4, 2, [0, 1], bridges([[4, 4], [4, 5]]))]
  },
  {
    id: 'c02',
    titleKey: 'level.c02.title',
    subtitleKey: 'level.c02.subtitle',
    hintKey: 'hint.gateWindow',
    palette: 'brass',
    par: 12,
    map: [
      '#########',
      '#S......#',
      '#.......#',
      '#.......#',
      '####G####',
      '####G####',
      '#.......#',
      '#A.....D#',
      '#########'
    ],
    objects: [dial('d1', 7, 7, 6, 3, [0, 1], gates([[4, 4], [4, 5]]))]
  },
  {
    id: 'c03',
    titleKey: 'level.c03.title',
    subtitleKey: 'level.c03.subtitle',
    hintKey: 'hint.drone',
    palette: 'verdant',
    par: 12,
    map: [
      '#########',
      '#S......#',
      '#......D#',
      '#.......#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#.......#',
      '#A......#',
      '#########'
    ],
    objects: [
      dial('d1', 7, 2, 4, 1, [0, 1], bridges([[4, 4], [4, 5]])),
      drone('p1', 0, patrol([1, 2], [6, 2]))
    ]
  },
  {
    id: 'c04',
    titleKey: 'level.c04.title',
    subtitleKey: 'level.c04.subtitle',
    hintKey: 'hint.twoDials',
    palette: 'ink',
    par: 12,
    map: [
      '#########',
      '#S......#',
      '#.....D.#',
      '#.......#',
      '####G####',
      '#..D....#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#.....A.#',
      '#########'
    ],
    objects: [
      dial('d1', 6, 2, 6, 4, [3, 4], gates([[4, 4]])),
      dial('d2', 3, 5, 4, 2, [0, 1], bridges([[4, 6], [4, 7]]))
    ]
  },
  {
    id: 'c05',
    titleKey: 'level.c05.title',
    subtitleKey: 'level.c05.subtitle',
    hintKey: 'hint.exitGate',
    palette: 'brass',
    par: 12,
    map: [
      '#########',
      '#S......#',
      '#..D....#',
      '#.......#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#.......#',
      '#A..G..D#',
      '#########'
    ],
    objects: [
      dial('d1', 3, 2, 4, 3, [1, 2], bridges([[4, 4], [4, 5]])),
      dial('d2', 7, 7, 5, 3, [1, 2], gates([[4, 7]]))
    ]
  },
  {
    id: 'c06',
    titleKey: 'level.c06.title',
    subtitleKey: 'level.c06.subtitle',
    hintKey: 'hint.twoDrones',
    palette: 'verdant',
    par: 18,
    map: [
      '#########',
      '#S......#',
      '#.......#',
      '#D......#',
      '####G####',
      '####G####',
      '#.......#',
      '#A.....A#',
      '#########'
    ],
    objects: [
      dial('d1', 1, 3, 6, 5, [1, 2], gates([[4, 4], [4, 5]])),
      drone('p1', 0, patrol([1, 2], [7, 2])),
      drone('p2', 5, patrol([1, 6], [7, 6]))
    ]
  },
  {
    id: 'c07',
    titleKey: 'level.c07.title',
    subtitleKey: 'level.c07.subtitle',
    hintKey: 'hint.crossfire',
    palette: 'ember',
    par: 18,
    map: [
      '#########',
      '#S......#',
      '#.....D.#',
      '#.......#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#.......#',
      '#A.....A#',
      '#########'
    ],
    objects: [
      dial('d1', 6, 2, 4, 0, [0, 1], bridges([[4, 4], [4, 5]])),
      drone('p1', 0, patrol([1, 3], [7, 3])),
      drone('p2', 6, patrol([1, 6], [7, 6]))
    ]
  },
  {
    id: 'c08',
    titleKey: 'level.c08.title',
    subtitleKey: 'level.c08.subtitle',
    hintKey: 'hint.sequence',
    palette: 'ink',
    par: 21,
    map: [
      '#########',
      '#S......#',
      '#.....D.#',
      '#.......#',
      '####G####',
      '####G####',
      '#......D#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#.......#',
      '#A.....A#',
      '#########'
    ],
    objects: [
      dial('d1', 7, 6, 4, 2, [0, 1], gates([[4, 4], [4, 5]])),
      dial('d2', 6, 2, 6, 1, [0, 1, 2], bridges([[4, 7], [4, 8]]))
    ]
  },
  {
    id: 'c09',
    titleKey: 'level.c09.title',
    subtitleKey: 'level.c09.subtitle',
    hintKey: 'hint.longSpan',
    palette: 'brass',
    par: 13,
    map: [
      '#########',
      '#S......#',
      '#.....D.#',
      '#.......#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#.......#',
      '#A......#',
      '#########'
    ],
    objects: [
      dial('d1', 6, 2, 5, 1, [0, 1, 2], bridges([[4, 4], [4, 5], [4, 6]])),
      drone('p1', 0, patrol([1, 6], [7, 6]))
    ]
  },
  {
    id: 'c10',
    titleKey: 'level.c10.title',
    subtitleKey: 'level.c10.subtitle',
    hintKey: 'hint.hunt',
    palette: 'ember',
    par: 20,
    map: [
      '#########',
      '#S......#',
      '#.......#',
      '#D......#',
      '####G####',
      '####G####',
      '#.......#',
      '#A.....A#',
      '#########'
    ],
    objects: [
      dial('d1', 1, 3, 6, 5, [1, 2], gates([[4, 4], [4, 5]])),
      drone('p1', 0, patrol([1, 2], [7, 2])),
      drone('p2', 3, patrol([1, 7], [7, 7]))
    ]
  },
  {
    id: 'c11',
    titleKey: 'level.c11.title',
    subtitleKey: 'level.c11.subtitle',
    hintKey: 'hint.narrow',
    palette: 'verdant',
    par: 21,
    map: [
      '#########',
      '#S......#',
      '#.......#',
      '#D......#',
      '####G####',
      '####G####',
      '#.......#',
      '#..D....#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#A.....A#',
      '#########'
    ],
    objects: [
      dial('d1', 1, 3, 4, 3, [0, 1], gates([[4, 4], [4, 5]])),
      dial('d2', 3, 7, 5, 4, [0, 1, 2], bridges([[4, 8], [4, 9]])),
      drone('p1', 2, patrol([1, 6], [7, 6]))
    ]
  },
  {
    id: 'c12',
    titleKey: 'level.c12.title',
    subtitleKey: 'level.c12.subtitle',
    hintKey: 'hint.finale',
    palette: 'cosmic',
    par: 21,
    map: [
      '#########',
      '#S......#',
      '#.......#',
      '#.D.....#',
      '####G####',
      '####G####',
      '#..D....#',
      '#~~~B~~~#',
      '#~~~B~~~#',
      '#.......#',
      '#A.....A#',
      '#########'
    ],
    objects: [
      dial('d1', 2, 3, 4, 1, [0, 1], gates([[4, 4], [4, 5]])),
      dial('d2', 3, 6, 6, 0, [0, 1, 2], bridges([[4, 7], [4, 8]])),
      drone('p1', 0, patrol([1, 2], [7, 2])),
      drone('p2', 4, patrol([1, 9], [7, 9]))
    ]
  }
];

export default LEVEL_DEFS;
