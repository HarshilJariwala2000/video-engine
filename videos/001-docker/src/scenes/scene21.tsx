import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, drawWall, fadeIn, fadeTo, mono, proc, sans, terminal, type, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {laptopServer, layerStack} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene21', 'DOCKER RUN, REVISITED');
  const X = -150;
  const term = terminal({y: -350, w: 700});
  const registry = box({x: 700, y: 60, w: 260, h: 120, title: 'registry', size: 26});
  const layers = layerStack(['layer 1', 'layer 2', 'layer 3'], {x: X, y: 205, w: 440}).map(l => l.node);
  const targets = layers.map(l => l.y());
  layers.forEach(l => l.position([700, 60]).scale(0.4));
  const rw = box({x: X, y: 205 - 3 * 58, w: 440, h: 46, title: 'writable layer', size: 20, dashed: true, stroke: C.accent});
  const ns = wall({x: X, y: 30, w: 540, h: 460, tag: 'pid  mnt  net'});
  const budget = mono('budget: cpu 0.5  mem 512M', {x: X - 266, y: 290, size: 18, fill: C.dim, align: 'left'});
  const p = proc({name: 'my-app', pid: 1, x: X, y: -105});
  p.node.stroke(C.accent);
  const build = [term.node, registry.node, ...layers, rw.node, ns.node, budget, p.node];

  // callback: the exact laptop + server from scene 01
  const cb = laptopServer(false);
  cb.okL.position([-420, 100]);
  cb.okR.position([420, 100]);
  const fast = sans('starts in ~1 s', {y: 190, size: 40, fill: C.accent});
  s.stage.add([...build, cb.group, fast]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Now watch docker run again."
  yield* s.at('watch');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, 'docker run my-app');

  // "Docker downloads any image layers you don't have yet."
  yield* s.at('pull');
  yield* fadeIn(registry.node);
  yield* sequence(0.25, ...layers.map((l, i) =>
    all(l.opacity(1, 0.2), l.position([X, targets[i]], T.slow), l.scale(1, T.slow))));

  // "It stacks them and adds a thin writable layer."
  yield* s.at('stack');
  yield* fadeIn(rw.node);

  // "It puts on the blinders" / "and sets the budget."
  yield* s.at('blind');
  yield* drawWall(ns);
  yield* s.at('budget');
  yield* fadeIn(budget);

  // "Then it starts your app as one ordinary process."
  yield* s.at('start');
  yield* all(fadeIn(p.node), registry.node.opacity(0, T.base));

  // "The same files on your laptop and on the server,"
  yield* s.at('same');
  yield* fadeTo(0, ...build);
  yield* fadeIn(cb.laptop.node, cb.server.node, cb.pkgL.node, cb.pkgR.node);

  // "so no more works on my machine."
  yield* s.at('works');
  yield* sequence(0.15, cb.okL.end(1, T.base), cb.okR.end(1, T.base));

  // "And no extra operating system, so it starts in about a second."
  yield* s.at('fast');
  yield* fadeIn(fast);

  yield* s.end();
});
