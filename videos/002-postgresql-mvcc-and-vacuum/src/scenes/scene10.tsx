import {makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {checkMark, draw, fadeIn, mono, termCard} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {actor, link, mvccPage, snapshot} from '../lib/figures';
import {C, DIM, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene10', 'SNAPSHOTS');
  // scene 09's last frame: wide page, stamps filled in
  const p = mvccPage({wide: true, frame: true, show: 3, stamps: true, headers: true});
  p.headers.forEach(h => h.fill(C.accent));
  p.oldB.df.value.text('—');
  p.oldB.node.opacity(DIM);
  p.oldA.df.value.fill(C.accent);
  p.newA.cf.value.fill(C.accent);

  const q = mono('?', {x: -450, y: -45, size: 44, fill: C.accent});
  const query = actor({x: -720, title: 'QUERY'});
  const snap = snapshot({x: -720, y: 100, lines: [['finished: 1…41', C.good], ['42: not yet', C.dim]]});
  snap.lines.forEach(l => l.opacity(0));
  const card = termCard('snapshot = a photo of finished tickets');
  const heading = mono('one rule:', {x: -330, y: 250, size: 22, fill: C.label, align: 'left'});
  const rule1 = mono('CREATED BY finished in the photo', {x: -300, y: 295, size: 24, align: 'left'});
  const rule2 = mono("DELETED BY hadn't finished", {x: -300, y: 340, size: 24, align: 'left'});
  const ok1 = checkMark({x: -330, y: 295});
  const ok2 = checkMark({x: -330, y: 340});
  const toOld = link([[-582, -95], [-405, -135]], C.accent);
  s.stage.add([p.group, q, query.node, snap.node, card, heading, rule1, rule2, ok1, ok2, toOld]);
  view.add(checklist().node);

  // "So with two alices on the page, which one does a query see?"
  yield* s.at('which');
  yield* all(fadeIn(q), ...p.headers.map(h => h.fill(C.dim, T.base)));

  // "When a query starts, Postgres hands it a snapshot:"
  yield* s.at('photo');
  yield* fadeIn(query.node, snap.node);

  // "think of it as a photo of which tickets had finished at that moment."
  yield* s.at('list');
  yield* all(fadeIn(...snap.lines), fadeIn(card));

  // "Then one rule decides everything."
  yield* s.at('rule');
  yield* all(fadeIn(heading), q.opacity(0, T.base));

  // "You see a version if its creator had finished in your photo,"
  yield* s.at('see');
  yield* all(fadeIn(rule1), ok1.end(1, T.base),
    p.oldA.cf.node.stroke(C.good, T.base), p.newA.cf.node.stroke(C.bad, T.base));

  // "and its deleter hadn't."
  yield* s.at('not');
  yield* all(fadeIn(rule2), ok2.end(1, T.base), p.oldA.df.node.stroke(C.good, T.base), p.newA.node.opacity(DIM, T.base));
  yield* draw(toOld);

  // the page, the query and its photo carry into scene 11
  yield* s.before(0.75);
  yield* all(p.oldA.cf.node.stroke(C.stroke, 0.3), p.oldA.df.node.stroke(C.stroke, 0.3), p.newA.cf.node.stroke(C.stroke, 0.3));
  yield* s.end([q, card, heading, rule1, rule2, ok1, ok2, toOld]);
});
