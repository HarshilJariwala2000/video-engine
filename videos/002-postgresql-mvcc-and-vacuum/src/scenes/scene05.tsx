import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, draw, fadeIn, fadeTo, swap, termCard} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {bank, coffee, link, padlock, stopSign} from '../lib/figures';
import {C, DIM, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene05', 'ATTEMPT 1: OVERWRITE', {fadeLabel: false});
  const b = bank({visible: true});
  const lock = padlock({y: -222});
  const card = termCard('lock = do not disturb');
  const stop = stopSign({y: 250});
  const saved = box({x: -400, y: 280, w: 470, h: 64, title: 'saved old values: alice 100, bob 100', size: 18, dashed: true});
  const toA = link([[-400, 246], [-400, -135], [-162, -135]], C.accent);
  const toB = link([[-330, 246], [-330, -45], [-162, -45]], C.accent);
  const cup = coffee({x: 400, y: 270});
  const cl = checklist({state: ['', '', 'fail', '']});
  s.stage.add([b.group, lock.node, card, stop.node, saved.node, toA, toB, cup]);
  view.add(cl.node);

  // "The textbook fix is a lock:"
  yield* s.at('fix');
  yield* fadeIn(lock.node);

  // "a do not disturb sign on the rows."
  yield* s.at('sign');
  yield* fadeIn(card);

  // "While the report reads, the payment waits."
  yield* s.at('while');
  b.rA.stroke(C.text);
  b.rB.stroke(C.text);
  yield* all(draw(b.rA), draw(b.rB), lock.body.stroke(C.accent, T.base), lock.shackle.stroke(C.accent, T.base),
    fadeTo(DIM, b.pay.node), fadeIn(b.pay.wait));
  yield* b.pay.pulse();

  // "While the payment writes, the report waits."
  yield* s.at('writes');
  yield* all(fadeTo(0, b.rA, b.rB), fadeTo(DIM, b.report.node), fadeIn(b.report.wait),
    b.pay.node.opacity(1, T.base), b.pay.wait.opacity(0, T.base), draw(b.pA), draw(b.pB));
  yield* all(swap(b.alice.bal, '50'), swap(b.bob.bal, '150'));

  // "Every total comes out clean."
  yield* s.at('clean');
  b.report.sum.text('sum: 200').fill(C.good);
  yield* all(b.report.sum.opacity(1, T.fast), cl.check(2));

  // "But now everyone is politely waiting for everyone else. It's a four-way stop, for data."
  yield* s.at('but');
  yield* all(fadeTo(0, b.pA, b.pB, b.report.sum), fadeTo(DIM, b.pay.node), fadeIn(b.pay.wait, stop.node));
  yield* all(b.report.pulse(1.2), b.pay.pulse(1.2));
  yield* all(b.report.pulse(1.2), b.pay.pulse(1.2));

  // "So much for the first two boxes."
  yield* s.at('fail');
  yield* sequence(0.2, cl.fail(0), cl.fail(1));

  // "And undo means saving the old values somewhere,"
  yield* s.at('undo');
  yield* fadeIn(saved.node);

  // "then copying them back, one row at a time."
  yield* s.at('back');
  yield* draw(toA);
  yield* swap(b.alice.bal, '100');
  yield* draw(toB);
  yield* swap(b.bob.bal, '100');

  // "On a million rows, that's not instant. That's a coffee break."
  yield* s.at('four');
  yield* all(cl.fail(3), fadeTo(0, toA, toB), fadeIn(cup));

  // lock, saved values, stop sign and waiting bars carry into scene 06
  yield* s.end([card, cup]);
});
