// Diagrams reused across scenes, so consecutive scenes and callbacks show the
// exact same visual in the exact same place (VIDEO_BRIEF §5).
//
// The "machine room" layout used from scene 01 to scene 19:
//   servers / nodes   bottom-left, three frames at SERVER_X, y SERVER_Y
//   controllers       a row above them (replica, scheduler, node controller)
//   reconcile stamp   between the controllers and the servers
//   API server + etcd notebook   the right-hand column
import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, chain, ThreadGenerator} from '@motion-canvas/core';
import {box, checkMark, frame, mono, swap} from './ui';
import {C, FS, MONO, T, W} from './theme';

type XY = [number, number];

// ── layout ───────────────────────────────────────────────────────────────────
// Everything left of the notebook stays at x < 340 so it never touches the notebook
// column (x 400..880), and nothing goes below y 415, where the captions start.
export const SERVER_X = [-560, -200, 160];
export const SERVER_Y = 260;
export const SW = 300, SH = 230;
export const API_POS: XY = [640, -250];
export const API_W = 320, API_H = 70;
export const NOTE_POS: XY = [640, 90];
export const NOTE_W = 480, NOTE_H = 480;
export const NOTE_LEFT = NOTE_POS[0] - NOTE_W / 2;
export const CTRL_Y = -110, CTRL_H = 70;
export const CTRL_X = {replica: -560, scheduler: -200, node: 160};
export const STAMP_POS: XY = [-200, 30];
/** Bounding frame around the three servers (the "cluster", scene 04 / 11 / 14). */
export const CLUSTER = {x: -200, y: 255, w: 1060, h: 320};
/** Controller → API server links: one horizontal lane each, ordered so no two links cross. */
export const LANE = {replica: -267, scheduler: -245, node: -223};
/** x where those links end: the API box's left edge. */
export const API_IN = API_POS[0] - API_W / 2 - 6;

/** A small chip: outlined pill with mono text. */
export function chip(text: string, o: {x?: number; y?: number; color?: string; stroke?: string; size?: number; w?: number; dashed?: boolean; opacity?: number} = {}) {
  const size = o.size ?? FS.small;
  return box({x: o.x, y: o.y, w: o.w ?? Math.round(text.length * size * 0.62 + 40), h: size + 24, title: text, size,
    color: o.color ?? C.text, stroke: o.stroke ?? C.stroke, dashed: o.dashed, opacity: o.opacity});
}

// ── servers / nodes ──────────────────────────────────────────────────────────
export interface Server {
  frame: Rect; tag: Txt;
  /** free-room bar: outline, fill (width = free fraction × BAR_W), value text */
  bar: Node; barFill: Rect; barTxt: Txt;
  web: Rect; webTitle: Txt;
  addr: Txt;
  kubelet: Rect;
  x: number; y: number;
}
export const BAR_W = 180;
const ROOM = [0.7, 0.35, 0.55]; // default free fraction per server

/** Three server frames. Every part starts invisible unless `visible` lists it. */
export function servers(o: {frames?: boolean; names?: 'server' | 'node'; n?: number; xs?: number[]} = {}) {
  const xs = o.xs ?? SERVER_X;
  const list: Server[] = xs.slice(0, o.n ?? xs.length).map((x, i) => serverAt(x, SERVER_Y, `${o.names ?? 'server'}-${i + 1}`, ROOM[i % 3], o.frames));
  const group = (<Node>{list.flatMap(s => [s.frame, s.bar, s.web, s.addr, s.kubelet])}</Node>) as Node;
  return {group, list};
}

