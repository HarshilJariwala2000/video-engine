import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, fadeIn, fadeTo, swap, terminal, termCard, type} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {accounts, actor, DEAD, link, mvccPage, snapshot, WIDE} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene14', 'DEAD ROWS');
  // scene 13's page, with both queries reading it
  const p = mvccPage({wide: true, frame: true, show: 4, stamps: true, headers: true});
  const rep = actor({x: -720, title: 'REPORT', visible: true});
  const snapR = snapshot({x: -720, y: 100, lines: [['finished: 1…41', C.good], ['42: not yet', C.dim]]});
  const q2 = actor({x: 720, title: 'QUERY 2', visible: true});
  const snap2 = snapshot({x: 720, y: 100, lines: [['finished: 1…42', C.good], ['42: finished', C.good]]});
  const rA = link([[-582, -95], [-405, -135]], C.accent), rB = link([[-582, -85], [-405, -45]], C.accent);
  const qA = link([[582, -95], [405, 45]], C.accent), qB = link([[582, -85], [405, 135]], C.accent);
  [snapR.node, snap2.node, rA, rB, qA, qB].forEach(n => n.opacity(1));
  [rA, rB, qA, qB].forEach(l => l.end(1));
  const card = termCard('dead row = no photo can see it');
  const sticky = box({x: -620, y: -135, w: 240, h: 50, title: 'cleanup: later', size: 20, color: C.label, dashed: true});
  const term = terminal({y: 300, w: 1000});
  const a = accounts({rows: 10_000_000, state: i => (DEAD.includes(i) ? 'ghost' : 'live')});
  const pageStuff = [p.group, q2.node, snap2.node, qA, qB, sticky.node, term.node, card];
  s.stage.add([p.group, rep.node, snapR.node, q2.node, snap2.node, rA, rB, qA, qB, card, sticky.node, term.node,
    a.group, a.disk.node]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Once the report finishes,"
  yield* s.at('report');
  yield* fadeTo(0, rep.node, snapR.node, rA, rB);

  // "no photo anywhere can see the old alice."
  yield* s.at('nobody');
  yield* all(p.oldA.rect.stroke(C.dim, T.base), p.oldB.rect.stroke(C.dim, T.base));

  // "Not ever again."
  yield* s.at('ever');
  yield* all(...[p.oldA, p.oldB].flatMap(c => [c.name.fill(C.dim, T.base), c.bal.fill(C.dim, T.base), c.fields.opacity(0.4, T.base)]));

  // "She's a dead row."
  yield* s.at('dead');
  yield* fadeIn(card);

  // "But she's still taking up space on the page."
  yield* s.at('space');
  p.slots[0].size([WIDE.card + 18, 82]).stroke(C.accent).lineWidth(3);
  yield* p.slots[0].end(1, T.slow);

  // "So why not delete her right away? Because some photo might still need her, so Postgres leaves the cleanup for later."
  yield* s.at('twist');
  yield* fadeIn(sticky.node);

  // "And delete? Same trick. It doesn't remove anything."
  yield* s.at('does');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, "DELETE FROM accounts WHERE name = 'bob';", 60);

  // "It just fills in the deleted-by stamp."
  yield* s.at('stamp');
  yield* all(swap(p.newB.df.value, '97', C.accent), p.newB.df.node.stroke(C.accent, T.base));

  // "Those 10 million accounts you deleted? 10 million dead rows,"
  yield* s.at('hook');
  yield* fadeTo(0, ...pageStuff);
  yield* fadeIn(a.frame, a.counter, ...a.pages, ...a.cells.map(c => c.rect));
  yield* sequence(0.06, ...DEAD.map(i => a.set(i, 'dead')));

  // "still sitting in your 10 gigabytes."
  yield* s.at('disk');
  yield* fadeIn(a.disk.node);

  // the accounts table and disk bar carry into scene 15
  yield* s.end([]);
});
