import {Line, Node, Rect, makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, drawCross, crossMark, fadeIn, fadeTo, frame, mono, sans, terminal, type} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {actor, mvccPage} from '../lib/figures';
import {C, DIM, FS, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene12', 'ROLLBACK');
  // scene 11's last frame: all four versions
  const p = mvccPage({wide: true, frame: true, show: 4, stamps: true, headers: true});
  const olds = [p.oldA, p.oldB], news = [p.newA, p.newB];
  olds.forEach(c => c.df.value.fill(C.accent));
  news.forEach(c => c.cf.value.fill(C.accent));

  const pay = actor({x: 720, title: 'PAYMENT #42'});
  const err = box({x: 720, y: 20, w: 200, h: 44, title: 'error!', size: 20, color: C.bad, stroke: C.bad});
  const term = terminal({y: 300, w: 480});
  const cross = crossMark({s: 2.4});
  const eraser = (
    <Node x={-690} y={-110} opacity={0}>
      <Rect width={100} height={46} radius={6} rotation={-20} stroke={C.text} lineWidth={3}>
        <Line points={[[-14, -23], [-14, 23]]} stroke={C.text} lineWidth={3} />
      </Rect>
      {cross.node}
      {mono('nothing erased', {y: 64, size: FS.small, fill: C.dim, opacity: 1})}
    </Node>
  ) as Node;
  const status = frame({x: -690, y: 150, w: 330, h: 130, tag: 'status list'});
  const l41 = mono('41   committed', {x: -820, y: 125, size: 24, fill: C.label, align: 'left', opacity: 1});
  const l42 = mono('', {x: -820, y: 175, size: 24, fill: C.bad, align: 'left', opacity: 1});
  const lines = (<Node opacity={0}>{l41}{l42}</Node>) as Node;
  const undo = sans('undo = 1 line', {y: 300, size: 48, fill: C.accent});
  const cl = checklist({state: ['ok', 'ok', 'ok', '']});
  s.stage.add([p.group, pay.node, err.node, term.node, eraser, status.node, lines, undo]);
  view.add(cl.node);

  // "Now say the payment blows up halfway through."
  yield* s.at('fails');
  yield* all(fadeIn(pay.node), fadeTo(0.6, p.oldA.node, p.oldB.node));
  yield* fadeIn(err.node);

  // "You roll it back."
  yield* s.at('rollback');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, 'ROLLBACK;', 30);

  // "And Postgres doesn't erase anything."
  yield* s.at('erase');
  yield* fadeIn(eraser);
  yield* drawCross(cross);

  // "It writes one line in a little status list: ticket 42, aborted."
  yield* s.at('note');
  yield* fadeIn(status.node, lines);
  yield* s.at('note', 2.8);
  yield* type(l42, '42   aborted', 20);

  // "Everything 42 created now counts for nobody."
  yield* s.at('never');
  yield* all(...news.flatMap(c => [c.node.opacity(DIM, T.base), c.cf.value.fill(C.bad, T.base)]));

  // "Every deleted-by-42 stamp is ignored."
  yield* s.at('expiry');
  yield* sequence(0.15, ...olds.map(c => c.df.strike.end(1, T.base)));
  yield* all(...olds.flatMap(c => [c.node.opacity(1, T.base), c.df.value.fill(C.dim, T.base)]));

  // "One line, whether the payment touched two rows or two million."
  yield* s.at('instant');
  yield* term.node.opacity(0, T.fast);
  yield* fadeIn(undo);

  // "That's all four."
  yield* s.at('box');
  yield* cl.check(3);

  yield* s.end();
});
