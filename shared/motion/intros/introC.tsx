// INTRO C, "Decode": the channel name starts as scrambled glyphs and locks in
// letter by letter, while scattered dashes fly together into the abstraction's
// dashed box. The core slams in, the lid swings open, and we're there.
// Timing: brand.json intros.C.beats.
import {makeScene2D, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, chain, easeInOutCubic, easeOutBack, easeOutCubic, spawn, useRandom, useThread, waitFor} from '@motion-canvas/core';
import {BRAND, LOCKUP, grid, logo, tagline} from '../brand';
import {waitUntilTime as at} from '../sync';
import {C, MONO} from '../theme';

const cfg = BRAND.intros.C;
const b = cfg.beats;
const GLYPHS = '0123456789abcdef{}[]<>/\\#$%&*+=?!;:';

/** Dash pieces along the logo's open-top U, in logo space. */
function dashLayout(w: number, h: number, k: number) {
  const dash = 64 * k, gapLen = 30 * k, thick = 32 * k;
  const segs: {x: number; y: number; r: number; len: number}[] = [];
  const edges = [
    {from: [-w / 2, -h / 2], to: [-w / 2, h / 2]},
    {from: [-w / 2, h / 2], to: [w / 2, h / 2]},
    {from: [w / 2, h / 2], to: [w / 2, -h / 2]},
  ];
  for (const e of edges) {
    const dx = e.to[0] - e.from[0], dy = e.to[1] - e.from[1];
    const len = Math.hypot(dx, dy);
    for (let s = 0; s + dash <= len + 1; s += dash + gapLen) {
      const mid = (s + dash / 2) / len;
      segs.push({x: e.from[0] + dx * mid, y: e.from[1] + dy * mid, r: (Math.atan2(dy, dx) * 180) / Math.PI, len: dash});
    }
  }
  return {segs, thick};
}

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  const random = useRandom(42);
  const bg = grid();
  const L = logo({...LOCKUP.logo, lid: 'hidden'});
  L.box.opacity(0);
  L.core.opacity(0).scale(0);

  // flying dashes that assemble into the box
  const {segs, thick} = dashLayout(L.w, L.h, L.k);
  const pieces = segs.map(sg => {
    const r = (<Rect width={sg.len} height={thick} radius={thick / 3} fill={C.accent} opacity={0}
                     x={random.nextFloat(-900, 900)} y={random.nextFloat(-500, 500)}
                     rotation={random.nextFloat(-180, 180)} />) as Rect;
    return {r, sg};
  });
  const assembly = (<Node position={[LOCKUP.logo.x, LOCKUP.logo.y]}>{pieces.map(p => p.r)}</Node>) as Node;
  // pieces start in screen space: convert their random spots into assembly space
  for (const p of pieces) p.r.position([p.r.x() - LOCKUP.logo.x, p.r.y() - LOCKUP.logo.y]);

  // two overlaid monospace texts: locked letters (white) and scrambled glyphs (dim)
  const name = BRAND.name;
  const locked = (<Txt text="" fontFamily={MONO} fontWeight={800} fontSize={92} fill={C.text} letterSpacing={-1}
                       offsetX={-1} {...LOCKUP.word} />) as Txt;
  const scram = (<Txt text="" fontFamily={MONO} fontWeight={800} fontSize={92} fill={C.dim} letterSpacing={-1}
                      offsetX={-1} {...LOCKUP.word} />) as Txt;
  const tag = tagline({...LOCKUP.tag, y: LOCKUP.tag.y + 14});
  const flash = (<Rect width={1920} height={1080} fill={C.accent} opacity={0} />) as Rect;
  view.add(<>{bg}{flash}{assembly}{L.node}{scram}{locked}{tag}</>);

  spawn(bg.opacity(1, 0.4));

  // scramble → decode, refreshed every 50 ms
  spawn(function* () {
    yield* at(b.scramble);
    const letters = [...name].map((c, i) => ({c, i})).filter(x => x.c !== ' ');
    while (useThread().time() < b.lockEnd + 0.05) {
      const t = useThread().time();
      const n = Math.max(0, Math.floor(((t - b.lockStart) / (b.lockEnd - b.lockStart)) * letters.length));
      const lockedSet = new Set(letters.slice(0, n).map(x => x.i));
      locked.text([...name].map((c, i) => (lockedSet.has(i) ? c : ' ')).join(''));
      scram.text([...name].map((c, i) => (c === ' ' || lockedSet.has(i) ? ' ' : GLYPHS[random.nextInt(0, GLYPHS.length)])).join(''));
      yield* waitFor(0.05);
    }
    locked.text(name);
    scram.text('');
  }());

  // dashes fly in, staggered
  yield* at(b.assemble);
  for (const p of pieces) p.r.opacity(0.85);
  yield* all(...pieces.map((p, i) => {
    const d = 1.1 + random.nextFloat(0, 0.5);
    const delay = (i / pieces.length) * (b.core - b.assemble - 1.65);
    return chain(
      waitFor(Math.max(0, delay)),
      all(p.r.position([p.sg.x, p.sg.y], d, easeInOutCubic), p.r.rotation(p.sg.r, d, easeInOutCubic), p.r.opacity(1, d)),
    );
  }));

  // the core slams in; swap the pieces for the real logo box
  yield* at(b.core);
  L.box.opacity(1);
  assembly.opacity(0);
  spawn(chain(flash.opacity(0.13, 0.05), flash.opacity(0, 0.45)));
  spawn(all(L.core.opacity(1, 0.1), L.core.scale(1, 0.35, easeOutBack), L.glow.opacity(0.85, 0.3)));

  yield* at(b.lidOpen);
  L.lid.position([L.closed.x, L.closed.y]).rotation(0).opacity(1);
  yield* L.openLid(0.45);

  yield* at(b.tagline);
  yield* all(tag.opacity(1, 0.5), tag.position.y(LOCKUP.tag.y, 0.5, easeOutCubic));

  yield* at(b.fadeOut);
  yield* all(L.node.opacity(0, 0.45), locked.opacity(0, 0.45), tag.opacity(0, 0.45), bg.opacity(0, 0.5));
  yield* at(cfg.duration);
});

