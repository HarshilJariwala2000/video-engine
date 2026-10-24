import {Line, makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, fadeTo, mono, sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {C, DIM, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene20', 'THE BIG IDEA');
  const X = -560;
  const head = sans('container =', {x: X, y: -290, size: 56, align: 'left'});
  const rows = [
    '  a normal process',
    '+ namespaces → what it can see',
    '+ cgroups    → how much it can use',
    '+ image      → its own files',
  ].map((t, i) => mono(t, {x: X, y: -180 + i * 70, size: 36, align: 'left'}));
  const box = [3, 1, 2, 0]; // which checklist box each row answers
  const not = mono('not a tiny computer', {x: X, y: 150, size: 32, fill: C.dim, align: 'left'});
  const strike = (<Line points={[[X, 150], [X + 19 * 19.2, 150]]} stroke={C.bad} lineWidth={4} end={0} />) as Line;
  const lie = sans('an ordinary process the kernel is lying to.', {x: X, y: 250, size: 50, fill: C.accent, align: 'left'});
  const cl = checklist({state: ['ok', 'ok', 'ok', 'ok']});
  s.stage.add([head, ...rows, not, strike, lie]);
  view.add(cl.node);

  function* row(i: number) {
    yield* all(
      rows[i].opacity(1, T.base), rows[i].fill(C.accent, T.base),
      ...(i > 0 ? [rows[i - 1].fill(C.text, T.base)] : []),
      cl.pulse(box[i]),
    );
  }

  // "So let's put it all together."
  yield* s.at('together');
  yield* fadeIn(head);
  // "A container is a normal process."
  yield* s.at('proc');
  yield* row(0);
  // "Namespaces decide what it can see."
  yield* s.at('ns');
  yield* row(1);
  // "Cgroups decide how much it can use."
  yield* s.at('cg');
  yield* row(2);
  // "And an image gives it its own files."
  yield* s.at('img');
  yield* row(3);
  // "It isn't a tiny computer."
  yield* s.at('not');
  yield* all(rows[3].fill(C.text, T.base), fadeIn(not));
  yield* strike.end(1, T.base);
  // "It's an ordinary process that the kernel is lying to."
  yield* s.at('lie');
  yield* all(fadeIn(lie), fadeTo(DIM, head, ...rows, not, strike));

  yield* s.end();
});
