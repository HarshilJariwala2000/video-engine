import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, drawWall, fadeIn, fadeTo, sans, termCard, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, CLUSTER, servers, you} from '../lib/figures';
import {C, DIM, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene04', 'WHAT WE NEED');
  const build = sans("let's build it ourselves", {y: -340, size: 44});
  const app = box({x: CLUSTER.x, y: -10, w: 220, h: 70, title: 'web', size: 28});
  const srv = servers();
  const cluster = wall({x: CLUSTER.x, y: CLUSTER.y, w: CLUSTER.w, h: CLUSTER.h, tag: 'cluster'});
  const card = termCard('cluster = a group of servers run as one');
  const me = you({x: srv.list[0].x, y: 60});
  const chores = ['restart', 'find room', 'fix address'].map((t, i) =>
    chip(t, {x: srv.list[i].x, y: 60, color: C.dim}).node);
  const cl = checklist({place: 'center', visible: false});
  s.stage.add([build, app.node, srv.group, cluster.node, card, me.node, ...chores]);
  view.add(cl.node);

  // "So let's pretend we're building Kubernetes ourselves, to take over your 3 a.m. job."
  yield* s.at('build');
  yield* fadeIn(build);

  // "Same web app, same three servers."
  yield* s.at('app');
  yield* fadeIn(app.node);
  yield* sequence(0.15, ...srv.list.map(x => x.frame.opacity(1, T.base)));

  // "Except we stop thinking of them as three separate machines you log in to… a cluster."
  yield* s.at('cluster');
  yield* fadeIn(me.node);
  yield* me.node.x(srv.list[1].x, 0.4);
  yield* me.node.x(srv.list[2].x, 0.4);
  yield* all(me.node.opacity(0, T.base), build.opacity(0, T.base));
  yield* drawWall(cluster);
  yield* fadeIn(card);

  // "Every chore you did by hand becomes a requirement."
  yield* s.at('four');
  yield* all(fadeTo(0, card, app.node), fadeTo(DIM, srv.group, cluster.node), fadeIn(...chores));
  yield* all(cl.title.opacity(1, T.base), ...chores.map(c => all(c.position([-160, -150], T.slow), c.scale(0.5, T.slow), c.opacity(0, T.slow))));

  // "One: keep three copies of the app running, always."
  yield* s.at('r1');
  yield* cl.reveal(0);
  // "Two: pick a server with room for each copy…"
  yield* s.at('r2');
  yield* cl.reveal(1);
  // "Three: heal on its own, even when a server dies at 3 a.m."
  yield* s.at('r3');
  yield* cl.reveal(2);
  // "And four: one address that reaches whichever copies are alive…"
  yield* s.at('r4');
  yield* cl.reveal(3);

  // the panel moves to its permanent home in the top-right corner
  yield* s.before(1.8);
  yield* all(cl.toCorner(0.8), fadeTo(1, srv.group, cluster.node));
  // keep the servers and the cluster frame (scene 05 starts on them)
  yield* s.end([build, card, app.node, me.node]);
});
