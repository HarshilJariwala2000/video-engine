import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, draw, fadeIn, fadeTo, frame, mono, termCard} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {actor, diskBar, link, mvccPage, rowCard, snapshot} from '../lib/figures';
import {C, FS, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene13', 'MVCC');
  const p = mvccPage({wide: true, show: 0, stamps: true, headers: true});
  p.frame.opacity(0);
  const rep = actor({x: -720, title: 'REPORT'});
  const snapR = snapshot({x: -720, y: 100, lines: [['finished: 1…41', C.good], ['42: not yet', C.dim]]});
  const q2 = actor({x: 720, title: 'QUERY 2'});
  const snap2 = snapshot({x: 720, y: 100, lines: [['finished: 1…42', C.good], ['42: finished', C.good]]});
  const arrows = [
    link([[-582, -95], [-405, -135]], C.accent), link([[-582, -85], [-405, -45]], C.accent),
    link([[582, -95], [405, 45]], C.accent), link([[582, -85], [405, 135]], C.accent),
  ];
  const queries = [rep.node, snapR.node, q2.node, snap2.node];
  const card = termCard('MVCC = multi-version concurrency control');

  // split panel: MySQL (left) vs Postgres (right)
  const myTitle = mono('MySQL', {x: -480, y: -150, size: 32});
  const myTable = frame({x: -480, y: -30, w: 420, h: 110, tag: 'table'});
  const myRow = rowCard({name: 'alice', bal: 50, y: -30, stroke: C.accent});
  myRow.node.x(-480);
  const undoLog = frame({x: -480, y: 140, w: 420, h: 110, tag: 'undo log (elsewhere)', dashed: true});
  const myOld = rowCard({name: 'alice', bal: 100, y: 140});
  myOld.node.x(-480);
  const toUndo = arrow([[-480, 28], [-480, 82]]);
  const mySub = mono('overwrite + stash the old one', {x: -480, y: 240, size: FS.small, fill: C.dim});
  const pgTitle = mono('Postgres', {x: 480, y: -150, size: 32});
  const pgSub = mono('old versions stay in the table', {x: 480, y: 210, size: FS.small, fill: C.dim});
  const disk = diskBar({x0: 380, y: 300, W: 200, gb: 5});
  const cl = checklist({state: ['ok', 'ok', 'ok', 'ok']});
  s.stage.add([p.group, ...queries, ...arrows, card, myTitle, myTable.node, myRow.node, undoLog.node, myOld.node, toUndo,
    mySub, pgTitle, pgSub, disk.node]);
  view.add(cl.node);

  // "All four boxes, from one hoarding habit:"
  yield* s.at('all');
  yield* sequence(0.15, ...[0, 1, 2, 3].map(i => cl.pulse(i)));

  // "keep many versions of every row,"
  yield* s.at('many');
  yield* all(fadeIn(p.frame, p.tag), sequence(0.12, ...p.cards.map(c => c.node.opacity(1, T.base))));

  // "and let each query pick the one its photo allows."
  yield* s.at('each');
  yield* fadeIn(...queries);
  yield* all(...arrows.map(a => draw(a)));

  // "The official name is multi-version concurrency control…"
  yield* s.at('name');
  yield* fadeIn(card);

  // "MySQL does it too, but tidier: it overwrites the row and stashes the old version in a separate undo log."
  yield* s.at('means');
  yield* all(fadeTo(0, ...queries, ...arrows, card), p.group.position([480, 40], T.slow), p.group.scale(0.55, T.slow));
  yield* fadeIn(myTitle, myTable.node, myRow.node);
  yield* s.at('means', 3.3);
  yield* draw(toUndo);
  yield* fadeIn(undoLog.node, myOld.node, mySub);

  // "Postgres keeps it all in the table."
  yield* s.at('means', 7.5);
  yield* fadeIn(pgTitle, pgSub);

  // "So every one of those old versions is still sitting on your disk."
  yield* s.at('bill');
  yield* all(p.oldA.rect.stroke(C.bad, T.base), p.oldB.rect.stroke(C.bad, T.base), fadeIn(disk.node));
  yield* all(disk.gb(9, T.slow), disk.fill.fill(C.bad, T.slow));

  yield* s.end();
});
