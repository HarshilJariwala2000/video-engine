import {Circle, makeScene2D, Node} from '@motion-canvas/2d';
import {all, sequence, useThread} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, checkMark, fadeIn, fadeTo, frame, mono, sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, clock, hub, HUB, loopArrow, podList, servers} from '../lib/figures';
import {C, DIM, FS, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene17', 'THE BILL');
  const h = hub({visible: true});
  h.group.opacity(0);
  const head = sans('the bill', {y: -390, size: 44});
  // up by the title, clear of the hub's spokes
  const nobody = mono('in charge: nobody', {x: -70, y: -310, size: FS.label + 4, fill: C.text});
  const why = chip('why?', {x: 170, y: -310, color: C.bad, stroke: C.bad});

  // one log line per component, each on the outer side of its box (away from the spokes)
  const LOG_AT: [number, number][] = [
    [HUB.replica[0], HUB.replica[1] + 62], [HUB.scheduler[0], HUB.scheduler[1] + 62],
    [HUB.kubelets[0][0], HUB.kubelets[0][1] + 62], [HUB.kubelets[1][0] + 250, HUB.kubelets[1][1]], [HUB.kubelets[2][0], HUB.kubelets[2][1] + 62],
  ];
  const logs = ['have 3: ok', '0/3 fit, retry', 'no pods for me', 'running 1', 'running 1']
    .map((t, i) => mono(t, {x: LOG_AT[i][0], y: LOG_AT[i][1], size: FS.small, fill: C.dim}));

  const timer = clock('5:00', {x: -60, y: -330});

  // every node full, and the Pending row from scene 02
  const sv = servers({names: 'node', frames: false});
  sv.list.forEach(n => {
    n.barFill.width(8);
    n.barFill.fill(C.bad);
    n.barTxt.text('full');
    n.barTxt.fill(C.bad);
  });
  const list = podList({x: -200, y: -120, visible: true, status: ['Running', 'Running', 'Pending']});
  list.node.opacity(0);
  list.rows[0].row.opacity(DIM);
  list.rows[1].row.opacity(DIM);

  // one app on one server: a script and a restart policy
  const one = frame({x: 0, y: 20, w: 620, h: 340, tag: 'one server'});
  const script = box({x: 0, y: -50, w: 440, h: 70, title: 'deploy.sh', size: 28});
  const restart = chip('restart: always', {y: 50, color: C.good, stroke: C.good});
  const ok = checkMark({y: 130, s: 1.6});
  const small = (<Node>{one.node}{script.node}{restart.node}{ok}</Node>) as Node;

  // many servers at 3 a.m.: loops spin, the script went home
  const many: {frame: Node; loop: Circle}[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const x = -120 + c * 240, y = -130 + r * 150;
    const f = frame({x, y, w: 200, h: 110, tag: ''});
    const loop = loopArrow({x, y, r: 28, color: C.good});
    many.push({frame: f.node, loop});
  }
  const late = clock('3:00 a.m.', {x: -760, y: -300});
  const gone = box({x: -620, y: 20, w: 300, h: 110, title: 'script.sh', sub: 'exited', size: 28, dashed: true, color: C.dim});

  s.stage.add([h.group, head, nobody, why.node, ...logs, timer.node, sv.group, list.node, small,
    ...many.flatMap(m => [m.frame, m.loop]), late.node, gone.node]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "This design isn't free. Here's the bill."
  yield* s.at('free');
  yield* all(h.group.opacity(DIM, T.base), fadeIn(head));

  // "Nobody is in charge, so when something breaks, no single place says why."
  yield* s.at('charge');
  yield* fadeIn(nobody);
  yield* fadeIn(why.node);

  // "The answer is scattered across a dozen loops, each doing exactly what it was told."
  yield* s.at('spread');
  yield* all(h.group.opacity(0.5, T.base), fadeTo(DIM, nobody, why.node));
  yield* sequence(0.15, ...logs.map(l => l.opacity(1, T.fast)));

  // "Healing isn't instant either: we just waited five minutes."
  yield* s.at('slow');
  yield* all(fadeTo(0, ...logs, nobody, why.node), h.group.opacity(DIM, T.base), fadeIn(timer.node));

  // "And it needs spare room. If no server has space for the replacement, it just waits, Pending,"
  yield* s.at('room');
  yield* all(fadeTo(0, h.group, timer.node, head));
  yield* all(...sv.list.flatMap(n => [n.frame.opacity(1, T.base), n.bar.opacity(1, T.base)]));
  yield* fadeIn(list.node);
  yield* list.rows[2].status.scale(1.15, 0.25).to(1, 0.3);

  // "And for one app on one server, it's a lot of machinery."
  yield* s.at('small');
  yield* fadeTo(0, sv.group, list.node);
  yield* all(one.node.opacity(1, T.base), script.node.opacity(1, T.base));
  yield* fadeIn(restart.node);
  yield* ok.end(1, T.base);

  // "But across many servers at 3 a.m., I'll take a room full of stubborn thermostats"
  yield* s.at('still');
  yield* fadeTo(0, small);
  yield* all(fadeIn(late.node, gone.node),
    ...many.map(m => all(m.frame.opacity(1, T.base), m.loop.end(1, T.base))));
  while (useThread().time() < s.duration - 1.4) {
    yield* all(...many.map(m => m.loop.rotation(m.loop.rotation() + 360, 0.9)));
  }

  yield* s.end();
});
