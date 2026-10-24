import {Line, Node, makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, fadeTo, mono, sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {stamp} from '../lib/figures';
import {C, DIM, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene18', 'THE BIG IDEA');
  const X = -820, Y0 = -300, STEP = 90;
  const head = mono('Kubernetes =', {x: X, y: Y0 - 80, size: 40, fill: C.text, align: 'left'});
  const rowText: [string, string][] = [
    ['kubectl apply', 'writes the want'],
    ['controllers', 'want vs have'],
    ['scheduler', 'fills in node'],
    ['kubelet', 'starts containers'],
    ['kube-proxy', 'kernel rules'],
  ];
  const rows = rowText.map(([who, what], i) => (
    <Node y={Y0 + 30 + i * STEP} opacity={0}>
      {mono(who, {x: X, size: 32, fill: C.text, align: 'left', opacity: 1})}
      {mono('→', {x: X + 310, size: 32, fill: C.dim, align: 'left', opacity: 1})}
      {mono(what, {x: X + 370, size: 32, fill: C.dim, align: 'left', opacity: 1})}
    </Node>
  ) as Node);
  const st = stamp({x: 420, y: Y0 + 30 + STEP, want: '3', have: '2', act: '+1', w: 140});
  st.node.scale(0.9);

  const launcher = sans("not a launcher", {y: 170, size: 44, fill: C.dim});
  const strike = (<Line points={[[-170, 172], [170, 172]]} stroke={C.bad} lineWidth={W.main} end={0} />) as Line;
  const loops = mono('a set of loops: want vs have', {y: 260, size: 52, fill: C.accent});
  const fix = sans('fixing the difference', {y: 345, size: 38, fill: C.text});
  const cl = checklist({state: ['ok', 'ok', 'ok', 'ok']});
  s.stage.add([head, ...rows, st.node, launcher, strike, loops, fix]);
  view.add(cl.node);

  // "Let's put it all together."
  yield* s.at('together');
  yield* fadeIn(head);

  // "Apply writes what you want into the notebook."
  yield* s.at('apply');
  yield* fadeIn(rows[0]);

  // "Controllers compare it with what you have."
  yield* s.at('ctrl');
  yield* all(fadeTo(0.55, rows[0]), fadeIn(rows[1], st.node));

  // "The scheduler fills in a server."
  yield* s.at('sched');
  yield* all(fadeTo(0.55, rows[1], st.node), fadeIn(rows[2]));

  // "The kube-let makes it real."
  yield* s.at('kubelet');
  yield* all(fadeTo(0.55, rows[2]), fadeIn(rows[3]));

  // "And kube proxy points the address at it."
  yield* s.at('proxy');
  yield* all(fadeTo(0.55, rows[3]), fadeIn(rows[4]));
  yield* sequence(0.12, ...[0, 1, 2, 3].map(i => cl.pulse(i)));

  // "Kubernetes isn't a launcher."
  yield* s.at('aha');
  yield* all(fadeTo(DIM, head, ...rows, st.node), fadeIn(launcher));
  yield* strike.end(1, T.base);

  // "It's a set of loops, comparing what you asked for with what exists,"
  yield* s.at('loops');
  yield* all(fadeTo(DIM, launcher, strike), fadeIn(loops));

  // "and fixing the difference."
  yield* s.at('fix');
  yield* fadeIn(fix);

  yield* s.end();
});
