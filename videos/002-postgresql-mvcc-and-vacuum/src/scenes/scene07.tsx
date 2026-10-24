import {makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, fadeIn, sans, terminal, termCard, type} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {bump, mvccPage} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene07', 'ROW VERSIONS');
  const p = mvccPage({show: 2});
  const term = terminal({y: 290, w: 1200});
  const expired = box({x: 275, y: -135, w: 130, h: 40, title: 'expired', size: 18, color: C.bad, stroke: C.bad});
  const card = termCard('row version = one copy of a row');
  const eq = sans('UPDATE = INSERT + paperwork', {y: 290, size: 44, fill: C.accent});
  s.stage.add([p.group, term.node, expired.node, card, eq]);
  view.add(checklist().node);

  // "And that is exactly what Postgres does."
  yield* s.at('that');
  yield* fadeIn(p.frame, p.tag);

  // "When you update alice,"
  yield* s.at('update');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, "UPDATE accounts SET balance = 50 WHERE name = 'alice';", 60);

  // "it doesn't touch her row. It writes a whole new copy,"
  yield* s.at('copy');
  yield* p.slots[2].end(1, T.slow);

  // "with the new balance."
  yield* s.at('balance');
  yield* all(fadeIn(p.newA.node), p.slots[2].opacity(0, T.base));

  // "The old copy stays right where it was,"
  yield* s.at('old');
  yield* bump(p.oldA.node, 1.05);

  // "with a little note that says: expired."
  yield* s.at('expired');
  yield* all(p.oldA.node.opacity(0.6, T.base), fadeIn(expired.node));

  // "Each copy is called a row version."
  yield* s.at('version');
  yield* fadeIn(card);

  // "So an update is really an insert, with extra paperwork."
  yield* s.at('insert');
  yield* term.node.opacity(0, T.fast);
  yield* fadeIn(eq);

  // page + versions + the expired note carry into scene 08
  yield* s.end([term.node, card, eq]);
});