export function serverAt(x: number, y: number, name: string, room = 0.5, visible = false): Server {
  const f = frame({x, y, w: SW, h: SH, tag: name, opacity: visible ? 1 : 0});
  const barFill = (<Rect x={-BAR_W / 2} offsetX={-1} width={BAR_W * room} height={22} fill={C.dim} />) as Rect;
  const barTxt = (<Txt text="free" fontFamily={MONO} fontSize={FS.tiny} fill={C.dim} x={BAR_W / 2 + 12} offsetX={-1} />) as Txt;
  const bar = (
    <Node x={x - 40} y={y - 80} opacity={0}>
      <Rect width={BAR_W} height={22} stroke={C.stroke} lineWidth={W.fine} radius={3} clip>{barFill}</Rect>
      {barTxt}
    </Node>
  ) as Node;
  const web = box({x, y: y - 20, w: 200, h: 60, title: 'web', size: 26});
  const addr = mono('', {x, y: y + 33, size: FS.small, fill: C.dim});
  const kubelet = box({x, y: y + 80, w: 200, h: 42, title: 'kubelet', size: FS.small, stroke: C.stroke, color: C.dim}).node;
  return {frame: f.node, tag: f.tag, bar, barFill, barTxt, web: web.node, webTitle: web.title, addr, kubelet, x, y};
}

// ── the "you" icon (scene 01, called back in 03, 04, 07, 19) ─────────────────
export function you(o: {x?: number; y?: number; opacity?: number} = {}) {
  const head = (<Circle y={-34} size={30} stroke={C.text} lineWidth={W.line} />) as Circle;
  const body = (<Rect y={6} width={58} height={36} radius={[29, 29, 4, 4]} stroke={C.text} lineWidth={W.line} />) as Rect;
  const label = (<Txt text="you" fontFamily={MONO} fontSize={FS.small} fill={C.text} y={48} />) as Txt;
  const node = (<Node x={o.x ?? 0} y={o.y ?? 0} opacity={o.opacity ?? 0}>{head}{body}{label}</Node>) as Node;
  return {node, head, body, label};
}

/** The "Kubernetes" box and its loop (end of scene 01 → start of scene 02), clear of the server tags. */
export const KUBE_POS: XY = [-200, -110];
export const KUBE_LOOP_R = 190;

/** Circular loop arrow (check → fix → check). Draw with `.end(1)`, spin with rotation. */
export function loopArrow(o: {x?: number; y?: number; r?: number; color?: string; dashed?: boolean; width?: number} = {}) {
  const r = o.r ?? 70;
  // the head scales with the loop: 14 px on big loops, down to 6 px on small glyphs
  const head = Math.min(14, Math.max(6, Math.round(r * 0.3)));
  return (
    <Circle x={o.x ?? 0} y={o.y ?? 0} size={r * 2} startAngle={-80} endAngle={250} stroke={o.color ?? C.accent}
            lineWidth={o.width ?? W.line} endArrow arrowSize={head} end={0} lineDash={o.dashed ? [12, 8] : []} />
  ) as Circle;
}

/** Clock chip ("3:00 a.m.") with a tiny clock face. */
export function clock(text: string, o: {x?: number; y?: number} = {}) {
  const hand = (<Line points={[[0, 0], [0, -9], [0, 0], [7, 0]]} stroke={C.text} lineWidth={W.fine} lineCap="round" />) as Line;
  const label = (<Txt text={text} fontFamily={MONO} fontSize={FS.label} fill={C.text} x={24} offsetX={-1} />) as Txt;
  const node = (
    <Node x={o.x ?? 0} y={o.y ?? 0} opacity={0}>
      <Circle size={30} stroke={C.text} lineWidth={W.fine} />{hand}{label}
    </Node>
  ) as Node;
  return {node, label};
}

