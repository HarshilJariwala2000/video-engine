// Small factories for the channel's visual vocabulary (boxes, walls, arrows…).
// Every element is created invisible (opacity 0 / end 0) and revealed on a cue.
import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, sequence, ThreadGenerator} from '@motion-canvas/core';
import {C, FS, MONO, SANS, T, W} from './theme';

type XY = [number, number];

export interface BoxOpts {
  x?: number; y?: number; w?: number; h?: number;
  title?: string; sub?: string; size?: number;
  stroke?: string; color?: string; dashed?: boolean; opacity?: number;
}
/** Outlined box with a mono title and optional dim subtitle. */
export function box(o: BoxOpts) {
  const size = o.size ?? 24;
  const title = (<Txt text={o.title ?? ''} fontFamily={MONO} fontSize={size} fill={o.color ?? C.text} />) as Txt;
  const sub = (<Txt text={o.sub ?? ''} fontFamily={MONO} fontSize={Math.max(FS.tiny, Math.round(size * 0.75))} fill={C.dim} />) as Txt;
  const node = (
    <Rect x={o.x ?? 0} y={o.y ?? 0} width={o.w ?? 300} height={o.h ?? 90}
          stroke={o.stroke ?? C.stroke} lineWidth={W.line} radius={4}
          lineDash={o.dashed ? [12, 8] : []} opacity={o.opacity ?? 0}
          layout direction="column" alignItems="center" justifyContent="center" gap={6}>
      {title}
      {o.sub !== undefined ? sub : []}
    </Rect>
  ) as Rect;
  return {node, title, sub};
}

/** A process: name + PID. */
export function proc(o: {x?: number; y?: number; name: string; pid: number | string; opacity?: number}) {
  return box({x: o.x, y: o.y, w: 300, h: 100, title: o.name, sub: `PID ${o.pid}`, size: 26, opacity: o.opacity});
}

/** Image layer bar. */
export function layer(o: {x?: number; y?: number; w?: number; title: string; opacity?: number; stroke?: string}) {
  return box({x: o.x, y: o.y, w: o.w ?? 460, h: 46, title: o.title, size: 20, opacity: o.opacity, stroke: o.stroke});
}

/**
 * Namespace "wall": a dashed accent outline drawn with `end`, plus a tag
 * above its top-left corner listing the namespaces ("pid mnt net").
 */
export function wall(o: {x?: number; y?: number; w: number; h: number; tag?: string; drawn?: boolean}) {
  const ref = createRef<Rect>();
  const tag = (
    <Txt text={o.tag ?? ''} fontFamily={MONO} fontSize={FS.small} fill={C.accent} offsetX={-1}
         x={() => -ref().width() / 2 + 4} y={() => -ref().height() / 2 - 26}
         opacity={o.drawn ? 1 : 0} />
  ) as Txt;
  const node = (
    <Rect ref={ref} x={o.x ?? 0} y={o.y ?? 0} width={o.w} height={o.h} stroke={C.accent}
          lineWidth={W.line} radius={6} lineDash={[12, 8]} end={o.drawn ? 1 : 0}>
      {tag}
    </Rect>
  ) as Rect;
  return {node, tag};
}
export function* drawWall(w: {node: Rect; tag: Txt}, d = T.slow): ThreadGenerator {
  yield* all(w.node.end(1, d), w.tag.opacity(1, d));
}

/** Monospace text. align 'left' anchors x at the left edge. */
export function mono(text: string, o: {x?: number; y?: number; size?: number; fill?: string; align?: 'left' | 'center'; opacity?: number} = {}) {
  return (
    <Txt text={text} fontFamily={MONO} fontSize={o.size ?? 24} fill={o.fill ?? C.text}
         x={o.x ?? 0} y={o.y ?? 0} offsetX={o.align === 'left' ? -1 : 0} opacity={o.opacity ?? 0} />
  ) as Txt;
}
/** Sentence text (Inter). */
export function sans(text: string, o: {x?: number; y?: number; size?: number; fill?: string; align?: 'left' | 'center'; opacity?: number} = {}) {
  return (
    <Txt text={text} fontFamily={SANS} fontSize={o.size ?? 40} fill={o.fill ?? C.text}
         x={o.x ?? 0} y={o.y ?? 0} offsetX={o.align === 'left' ? -1 : 0} opacity={o.opacity ?? 0} />
  ) as Txt;
}

/** Arrow drawn in with `draw()`. */
export function arrow(points: XY[], o: {stroke?: string; width?: number} = {}) {
  return (
    <Line points={points} stroke={o.stroke ?? C.dim} lineWidth={o.width ?? W.line}
          endArrow arrowSize={12} end={0} opacity={0} />
  ) as Line;
}
export function* draw(line: Line, d = T.base): ThreadGenerator {
  yield* all(line.opacity(1, 0.1), line.end(1, d));
}

/** Terminal bar: "$ " + a command that can be typed with type(). */
export function terminal(o: {x?: number; y?: number; w?: number}) {
  const cmd = (<Txt text="" fontFamily={MONO} fontSize={32} fill={C.text} />) as Txt;
  const node = (
    <Rect x={o.x ?? 0} y={o.y ?? 0} width={o.w ?? 760} height={84} stroke={C.stroke} lineWidth={W.main}
          radius={4} opacity={0} layout alignItems="center" paddingLeft={32} gap={18}>
      <Txt text="$" fontFamily={MONO} fontSize={32} fill={C.dim} />
      {cmd}
    </Rect>
  ) as Rect;
  return {node, cmd};
}
/** Typewriter effect: ~22 chars/s. */
export function* type(t: Txt, text: string, cps = 22): ThreadGenerator {
  for (let i = 1; i <= text.length; i++) {
    t.text(text.slice(0, i));
    yield* waitFrames(Math.max(1, Math.round(60 / cps)));
  }
}
function* waitFrames(n: number): ThreadGenerator {
  for (let i = 0; i < n; i++) yield;
}

