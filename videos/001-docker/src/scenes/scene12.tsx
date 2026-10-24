import {Line, Rect, makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, fadeTo, meter, mono, proc, swap, termCard, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene12', 'CONTROL GROUPS');
  const a = wall({x: -380, w: 420, h: 300, tag: 'pid  mnt  net', drawn: true});
  const pa = proc({name: 'my-app', pid: 1, x: -380, y: -40, opacity: 1});
  pa.node.stroke(C.accent);
  pa.sub.fill(C.accent);
  const b = wall({x: 380, w: 420, h: 300, tag: 'pid  mnt  net', drawn: true});
  const pb = proc({name: 'other-app', pid: 1, x: 380, y: -40, opacity: 1});
  pb.node.stroke(C.accent);

  // shared server memory: my-app grows from the left, other-app is anchored right
  const W = 1140;
  const fillA = (<Rect x={-W / 2} offsetX={-1} width={W * 0.3} height={36} fill={C.accent} />) as Rect;
  const fillB = (<Rect x={W / 2} offsetX={1} width={W * 0.3} height={36} fill={C.dim} />) as Rect;
  const shared = (
    <Rect y={230} width={W} height={36} stroke={C.stroke} lineWidth={2} radius={4} clip opacity={0}>
      {fillA}{fillB}
    </Rect>
  ) as Rect;
  const sharedLbl = mono('server memory', {x: -W / 2, y: 195, size: 18, fill: C.dim, align: 'left'});

  const card = termCard('cgroup = a budget');
  const cpu = meter({x: 200, y: -40, w: 520, label: 'CPU'});
  const mem = meter({x: 200, y: 120, w: 520, label: 'MEMORY'});
  const limitX = 200 - 260 + 0.8 * 520;
  const limit = (<Line points={[[limitX, 88], [limitX, 152]]} stroke={C.text} lineWidth={2} lineDash={[6, 6]} opacity={0} />) as Line;
  const limitTxt = mono('budget 512 MB', {x: limitX, y: 176, size: 18, fill: C.dim});
  const cl = checklist({state: ['', 'ok', '', '']});
  s.stage.add([a.node, pa.node, b.node, pb.node, shared, sharedLbl, card, cpu.node, mem.node, limit, limitTxt]);
  view.add(cl.node);

  // "But blinders only hide things."
  yield* s.at('hide');
  yield* fadeIn(shared, sharedLbl);

  // "A hidden app can still eat all the memory"
  yield* s.at('eat');
  yield* all(fillA.width(W * 0.85, T.slow), fillB.width(W * 0.15, T.slow));

  // "and slow everyone down."
  yield* s.at('slow');
  yield* all(fadeTo(0.4, b.node, pb.node), swap(pb.sub, 'slow…', C.bad));

  // "So Linux has a second feature, called control groups, or cgroups."
  // "A cgroup is a budget."
  yield* s.at('budget');
  yield* all(
    fadeIn(card),
    fadeTo(0, b.node, pb.node, shared, sharedLbl),
    a.node.position([-520, 40], T.slow), a.node.size([420, 240], T.slow),
    pa.node.position([-520, 40], T.slow),
  );
  yield* fadeIn(cpu.node, mem.node);

  // "Half of one CPU core."
  yield* s.at('cpu');
  yield* all(cpu.fill.width(260, T.slow), cpu.value.text('0.5 core', T.base));

  // "512 megabytes of memory."
  yield* s.at('mem');
  yield* all(fadeIn(limit, limitTxt), mem.fill.width(0.6 * 520, T.slow), mem.value.text('300 MB', T.base));

  // "If the app goes over its memory budget,"
  yield* s.at('over');
  yield* all(mem.fill.width(520, T.slow), mem.fill.fill(C.bad, T.slow), mem.value.text('600 MB', T.base), mem.value.fill(C.bad, T.base));

  // "the kernel shuts it down."
  yield* s.at('kill');
  yield* all(pa.node.stroke(C.bad, T.fast), swap(pa.sub, 'shut down', C.bad), pa.title.fill(C.dim, T.fast));

  // "That's box three."
  yield* s.at('box');
  yield* cl.check(2);

  yield* s.end();
});
