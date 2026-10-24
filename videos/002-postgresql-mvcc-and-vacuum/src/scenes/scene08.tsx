import {makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, drawWall, fadeIn, mono, termCard, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {actor, mvccPage, ticket} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene08', 'TRANSACTIONS');
  // scene 07's last frame
  const p = mvccPage({frame: true, show: 3});
  p.oldA.node.opacity(0.6);
  const expired = box({x: 275, y: -135, w: 130, h: 40, title: 'expired', size: 18, color: C.bad, stroke: C.bad, opacity: 1});
  const q = mono('?', {x: 375, y: -135, size: 40, fill: C.accent});
  const pay = actor({x: 700, title: 'PAYMENT', sub: 'alice −50, bob +50'});
  const bracket = wall({x: 700, y: -90, w: 340, h: 150, tag: 'together, or not at all'});
  const card = termCard('transaction = all together or not at all');
  const dispenser = box({x: 700, y: 170, w: 210, h: 70, title: 'take a number', size: 18});
  const t40 = ticket('#40', {x: 700, y: 170});
  const t41 = ticket('#41', {x: 700, y: 170});
  const t42 = ticket('#42', {x: 700, y: 170, accent: true});
  s.stage.add([p.group, expired.node, q, pay.node, bracket.node, card, t40.node, t41.node, t42.node, dispenser.node]);
  view.add(checklist().node);

  // "But that note has to say who expired her, and when."
  yield* s.at('mark');
  yield* fadeIn(q);

  // "Our payment changes two rows, and they have to happen together, or not at all."
  yield* s.at('group');
  yield* fadeIn(pay.node);
  yield* drawWall(bracket);

  // "A bundle of changes like that is called a transaction."
  yield* s.at('name');
  yield* fadeIn(card);

  // "Every transaction that writes takes a ticket number, like the machine at a deli counter,"
  yield* s.at('ticket');
  yield* fadeIn(dispenser.node);
  yield* all(t41.node.opacity(1, T.fast), t41.node.y(285, T.base));

  // "always counting up."
  yield* s.at('up');
  t40.node.position([570, 285]);
  yield* all(t40.node.opacity(0.5, T.base), t41.node.opacity(0.5, T.base),
    t40.node.x(440, T.base), t41.node.x(570, T.base));

  // "Our payment pulled number 42."
  yield* s.at('ours');
  yield* all(t42.node.opacity(1, T.fast), t42.node.y(285, T.base));
  yield* t42.node.position([700, 40], T.slow);

  // the page carries into scene 09
  yield* s.end([q, expired.node, pay.node, bracket.node, card, dispenser.node, t40.node, t41.node, t42.node]);
});
