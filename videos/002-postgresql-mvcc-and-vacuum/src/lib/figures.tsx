// Diagrams reused across scenes, so consecutive scenes and callbacks show the
// exact same visual in the exact same place (VIDEO_BRIEF §5).
import {Circle, Line, Node, Polygon, Rect, Txt} from '@motion-canvas/2d';
import {all, chain, createSignal, sequence, ThreadGenerator} from '@motion-canvas/core';
import {box, checkMark, crossMark, mono} from './ui';
import {C, FS, MONO, T, W as LW} from './theme';

type XY = [number, number];
const NONE = '#14141400'; // transparent background (tweens cleanly from any grey)
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

// ─── the 10 GB "accounts" table (scenes 01, 02, 14–17, 20) ────────────────────
// 4 pages × 5 slots; each slot stands for a million rows.
export const PAGE_X = [-255, -85, 85, 255];
export const CELL_Y = (r: number) => -60 + (r - 2) * 38;
/** The 10 slots holding the closed accounts (deleted in scene 01). */
export const DEAD = [1, 3, 5, 7, 9, 11, 12, 15, 18, 19];
export type CellState = 'live' | 'ghost' | 'dead' | 'free' | 'new';

export function accounts(o: {visible?: boolean; rows?: number; state?: (i: number) => CellState} = {}) {
  const v = o.visible ? 1 : 0;
  const rows = createSignal(o.rows ?? 20_000_000);
  const frameRect = (
    <Rect y={-90} width={720} height={300} stroke={C.stroke} lineWidth={LW.main} radius={6} opacity={v}>
      {mono('accounts', {x: -356, y: -172, size: FS.label, fill: C.dim, align: 'left', opacity: 1})}
    </Rect>
  ) as Rect;
  const counter = (
    <Txt text={() => `${fmt(rows())} rows`} fontFamily={MONO} fontSize={30} fill={C.text} y={-205} opacity={v} />
  ) as Txt;
  const pages = PAGE_X.map(x => (
    <Rect x={x} y={-60} width={150} height={206} stroke={C.stroke} lineWidth={LW.fine} radius={4} opacity={v} />
  ) as Rect);
  const cells = Array.from({length: 20}, (_, i) => {
    const tag = (<Txt text="" fontFamily={MONO} fontSize={FS.tiny} fill={C.text} />) as Txt;
    const rect = (
      <Rect x={PAGE_X[Math.floor(i / 5)]} y={CELL_Y(i % 5)} width={120} height={28} radius={3}
            lineWidth={LW.fine} fill={C.dim} stroke={C.dim} opacity={v}>
        {tag}
      </Rect>
    ) as Rect;
    return {rect, tag};
  });
  const sweep = (<Line points={[[0, -175], [0, 55]]} x={-345} stroke={C.accent} lineWidth={4} lineCap="round" opacity={0} />) as Line;
  const disk = diskBar({});
  const group = (<Node>{frameRect}{counter}{pages}{cells.map(c => c.rect)}{sweep}</Node>) as Node;
  const table = [frameRect, counter, ...pages, ...cells.map(c => c.rect)];

  function* set(i: number, state: CellState, d = T.fast, text = ''): ThreadGenerator {
    const c = cells[i];
    const dash = state === 'ghost' || state === 'free' ? [6, 4] : [];
    c.rect.lineDash(dash);
    const fill = state === 'live' ? C.dim : state === 'dead' ? C.stroke : NONE;
    const stroke = {live: C.dim, ghost: C.stroke, dead: C.stroke, free: C.good, new: C.accent}[state];
    c.tag.text(state === 'free' ? 'free' : text);
    c.tag.fill(state === 'free' ? C.good : state === 'new' ? C.accent : C.text);
    yield* all(c.rect.fill(fill, d), c.rect.stroke(stroke, d));
  }
  if (o.state) cells.forEach((_, i) => { const st = o.state!(i); if (st !== 'live') setNow(i, st); });
  function setNow(i: number, st: CellState) {
    const c = cells[i];
    c.rect.lineDash(st === 'ghost' || st === 'free' ? [6, 4] : []);
    c.rect.fill(st === 'live' ? C.dim : st === 'dead' ? C.stroke : NONE);
    c.rect.stroke({live: C.dim, ghost: C.stroke, dead: C.stroke, free: C.good, new: C.accent}[st]);
    if (st === 'free') c.tag.text('free').fill(C.good);
  }
  /** Sweep line walks the table page by page. */
  function* walk(d = 1.6, from = -345, to = 345): ThreadGenerator {
    sweep.x(from);
    yield* sweep.opacity(1, 0.15);
    yield* sweep.x(to, d);
  }
  return {group, frame: frameRect, counter, rows, pages, cells, sweep, disk, table, set, walk};
}

