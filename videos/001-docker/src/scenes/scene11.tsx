import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, drawWall, fadeIn, mono, proc, swap, termCard, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene11', 'NAMESPACES', {fadeLabel: false});
  const a = wall({x: -150, w: 760, h: 320, tag: 'pid  mnt', drawn: true});
  const pa = proc({name: 'my-app', pid: 1, x: -350, opacity: 1});
  pa.node.stroke(C.accent);
  pa.sub.fill(C.accent);
  const ipA = box({x: -380, y: 75, w: 330, h: 56, title: 'address 172.17.0.2', size: 20});
  const b = wall({x: 380, w: 420, h: 300, tag: 'pid  mnt  net'});
  const pb = proc({name: 'other-app', pid: 1, x: 380, y: -40});
  pb.node.stroke(C.accent);
  const ipB = box({x: 380, y: 75, w: 330, h: 56, title: 'address 172.17.0.3', size: 20});
  const portA = mono(':80', {x: -380, y: 200, size: 30, fill: C.accent});
  const portB = mono(':80', {x: 380, y: 200, size: 30, fill: C.accent});
  const card = termCard('port 80 = the standard web port');
  const note = mono('no collision', {y: 280, size: 24, fill: C.good});
  const cl = checklist();
  s.stage.add([a.node, pa.node, ipA.node, b.node, pb.node, ipB.node, portA, portB, card, note]);
  view.add(cl.node);

  // "And the same for the network."
  yield* s.at('net');
  yield* all(
    swap(a.tag, 'pid  mnt  net'),
    a.node.size([420, 300], T.slow), a.node.x(-380, T.slow),
    pa.node.position([-380, -40], T.slow),
  );

  // "The app gets its own network address."
  yield* s.at('addr');
  yield* fadeIn(ipA.node);

  // "So two apps can both use port 80,"
  yield* s.at('two');
  yield* all(drawWall(b, T.base), fadeIn(pb.node, ipB.node));
  yield* sequence(0.2, fadeIn(portA), fadeIn(portB));

  // "the standard port for websites,"
  yield* s.at('std');
  yield* fadeIn(card);

  // "and they never collide."
  yield* s.at('collide');
  yield* fadeIn(note);

  // "That's box two..."
  yield* s.at('box');
  yield* cl.check(1);

  yield* s.end([ipA.node, ipB.node, portA, portB, card, note]);
});
