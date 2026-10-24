import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, sequence, waitFor} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, draw, fadeIn, fadeTo, mono, swap} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, clock, controller, CTRL_X, CTRL_Y, entryY, fillNode, LANE, NOTE_H, NOTE_LEFT, NOTE_POS, SERVER_Y, spin, stamp, STAMP_POS} from '../lib/figures';
import {machineRoom, toApi} from '../lib/extra-c';
import {C, DIM, FS, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene15', 'HEALING');
  const m = machineRoom();
  const [n1, n2, n3] = m.sv.list;
  const clk = clock('3:00 a.m.', {x: -780, y: -330});
  const paged = chip('paged', {x: -440, y: -330, color: C.dim});
  const zzz = mono('z z z', {x: -700, y: -385, size: FS.label, fill: C.dim});
  const running = mono('running: 3', {x: 640, y: 380, size: FS.label, fill: C.good, opacity: 1});

  // node-2's kubelet checking in with the notebook
  const beat = (<Line points={[[n2.x, SERVER_Y + 105], [n2.x, 400], [NOTE_LEFT + 30, 400], [NOTE_LEFT + 30, NOTE_POS[1] + NOTE_H / 2 + 6]]} stroke={C.dim} lineWidth={W.line}
                      endArrow arrowSize={12} />) as Line;
  const nodeCtl = controller('node controller', {x: CTRL_X.node, y: CTRL_Y});
  const aNode = toApi(CTRL_X.node, LANE.node);
  const aRep = toApi(CTRL_X.replica, LANE.replica);
  const aSch = toApi(CTRL_X.scheduler, LANE.scheduler);
  const timer = clock('5:00', {x: 90, y: 30});
  const st = stamp({x: STAMP_POS[0], y: STAMP_POS[1]});
  // the notebook's row for node-2 itself, and the replacement pod
  const unreach = m.nb.pods[4];
  unreach.name.text('node node-2');
  unreach.field.text('unreachable');
  unreach.field.fill(C.bad);
  unreach.node.y(entryY(5));
  const repl = m.nb.pods[3];
  // node-3's second container
  const web2 = box({x: n3.x + 68, y: n3.y - 20, w: 120, h: 60, title: 'web', size: 26});

  s.stage.add([m.group, beat, nodeCtl.node, aNode, aRep, aSch, timer.node, st.node, web2.node, clk.node, paged.node, zzz, running]);
  s.stage.opacity(0);
  const cl = checklist({state: ['ok', 'ok', '', '']});
  view.add(cl.node);

  // "Which brings us back to 3 a.m."
  yield* s.at('back');
  yield* s.stage.opacity(1, T.base);
  yield* fadeIn(clk.node);

  // "Server two dies."
  yield* s.at('dies');
  yield* all(
    n2.frame.stroke(C.bad, T.fast), n2.web.opacity(0, T.fast), fadeTo(DIM, n2.kubelet),
    swap(running, 'running: 2', C.bad),
  );

  // "Its kubelet stops checking in."
  yield* s.at('silent');
  yield* all(beat.stroke(C.bad, T.fast), beat.lineDash([12, 8], T.fast), beat.end(0.35, T.slow));

  // "Another thermostat in the office, the node controller, notices the silence"
  yield* s.at('node');
  yield* fadeIn(nodeCtl.node);
  yield* all(draw(aNode), spin(nodeCtl.glyph));

  // "and marks server two unreachable."
  yield* s.at('marks');
  yield* all(fadeIn(unreach.node), swap(n2.tag, 'node-2 · unreachable', C.bad));

  // "Then it waits, about five minutes by default,"
  yield* s.at('wait');
  yield* fadeIn(timer.node);
  for (const t of ['4:00', '3:00', '2:00', '1:00', '0:00']) {
    yield* waitFor(0.45);
    timer.label.text(t);
  }

  // "After that, its pods are struck from the books."
  yield* s.at('evict');
  yield* m.nb.pods[0].strike.end(1, T.base);
  yield* all(fadeTo(DIM, m.nb.pods[0].node, timer.node, nodeCtl.node, aNode));

  // "And the replica controller does its thing. Want three, have two."
  yield* s.at('replica');
  yield* all(m.replica.box.stroke(C.accent, T.fast), draw(aRep), spin(m.replica.glyph));
  yield* fadeIn(st.node);
  yield* sequence(0.3, st.set('want', '3'), st.set('have', '2'));

  // "Plus one."
  yield* s.at('plus');
  yield* all(st.set('act', '+1'), fadeIn(repl.node));

  // "The scheduler fills in a server,"
  yield* s.at('sched');
  yield* all(m.replica.box.stroke(C.stroke, T.fast), fadeTo(DIM, aRep, st.node),
    m.scheduler.box.stroke(C.accent, T.fast), draw(aSch, T.fast), fillNode(repl, 'node-3'));

  // "a kubelet starts it."
  yield* s.at('kubelet');
  yield* all(
    m.scheduler.box.stroke(C.stroke, T.fast), fadeTo(DIM, aSch),
    n3.kubelet.stroke(C.accent, T.fast),
    n3.web.width(120, T.base), n3.web.x(n3.x - 68, T.base),
  );
  yield* all(fadeIn(web2.node), swap(running, 'running: 3', C.good));

  // "Nobody woke up. Not you, not even Jordan."
  yield* s.at('sleep');
  yield* cl.check(2);
  yield* all(zzz.opacity(1, T.base), paged.node.opacity(DIM, T.base), n3.kubelet.stroke(C.stroke, T.base));

  yield* s.end();
});
