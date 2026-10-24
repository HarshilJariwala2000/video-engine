import {Line, Node, makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, mono, sans, swap, terminal, type} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {C, T, W} from '../lib/theme';

const SELECT = 'SELECT xmin, xmax, * FROM accounts;';
const COLS = [-560, -400, -240, -60];

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene21', 'PROOF');
  const term = terminal({y: -300, w: 1300});
  const heads = ['xmin', 'xmax', 'name', 'balance'].map((t, i) => mono(t, {x: COLS[i], y: -190, size: 28, fill: C.dim, align: 'left', opacity: 1}));
  const vals = ['7', '0', 'alice', '100'].map((t, i) => mono(t, {x: COLS[i], y: -125, size: 28, align: 'left', opacity: 1}));
  const table = (
    <Node opacity={0}>
      {heads}
      <Line points={[[-570, -158], [100, -158]]} stroke={C.stroke} lineWidth={W.line} />
      {vals}
    </Node>
  ) as Node;
  const notSame = sans('not the same row.', {y: 40, size: 48});
  const copy = sans('a brand new copy.', {y: 120, size: 48, fill: C.accent});
  const forgets = sans('Postgres never forgets. It just eventually lets go.', {y: 230, size: 36, fill: C.label});
  s.stage.add([term.node, table, notSame, copy, forgets]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Want to catch Postgres in the act?"
  yield* s.at('proof');
  yield* term.node.opacity(1, T.base);

  // "Run select xmin, xmax, star from accounts."
  yield* s.at('select');
  yield* type(term.cmd, SELECT, 40);
  yield* fadeIn(table);

  // "Those are hidden columns on every table you've ever made."
  yield* s.at('hidden');
  yield* all(heads[0].fill(C.accent, T.base), heads[1].fill(C.accent, T.base));

  // "Update a row,"
  yield* s.at('update');
  yield* all(swap(term.cmd, "UPDATE accounts SET balance = 50 WHERE name = 'alice';"), table.opacity(0.3, T.fast));

  // "run it again,"
  yield* s.at('again');
  yield* all(swap(term.cmd, SELECT), table.opacity(1, T.fast));

  // "and the created-by number has changed."
  yield* s.at('changed');
  yield* all(swap(vals[0], '42', C.accent), swap(vals[3], '50'));

  // "It's not the same row anymore."
  yield* s.at('new');
  yield* fadeIn(notSame);

  // "It's a brand new copy. Postgres never forgets. It just eventually lets go."
  yield* s.at('copy');
  yield* fadeIn(copy);
  yield* s.at('copy', 1.6);
  yield* fadeIn(forgets);

  yield* s.end();
});
