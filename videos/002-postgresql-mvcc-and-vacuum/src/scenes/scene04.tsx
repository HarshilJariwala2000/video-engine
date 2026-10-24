import {makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, draw, fadeIn, fadeTo, sans, swap} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {bank} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene04', 'ATTEMPT 1: OVERWRITE');
  const b = bank({visible: true});
  const title = sans('overwrite in place', {x: -120, y: -320, size: 40});
  const chip = box({x: -700, y: 160, w: 300, h: 50, title: '+50 from nowhere', size: 20, color: C.bad, stroke: C.bad});
  const cl = checklist();
  s.stage.add([b.group, title, chip.node]);
  view.add(cl.node);

  // "The obvious design: when something changes, overwrite it."
  yield* s.at('obvious');
  yield* fadeIn(title);

  // "The report reads alice: 100."
  yield* s.at('reads');
  b.rA.stroke(C.text);
  yield* draw(b.rA);
  b.report.sum.text('sum: 100');
  yield* b.report.sum.opacity(1, T.fast);

  // "Then the payment lands and overwrites both rows."
  yield* s.at('pay');
  yield* all(draw(b.pA), draw(b.pB), b.rA.opacity(0.3, T.base));

  // "Alice 50, bob 150."
  yield* s.at('after');
  yield* all(swap(b.alice.bal, '50', C.accent), swap(b.bob.bal, '150', C.accent));

  // "Then the report reads bob: 150."
  yield* s.at('bob');
  b.rB.stroke(C.text);
  yield* all(draw(b.rB), fadeTo(0.3, b.pA, b.pB));
  yield* swap(b.report.sum, 'sum: 100 + 150');

  // "Total: 250 dollars."
  yield* s.at('total');
  yield* swap(b.report.sum, 'sum: 250', C.bad);

  // "Fifty dollars just appeared out of thin air."
  yield* s.at('money');
  yield* fadeIn(chip.node);

  // "So much for one clean moment."
  yield* s.at('fail');
  yield* cl.fail(2);

  // reset the rows to 100 / 100 for the next attempt (scene 05 starts there)
  yield* s.before(0.9);
  yield* all(swap(b.alice.bal, '100', C.text), swap(b.bob.bal, '100', C.text));
  yield* s.end([title, chip.node, b.report.sum, b.rA, b.rB, b.pA, b.pB]);
});
