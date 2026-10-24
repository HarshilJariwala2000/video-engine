import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, code, draw, fadeIn, fadeTo, mono} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, clock, servers, SERVER_X} from '../lib/figures';
import {clusterFrame} from '../lib/extra-a';
import {C, DIM, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene05', 'ATTEMPT 1: A SCRIPT');
  // scene 04's last frame: three servers inside the cluster frame
  const cluster = clusterFrame(true);
  const sv = servers({frames: true});
  const [s1, s2, s3] = sv.list;

  const script = code(['for s in server-1 server-2 server-3:', '  ssh $s docker run web', 'done.'], {x: -200, y: -170, w: 820, size: 28});
  script.lines[2].opacity(0);
  script.lines[2].fill(C.text);
  // underline under the hard-coded server names (mono 0.6 em per char)
  const cw = 28 * 0.6, left = -200 - 410 + 36;
  const names = (<Line points={[[left + 9 * cw, script.lineY(0) + 22], [left + 35 * cw, script.lineY(0) + 22]]}
                       stroke={C.accent} lineWidth={W.line} end={0} />) as Line;
  const arrows = SERVER_X.map((x, i) => arrow([[-200 + (i - 1) * 150, -60], [x, 110]]));
  const time = clock('3:00 a.m.', {x: 520, y: -200});
  const exited = mono('exited', {x: -200, y: -170, size: 30, fill: C.dim});
  const count = mono('2 / 3', {x: 640, y: -100, size: 48, fill: C.bad});
  const loose = [['server-1', 560, -10], ['server-3', 740, 70], ['server-2', 580, 150]].map(([t, x, y]) =>
    chip(t as string, {x: x as number, y: y as number}).node);
  loose.forEach((c, i) => c.rotation([-6, 4, -3][i]));
  s.stage.add([cluster.node, sv.group, script.node, names, ...arrows, time.node, exited, count, ...loose]);
  const cl = checklist();
  view.add(cl.node);

  // "The obvious first try is to automate your own hands: a script."
  yield* s.at('obvious');
  yield* all(fadeIn(script.node), cluster.node.opacity(0, T.base));

  // "For each server, connect, and start the app."
  yield* s.at('each');
  yield* sequence(0.6, ...arrows.map(a => draw(a)));

  // "Three copies."
  yield* s.at('run');
  yield* all(sequence(0.12, ...sv.list.map(x => x.web.opacity(1, T.fast))), cl.check(0));

  // "It even picks the servers, sort of: we typed their names in by hand…"
  yield* s.at('picks');
  yield* all(names.end(1, T.base), fadeTo(DIM, ...arrows));
  yield* cl.fail(1);

  // "Now server two dies at 3 a.m."
  yield* s.at('dies');
  yield* all(
    fadeIn(time.node), names.opacity(0, T.fast), fadeTo(0, ...arrows),
    s2.frame.stroke(C.bad, T.base), s2.tag.fill(C.bad, T.base), s2.web.opacity(0, T.base),
  );

  // "The script finished hours ago."
  yield* s.at('finished');
  yield* script.lines[2].opacity(1, T.fast);
  yield* script.node.opacity(DIM, T.base);

  // "It printed done, and went home."
  yield* s.at('home');
  yield* script.node.opacity(0, T.base);
  yield* fadeIn(exited);

  // "You have two copies, and nobody knows."
  yield* s.at('two');
  yield* fadeIn(count);
  yield* cl.rows[0].ok.end(0, 0.15);
  yield* all(cl.fail(0), cl.fail(2));

  // "And there's no single address, just three server names you hand out and hope."
  yield* s.at('addr');
  yield* all(fadeTo(DIM, count, exited), sequence(0.15, ...loose.map(c => c.opacity(1, T.fast))));
  yield* cl.fail(3);

  // keep the servers (server-2 dead) for scene 06
  yield* s.end([script.node, exited, count, time.node, ...loose]);
});