// ─── disk usage bar (scenes 01, 02, 13–17, 19, 20) ───────────────────────────
/** Left-anchored bar; W pixels = 10 GB. The value label follows the bar's end. */
export function diskBar(o: {x0?: number; y?: number; W?: number; gb?: number; visible?: boolean; label?: string}) {
  const W = o.W ?? 480;
  const fill = (<Rect offsetX={-1} width={W * (o.gb ?? 10) / 10} height={40} radius={3} fill={C.dim} />) as Rect;
  const stripes = Array.from({length: Math.ceil(W / 2 / 14) + 4}, (_, k) => (
    <Line points={[[-W / 4 + (k - 2) * 14 - 20, 20], [-W / 4 + (k - 2) * 14 + 20, -20]]} stroke={C.bg} lineWidth={4} />
  ) as Line);
  const hatch = (
    <Rect x={W * 0.75} width={W / 2} height={40} clip stroke={C.label} lineWidth={LW.fine} lineDash={[6, 4]} opacity={0}>
      {stripes}
    </Rect>
  ) as Rect;
  const hatchLbl = mono('space still taken', {x: W * 0.75, y: 44, size: 18, fill: C.label});
  const value = (
    <Txt text={() => `${Math.round(fill.width() / W * 10)} GB`} fontFamily={MONO} fontSize={26} fill={C.text}
         x={() => fill.width() + 18} offsetX={-1} />
  ) as Txt;
  const label = mono(o.label ?? 'disk', {y: -42, size: FS.small, fill: C.dim, align: 'left', opacity: 1});
  const node = (
    <Node x={o.x0 ?? -360} y={o.y ?? 170} opacity={o.visible ? 1 : 0}>{label}{fill}{hatch}{hatchLbl}{value}</Node>
  ) as Node;
  function* gb(n: number, d = T.slow): ThreadGenerator {
    yield* fill.width(W * n / 10, d);
  }
  /** Hatched right half: 'taken' (grey) or 'free' (green). */
  function* showHatch(kind: 'taken' | 'free', d = T.base): ThreadGenerator {
    const c = kind === 'free' ? C.good : C.label;
    hatchLbl.text(kind === 'free' ? 'free inside' : 'space still taken');
    hatchLbl.fill(c);
    hatch.stroke(c);
    yield* all(hatch.opacity(1, d), hatchLbl.opacity(1, d));
  }
  return {node, fill, hatch, hatchLbl, value, label, W, gb, showHatch};
}

// ─── "Sam (infra)" chat chip (scenes 01, 15, 20) ─────────────────────────────
export function samChip() {
  const ok = checkMark({x: -330, color: C.good});
  const node = (
    <Rect x={560} y={330} width={600} height={64} radius={8} stroke={C.stroke} lineWidth={LW.line} opacity={0}>
      {mono('Sam (infra):', {x: -270, size: FS.small, fill: C.dim, align: 'left', opacity: 1})}
      {mono('you need to vacuum.', {x: -90, size: 22, fill: C.text, align: 'left', opacity: 1})}
      {ok}
    </Rect>
  ) as Rect;
  return {node, ok};
}

// ─── terminal with an output line (scenes 01, 02, 15–17, 20) ─────────────────
export function termOut(o: {x?: number; y?: number; w?: number; visible?: boolean} = {}) {
  const x = o.x ?? -200, y = o.y ?? 290, w = o.w ?? 780;
  const cmd = (<Txt text="" fontFamily={MONO} fontSize={28} fill={C.text} />) as Txt;
  const node = (
    <Rect x={x} y={y} width={w} height={72} stroke={C.stroke} lineWidth={LW.main} radius={4} opacity={o.visible ? 1 : 0}
          layout alignItems="center" paddingLeft={28} gap={16}>
      <Txt text="$" fontFamily={MONO} fontSize={28} fill={C.dim} />
      {cmd}
    </Rect>
  ) as Rect;
  const out = mono('', {x: x - w / 2 + 28, y: y + 62, size: FS.small, fill: C.dim, align: 'left', opacity: 1});
  return {node, cmd, out};
}

