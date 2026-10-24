import {makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, draw, fadeIn, mono, type} from '../lib/ui';
import {accounts, DEAD, samChip, termOut} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene01', 'THE PROBLEM');
  const a = accounts();
  a.disk.fill.width(0);
  const term = termOut();
  const point = arrow([[470, 170], [250, 170]], {stroke: C.accent, width: 3});
  const nine = mono('9?', {x: -360 + 0.9 * 480, y: 112, size: 26, fill: C.dim});
  const nineHalf = mono('9.5?', {x: -360 + 0.95 * 480 + 20, y: 112, size: 26, fill: C.dim});
  const sam = samChip();
  s.stage.add([a.group, a.disk.node, term.node, term.out, point, nine, nineHalf, sam.node]);

  // "Want to ruin your afternoon? Take an accounts table with 20 million rows."
  yield* s.at('table');
  yield* all(fadeIn(a.frame, a.counter, ...a.pages),
    sequence(0.04, ...a.cells.map(c => c.rect.opacity(1, T.fast))));

  // "It uses 10 gigabytes of disk."
  yield* s.at('size');
  a.disk.node.opacity(1);
  yield* a.disk.gb(10, T.slow);

  // "You delete the 10 million closed accounts,"
  yield* s.at('delete');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, 'DELETE FROM accounts WHERE closed;', 30);
  term.out.text('DELETE 10000000');

  // "and the row count drops to 10 million."
  yield* s.at('count');
  yield* all(
    a.rows(10_000_000, T.slow), a.counter.fill(C.accent, T.fast),
    sequence(0.04, ...DEAD.map(i => a.set(i, 'ghost'))),
  );

  // "Then you check the disk."
  yield* s.at('disk');
  yield* all(draw(point), a.counter.fill(C.text, T.base));

  // "10 gigabytes. Not 9. Not even 9 and a half."
  yield* s.at('still');
  yield* a.disk.value.fill(C.bad, T.fast);
  yield* s.at('still', 1.5);
  yield* chain(nine.opacity(0.8, T.fast), nine.opacity(0, T.base));
  yield* s.at('still', 2.6);
  yield* chain(nineHalf.opacity(0.8, T.fast), nineHalf.opacity(0, T.base));

  // "And Sam from infra leans over and says: you need to vacuum."
  yield* s.at('vacuum');
  yield* all(sam.node.opacity(1, T.base), point.opacity(0, T.base));

  // the table, disk bar and terminal carry straight into scene 02
  yield* s.end([sam.node]);
});
