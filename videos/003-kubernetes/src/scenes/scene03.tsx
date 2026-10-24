import {Circle, Line, Node, Rect, makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, fadeIn, fadeTo, mono, terminal, type} from '../lib/ui';
import {chip, clock, LIST_POS, loopArrow, podList, you} from '../lib/figures';
import {C, DIM, FS, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene03', 'THE MYSTERY');
  // scene 02's pod list, as it was left
  const term = terminal({y: -250, w: 900});
  term.cmd.text('kubectl get pods');
  term.node.opacity(DIM);
  const list = podList({visible: true, status: ['Running', 'Running', 'Pending']});
  list.node.opacity(0);
  const pendY = LIST_POS[1] - 30 + 2 * 64;
  const q = mono('?', {x: 470, y: pendY - 10, size: 120, fill: C.accent});
  const empty = mono('(no output)', {x: -418, y: -170, size: 28, fill: C.dim, align: 'left'});
  const never = chip('never started', {x: 520, y: pendY + 90, color: C.dim});

  // the "remote control" picture of Kubernetes
  const RX = -360;
  const buttons = [[-30, -60], [30, -60], [-30, 0], [30, 0]].map(([bx, by]) =>
    (<Circle x={bx} y={by} size={34} stroke={C.dim} lineWidth={W.line} />) as Circle);
  const apply = (<Rect y={80} width={110} height={44} radius={8} fill={C.accent}>{mono('apply', {size: FS.small, fill: C.bg, opacity: 1})}</Rect>) as Rect;
  const remote = (
    <Node x={RX} y={-40} opacity={0}>
      <Rect width={160} height={280} radius={30} stroke={C.text} lineWidth={W.main} />
      <Circle y={-110} size={14} fill={C.bad} />
      {buttons}{apply}
    </Node>
  ) as Node;
  const remoteLbl = mono('apply = docker run × 3', {x: RX, y: 140, size: FS.label, fill: C.dim});
  const eq = mono('created = running', {x: RX, y: 240, size: 44, fill: C.text});
  const strikeR = (<Line points={[[RX - 140, -190], [RX + 140, 110]]} stroke={C.bad} lineWidth={W.main} end={0} />) as Line;
  const strikeE = (<Line points={[[RX - 240, 240], [RX + 240, 240]]} stroke={C.bad} lineWidth={W.main} end={0} />) as Line;
  // scene 01's "you", hopping between servers
  const SX = [220, 420, 620];
  const minis = SX.map((x, i) => box({x, y: 60, w: 170, h: 60, title: `server-${i + 1}`, size: FS.tiny}).node);
  const me = you({x: SX[0], y: -60});
  const magic = mono('magic', {x: 300, y: 240, size: 40, fill: C.text});
  const haunted = mono('haunted', {x: 560, y: 240, size: 40, fill: C.bad});

  // a small waiting loop beside the Pending row (an ellipse around it ran through the other rows)
  const loop = loopArrow({x: 470, y: pendY, r: 40, dashed: true});
  const notErr = chip('not an error', {x: -220, y: 330, color: C.accent, stroke: C.accent, size: FS.label});
  const clk = clock('3:00 a.m.', {x: 180, y: 330});
  const zzz = mono('z z z', {x: 420, y: 316, size: FS.label, fill: C.dim});
  s.stage.add([term.node, list.node, q, empty, never.node, remote, remoteLbl, eq, strikeR, strikeE, ...minis, me.node,
    magic, haunted, loop, notErr.node, clk.node, zzz]);
  const pending = list.rows[2];

  // "Waiting for what?"
  yield* s.at('what');
  yield* all(list.node.opacity(1, T.base), ...list.rows.slice(0, 2).map(r => r.row.opacity(DIM, T.base)));
  yield* fadeIn(q);

  // "You go looking for logs, and there are none, because that copy never started anywhere."
  yield* s.at('log');
  term.cmd.text('');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, 'kubectl logs web-x7k2p', 30);
  yield* fadeIn(empty);
  yield* all(fadeIn(never.node), q.opacity(0, T.base));

  // "For my first year with Kubernetes, I treated it like a very expensive remote control for docker run."
  yield* s.at('confess');
  yield* all(fadeTo(0, term.node, list.node, empty, never.node));
  yield* fadeIn(remote, remoteLbl);
  yield* all(chain(apply.scale(0.85, 0.12), apply.scale(1, 0.2)), fadeIn(...minis, me.node));
  for (const x of [SX[1], SX[2], SX[0], SX[1], SX[2]]) yield* me.node.x(x, 0.4);

  // "If that were true, created would mean running…"
  yield* s.at('wrong');
  yield* fadeIn(eq);

  // "That picture is wrong, and it's why Kubernetes feels like magic on good days and haunted on bad ones."
  yield* s.at('haunted');
  yield* sequence(0.2, strikeR.end(1, T.base), strikeE.end(1, T.base));
  yield* all(fadeTo(DIM, remote, remoteLbl, eq, strikeR, strikeE), fadeTo(0, ...minis, me.node));
  yield* fadeIn(magic);
  yield* fadeIn(haunted);

  // "By the end of this video, you'll know exactly what that pod is waiting for,"
  yield* s.at('promise');
  yield* fadeTo(0, remote, remoteLbl, eq, strikeR, strikeE, magic, haunted);
  yield* all(list.node.opacity(1, T.base), pending.row.opacity(1, 0));
  yield* loop.end(1, T.slow);

  // "and why it's the same thing that finally lets you sleep."
  yield* s.at('fight');
  yield* all(chain(loop.lineWidth(W.main + 2, 0.25), loop.lineWidth(W.line, 0.35)), fadeIn(notErr.node));
  yield* fadeIn(clk.node);
  yield* fadeIn(zzz);

  yield* s.end();
});
