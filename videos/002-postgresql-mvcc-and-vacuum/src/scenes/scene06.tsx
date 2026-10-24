import {Line, Node, makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, draw, fadeIn, fadeTo, mono, sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {bank, bump, link, padlock, stopSign} from '../lib/figures';
import {C, DIM, FS, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene06', 'THE BETTER QUESTION');
  // scene 05's last frame: both sides waiting, lock on, old values saved
  const b = bank({visible: true});
  b.report.node.opacity(DIM);
  b.pay.node.opacity(DIM);
  b.report.wait.opacity(1);
  b.pay.wait.opacity(1);
  const lock = padlock({y: -222, color: C.accent});
  lock.node.opacity(1);
  const stop = stopSign({y: 250});
  stop.node.opacity(1);
  const saved = box({x: -400, y: 280, w: 470, h: 64, title: 'saved old values: alice 100, bob 100', size: 18, dashed: true, opacity: 1});
  const oldTag = mono('old alice', {x: -150, y: -186, size: FS.small, fill: C.dim, align: 'left'});
  const never = sans('never overwrite', {x: -120, y: -320, size: 40, fill: C.accent});
  const toNew = link([[555, -80], [162, 45]], C.accent);
  const lanes = (
    <Node y={250} opacity={0}>
      <Line points={[[-130, -22], [130, -22]]} stroke={C.text} lineWidth={3} lineDash={[18, 12]} />
      <Line points={[[-130, 22], [130, 22]]} stroke={C.text} lineWidth={3} lineDash={[18, 12]} />
      {mono('two lanes', {y: 74, size: FS.small, fill: C.dim, opacity: 1})}
    </Node>
  ) as Node;
  const cl = checklist({state: ['fail', 'fail', 'ok', 'fail']});
  s.stage.add([b.group, lock.node, stop.node, saved.node, oldTag, never, toNew, lanes]);
  view.add(cl.node);

  // "Okay. Let's look under the abstraction, and ask a better question."
  yield* s.at('reset');
  yield* all(cl.clear(), lock.node.opacity(0, T.base));

  // "To undo anything, we already need the old value."
  yield* s.at('keep');
  yield* all(saved.node.stroke(C.accent, T.fast), bump(saved.node));

  // "So what if we just never threw it away?"
  yield* s.at('what');
  yield* all(saved.node.position([0, -135], T.slow), saved.node.size([300, 64], T.slow), saved.title.opacity(0, T.fast));
  yield* all(saved.node.opacity(0, T.fast), fadeIn(oldTag));

  // "What if nothing ever got overwritten at all?"
  yield* s.at('never');
  yield* fadeIn(never);

  // "The report keeps reading the old alice."
  yield* s.at('old');
  b.rA.stroke(C.label);
  yield* all(b.report.node.opacity(1, T.base), draw(b.rA), b.alice.rect.stroke(C.dim, T.base));

  // "The payment writes a new alice, right next to her."
  yield* s.at('new');
  yield* all(b.pay.node.opacity(1, T.base), fadeIn(b.page.newA.node));
  yield* draw(toNew);

  // "Nobody waits. It's not a four-way stop anymore. It's two lanes."
  yield* s.at('both');
  yield* fadeTo(0, b.report.wait, b.pay.wait);
  yield* sequence(0.2, stop.node.opacity(0, T.base), lanes.opacity(1, T.base));

  // only alice and bob stay for scene 07
  yield* s.before(0.9);
  yield* b.alice.rect.stroke(C.stroke, 0.4);
  yield* s.end([b.report.node, b.pay.node, b.rA, toNew, b.page.newA.node, oldTag, never, lanes]);
});
