import {Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {checkMark, fadeIn, fadeTo, mono, swap, terminal, type} from '../lib/ui';
import {chat, chip, CLUSTER, clock, KUBE_LOOP_R, KUBE_POS, loopArrow, podList, servers} from '../lib/figures';
import {C, DIM, MONO, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene02', 'THE PROBLEM', {fadeLabel: false});
  // scene 01's last frame: empty server frames, the Kubernetes box and its loop
  const srv = servers({frames: true});
  const kube = (<Rect x={KUBE_POS[0]} y={KUBE_POS[1]} width={340} height={90} stroke={C.accent} lineWidth={W.line} radius={4} />) as Rect;
  const kubeTxt = (<Txt text="Kubernetes" fontFamily={MONO} fontSize={34} fill={C.text} x={KUBE_POS[0]} y={KUBE_POS[1]} />) as Txt;
  const loop = loopArrow({x: KUBE_POS[0], y: KUBE_POS[1], r: KUBE_LOOP_R});
  loop.end(1);
  const sleep = chat("you'll sleep now");

  const term = terminal({y: -250, w: 900});
  const out = mono('deployment.apps/web created', {x: -418, y: -170, size: 28, align: 'left'});
  const ok = checkMark({x: 80, y: -172});
  const list = podList();
  const later = clock('+10 min', {x: 470, y: 0});
  const noErr = chip('no error', {x: 540, y: 100, color: C.dim});
  const noCrash = chip('no crash', {x: 540, y: 160, color: C.dim});
  const jordan = chat("it's not stuck. it's waiting.");
  s.stage.add([srv.group, kube, kubeTxt, loop, sleep.node, term.node, out, ok, list.node, later.node, noErr.node, noCrash.node, jordan.node]);
  const [a, m, x] = list.rows;

  // "So your team installs it, and Jordan from the platform team promises you'll finally sleep…"
  yield* s.at('install');
  yield* loop.opacity(0, T.fast);
  yield* all(
    kube.position([CLUSTER.x, CLUSTER.y], T.slow), kube.size([CLUSTER.w, CLUSTER.h], T.slow), kube.lineWidth(W.main, T.slow),
    kubeTxt.position([CLUSTER.x - CLUSTER.w / 2 + 4, CLUSTER.y - CLUSTER.h / 2 - 30], T.slow),
    kubeTxt.offset.x(-1, T.slow), kubeTxt.fontSize(30, T.slow), kubeTxt.fill(C.accent, T.slow),
  );
  yield* fadeIn(sleep.node);

  // "You apply your web app, three copies."
  yield* s.at('apply');
  yield* all(fadeTo(0, srv.group, kube, kubeTxt, sleep.node), term.node.opacity(1, T.fast));
  yield* type(term.cmd, 'kubectl apply -f web.yaml');

  // "It says: created."
  yield* s.at('created');
  yield* fadeIn(out);
  yield* ok.end(1, T.base);

  // "You check the pods."
  yield* s.at('pods');
  term.cmd.text('');
  yield* all(fadeTo(DIM, out, ok), type(term.cmd, 'kubectl get pods', 30));
  yield* all(list.node.opacity(1, T.fast), sequence(0.08, ...list.rows.map(r => r.row.opacity(1, T.fast))));

  // "Two are running."
  yield* s.at('two');
  yield* all(swap(a.status, 'Running', C.good), swap(m.status, 'Running', C.good));

  // "The third one says Pending."
  yield* s.at('pending');
  yield* swap(x.status, 'Pending', C.accent);

  // "Ten minutes later, still Pending."
  yield* s.at('later');
  yield* fadeIn(later.node);
  yield* chain(x.row.scale(1.06, 0.25), x.row.scale(1, 0.3));

  // "No error. No crash. Nothing."
  yield* s.at('noerr');
  yield* fadeIn(noErr.node);
  yield* fadeIn(noCrash.node);

  // "Jordan rolls their chair over… it's not stuck. It's waiting."
  yield* s.at('jordan');
  yield* all(fadeIn(jordan.node), fadeTo(DIM, noErr.node, noCrash.node, later.node));

  yield* s.end();
});
