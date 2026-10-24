import {makeScene2D} from '@motion-canvas/2d';
import {all, chain} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, checkMark, code, fadeIn, fadeTo, mono, sans, swap, terminal, type} from '../lib/ui';
import {chip, clock, KUBE_LOOP_R, KUBE_POS, loopArrow, servers, SERVER_Y, you} from '../lib/figures';
import {C, DIM, FS, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene01', 'THE PROBLEM');
  const big = sans('one container is easy', {y: -330, size: 48});
  const term = terminal({x: -200, y: -190, w: 900});
  const srv = servers();
  const [s1, s2, s3] = srv.list;
  const ok1 = checkMark({x: s1.x + 135, y: SERVER_Y - 20});
  // sized for the longer label it swaps to
  const users = chip('10 users', {x: 640, y: -300, size: FS.label, w: Math.round('10,000 users'.length * FS.label * 0.62 + 40)});
  const me = you({x: s1.x, y: 40});
  const clk = clock('3:00 a.m.', {x: 560, y: -200});
  const paged = chip('paged!', {x: 0, y: 0, color: C.bad, stroke: C.bad});
  const extra = box({x: -200, y: -50, w: 200, h: 60, title: 'web', size: 26, dashed: true, stroke: C.accent});
  // the copy that moves: drawn exactly over server-1's container, with its address
  const mover = box({x: s1.x, y: SERVER_Y - 20, w: 200, h: 76, title: 'web', sub: '10.0.0.4', size: 26});
  const cfg = code(['web = 10.0.0.4'], {x: 640, y: 40, w: 420, size: 28, fill: C.text});
  const loop = loopArrow({x: -200, y: -60, r: 120});
  // beside the loop, not under it: below it are the server tags
  const prog = mono('you = the program', {x: -50, y: -60, size: 36, fill: C.accent, align: 'left'});
  const kube = box({x: KUBE_POS[0], y: KUBE_POS[1], w: 340, h: 90, title: 'Kubernetes', size: 34, stroke: C.accent});
  s.stage.add([big, term.node, srv.group, ok1, users.node, clk.node, extra.node, mover.node, cfg.node, prog, kube.node, loop, me.node, paged.node]);

  // "One container is easy."
  yield* s.at('one');
  yield* fadeIn(big, s1.frame);

  // "You type docker run, your web app starts, and life is good."
  yield* s.at('run');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, 'docker run web');
  yield* fadeIn(s1.web);
  yield* ok1.end(1, T.base);

  // "Then people actually start using it."
  yield* s.at('grow');
  yield* all(fadeIn(users.node), big.opacity(0, T.base));
  yield* swap(users.title, '10,000 users', C.accent);

  // "Now you need three copies, on three servers,"
  yield* s.at('three');
  s2.frame.x(s2.x + 120);
  s3.frame.x(s3.x + 240);
  yield* all(
    s2.frame.opacity(1, T.slow), s2.frame.x(s2.x, T.slow),
    s3.frame.opacity(1, T.slow), s3.frame.x(s3.x, T.slow),
    ok1.opacity(0, T.fast),
  );

  // "so you log in to each one and start it by hand."
  yield* s.at('ssh');
  yield* me.node.opacity(1, T.fast);
  yield* me.node.x(s2.x, 0.35);
  term.cmd.text('ssh server-2; docker run web');
  yield* s2.web.opacity(1, T.fast);
  yield* me.node.x(s3.x, 0.35);
  yield* all(swap(term.cmd, 'ssh server-3; docker run web'), s3.web.opacity(1, T.fast));

  // "At 3 a.m. one of them crashes, and guess who gets woken up to restart it."
  yield* s.at('crash');
  yield* all(fadeIn(clk.node), users.node.opacity(0, T.base), me.node.x(s1.x, T.base), term.node.opacity(DIM, T.base));
  yield* all(s3.web.stroke(C.bad, T.fast), s3.webTitle.fill(C.bad, T.fast));
  paged.node.position([s1.x + 120, -10]);
  yield* paged.node.opacity(1, 0.2);
  yield* chain(...[1, -1, 1, -1].map(k => paged.node.x(s1.x + 120 + k * 8, 0.06)), paged.node.x(s1.x + 120, 0.06));
  yield* all(me.node.x(s3.x, T.slow), paged.node.opacity(0, T.base));
  yield* all(s3.web.stroke(C.good, T.fast), s3.webTitle.fill(C.text, T.fast));
  yield* s3.web.stroke(C.stroke, T.base);

  // "A new copy needs a home, and you're the one who remembers which server still has memory free."
  yield* s.at('room');
  yield* all(fadeIn(extra.node, ...srv.list.map(x => x.bar)), clk.node.opacity(DIM, T.base));
  for (const sv of srv.list) {
    yield* me.node.x(sv.x, 0.4);
    yield* chain(sv.barFill.fill(C.accent, 0.2), sv.barFill.fill(C.dim, 0.5));
  }

  // "Every time a copy moves, its address changes, and you go and fix the config."
  yield* s.at('addr');
  s1.web.opacity(0);
  mover.node.opacity(1);
  yield* all(fadeIn(cfg.node), extra.node.opacity(0, T.base), fadeTo(DIM, ...srv.list.map(x => x.bar)));
  yield* mover.node.position([s2.x, SERVER_Y + 60], T.slow);
  yield* swap(mover.sub, '10.0.0.9', C.accent);
  yield* all(cfg.node.stroke(C.bad, T.fast), swap(cfg.lines[0], 'web = 10.0.0.9', C.bad));
  yield* me.node.x(s2.x, T.base);

  // "Without noticing, you've become a program. A slow, tired one…"
  yield* s.at('you');
  yield* all(
    fadeTo(DIM, srv.group, mover.node, cfg.node, clk.node),
    term.node.opacity(0, T.base),
    me.node.position([-200, -60], T.slow), me.node.scale(1.5, T.slow),
  );
  yield* loop.end(1, T.slow);
  yield* fadeIn(prog);
  yield* loop.rotation(360, 4);

  // "That job is exactly what Kubernetes was built to take off your hands."
  yield* s.at('name');
  yield* all(
    me.node.position([-700, -60], T.slow), me.node.opacity(DIM, T.slow), prog.opacity(0, T.base),
    fadeIn(kube.node), loop.size(KUBE_LOOP_R * 2, T.slow), loop.position(KUBE_POS, T.slow),
    fadeTo(1, srv.group), cfg.node.opacity(0, T.base), clk.node.opacity(0, T.base),
    fadeTo(0, mover.node, ...srv.list.flatMap(x => [x.web, x.bar])),
  );
  yield* loop.rotation(720, 2.5);

  // keep the Kubernetes box, its loop and the empty server frames for scene 02
  yield* s.end([me.node]);
});