// ─── the two-row bank and the page of row versions (scenes 03–14) ────────────
export const SLOT_Y = [-135, -45, 45, 135];
export const NARROW = {card: 300, page: 400};
export const WIDE = {card: 740, page: 800};
/** Column centers of the CREATED BY / DELETED BY fields on a wide card. */
export const FIELD_X = [25, 255];

function field(x: number, label: string) {
  const lbl = (<Txt text={label} fontFamily={MONO} fontSize={FS.tiny} fill={C.dim} x={-95} offsetX={-1} />) as Txt;
  const value = (<Txt text="" fontFamily={MONO} fontSize={24} fill={C.text} x={95} offsetX={1} />) as Txt;
  const strike = (<Line points={[[40, 0], [100, 0]]} stroke={C.bad} lineWidth={3} end={0} />) as Line;
  const node = (
    <Rect x={x} width={210} height={44} radius={3} stroke={C.stroke} lineWidth={LW.line}>{lbl}{value}{strike}</Rect>
  ) as Rect;
  return {node, lbl, value, strike};
}

export interface Card {
  node: Node; rect: Rect; name: Txt; bal: Txt;
  cf: ReturnType<typeof field>; df: ReturnType<typeof field>; fields: Node;
  widen: (d?: number) => ThreadGenerator;
}
/** One row version: name + balance, and (once wide) the two hidden stamps. */
export function rowCard(o: {name: string; bal: string | number; y: number; wide?: boolean; stroke?: string;
  created?: string; deleted?: string; opacity?: number}): Card {
  const wide = !!o.wide;
  const rect = (<Rect width={wide ? WIDE.card : NARROW.card} height={64} radius={4} stroke={o.stroke ?? C.stroke} lineWidth={LW.line} />) as Rect;
  const name = (<Txt text={o.name} fontFamily={MONO} fontSize={26} fill={C.text} x={wide ? -350 : -130} offsetX={-1} />) as Txt;
  const bal = (<Txt text={String(o.bal)} fontFamily={MONO} fontSize={26} fill={C.text} x={wide ? -220 : 40} offsetX={-1} />) as Txt;
  const cf = field(FIELD_X[0], 'CREATED BY');
  const df = field(FIELD_X[1], 'DELETED BY');
  cf.value.text(o.created ?? '');
  df.value.text(o.deleted ?? '');
  const fields = (<Node opacity={wide ? 1 : 0}>{cf.node}{df.node}</Node>) as Node;
  const node = (<Node y={o.y} opacity={o.opacity ?? 0}>{rect}{fields}{name}{bal}</Node>) as Node;
  function* widen(d = T.slow): ThreadGenerator {
    yield* all(rect.width(WIDE.card, d), name.x(-350, d), bal.x(-220, d), fields.opacity(1, d));
  }
  return {node, rect, name, bal, cf, df, fields, widen};
}

/**
 * The table page with up to four row versions:
 * [0] old alice 100 (7, 42), [1] old bob 100 (7, 42), [2] new alice 50 (42, —), [3] new bob 150 (42, —).
 */
export function mvccPage(o: {wide?: boolean; frame?: boolean; show?: number; stamps?: boolean; headers?: boolean} = {}) {
  const wide = !!o.wide, show = o.show ?? 0;
  const W = wide ? WIDE.page : NARROW.page;
  const frameRect = (<Rect width={W} height={400} stroke={C.stroke} lineWidth={LW.main} radius={6} opacity={o.frame ? 1 : 0} />) as Rect;
  const tag = mono('table page', {y: -228, size: FS.label, fill: C.dim, align: 'left', opacity: o.frame ? 1 : 0});
  tag.x(() => -frameRect.width() / 2 + 4);
  const data: [string, number, string, string, string?][] = [
    ['alice', 100, '7', '42'], ['bob', 100, '7', '42'],
    ['alice', 50, '42', '—', C.accent], ['bob', 150, '42', '—', C.accent],
  ];
  const cards = data.map(([name, bal, cr, de, stroke], i) => rowCard({
    name, bal, y: SLOT_Y[i], wide, stroke,
    created: o.stamps ? cr : '', deleted: o.stamps ? de : '', opacity: i < show ? 1 : 0,
  }));
  const slots = SLOT_Y.map(y => (
    <Rect y={y} width={wide ? WIDE.card : NARROW.card} height={64} radius={4} stroke={C.stroke} lineWidth={LW.line} lineDash={[8, 6]} end={0} />
  ) as Rect);
  const headers = ['xmin', 'xmax'].map((t, i) => mono(t, {x: FIELD_X[i], y: -230, size: FS.label, fill: C.dim, opacity: o.headers ? 1 : 0}));
  const group = (<Node>{frameRect}{tag}{slots}{cards.map(c => c.node)}{headers}</Node>) as Node;
  function* widen(d = T.slow): ThreadGenerator {
    yield* all(frameRect.width(WIDE.page, d), ...slots.map(sl => sl.width(WIDE.card, d)), ...cards.map(c => c.widen(d)));
  }
  return {group, frame: frameRect, tag, cards, slots, headers, widen,
    oldA: cards[0], oldB: cards[1], newA: cards[2], newB: cards[3]};
}

