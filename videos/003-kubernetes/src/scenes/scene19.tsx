import {Rect, makeScene2D} from '@motion-canvas/2d';
import {all, chain, loop, sequence, spawn, waitFor} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, draw, fadeIn, fadeTo, mono, terminal} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {
  BAR_W, CTRL_X, CTRL_Y, NOTE_LEFT, NOTE_POS, SERVER_X, SERVER_Y, SH, chat, chip, controller, entryPos, fillNode, flash, loopArrow,
  notebook, podList, serverAt, servers, spin, you,
} from '../lib/figures';
import {C, DIM, FS, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene19', 'THE PROBLEM, REVISITED');

  // ── the exact scene 02 frame ──
  const term = terminal({y: -250, w: 900});
  term.node.opacity(1);
  term.cmd.text('kubectl get pods');
  const list = podList({visible: true, status: ['Running', 'Running', 'Pending']});
  const pending = list.rows[2].status;

  // ── the machine room ──
  const nb = notebook();
  const pods = nb.pods.slice(0, 3);
  const replica = controller('replica controller', {x: CTRL_X.replica, y: CTRL_Y});
  const sched = controller('scheduler', {x: CTRL_X.scheduler, y: CTRL_Y});
  const srv = servers({names: 'node', frames: true});
  const nodes = srv.list;
  const node4 = serverAt(SERVER_X[2] + 360, SERVER_Y, 'node-4', 0.9);
  // all four nodes live in one group, so they can shrink left to make room for node-4
  const SHRINK = 0.78, SHRINK_POS: [number, number] = [-280, 60];
  srv.group.add([node4.frame, node4.bar, node4.web, node4.addr, node4.kubelet]);
  srv.group.opacity(0);
  // free room as a fraction of BAR_W (8 GB): a copy asks for 2 GB = 0.25
  // the notebook's two spare rows hold the notes: ROW_A (scheduler note) and ROW_B (asks / no apply)
  const [, ROW_A] = entryPos(4), [, ROW_B] = entryPos(5);
  const asks = chip('each pod asks 2 GB', {x: NOTE_POS[0], y: ROW_B, size: FS.small}).node;
  const others = nodes.map(n => chip('other team', {x: n.x, y: n.y + 33, size: FS.tiny, color: C.dim, dashed: true, w: 200}).node);
  srv.group.add(others);
  const note = mono('0/3 nodes: insufficient memory', {x: NOTE_POS[0] + 30, y: ROW_A, size: FS.tiny, fill: C.dim});
  const retry = loopArrow({x: NOTE_LEFT + 50, y: ROW_A, r: 18, width: 3});
  const want = chip('change the want: asks 1 GB', {x: -590, y: 30});
  const have = chip('change the have: + server', {x: -110, y: 30});
  const noApply = chip('no apply', {x: NOTE_POS[0], y: ROW_B, color: C.accent, stroke: C.accent});
  const auto = controller('cluster autoscaler', {x: CTRL_X.node, y: CTRL_Y});
  const autoToPod = arrow([[CTRL_X.node + 120, CTRL_Y + 39], [NOTE_LEFT + 26, entryPos(3)[1]]]);
  // node-4 after the shrink: group at SHRINK_POS, scale SHRINK
  const n4x = SHRINK_POS[0] + SHRINK * node4.x, n4top = SHRINK_POS[1] + SHRINK * (SERVER_Y - SH / 2 - 34);
  const autoToNode = arrow([[n4x, CTRL_Y + 39], [n4x, n4top]]);
  const me = you({x: -800, y: 40});
  const jordan = chat("it's not stuck. it's waiting.");
  const room = [nb.group, replica.node, sched.node, srv.group, asks, note, retry, want.node, have.node,
    noApply.node, auto.node, autoToPod, autoToNode, me.node];
  s.stage.add([term.node, list.node, ...room, jordan.node]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Now, back to the pod that said Pending."
  yield* s.at('back');
  yield* chain(pending.scale(1.15, 0.25), pending.scale(1, 0.35));

  // "The replica controller did its part: three entries."
  yield* s.at('replica');
  yield* fadeTo(0, term.node, list.node);
  yield* all(nb.group.opacity(1, T.base), nb.api.opacity(1, T.base), nb.book.opacity(1, T.base),
    nb.link.opacity(1, T.base), nb.deploy.node.opacity(1, T.base), replica.node.opacity(1, T.base));
  yield* all(sequence(0.15, ...pods.map(p => p.node.opacity(1, T.base))), spin(replica.glyph));

  // "Then the scheduler looked. Each copy asks for two gigabytes of memory."
  yield* s.at('ask');
  yield* all(fadeTo(DIM, replica.node), fadeIn(sched.node, srv.group), spin(sched.glyph));
  yield* all(...nodes.map(n => n.bar.opacity(1, T.base)));
  yield* fadeIn(asks);

  // "Two copies found a server with room."
  yield* s.at('two');
  yield* fillNode(pods[0], 'node-1', C.good);
  yield* all(fadeIn(nodes[0].web), nodes[0].barFill.width(BAR_W * 0.45, T.base));
  yield* fillNode(pods[1], 'node-2', C.good);
  yield* all(fadeIn(nodes[1].web), nodes[1].barFill.width(BAR_W * 0.1, T.base));

  // "For the third, every server was already filled past that by other teams' apps."
  yield* s.at('full');
  yield* all(fadeTo(DIM, pods[0].node, pods[1].node), flash(pods[2].node));
  yield* sequence(0.15, ...others.map(o => o.opacity(0.7, T.base)));
  yield* all(...nodes.flatMap(n => [
    n.barFill.width(BAR_W * 0.15, T.base), n.barFill.fill(C.bad, T.base),
    (n.bar.children()[0] as Rect).stroke(C.bad, T.base), n.barTxt.text('< 2 GB', T.base), n.barTxt.fill(C.bad, T.base),
  ]));

  // "So its blank stayed blank."
  yield* s.at('blank');
  yield* all(pods[2].field.fill(C.accent, T.fast), flash(pods[2].node), chain(pods[2].field.scale(1.15, 0.25), pods[2].field.scale(1, 0.35)));

  // "No error, because nothing failed. The scheduler wrote a note on the pod, and kept trying."
  yield* s.at('note');
  yield* all(fadeIn(note), retry.end(1, T.base));
  spawn(loop(5, () => retry.rotation(retry.rotation() + 360, 1)));

  // "So change the want, or the have."
  yield* s.at('fix');
  yield* fadeIn(want.node, have.node);
  yield* all(fadeTo(DIM, want.node), have.node.stroke(C.accent, T.base), have.title.fill(C.accent, T.base));

  // "Add a fourth server,"
  yield* s.at('add');
  yield* all(srv.group.scale(SHRINK, T.base), srv.group.position(SHRINK_POS, T.base), fadeTo(0, want.node));
  yield* all(node4.frame.opacity(1, T.base), node4.bar.opacity(1, T.base));

  // "and once it joins, the scheduler fills in the blank, and the pod starts. You didn't apply anything."
  yield* s.at('starts');
  yield* all(sched.node.opacity(1, T.fast), spin(sched.glyph, 1, T.base), fadeTo(0, note, retry, have.node, asks));
  yield* fillNode(pods[2], 'node-4', C.accent);
  yield* all(fadeIn(node4.web), node4.barFill.width(BAR_W * 0.65, T.base), pods[2].field.fill(C.good, T.base));
  yield* fadeIn(noApply.node);

  // "On a cloud, there's even a thermostat for that: a cluster autoscaler..."
  yield* s.at('auto');
  yield* all(fadeIn(auto.node), fadeTo(DIM, sched.node, noApply.node), spin(auto.glyph));
  yield* draw(autoToPod);
  yield* waitFor(1.2);
  // "...and rents another server."
  yield* all(draw(autoToNode), flash(node4.frame));
  yield* waitFor(1.5);
  // "Finding room used to be your job too."
  yield* fadeIn(me.node);
  yield* me.node.x(-700, T.slow);
  yield* waitFor(0.6);
  yield* me.node.opacity(0, T.slow);

  // "Jordan was right, by the way. It wasn't stuck. It was waiting..."
  yield* s.at('jordan');
  yield* all(fadeTo(0.1, ...room), fadeIn(jordan.node));
  yield* jordan.ok.end(1, T.base);

  yield* s.end();
});
