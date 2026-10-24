// Reports solvability, par and time-control necessity for every chamber.
// The search uses pause/play rates for tractability; rewind and fast-forward
// can only shorten the routes found here, never lengthen them.
import { LEVEL_DEFS } from '../src/data/levels.js';
import { parseLevel } from '../src/core/level.js';
import { solve } from '../src/core/solver.js';

let failures = 0;
for (const def of LEVEL_DEFS) {
  const level = parseLevel(def);
  const t0 = Date.now();
  const withTime = solve(level, { allowTimeControls: true, maxStates: 1000000, weight: 1, rates: [0, 1] });
  const t1 = Date.now();
  const withoutTime = solve(level, { allowTimeControls: false, maxStates: 1000000 });
  const t2 = Date.now();
  const ok = withTime.solved && !withoutTime.solved;
  if (!ok) failures += 1;
  console.log(
    `${level.id.padEnd(4)} par(data)=${String(def.par).padStart(3)} solver=${withTime.solved ? String(withTime.moves).padStart(3) : ' -- '} needsTime=${withoutTime.solved ? 'NO ' : 'yes'} states=${String(withTime.expanded).padStart(6)} ${t1 - t0}ms/${t2 - t1}ms ${ok ? 'OK' : 'CHECK'}`
  );
}
process.exitCode = failures ? 1 : 0;