/** REPORT / PAYMENT / QUERY box with a "waiting…" line and a running-sum line under it. */
export function actor(o: {x: number; y?: number; title: string; sub?: string; visible?: boolean}) {
  const y = o.y ?? -90;
  const b = box({x: o.x, y, w: 280, h: 104, title: o.title, sub: o.sub, size: 26, opacity: o.visible ? 1 : 0});
  const waitFill = (<Rect x={-90} offsetX={-1} width={60} height={6} fill={C.dim} />) as Rect;
  const wait = (
    <Node x={o.x} y={y + 82} opacity={0}>
      {mono('waiting…', {y: -16, size: FS.small, fill: C.dim, opacity: 1})}
      <Rect y={14} width={180} height={6} stroke={C.stroke} lineWidth={LW.fine} clip>{waitFill}</Rect>
    </Node>
  ) as Node;
  const sum = mono('', {x: o.x, y: y + 150, size: 28, fill: C.text});
  /** Pulse the waiting bar once (fill sweeps left → right). */
  function* pulse(d = 0.9): ThreadGenerator {
    waitFill.width(0);
    yield* waitFill.width(180, d);
  }
  return {...b, wait, waitFill, sum, pulse};
}

/** Scenes 03–06: alice and bob (narrow cards), REPORT on the left, PAYMENT on the right. */
export function bank(o: {visible?: boolean} = {}) {
  const page = mvccPage({show: o.visible ? 2 : 0});
  const report = actor({x: -700, title: 'REPORT', sub: 'SUM(balance)', visible: o.visible});
  const pay = actor({x: 700, title: 'PAYMENT', sub: 'alice −50, bob +50', visible: o.visible});
  const rA = link([[-555, -95], [-162, -135]]), rB = link([[-555, -85], [-162, -45]]);
  const pA = link([[555, -95], [162, -135]], C.accent), pB = link([[555, -85], [162, -45]], C.accent);
  const group = (
    <Node>{page.group}{report.node}{report.wait}{report.sum}{pay.node}{pay.wait}{pay.sum}{rA}{rB}{pA}{pB}</Node>
  ) as Node;
  return {group, page, alice: page.oldA, bob: page.oldB, report, pay, rA, rB, pA, pB};
}

/** Arrow factory with explicit points, created invisible. */
export function link(points: XY[], stroke: string = C.dim) {
  return (<Line points={points} stroke={stroke} lineWidth={LW.line} endArrow arrowSize={12} end={0} opacity={0} />) as Line;
}

/** Snapshot = camera-viewfinder brackets with a tag and up to two text lines. */
export function snapshot(o: {x: number; y?: number; w?: number; h?: number; lines?: [string, string][]; accent?: boolean}) {
  const w = o.w ?? 280, h = o.h ?? 110, y = o.y ?? 100, k = 22;
  const color = o.accent ? C.accent : C.label;
  const corner = (sx: number, sy: number) => (
    <Line points={[[sx * w / 2, sy * (h / 2 - k)], [sx * w / 2, sy * h / 2], [sx * (w / 2 - k), sy * h / 2]]}
          stroke={color} lineWidth={3} lineCap="round" />
  ) as Line;
  const corners = [corner(-1, -1), corner(1, -1), corner(-1, 1), corner(1, 1)];
  const tag = mono('snapshot', {y: -h / 2 - 22, size: FS.small, fill: C.dim, opacity: 1});
  const lines = (o.lines ?? []).map(([t, fill], i) => mono(t, {y: (i - ((o.lines!.length - 1) / 2)) * 34, size: 22, fill, opacity: 1}));
  const node = (<Node x={o.x} y={y} opacity={0}>{corners}{tag}{lines}</Node>) as Node;
  return {node, corners, tag, lines};
}

