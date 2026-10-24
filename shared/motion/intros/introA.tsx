// INTRO A, "Lifted Lid": the abstraction (dashed box) draws itself, a lid
// slams shut on it, light leaks through the gap while the lid rattles, then it
// flips open into the logo pose and the wordmark types out.
// Timing lives in shared/brand/brand.json (intros.A.beats); the music
// (tools/music/compose.py) hits the same beats.
import {makeScene2D, Rect} from '@motion-canvas/2d';
import {all, chain, easeInCubic, easeInOutCubic, easeOutCubic, spawn, waitFor} from '@motion-canvas/core';
import {BRAND, LOCKUP, grid, logo, tagline, wordmark} from '../brand';
import {waitUntilTime as at} from '../sync';
import {C} from '../theme';

const cfg = BRAND.intros.A;
const b = cfg.beats;
const BIG = 440; // logo width while it's centre stage

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  const bg = grid();
  const L = logo({width: BIG, y: 60, lid: 'hidden'});
  const flash = (<Rect width={1920} height={1080} fill={C.accent} opacity={0} />) as Rect;
  const word = wordmark({...LOCKUP.word, text: ''});
  const tag = tagline({...LOCKUP.tag, y: LOCKUP.tag.y + 14});
  L.box.end(0);
  L.core.opacity(0).scale(0);
  L.lid.position([L.closed.x, -900]).rotation(0);
  view.add(<>{bg}{flash}{L.node}{word}{tag}</>);

  // never block before a beat: everything below is scheduled on absolute times
  spawn(bg.opacity(1, 0.8));

  // the abstraction draws itself
  yield* at(b.boxDraw);
  yield* L.box.end(1, b.core - b.boxDraw - 0.1, easeInOutCubic);

  // something inside
  yield* at(b.core);
  yield* all(L.core.opacity(1, 0.3), L.core.scale(1, 0.4, easeOutCubic));

  // the lid drops shut
  yield* at(b.lidLand - 0.42);
  L.lid.opacity(1);
  yield* L.lid.position.y(L.closed.y, 0.42, easeInCubic);
  spawn(chain(L.node.scale([1.02, 0.98], 0.07), L.node.scale(1, 0.12)));
  yield* L.core.opacity(0.35, 0.2);

  // light leaks while it rattles
  for (let i = 0; i < b.rattle.length; i++) {
    yield* at(b.rattle[i]);
    const lift = 10 + i * 6;
    spawn(chain(
      all(L.lid.position.y(L.closed.y - lift, 0.06), L.lid.rotation(-1.5 - i, 0.06)),
      all(L.lid.position.y(L.closed.y, 0.1), L.lid.rotation(0, 0.1)),
    ));
    spawn(all(L.glow.opacity(0.25 + i * 0.18, 0.15), chain(L.core.opacity(0.9, 0.06), L.core.opacity(0.5 + i * 0.1, 0.25))));
  }

  // it opens
  yield* at(b.lift);
  spawn(chain(flash.opacity(0.13, 0.05), flash.opacity(0, 0.5)));
  spawn(chain(L.core.scale(1.18, 0.1), L.core.scale(1, 0.35)));
  spawn(all(L.openLid(0.45), L.glow.opacity(1, 0.3), L.core.opacity(1, 0.2)));

  // settle into the banner lockup (overlaps the lid opening; lands as the name starts typing)
  yield* at(b.lift + 0.15);
  spawn(all(
    L.node.position([LOCKUP.logo.x, LOCKUP.logo.y], 0.6, easeInOutCubic),
    L.node.scale(LOCKUP.logo.width / BIG, 0.6, easeInOutCubic),
    L.glow.opacity(0.7, 0.6),
  ));

  // the name types out
  yield* at(b.type);
  const name = BRAND.name;
  const step = (b.typeEnd - b.type) / name.length;
  for (let i = 1; i <= name.length; i++) {
    word.text(name.slice(0, i));
    yield* waitFor(step);
  }

  yield* at(b.tagline);
  yield* all(tag.opacity(1, 0.5), tag.position.y(LOCKUP.tag.y, 0.5, easeOutCubic));

  yield* at(b.fadeOut);
  yield* all(L.node.opacity(0, 0.45), word.opacity(0, 0.45), tag.opacity(0, 0.45), bg.opacity(0, 0.5));
  yield* at(cfg.duration);
});
