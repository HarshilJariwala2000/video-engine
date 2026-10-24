import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, mono, proc, sans, swap, terminal, termCard, type, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene22', 'DOCKER RUN, REVISITED', {fadeLabel: false});
  const ns = wall({x: -450, y: 0, w: 420, h: 240, tag: 'pid  mnt  net', drawn: true});
  ns.node.opacity(0);
  const p = proc({name: 'my-app', pid: 1, x: -450, y: 0});
  p.node.stroke(C.accent);
  p.sub.fill(C.accent);
  const term = terminal({x: 420, y: -200, w: 640});
  const list = ['    1  systemd', '  812  sshd', '48213  my-app', '48390  postgres'].map((t, i) =>
    mono(t, {x: 130, y: -110 + i * 44, size: 26, align: 'left'}));
  const card = termCard('ps = lists running programs');
  const just = sans('just a process.', {x: -450, y: 200, size: 44, fill: C.accent});
  const cl = checklist({state: ['ok', 'ok', 'ok', 'ok']});
  s.stage.add([ns.node, p.node, term.node, ...list, card, just]);
  view.add(cl.node);

  // "Want proof?"
  yield* s.at('proof');
  yield* fadeIn(ns.node, p.node);

  // "On a Linux server, run ps,"
  yield* s.at('ps');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, 'ps -e');

  // "the command that lists every running program."
  yield* s.at('lists');
  yield* all(fadeIn(card), sequence(0.1, ...list.map(l => fadeIn(l))));

  // "Your container is right there in the list."
  yield* s.at('there');
  yield* list[2].fill(C.accent, T.base);

  // "Just a normal process,"
  yield* s.at('just');
  yield* all(ns.node.end(0, T.slow), ns.tag.opacity(0, T.slow), swap(p.sub, 'PID 48213', C.accent));
  yield* fadeIn(just);

  yield* s.end([s.stage, cl.node]);
});
