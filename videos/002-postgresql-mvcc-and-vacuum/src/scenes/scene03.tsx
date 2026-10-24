import {makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {draw, fadeIn, sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {bank} from '../lib/figures';
import {T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene03', 'WHAT WE NEED');
  const b = bank();
  const build = sans("let's build it ourselves", {y: -330, size: 40});
  const cl = checklist({place: 'center', visible: false});
  s.stage.add([b.group, build]);
  view.add(cl.node);

  // "Let's pretend we're building the database ourselves."
  yield* s.at('build');
  yield* fadeIn(build);

  // "Two rows: alice and bob, 100 dollars each."
  yield* s.at('rows');
  yield* fadeIn(b.alice.node, b.bob.node);

  // "A report is adding up all the money."
  yield* s.at('report');
  yield* fadeIn(b.report.node);
  yield* all(draw(b.rA), draw(b.rB));

  // "At the exact same moment, a payment moves 50 dollars from alice to bob."
  yield* s.at('pay');
  yield* fadeIn(b.pay.node);
  yield* all(draw(b.pA), draw(b.pB));

  // "To survive that, our database needs four things."
  yield* s.at('four');
  yield* all(b.group.opacity(0.08, T.base), build.opacity(0, T.base), cl.title.opacity(1, T.base));

  // One / Two / Three / Four
  yield* s.at('r1');
  yield* cl.reveal(0);
  yield* s.at('r2');
  yield* cl.reveal(1);
  yield* s.at('r3');
  yield* cl.reveal(2);
  yield* s.at('r4');
  yield* cl.reveal(3);

  // panel moves to its permanent home; the two rows come back for scene 04
  yield* s.before(1.0);
  [b.rA, b.rB, b.pA, b.pB].forEach(l => l.opacity(0));
  yield* all(cl.toCorner(0.7), b.group.opacity(1, 0.7));
  yield* s.end([]);
});
