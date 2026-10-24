import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, fadeIn, fadeTo, mono, type} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {accounts, DEAD, padlock, termOut} from '../lib/figures';
import {C, FS, T} from '../lib/theme';

const K = 0.7, OLD_X = -440, NEW_X = 440;

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene16', 'VACUUM FULL');
  // scene 15's last frame: free slots, carol moved in, terminal still open
  const carol = DEAD[3];
  const a = accounts({visible: true, rows: 10_000_000,
    state: i => (i === carol ? 'new' : DEAD.includes(i) ? 'free' : 'live')});
  a.cells[carol].tag.text('carol 30').fill(C.accent);
  a.disk.node.opacity(1);
  a.disk.hatch.opacity(1);
  a.disk.hatch.stroke(C.good);
  a.disk.hatchLbl.text('free inside').fill(C.good).opacity(1);
  const term = termOut({visible: true});
  term.cmd.text('VACUUM accounts;');

  // the new, compact copy (same figure, all slots empty to start)
  const nw = accounts({rows: 11_000_000});
  nw.group.position([NEW_X, 0]).scale(K);
  nw.counter.opacity(0);
  nw.frame.end(0);
  const newTag = mono('new copy', {x: NEW_X, y: -230, size: 22, fill: C.accent});
  const oldTag = mono('old file, still on disk', {x: OLD_X, y: -230, size: FS.small, fill: C.dim});
  const live = a.cells.map((_, i) => i).filter(i => !DEAD.includes(i) || i === carol);

  const lock = padlock({x: NEW_X, y: -180, color: C.accent});
  const rep = box({x: -320, y: 320, w: 220, h: 60, title: 'REPORT', size: 22});
  const pay = box({x: 320, y: 320, w: 220, h: 60, title: 'PAYMENT', size: 22});
  const waits = [-320, 320].map(x => mono('waiting…', {x, y: 375, size: FS.small, fill: C.dim}));
  const cl = checklist({state: ['ok', 'ok', 'ok', 'ok']});
  s.stage.add([a.group, nw.group, a.disk.node, term.node, term.out, newTag, oldTag, lock.node, rep.node, pay.node, ...waits]);
  view.add(cl.node);

  // "If you really want the space back, there's vacuum full."
  yield* s.at('shrink');
  term.cmd.text('');
  yield* type(term.cmd, 'VACUUM FULL accounts;', 30);

  // "It builds a brand new copy of the table,"
  yield* s.at('copy');
  yield* all(a.group.position([OLD_X, 0], T.slow), a.group.scale(K, T.slow));
  nw.frame.opacity(1);
  yield* all(nw.frame.end(1, T.base), fadeIn(...nw.pages, newTag));

  // "with only the live rows,"
  yield* s.at('live');
  yield* sequence(0.05, ...live.map((src, k) => {
    const from = a.cells[src].rect, to = nw.cells[k].rect, target = to.position();
    to.position([from.x() + (OLD_X - NEW_X) / K, from.y()]);
    to.fill(from.fill()).stroke(from.stroke());
    if (src === carol) nw.cells[k].tag.text('carol 30').fill(C.accent);
    return all(to.opacity(1, 0.15), to.position(target, 0.6), from.opacity(0.3, 0.3));
  }));

  // "then throws the old file away."
  yield* s.at('swap');
  yield* a.group.opacity(0, T.base);

  // "10 gigabytes becomes 5."
  yield* s.at('five');
  yield* all(a.disk.gb(5, T.slow), a.disk.fill.fill(C.good, T.slow), a.disk.hatch.opacity(0, T.base), a.disk.hatchLbl.opacity(0, T.base));

  // "But it's like moving to a smaller apartment."
  yield* s.at('lock');
  lock.node.scale(1.4);
  yield* all(term.node.opacity(0, T.fast), term.out.opacity(0, T.fast), lock.node.opacity(1, T.fast), lock.node.scale(1, T.base));

  // "While you're packing, nobody gets in: no reads, no writes."
  yield* s.at('nothing');
  yield* fadeIn(rep.node, pay.node, ...waits);
  yield* sequence(0.15, cl.fail(0), cl.fail(1));

  // "And for a while, you're paying rent on both places."
  yield* s.at('room');
  a.cells.forEach(c => c.rect.opacity(1));
  yield* all(a.group.opacity(0.4, T.base), fadeIn(oldTag), a.disk.gb(15, T.slow), a.disk.fill.fill(C.bad, T.slow));

  // "That's the bill for hoarding…" — the move finishes, the doors open again
  yield* s.at('room', 3.4);
  yield* all(a.group.opacity(0, T.base), oldTag.opacity(0, T.base), a.disk.gb(5, T.slow), a.disk.fill.fill(C.good, T.slow),
    lock.node.opacity(0, T.base), fadeTo(0, ...waits));
  yield* all(cl.check(0), cl.check(1));

  yield* s.end();
});