// ── the reconcile stamp: WANT / HAVE / ACT ───────────────────────────────────
export function stamp(o: {x?: number; y?: number; want?: string; have?: string; act?: string; w?: number} = {}) {
  const cw = o.w ?? 160;
  const cell = (head: string, value: string, i: number, accent = false) => {
    const val = (<Txt text={value} fontFamily={MONO} fontSize={36} fill={accent ? C.accent : C.text} y={14} />) as Txt;
    const node = (
      <Node x={(i - 1) * cw} opacity={value ? 1 : 0}>
        <Txt text={head} fontFamily={MONO} fontSize={FS.tiny} fill={accent ? C.accent : C.dim} y={-24} letterSpacing={2} />
        {val}
      </Node>
    ) as Node;
    return {node, val};
  };
  const want = cell('WANT', o.want ?? '', 0);
  const have = cell('HAVE', o.have ?? '', 1);
  const act = cell('ACT', o.act ?? '', 2, true);
  const outline = (<Rect width={cw * 3 + 20} height={96} stroke={C.stroke} lineWidth={W.line} radius={4} />) as Rect;
  const div = [-0.5, 0.5].map(k => (<Line points={[[k * cw, -36], [k * cw, 36]]} stroke={C.stroke} lineWidth={W.fine} />) as Line);
  const node = (<Node x={o.x ?? 0} y={o.y ?? 0} opacity={0}>{outline}{div}{want.node}{have.node}{act.node}</Node>) as Node;
  const cells = {want, have, act};
  return {
    node, cells,
    /** show / change one cell's value */
    *set(which: 'want' | 'have' | 'act', value: string, fill?: string): ThreadGenerator {
      const c = cells[which];
      if (c.node.opacity() < 0.5) {
        c.val.text(value);
        if (fill) c.val.fill(fill);
        yield* c.node.opacity(1, T.base);
      } else yield* swap(c.val, value, fill);
    },
    *clear(): ThreadGenerator {
      yield* all(want.node.opacity(0, T.fast), have.node.opacity(0, T.fast), act.node.opacity(0, T.fast));
    },
  };
}

// ── controllers ──────────────────────────────────────────────────────────────
/** A controller: a box with a small spinning loop glyph at its left end and the
 *  name beside it. The box fits the name unless `w` asks for more.
 *  `node` is the group (fade/move it); `box` is the outline (recolor it). */
export function controller(name: string, o: {x?: number; y?: number; w?: number; size?: number} = {}) {
  const size = o.size ?? FS.small;
  const w = Math.max(o.w ?? 0, Math.round(name.length * size * 0.6 + 100));
  const outline = (<Rect width={w} height={CTRL_H} stroke={C.stroke} lineWidth={W.line} radius={4} />) as Rect;
  const glyph = loopArrow({x: -w / 2 + 32, r: 12, width: W.fine, color: C.dim});
  glyph.end(1);
  // centred in the space right of the glyph
  const title = (<Txt text={name} fontFamily={MONO} fontSize={size} fill={C.text} x={26} />) as Txt;
  const node = (<Node x={o.x ?? 0} y={o.y ?? 0} opacity={0}>{outline}{title}{glyph}</Node>) as Node;
  return {node, box: outline, title, glyph, w};
}
/** Controller → API server: up from the controller's top edge, then right along its lane. */
export function apiLink(x: number, lane: number) {
  return (
    <Line points={[[x, CTRL_Y - CTRL_H / 2 - 4], [x, lane], [API_IN, lane]]} stroke={C.dim}
          lineWidth={W.line} endArrow arrowSize={12} end={0} opacity={0} />
  ) as Line;
}
export function* spin(glyph: Circle, turns = 1, d = T.slow): ThreadGenerator {
  yield* glyph.rotation(glyph.rotation() + 360 * turns, d);
}

// ── API server + the etcd notebook ───────────────────────────────────────────
export interface Entry {node: Rect; name: Txt; field: Txt; strike: Line}
const ENTRY_W = NOTE_W - 60;
function entry(name: string, field: string, y: number): Entry {
  const nameTxt = (<Txt text={name} fontFamily={MONO} fontSize={FS.small} fill={C.text} x={-ENTRY_W / 2 + 20} offsetX={-1} />) as Txt;
  const fieldTxt = (<Txt text={field} fontFamily={MONO} fontSize={FS.small} fill={C.dim} x={ENTRY_W / 2 - 20} offsetX={1} />) as Txt;
  const strike = (<Line points={[[-ENTRY_W / 2 + 10, 0], [ENTRY_W / 2 - 10, 0]]} stroke={C.bad} lineWidth={W.line} end={0} />) as Line;
  const node = (
    <Rect y={y} width={ENTRY_W} height={50} stroke={C.stroke} lineWidth={W.line} radius={4} opacity={0}>
      {nameTxt}{fieldTxt}{strike}
    </Rect>
  ) as Rect;
  return {node, name: nameTxt, field: fieldTxt, strike};
}
export const POD_NAMES = ['web-a1b2c', 'web-m3n8d', 'web-x7k2p'];
export const BLANK = 'node: ___';
const ROW0 = -NOTE_H / 2 + 60, ROW = 66;
export const entryY = (i: number) => ROW0 + i * ROW;

