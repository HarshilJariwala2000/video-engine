import {Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, sequence, waitFor} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, fadeTo, mono, sans, terminal, type} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, loopArrow, statusColor} from '../lib/figures';
import {C, DIM, FS, MONO, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene20', 'PROOF');

  // ── kubectl describe ──
  const t1 = terminal({y: -260, w: 1100});
  const OUT_W = 1100, OUT_H = 440;
  const lines = [
    'Name:         web-x7k2p', 'Namespace:    default', 'Node:         <none>', 'Status:       Pending',
    'Containers:', '  web:', '    Image:      web:1.0', '    Requests:   memory: 2Gi', 'Conditions:',
    '  PodScheduled   False', 'Events:', '  Type     Reason            Message',
  ];
  const scroll = (
    <Node>
      {lines.map((l, i) => (
        <Txt text={l} fontFamily={MONO} fontSize={FS.label} fill={l === 'Events:' ? C.text : C.dim}
             x={-OUT_W / 2 + 40} y={-OUT_H / 2 + 40 + i * 44} offsetX={-1} />
      ))}
    </Node>
  ) as Node;
  const ev = (
    <Node x={-OUT_W / 2 + 40} y={-OUT_H / 2 + 40 + lines.length * 44} opacity={0}>
      <Txt text="  Warning  FailedScheduling" fontFamily={MONO} fontSize={FS.label} fill={C.text} offsetX={-1} />
      <Rect layout offsetX={-1} y={44}>
        <Txt text="    0/3 nodes are available: 3 " fontFamily={MONO} fontSize={FS.label} fill={C.text} />
        <Txt text="Insufficient memory." fontFamily={MONO} fontSize={FS.label} fill={C.accent} />
      </Rect>
    </Node>
  ) as Node;
  scroll.add(ev);
  const out = (
    <Rect y={60} width={OUT_W} height={OUT_H} stroke={C.stroke} lineWidth={W.line} radius={4} clip opacity={0}>{scroll}</Rect>
  ) as Rect;

  // ── watch + delete ──
  const L = -470, R = 470, TW = 880;
  const t2 = terminal({x: L, y: -260, w: TW});
  const t3 = terminal({x: R, y: -260, w: TW});
  const watchRows: [string, string][] = [
    ['NAME', 'STATUS'], ['web-a1b2c', 'Running'], ['web-m3n8d', 'Running'], ['web-x7k2p', 'Running'],
    ['web-m3n8d', 'Terminating'], ['web-h2v6p', 'ContainerCreating'],
  ];
  const rows = watchRows.map(([n, st], i) => {
    const head = i === 0;
    const name = (<Txt text={n} fontFamily={MONO} fontSize={head ? FS.small : 28}
                       fill={head ? C.dim : i === 5 ? C.accent : C.text} x={L - TW / 2 + 40} offsetX={-1} />) as Txt;
    const status = (<Txt text={st} fontFamily={MONO} fontSize={head ? FS.small : 28}
                         fill={head ? C.dim : st === 'ContainerCreating' ? C.text : statusColor(st)} x={L - 40} offsetX={-1} />) as Txt;
    return (<Node y={-150 + i * 58} opacity={0}>{name}{status}</Node>) as Node;
  });
  const bug = chip('a bug report to a loop', {x: R, y: 90, color: C.accent, stroke: C.accent, size: 30});

  // ── the aphorism + the question ──
  const say = sans('Kubernetes never does what you say.', {y: -60, size: 48, fill: C.dim});
  const does = sans('It does what you want. As soon as it can.', {y: 30, size: 52, fill: C.accent});
  const qLoop = loopArrow({x: -460, y: -20, r: 60});
  const q1 = sans('Ever stared at a Pending pod,', {x: -340, y: -60, size: 42, align: 'left'});
  const q2 = sans('waiting for an error that never came?', {x: -340, y: 0, size: 42, align: 'left'});
  const q3 = sans('What turned out to be missing?', {x: -340, y: 80, size: 36, fill: C.dim, align: 'left'});
  const card = (
    <Rect y={0} width={1260} height={340} stroke={C.stroke} lineWidth={W.main} radius={6} opacity={0} />
  ) as Rect;
  [q1, q2, q3, qLoop].forEach(n => card.add(n));
  q1.opacity(1); q2.opacity(1); q3.opacity(1);

  s.stage.add([t1.node, out, t2.node, t3.node, ...rows, bug.node, say, does, card]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Want to see that note yourself?"
  yield* s.at('proof');
  yield* t1.node.opacity(1, T.base);

  // "Run kube control describe pod on any Pending pod, and scroll to the bottom."
  yield* s.at('describe');
  yield* type(t1.cmd, 'kubectl describe pod web-x7k2p', 26);
  yield* out.opacity(1, T.fast);
  // bring the Events section (and the two-line event under it) to the bottom of the panel
  yield* scroll.y(-200, 1.2);

  // "The scheduler tells you exactly why: ... insufficient memory."
  yield* s.at('events');
  yield* all(...scroll.children().slice(0, lines.length).map(n => n.opacity(DIM, T.base)), ev.opacity(1, T.base));

  // "And to watch the loop at work, run kube control get pods, dash w, for watch,"
  yield* s.at('watch');
  yield* fadeTo(0, t1.node, out);
  yield* t2.node.opacity(1, T.fast);
  yield* type(t2.cmd, 'kubectl get pods -w', 26);
  yield* sequence(0.2, ...rows.slice(0, 4).map(r => r.opacity(1, T.fast)));

  // "and delete a pod from a second terminal."
  yield* s.at('delete');
  yield* t3.node.opacity(1, T.fast);
  yield* type(t3.cmd, 'kubectl delete pod web-m3n8d', 30);
  yield* fadeIn(rows[4]);

  // "A new name appears before the old one is even gone. You just filed a bug report to a loop."
  yield* s.at('see');
  yield* fadeIn(rows[5]);
  yield* waitFor(1.2);
  yield* fadeIn(bug.node);

  // "Kubernetes never does what you say. It does what you want, as soon as it can."
  yield* s.at('aphorism');
  yield* fadeTo(0, t2.node, t3.node, bug.node, ...rows);
  yield* fadeIn(say);
  yield* waitFor(1.6);
  yield* fadeIn(does);

  // "Have you ever stared at a Pending pod, waiting for an error that never came? ..."
  yield* s.at('question');
  yield* fadeTo(0, say, does);
  yield* all(fadeIn(card), qLoop.end(1, T.slow));
  yield* qLoop.rotation(360, 2);

  yield* s.end();
});
