import {makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, termCard, type} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {accounts, bump, DEAD, samChip, termOut} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene15', 'VACUUM');
  // scene 14's last frame: the accounts table with 10 million dead rows
  const a = accounts({visible: true, rows: 10_000_000, state: i => (DEAD.includes(i) ? 'dead' : 'live')});
  a.disk.node.opacity(1);
  const term = termOut();
  const card = termCard('vacuum = the cleaning crew');
  const sam = samChip();
  const carol = DEAD[3];
  s.stage.add([a.group, a.disk.node, term.node, term.out, card, sam.node]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Which brings us to vacuum."
  yield* s.at('crew');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, 'VACUUM accounts;', 30);

  // "If Postgres is the hoarder, vacuum is the cleaning crew."
  yield* s.at('think');
  yield* fadeIn(card);

  // "It walks the table page by page,"
  yield* s.at('walks');
  yield* a.walk(1.6);

  // "finds rows no photo can see anymore,"
  yield* s.at('finds');
  yield* all(a.sweep.opacity(0, T.fast), sequence(0.05, ...DEAD.map(i => a.cells[i].rect.stroke(C.accent, T.fast))));

  // "and marks their space as free."
  yield* s.at('marks');
  yield* sequence(0.06, ...DEAD.map(i => a.set(i, 'free')));

  // "New rows move into those holes."
  yield* s.at('new');
  yield* a.set(carol, 'new', T.base, 'carol 30');

  // "And this is where Sam's advice disappoints people."
  yield* s.at('but');
  yield* all(fadeIn(sam.node), bump(a.disk.node, 1.04));

  // "The file doesn't shrink."
  yield* s.at('file');
  yield* chain(a.disk.value.fill(C.bad, T.fast), a.disk.value.fill(C.text, T.slow));

  // "You cleared out half the closet, and the closet is still the same size."
  yield* s.at('stays');
  yield* a.disk.showHatch('free');

  // table, disk bar and terminal carry into scene 16
  yield* s.end([card, sam.node]);
});
