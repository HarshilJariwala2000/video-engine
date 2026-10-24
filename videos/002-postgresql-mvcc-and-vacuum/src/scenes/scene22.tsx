import {makeScene2D} from '@motion-canvas/2d';
import {summary} from '@shared/outro';
import {setup} from '../lib/sync';
import {sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene22', 'TO SUMMARISE');
  // the checklist stays in its corner, all four solved, as at the end of scene 21
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);
  const head = sans('to summarise everything', {y: -330, size: 40, opacity: 0});
  const sum = summary([
    'UPDATE writes a new version, stamps the old one',
    'each query reads its own snapshot: nobody waits',
    'DELETE is a stamp; VACUUM frees the space',
    'forgotten BEGIN or slow vacuum → the table grows',
  ]);
  s.stage.add(<>{head}{sum.node}</>);

  // "So, to summarise everything."
  yield* s.at('sum');
  yield* head.opacity(1, T.base);
  // "An update never changes a row…"
  yield* s.at('p1');
  yield* sum.reveal(0);
  // "Every query reads through its own snapshot…"
  yield* s.at('p2');
  yield* sum.reveal(1);
  // "A delete is just a stamp, and vacuum…"
  yield* s.at('p3');
  yield* sum.reveal(2);
  // "Leave a transaction open, or let vacuum fall behind…"
  yield* s.at('p4');
  yield* sum.reveal(3);
  // "Postgres is a hoarder. On purpose."
  yield* s.at('aha');
  yield* sum.aha('Postgres is a hoarder. On purpose.');
  yield* s.end();
});
