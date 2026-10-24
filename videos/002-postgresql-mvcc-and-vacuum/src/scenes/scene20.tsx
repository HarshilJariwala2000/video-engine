import {Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createSignal, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, draw, fadeIn, fadeTo} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {accounts, DEAD, diskBar, fmt, link, samChip, termOut} from '../lib/figures';
import {C, MONO, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene20', 'THE PROBLEM, REVISITED');
  // callback: the exact scene 01 frame
  const a = accounts();
  const term = termOut();
  term.cmd.text('DELETE FROM accounts WHERE closed;');
  term.out.text('DELETE 10000000');
  const stamp = box({x: 640, y: -90, w: 320, h: 50, title: 'DELETED BY 97', size: 22, color: C.label});
  const inserts = createSignal(0);
  const insTxt = (
    <Txt text={() => `inserts: ${fmt(inserts())}`} fontFamily={MONO} fontSize={24} fill={C.accent} x={640} y={-90} opacity={0} />
  ) as Txt;
  const alt = diskBar({x0: -360, y: 340, gb: 10, label: 'VACUUM FULL, 3 a.m.'});
  alt.label.fill(C.accent);
  const branch = link([[-380, 182], [-410, 182], [-410, 340], [-380, 340]]);
  branch.lineDash([8, 6]);
  const sam = samChip();
  s.stage.add([a.group, a.disk.node, term.node, term.out, stamp.node, insTxt, alt.node, branch, sam.node]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "So, back to your 10 gigabytes."
  yield* s.at('back');
  yield* fadeIn(a.frame, a.counter, ...a.pages, ...a.cells.map(c => c.rect), a.disk.node, term.node, term.out);

  // "Your delete stamped 10 million rows as dead."
  yield* s.at('delete');
  yield* all(a.rows(10_000_000, T.slow), fadeIn(stamp.node), sequence(0.05, ...DEAD.map(i => a.set(i, 'dead'))));

  // "Autovacuum marks their space as free."
  yield* s.at('auto');
  yield* all(stamp.node.opacity(0, T.fast), a.walk(1.0));
  yield* all(a.sweep.opacity(0, T.fast), sequence(0.05, ...DEAD.map(i => a.set(i, 'free'))));

  // "Your next 10 million inserts move into those holes,"
  yield* s.at('next');
  yield* all(fadeIn(insTxt), inserts(10_000_000, 1.4), a.rows(20_000_000, 1.4),
    sequence(0.1, ...DEAD.map(i => a.set(i, 'live', 0.3))));

  // "and the file doesn't grow at all."
  yield* s.at('flat');
  yield* all(a.disk.fill.fill(C.good, T.base), a.disk.value.fill(C.good, T.base));

  // "And if you truly need the disk back,"
  yield* s.at('need');
  yield* fadeTo(0, term.node, term.out);
  yield* draw(branch);

  // "run vacuum full at 3 a.m., when nobody's looking."
  yield* s.at('full');
  yield* fadeIn(alt.node);
  yield* all(alt.gb(5, T.slow), alt.fill.fill(C.good, T.slow));

  // "Sam was right, by the way. Sam is annoyingly often right."
  yield* s.at('now');
  yield* fadeIn(sam.node);
  yield* sam.ok.end(1, T.base);

  yield* s.end();
});
