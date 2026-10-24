import {Line, Node, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createSignal, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, draw, fadeIn, swap} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {accounts, fmt, link, snapshot, termOut} from '../lib/figures';
import {C, MONO, T} from '../lib/theme';

const WAVE1 = [1, 7, 12, 18], WAVE2 = [3, 5, 11, 15, 19];

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene17', 'AUTOVACUUM');
  const a = accounts({visible: true, rows: 10_000_000});
  a.disk.node.opacity(1);
  const term = termOut({visible: true});
  term.cmd.text('VACUUM accounts;');
  const auto = box({x: -700, y: -150, w: 260, h: 90, title: 'autovacuum', sub: 'asleep', size: 24});
  const dead = createSignal(0);
  const deadTxt = (
    <Txt text={() => `dead rows: ${fmt(dead())}`} fontFamily={MONO} fontSize={20} fill={C.dim} x={-700} y={-78} opacity={0} />
  ) as Txt;
  const sess = box({x: -700, y: 100, w: 260, h: 100, title: 'BEGIN;', sub: 'idle for 3 days', size: 26});
  const chair = (
    <Node x={-700} y={232} opacity={0}>
      <Line points={[[-18, -34], [-18, 22]]} stroke={C.dim} lineWidth={3} lineCap="round" />
      <Line points={[[-18, 0], [18, 0], [18, 22]]} stroke={C.dim} lineWidth={3} lineCap="round" lineJoin="round" />
    </Node>
  ) as Node;
  const snap = snapshot({x: -700, y: 100, w: 330, h: 160, accent: true});
  const chip = box({x: 640, y: -90, w: 360, h: 50, title: 'still visible to someone', size: 20, color: C.accent, stroke: C.accent});
  const toCells = link([[458, -90], [372, -90]], C.accent);
  s.stage.add([a.group, a.disk.node, term.node, term.out, auto.node, deadTxt, sess.node, chair, snap.node, chip.node, toCells]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Luckily, you almost never run vacuum by hand."
  yield* s.at('rarely');
  yield* all(term.node.opacity(0, T.base), term.out.opacity(0, T.base));

  // "Postgres has a background helper called autovacuum."
  yield* s.at('auto');
  yield* fadeIn(auto.node, deadTxt);

  // "It wakes up whenever enough rows in a table have died."
  yield* s.at('wakes');
  yield* all(dead(4_000_000, 0.6), sequence(0.1, ...WAVE1.map(i => a.set(i, 'dead'))));
  yield* all(auto.node.stroke(C.accent, T.fast), swap(auto.sub, 'sweeping', C.accent));
  yield* a.walk(1.0);
  yield* all(a.sweep.opacity(0, T.fast), dead(0, 0.4), ...WAVE1.map(i => a.set(i, 'free', 0.4)));

  // "But it has one weakness, and it's a person."
  yield* s.at('but');
  yield* all(dead(5_000_000, 0.6), swap(auto.sub, 'asleep', C.dim), auto.node.stroke(C.stroke, T.fast),
    sequence(0.1, ...WAVE2.map(i => a.set(i, 'dead'))));
  yield* all(auto.node.stroke(C.accent, T.fast), swap(auto.sub, 'sweeping', C.accent));
  yield* a.walk(0.8, -345, -5);
  yield* swap(auto.sub, 'paused', C.bad);

  // "Somewhere, someone typed BEGIN in a terminal, went to lunch, and never came back."
  yield* s.at('open');
  yield* fadeIn(sess.node, chair);

  // "That forgotten BEGIN is still holding its old photo."
  yield* s.at('holds');
  yield* fadeIn(snap.node);

  // "And vacuum won't clean anything that photo might still see."
  yield* s.at('cant');
  yield* all(a.sweep.opacity(0, T.base), ...WAVE2.map(i => a.cells[i].rect.stroke(C.accent, T.base)), fadeIn(chip.node));
  yield* draw(toCells);

  // "So the table grows. And grows. And grows."
  yield* s.at('grows');
  yield* all(a.disk.gb(12, T.base), a.disk.fill.fill(C.bad, T.base), a.disk.value.fill(C.bad, T.base));
  yield* s.at('grows', 1.64);
  yield* a.disk.gb(14, T.base);
  yield* s.at('grows', 2.93);
  yield* a.disk.gb(16, T.base);

  yield* s.end();
});