/** Code panel with individually addressable lines (explicit positions, so
 *  other elements can line up with a row via `lineY(i)`). */
export function code(lines: string[], o: {x?: number; y?: number; w?: number; size?: number; fill?: string; stroke?: string} = {}) {
  const size = o.size ?? 28, gap = Math.round(size * 1.8), pad = 36, w = o.w ?? 720;
  const h = pad * 2 + (lines.length - 1) * gap + size;
  const lineY = (i: number) => (o.y ?? 0) - h / 2 + pad + size / 2 + i * gap;
  const txts = lines.map((l, i) => (
    <Txt text={l} fontFamily={MONO} fontSize={size} fill={o.fill ?? C.dim}
         x={-w / 2 + pad} y={-h / 2 + pad + size / 2 + i * gap} offsetX={-1} />
  ) as Txt);
  const node = (
    <Rect x={o.x ?? 0} y={o.y ?? 0} width={w} height={h} stroke={o.stroke ?? C.stroke}
          lineWidth={W.line} radius={4} opacity={0}>
      {txts}
    </Rect>
  ) as Rect;
  return {node, lines: txts, lineY, h, w};
}

/** Quick fade-swap of a text's content. */
export function* swap(t: Txt, text: string, fill?: string): ThreadGenerator {
  yield* t.opacity(0, 0.15);
  t.text(text);
  if (fill) t.fill(fill);
  yield* t.opacity(1, 0.25);
}

/** Horizontal meter (CPU / memory). Fill grows from the left. */
export function meter(o: {x?: number; y?: number; w?: number; label: string}) {
  const w = o.w ?? 560;
  const fill = (<Rect x={-w / 2} offsetX={-1} width={0} height={40} fill={C.accent} />) as Rect;
  const value = (<Txt text="" fontFamily={MONO} fontSize={22} fill={C.text} x={w / 2 + 24} offsetX={-1} />) as Txt;
  const node = (
    <Node x={o.x ?? 0} y={o.y ?? 0} opacity={0}>
      <Txt text={o.label} fontFamily={MONO} fontSize={FS.small} fill={C.dim} x={-w / 2} y={-48} offsetX={-1} />
      <Rect width={w} height={40} stroke={C.stroke} lineWidth={W.line} radius={4} clip>
        {fill}
      </Rect>
      {value}
    </Node>
  ) as Node;
  return {node, fill, value, w};
}

export function* fadeIn(...nodes: Node[]): ThreadGenerator {
  yield* all(...nodes.map(n => n.opacity(1, T.base)));
}
export function* fadeTo(v: number, ...nodes: Node[]): ThreadGenerator {
  yield* all(...nodes.map(n => n.opacity(v, T.base)));
}
export function* stagger(gap: number, ...tasks: ThreadGenerator[]): ThreadGenerator {
  yield* sequence(gap, ...tasks);
}

/** "term = analogy" card shown once when a new term is introduced (§5). */
export function termCard(text: string, o: {x?: number; y?: number} = {}) {
  return mono(text, {x: o.x ?? -120, y: o.y ?? -320, size: 30, fill: C.text});
}

/** Drawn check mark / cross (no font glyphs needed). Reveal with `.end(1)`. */
export function checkMark(o: {x?: number; y?: number; s?: number; color?: string} = {}) {
  const s = o.s ?? 1;
  return (
    <Line x={o.x ?? 0} y={o.y ?? 0} points={[[-14 * s, 0], [-4 * s, 10 * s], [16 * s, -12 * s]]}
          stroke={o.color ?? C.good} lineWidth={4} lineCap="round" lineJoin="round" end={0} />
  ) as Line;
}
export function crossMark(o: {x?: number; y?: number; s?: number; color?: string} = {}) {
  const s = o.s ?? 1, c = o.color ?? C.bad;
  const a = (<Line points={[[-12 * s, -12 * s], [12 * s, 12 * s]]} stroke={c} lineWidth={4} lineCap="round" end={0} />) as Line;
  const b = (<Line points={[[12 * s, -12 * s], [-12 * s, 12 * s]]} stroke={c} lineWidth={4} lineCap="round" end={0} />) as Line;
  const node = (<Node x={o.x ?? 0} y={o.y ?? 0}>{a}{b}</Node>) as Node;
  return {node, a, b};
}
export function* drawCross(c: {a: Line; b: Line}, d = T.fast): ThreadGenerator {
  yield* sequence(0.1, c.a.end(1, d), c.b.end(1, d));
}

/** Outline with a small tag above its top-left corner (laptop, server, real computer…). */
export function frame(o: {x?: number; y?: number; w: number; h: number; tag: string; opacity?: number; dashed?: boolean}) {
  const tag = mono(o.tag, {x: -o.w / 2 + 4, y: -o.h / 2 - 26, size: FS.label, fill: C.dim, align: 'left', opacity: 1});
  const node = (
    <Rect x={o.x ?? 0} y={o.y ?? 0} width={o.w} height={o.h} stroke={C.stroke} lineWidth={W.main} radius={6}
          lineDash={o.dashed ? [12, 8] : []} opacity={o.opacity ?? 0}>
      {tag}
    </Rect>
  ) as Rect;
  return {node, tag};
}
