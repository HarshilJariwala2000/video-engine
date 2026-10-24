// INTRO B, "Descent": five nested abstraction layers, from your code down to
// the hardware. The camera dives through each one (one note per layer), hits
// the glowing core, then pulls back: the innermost layer was the logo all along.
// Layer sizes are a geometric series, so a constant-rate exponential zoom passes
// one layer per beat (brand.json intros.B.beats.layers).
import {makeScene2D, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, chain, createSignal, easeInOutCubic, easeOutCubic, linear, spawn, tween} from '@motion-canvas/core';
import {BRAND, LOCKUP, grid, logo, tagline, wordmark} from '../brand';
import {waitUntilTime as at} from '../sync';
import {C, MONO} from '../theme';

const cfg = BRAND.intros.B;
const b = cfg.beats;
const NAMES = ['your code', 'libraries', 'runtime', 'kernel', 'hardware'];
const CORE_W = 420;            // innermost layer = the logo box, at world scale 1
const RATIO = 1.9;             // each layer is 1.9× its inner neighbour
const PASS_W = 2300;           // on-screen width of a layer at the moment we pass it

export default makeScene2D(function* (view) {
  view.fill(C.bg);
  const bg = grid();
  const zoom = createSignal(1);
  const world = (<Node scale={() => zoom()} />) as Node;

  // outer layers (0 = outermost); the innermost "layer" is the logo itself
  const layers = NAMES.slice(0, 4).map((name, i) => {
    const w = CORE_W * RATIO ** (4 - i), h = w * (600 / 840);
    const rect = (
      <Rect width={w} height={h} stroke={i === 3 ? C.accent : C.stroke} radius={w * 0.02}
            lineWidth={() => 3 / zoom()} lineDash={() => [16 / zoom(), 11 / zoom()]} />
    ) as Rect;
    const label = (
      <Txt text={name} fontFamily={MONO} fontSize={w * 0.032} fill={C.label}
           x={-w / 2 + w * 0.03} y={-h / 2 + w * 0.03} offsetX={-1} offsetY={-1} />
    ) as Txt;
    return {node: (<Node>{rect}{label}</Node>) as Node, rect, label};
  });
  const L = logo({width: CORE_W, lid: 'hidden'});
  const coreLabel = (<Txt text={NAMES[4]} fontFamily={MONO} fontSize={CORE_W * 0.06} fill={C.label}
                          x={-CORE_W / 2 + 18} y={-CORE_W * 0.357 + 16} offsetX={-1} offsetY={-1} />) as Txt;
  const flash = (<Rect width={1920} height={1080} fill={C.accent} opacity={0} />) as Rect;
  world.add(<>{layers.map(l => l.node)}{L.node}{coreLabel}</>);
  const word = wordmark({...LOCKUP.word, opacity: 0, x: LOCKUP.word.x + 30});
  const tag = tagline({...LOCKUP.tag});
  view.add(<>{bg}{world}{flash}{word}{tag}</>);

  // zoom(t) = s0 · RATIO^((t − first)/gap): passes layer i exactly at beats.layers[i]
  const first = b.layers[0], gap = b.layers[1] - b.layers[0];
  const s0 = PASS_W / (CORE_W * RATIO ** 4);
  const zoomAt = (t: number) => s0 * RATIO ** ((t - first) / gap);
  const tStart = 0.2;
  zoom(zoomAt(tStart));
  L.glow.opacity(0.4);

  spawn(bg.opacity(1, 0.6));
  const tEnd = b.layers[4];
  yield* at(tStart);
  // the dive: constant rate in log space
  yield* tween(tEnd - tStart, v => zoom(zoomAt(tStart + v * (tEnd - tStart))), linear);

  // ease into the core
  const zCore = zoomAt(tEnd) * 1.12;
  yield* tween(b.core - tEnd, v => zoom(zoomAt(tEnd) + (zCore - zoomAt(tEnd)) * easeOutCubic(v)));

  // the core: flash, then pull all the way back out
  spawn(chain(flash.opacity(0.14, 0.05), flash.opacity(0, 0.5)));
  spawn(chain(L.core.scale(1.15, 0.1), L.core.scale(1, 0.3)));
  spawn(L.glow.opacity(1, 0.3));
  const zFinal = LOCKUP.logo.width / CORE_W;
  yield* all(
    tween(b.lid - b.core - 0.2, v => zoom(Math.exp(Math.log(zCore) + (Math.log(zFinal) - Math.log(zCore)) * easeInOutCubic(v)))),
    world.position([LOCKUP.logo.x, LOCKUP.logo.y], b.lid - b.core - 0.2, easeInOutCubic),
    ...layers.map(l => l.node.opacity(0, 0.45)),
    coreLabel.opacity(0, 0.3),
  );

  // the lid lands in its lifted pose
  L.lid.position([L.open.x, L.open.y - 260]).rotation(-25).opacity(1);
  yield* all(L.lid.position([L.open.x, L.open.y], 0.2, easeOutCubic), L.lid.rotation(L.open.r, 0.2, easeOutCubic));
  spawn(chain(L.node.scale([1.03, 0.97], 0.06), L.node.scale(1, 0.12)));

  yield* at(b.wordmark);
  yield* all(word.opacity(1, 0.45), word.position.x(LOCKUP.word.x, 0.45, easeOutCubic));
  yield* at(b.tagline);
  yield* tag.opacity(1, 0.5);

  yield* at(b.fadeOut);
  yield* all(world.opacity(0, 0.45), word.opacity(0, 0.45), tag.opacity(0, 0.45), bg.opacity(0, 0.5));
  yield* at(cfg.duration);
});