// ─── small icons ─────────────────────────────────────────────────────────────
export function padlock(o: {x?: number; y?: number; s?: number; color?: string; crossed?: boolean} = {}) {
  const c = o.color ?? C.text;
  const shackle = (<Circle y={-20} size={34} startAngle={180} endAngle={360} stroke={c} lineWidth={4} />) as Circle;
  const body = (<Rect y={6} width={50} height={38} radius={5} stroke={c} lineWidth={3} fill={C.bg} />) as Rect;
  const cross = crossMark({s: 2.2, color: C.bad});
  if (!o.crossed) cross.node.opacity(0);
  const node = (<Node x={o.x ?? 0} y={o.y ?? 0} scale={o.s ?? 1} opacity={0}>{shackle}{body}{cross.node}</Node>) as Node;
  return {node, shackle, body, cross};
}

export function stopSign(o: {x?: number; y?: number} = {}) {
  const oct = (<Polygon sides={8} size={96} rotation={22.5} stroke={C.bad} lineWidth={3} />) as Polygon;
  const node = (
    <Node x={o.x ?? 0} y={o.y ?? 0} opacity={0}>
      {oct}
      {mono('STOP', {size: 20, fill: C.bad, opacity: 1})}
      {mono('four-way stop', {y: 74, size: FS.small, fill: C.dim, opacity: 1})}
    </Node>
  ) as Node;
  return {node, oct};
}

export function coffee(o: {x?: number; y?: number} = {}) {
  return (
    <Node x={o.x ?? 0} y={o.y ?? 0} opacity={0}>
      <Rect width={52} height={48} radius={[0, 0, 10, 10]} stroke={C.text} lineWidth={3} />
      <Circle x={30} size={26} startAngle={-90} endAngle={90} stroke={C.text} lineWidth={3} />
      <Line points={[[-10, -34], [-4, -44], [-10, -54]]} stroke={C.dim} lineWidth={LW.fine} lineCap="round" />
      <Line points={[[8, -34], [14, -44], [8, -54]]} stroke={C.dim} lineWidth={LW.fine} lineCap="round" />
      {mono('coffee break', {y: 54, size: FS.small, fill: C.dim, opacity: 1})}
    </Node>
  ) as Node;
}

export function ticket(n: string, o: {x?: number; y?: number; accent?: boolean; opacity?: number} = {}) {
  const c = o.accent ? C.accent : C.label;
  const txt = mono(n, {size: 26, fill: c, opacity: 1});
  const node = (
    <Rect x={o.x ?? 0} y={o.y ?? 0} width={110} height={52} radius={8} stroke={c} lineWidth={LW.line} lineDash={o.accent ? [] : [6, 4]}
          opacity={o.opacity ?? 0}>
      {txt}
    </Rect>
  ) as Rect;
  return {node, txt};
}

/** Small clock face (same-instant marker in scene 11). */
export function clockIcon(o: {x?: number; y?: number; label?: string} = {}) {
  return (
    <Node x={o.x ?? 0} y={o.y ?? 0} opacity={0}>
      <Circle size={56} stroke={C.text} lineWidth={3} />
      <Line points={[[0, 0], [0, -18]]} stroke={C.text} lineWidth={3} lineCap="round" />
      <Line points={[[0, 0], [13, 6]]} stroke={C.text} lineWidth={3} lineCap="round" />
      {mono(o.label ?? '', {y: 52, size: FS.small, fill: C.dim, opacity: 1})}
    </Node>
  ) as Node;
}

/** Pulse a node's scale once (attention without color). */
export function* bump(n: Node, k = 1.08): ThreadGenerator {
  yield* chain(n.scale(k, 0.2), n.scale(1, 0.3));
}

/** A row of sequential reveals (used for staggering cells). */
export function* stag(gap: number, ...tasks: ThreadGenerator[]): ThreadGenerator {
  yield* sequence(gap, ...tasks);
}
