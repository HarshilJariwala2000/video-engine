import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, fadeIn, fadeTo, mono, sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {diskBar} from '../lib/figures';
import {C, DIM, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene19', 'THE BIG IDEA');
  const head = mono('Postgres =', {x: -820, y: -330, size: 34, align: 'left'});
  const rowY = [-255, -195, -135, -75];
  const rows = [
    'UPDATE → new version',
    'DELETE → DELETED BY stamp',
    'query  → snapshot photo',
    'VACUUM → frees what no photo sees',
  ].map((t, i) => mono(t, {x: -780, y: rowY[i], size: 28, align: 'left'}));
  const oldCard = box({x: 120, y: rowY[0], w: 190, h: 44, title: 'alice 100', size: 20, color: C.dim});
  const strike = (<Line points={[[40, rowY[0]], [200, rowY[0]]]} stroke={C.bad} lineWidth={3} end={0} />) as Line;
  const newCard = box({x: 340, y: rowY[0], w: 190, h: 44, title: 'alice 50', size: 20, stroke: C.accent});
  const aha = sans('Postgres never changes a row.', {y: 40, size: 60, fill: C.accent});
  const instead = sans('It writes a new one,', {y: 120, size: 40});
  const readers = sans('which is why readers never block writers,', {y: 190, size: 40, fill: C.good});
  const grows = sans('and why the table grows until vacuum cleans up', {x: -150, y: 265, size: 36});
  const disk = diskBar({x0: 330, y: 265, W: 200, gb: 5});
  const cl = checklist({state: ['ok', 'ok', 'ok', 'ok']});
  s.stage.add([head, ...rows, oldCard.node, strike, newCard.node, aha, instead, readers, grows, disk.node]);
  view.add(cl.node);

  // "So, putting it all together."
  yield* s.at('together');
  yield* fadeIn(head);

  // "An update writes a new version."
  yield* s.at('update');
  yield* fadeIn(rows[0], oldCard.node);
  yield* all(strike.end(1, T.fast), fadeIn(newCard.node));

  // "A delete stamps an old one."
  yield* s.at('delete');
  yield* fadeIn(rows[1]);

  // "Every query reads through its own photo."
  yield* s.at('photo');
  yield* fadeIn(rows[2]);

  // "And vacuum sweeps up whatever no photo can see."
  yield* s.at('vacuum');
  yield* fadeIn(rows[3]);

  // "Postgres never changes a row."
  yield* s.at('aha');
  yield* all(fadeTo(DIM, head, ...rows, oldCard.node, strike, newCard.node), fadeIn(aha));

  // "It writes a new one,"
  yield* s.at('instead');
  yield* fadeIn(instead);

  // "which is why readers never block writers,"
  yield* s.at('readers');
  yield* all(fadeIn(readers), sequence(0.2, cl.pulse(0), cl.pulse(1)));

  // "and why your table grows until vacuum cleans up."
  yield* s.at('grows');
  yield* fadeIn(grows, disk.node);
  yield* disk.gb(8, T.slow);

  yield* s.end();
});
