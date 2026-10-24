import {makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {draw, fadeIn, mono, swap} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {actor, clockIcon, link, mvccPage, padlock, snapshot} from '../lib/figures';
import {C, DIM, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene11', 'SNAPSHOTS', {fadeLabel: false});
  // scene 10's last frame
  const p = mvccPage({wide: true, frame: true, show: 3, stamps: true, headers: true});
  p.oldB.df.value.text('—');
  p.oldB.node.opacity(DIM);
  p.newA.node.opacity(DIM);
  p.oldA.df.value.fill(C.accent);
  p.newA.cf.value.fill(C.accent);
  p.newB.cf.value.fill(C.accent);

  const rep = actor({x: -720, title: 'QUERY', visible: true});
  rep.sum.y(215);
  const snapR = snapshot({x: -720, y: 100, lines: [['finished: 1…41', C.good], ['42: not yet', C.dim]]});
  snapR.node.opacity(1);
  const q2 = actor({x: 720, title: 'QUERY 2'});
  q2.sum.y(215);
  const snap2 = snapshot({x: 720, y: 100, lines: [['finished: 1…42', C.good], ['42: finished', C.good]]});
  const rA = link([[-582, -95], [-405, -135]], C.accent);
  const rB = link([[-582, -85], [-405, -45]], C.accent);
  const qA = link([[582, -95], [405, 45]], C.accent);
  const qB = link([[582, -85], [405, 135]], C.accent);
  const clock = clockIcon({x: -150, y: 280, label: 'same instant'});
  const nobody = mono('nobody waited', {x: 110, y: 280, size: 24, fill: C.label});
  const noLock = padlock({x: 330, y: 280, crossed: true});
  const cl = checklist();
  s.stage.add([p.group, rep.node, rep.sum, snapR.node, q2.node, q2.sum, snap2.node, rA, rB, qA, qB, clock, nobody, noLock.node]);
  view.add(cl.node);

  // "Back to our report."
  yield* s.at('report');
  p.newB.node.opacity(0);
  yield* all(swap(rep.title, 'REPORT'), p.newB.node.opacity(DIM, T.base), swap(p.oldB.df.value, '42', C.accent));

  // "It took its photo before ticket 42 finished."
  yield* s.at('photo');
  yield* chain(snapR.lines[1].fill(C.accent, T.fast), snapR.lines[1].fill(C.dim, 0.6));

  // "So it sees the old alice, 100,"
  yield* s.at('alice');
  yield* draw(rA);
  rep.sum.text('100');
  yield* rep.sum.opacity(1, T.fast);

  // "and the old bob, 100."
  yield* s.at('bob');
  yield* all(p.oldB.node.opacity(1, T.base), draw(rB));
  yield* swap(rep.sum, '100 + 100');

  // "Total: 200."
  yield* s.at('total');
  yield* swap(rep.sum, 'sum: 200', C.good);

  // "Now a second query starts just after 42 finishes."
  yield* s.at('second');
  yield* fadeIn(q2.node, snap2.node);

  // "It sees alice 50 and bob 150."
  yield* s.at('sees');
  yield* all(p.newA.node.opacity(1, T.base), p.newB.node.opacity(1, T.base), draw(qA), draw(qB));

  // "Also 200."
  yield* s.at('also');
  q2.sum.text('sum: 200').fill(C.good);
  yield* q2.sum.opacity(1, T.base);

  // "Same table, same instant, two different answers, and both are right."
  yield* s.at('same');
  yield* all(fadeIn(clock), ...[rA, rB, qA, qB].map(l => chain(l.lineWidth(5, T.fast), l.lineWidth(2, T.base))));

  // "And nobody waited for anybody."
  yield* s.at('nobody');
  yield* fadeIn(nobody);

  // "Three out of four, without a single lock."
  yield* s.at('boxes');
  yield* all(sequence(0.2, cl.check(0), cl.check(1), cl.check(2)), fadeIn(noLock.node));
  yield* sequence(0.1, noLock.cross.a.end(1, T.fast), noLock.cross.b.end(1, T.fast));

  // only the page carries into scene 12
  yield* s.end([rep.node, rep.sum, snapR.node, q2.node, q2.sum, snap2.node, rA, rB, qA, qB, clock, nobody, noLock.node]);
});