/**
 * The API server box and its notebook (etcd). Rows: 0 = the deployment
 * ("web · want 3"), 1–3 = the three pods, 4–5 = spares for replacements.
 */
export function notebook(o: {visible?: boolean; rows?: number; pods?: string[]} = {}) {
  const v = o.visible ? 1 : 0;
  const api = box({x: API_POS[0], y: API_POS[1], w: API_W, h: API_H, title: 'API SERVER', size: 28, stroke: C.accent, opacity: v});
  const book = frame({x: NOTE_POS[0], y: NOTE_POS[1], w: NOTE_W, h: NOTE_H, tag: 'etcd · the notebook', opacity: v});
  // right of centre, so the line clears the "etcd · the notebook" tag
  const LX = API_POS[0] + 110;
  const link = (<Line points={[[LX, API_POS[1] + API_H / 2], [LX, NOTE_POS[1] - NOTE_H / 2]]}
                      stroke={C.stroke} lineWidth={W.line} opacity={v} />) as Line;
  const deploy = entry('deployment web', 'want: 3', entryY(0));
  deploy.field.fill(C.accent);
  const pods = [...(o.pods ?? POD_NAMES), 'web-q4r7t', 'web-h2v6p'].map((n, i) => entry(`pod ${n}`, BLANK, entryY(i + 1)));
  book.node.add(deploy.node);
  pods.forEach(p => book.node.add(p.node));
  const group = (<Node>{link}{api.node}{book.node}</Node>) as Node;
  return {group, api: api.node, apiTitle: api.title, book: book.node, bookTag: book.tag, link, deploy, pods};
}
/** Write a node name into a pod entry's blank, typed character by character. */
export function* fillNode(e: Entry, nodeName: string, fill = C.accent): ThreadGenerator {
  const full = `node: ${nodeName}`;
  e.field.fill(fill);
  for (let i = 6; i <= full.length; i++) {
    e.field.text(full.slice(0, i));
    yield* waitFrames(3);
  }
}
function* waitFrames(n: number): ThreadGenerator {
  for (let i = 0; i < n; i++) yield;
}

/** Absolute position of an entry (for arrows into the notebook). */
export function entryPos(i: number): XY {
  return [NOTE_POS[0], NOTE_POS[1] + entryY(i)];
}

// ── the pod list from scene 02 (called back in 03, 10, 17, 19) ──────────────
export const LIST_POS: XY = [0, 60];
export function podList(o: {x?: number; y?: number; visible?: boolean; status?: string[]} = {}) {
  const x = o.x ?? LIST_POS[0], y = o.y ?? LIST_POS[1], w = 760;
  const status = o.status ?? ['', '', ''];
  const head = (
    <Node y={-90}>
      <Txt text="NAME" fontFamily={MONO} fontSize={FS.small} fill={C.dim} x={-w / 2 + 40} offsetX={-1} />
      <Txt text="STATUS" fontFamily={MONO} fontSize={FS.small} fill={C.dim} x={110} offsetX={-1} />
    </Node>
  ) as Node;
  const rows = POD_NAMES.map((n, i) => {
    const st = (<Txt text={status[i]} fontFamily={MONO} fontSize={30} x={110} offsetX={-1}
                     fill={statusColor(status[i])} />) as Txt;
    const name = (<Txt text={n} fontFamily={MONO} fontSize={30} fill={C.text} x={-w / 2 + 40} offsetX={-1} />) as Txt;
    const row = (<Node y={-30 + i * 64} opacity={o.visible ? 1 : 0}>{name}{st}</Node>) as Node;
    return {row, name, status: st};
  });
  const node = (
    <Rect x={x} y={y} width={w} height={290} stroke={C.stroke} lineWidth={W.main} radius={4} opacity={o.visible ? 1 : 0}>
      {head}{rows.map(r => r.row)}
    </Rect>
  ) as Rect;
  return {node, head, rows, w};
}
export function statusColor(s: string) {
  return s === 'Running' ? C.good : s === 'Pending' ? C.accent : s === 'Terminating' ? C.dim : C.text;
}

// ── the hub (scene 13, 14, 17): every component talks only to the API server ──
export const HUB = {
  api: [0, -20] as XY,
  replica: [-560, -230] as XY,
  scheduler: [560, -230] as XY,
  kubelets: [[-500, 280], [0, 330], [500, 280]] as XY[],
};
export function hub(o: {visible?: boolean} = {}) {
  const v = o.visible ? 1 : 0;
  const api = box({x: HUB.api[0], y: HUB.api[1], w: 360, h: 150, title: 'API SERVER', sub: 'etcd · the notebook', size: 30, stroke: C.accent, opacity: v});
  const replica = controller('replica controller', {x: HUB.replica[0], y: HUB.replica[1], w: 340});
  const scheduler = controller('scheduler', {x: HUB.scheduler[0], y: HUB.scheduler[1], w: 340});
  const kubelets = HUB.kubelets.map((p, i) => controller(`kubelet · node-${i + 1}`, {x: p[0], y: p[1], w: 340}));
  [replica, scheduler, ...kubelets].forEach(c => c.node.opacity(v));
  // distance from a box's centre to its edge along (dx, dy), plus a small gap
  const edge = (w: number, h: number, dx: number, dy: number) =>
    Math.min((w / 2 + 14) / Math.abs(dx || 1e-6), (h / 2 + 14) / Math.abs(dy || 1e-6));
  const spoke = (p: XY) => {
    const [ax, ay] = HUB.api;
    const dx = p[0] - ax, dy = p[1] - ay;
    const kf = 1 - edge(340, CTRL_H, dx, dy), kt = edge(360, 150, dx, dy);
    const from: XY = [ax + dx * kf, ay + dy * kf];
    const to: XY = [ax + dx * kt, ay + dy * kt];
    return (<Line points={[from, to]} stroke={C.dim} lineWidth={W.line} endArrow arrowSize={12} end={v} opacity={v} />) as Line;
  };
  const spokes = [HUB.replica, HUB.scheduler, ...HUB.kubelets].map(spoke);
  const group = (<Node>{spokes}{api.node}{replica.node}{scheduler.node}{kubelets.map(k => k.node)}</Node>) as Node;
  return {group, api: api.node, apiTitle: api.title, apiSub: api.sub, replica, scheduler, kubelets, spokes,
    all: [replica.node, scheduler.node, ...kubelets.map(k => k.node)]};
}

// ── Jordan's chat bubble (scene 02, called back in scene 19) ─────────────────
export const CHAT_POS: XY = [650, 330];
export function chat(text: string, o: {x?: number; y?: number} = {}) {
  const w = 500;
  const who = (<Txt text="Jordan (platform)" fontFamily={MONO} fontSize={FS.tiny} fill={C.dim} x={-w / 2 + 24} y={-20} offsetX={-1} />) as Txt;
  const msg = (<Txt text={text} fontFamily={MONO} fontSize={FS.small} fill={C.text} x={-w / 2 + 24} y={14} offsetX={-1} />) as Txt;
  const ok = checkMark({x: w / 2 - 34, y: -18});
  const node = (
    <Node x={o.x ?? CHAT_POS[0]} y={o.y ?? CHAT_POS[1]} opacity={0}>
      <Rect width={w} height={92} radius={12} stroke={C.stroke} lineWidth={W.line} />
      {who}{msg}{ok}
    </Node>
  ) as Node;
  return {node, who, msg, ok};
}

/** A quick accent pulse on a node's stroke. */
export function* flash(r: Rect, color = C.accent, back?: string): ThreadGenerator {
  const b = back ?? (r.stroke() as unknown as string);
  yield* chain(r.stroke(color, 0.2), r.stroke(b, 0.5));
}
