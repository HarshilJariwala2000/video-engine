// Diagrams reused across scenes, so consecutive scenes and callbacks show the
// exact same visual in the exact same place (VIDEO_BRIEF §5).
import {Node, Rect, Txt} from '@motion-canvas/2d';
import {arrow, box, checkMark, crossMark, frame, mono, proc} from './ui';
import {C} from './theme';

/** Scene 01 / 21: laptop vs server, each holding the app. */
export function laptopServer(visible = false) {
  const o = visible ? 1 : 0;
  const laptop = frame({x: -420, y: -40, w: 480, h: 300, tag: 'laptop', opacity: o});
  const server = frame({x: 420, y: -40, w: 480, h: 300, tag: 'server', opacity: o});
  const appL = box({x: -420, y: -60, w: 220, h: 80, title: 'my-app', size: 26, opacity: o});
  const appR = box({x: 420, y: -60, w: 220, h: 80, title: 'my-app', size: 26, opacity: o});
  const okL = checkMark({x: -420, y: 60});
  const okR = checkMark({x: 420, y: 60});
  const badR = crossMark({x: 420, y: 60});
  const link = arrow([[-170, -40], [170, -40]]);
  const chips = ['node 18 ≠ 22', 'libssl missing', 'PORT unset'].map((t, i) =>
    box({x: 420, y: 155 + i * 52, w: 300, h: 40, title: t, size: 18, color: C.bad}).node);
  const pkg = (x: number) => box({x, y: -40, w: 380, h: 200, title: 'my-app', sub: 'node 22 + libs + config',
    size: 28, dashed: true, stroke: C.accent});
  const pkgL = pkg(-420), pkgR = pkg(420);
  const group = (
    <Node>
      {laptop.node}{server.node}{link}{appL.node}{appR.node}{okL}{okR}{badR.node}{chips}{pkgL.node}{pkgR.node}
    </Node>
  ) as Node;
  return {group, laptop, server, appL, appR, okL, okR, badR, link, chips, pkgL, pkgR};
}

/** Scenes 04–07 / 13: a real computer running three VMs. */
export function vmFigure(o: {visible?: boolean; kernels?: boolean} = {}) {
  const v = o.visible ? 1 : 0;
  const real = frame({y: 50, w: 1300, h: 470, tag: 'real computer', opacity: v});
  const vms = [-420, 0, 420].map((x, i) => {
    const outline = box({x, y: 50, w: 360, h: 380, dashed: true, opacity: v}).node;
    const tag = mono(`VM ${i + 1}`, {x, y: -162, size: 20, fill: C.dim, opacity: v});
    const app = box({x, y: -55, w: 300, h: 70, title: 'APP', size: 20, opacity: v}).node;
    const os = box({x, y: 40, w: 300, h: 70, title: 'OPERATING SYSTEM', size: 18, opacity: v}).node;
    const kernel = box({x, y: 135, w: 300, h: 70, title: 'KERNEL', size: 20, stroke: C.accent,
      opacity: o.visible && o.kernels ? 1 : 0}).node;
    const fill = (<Rect x={-120} offsetX={-1} width={0} height={8} fill={C.accent} />) as Rect;
    const bar = (<Rect x={x} y={-112} width={240} height={8} stroke={C.stroke} lineWidth={1} radius={2} clip opacity={0}>{fill}</Rect>) as Rect;
    const gb = mono('GBs of RAM', {x, y: 262, size: 20, fill: C.text});
    return {outline, tag, app, os, kernel, bar, fill, gb};
  });
  const group = (
    <Node>{real.node}{vms.flatMap(m => [m.outline, m.tag, m.app, m.os, m.kernel, m.bar, m.gb])}</Node>
  ) as Node;
  return {group, real, vms};
}

/** Scenes 08–10: one process that can see the whole machine. */
export function processWorld(visible = false) {
  const o = visible ? 1 : 0;
  const p = proc({name: 'my-app', pid: 48213, opacity: o});
  p.node.stroke(C.accent);
  const others: [string, number][] = [['systemd', 1], ['sshd', 812], ['dockerd', 977], ['postgres', 1290], ['chrome', 2044], ['bash', 3310]];
  const rows = others.map(([name, pid], i) => {
    const pidTxt = (<Txt text={String(pid)} fontFamily={MONO_F} fontSize={18} fill={C.dim} x={115} offsetX={1} />) as Txt;
    const node = (
      <Rect x={-650} y={-150 + i * 60} width={270} height={46} stroke={C.stroke} lineWidth={2} radius={4} opacity={o}>
        <Txt text={name} fontFamily={MONO_F} fontSize={18} fill={C.text} x={-115} offsetX={-1} />
        {pidTxt}
      </Rect>
    ) as Rect;
    return {node, pidTxt};
  });
  const treeLines = ['/', '├─ bin', '├─ etc', '├─ home', '├─ containers', '│  └─ app1', '└─ var'];
  const treeTxts = treeLines.map((t, i) => mono(t, {x: 420, y: -240 + i * 34, size: 22, align: 'left', opacity: 1}));
  const files = (<Node opacity={o}>{treeTxts}</Node>) as Node;
  const net = (
    <Node opacity={o}>
      {mono('eth0  192.168.1.20', {x: 420, y: 150, size: 22, align: 'left', opacity: 1})}
      {mono('lo    127.0.0.1', {x: 420, y: 186, size: 22, align: 'left', opacity: 1})}
    </Node>
  ) as Node;
  const aL = arrow([[-160, 0], [-505, 0]]);
  const aF = arrow([[160, -30], [395, -140]]);
  const aN = arrow([[160, 30], [395, 160]]);
  if (visible) [aL, aF, aN].forEach(a => { a.opacity(1); a.end(1); });
  const group = (<Node>{rows.map(r => r.node)}{files}{net}{aL}{aF}{aN}{p.node}</Node>) as Node;
  return {group, p, rows, files, treeTxts, net, aL, aF, aN};
}
const MONO_F = 'JetBrains Mono';

/** The simplified 4-step Dockerfile used in scenes 17 and 19. */
export const DOCKERFILE = ['FROM node:22-alpine', 'COPY package.json .', 'RUN npm install', 'COPY . .'];
export const LAYER_NAMES = ['base: linux + node', 'package.json', 'node_modules/', 'your code'];

/** Read-only image layers stacked bottom-up. */
export function layerStack(titles: string[], o: {x?: number; y?: number; w?: number; visible?: boolean} = {}) {
  const x = o.x ?? 0, y0 = o.y ?? 200, step = 58;
  return titles.map((t, i) =>
    box({x, y: y0 - i * step, w: o.w ?? 460, h: 46, title: t, size: 20, opacity: o.visible ? 1 : 0}),
  );
}

/** Three containers on one kernel (scenes 13, 14). */
export function sharedKernel(X: number, visible = false) {
  const v = visible ? 1 : 0;
  const hw = box({x: X, y: 236, w: 780, h: 60, title: 'HARDWARE', size: 22, opacity: v});
  const kernel = box({x: X, y: 160, w: 780, h: 60, title: 'ONE KERNEL', size: 22, stroke: C.accent, opacity: v});
  const ctrs = ['my-app', 'other-app', 'db'].map((name, i) => {
    const x = X - 260 + i * 260;
    const w = wallLite(x, visible);
    const p = box({x, y: 30, w: 180, h: 70, title: name, size: 22, opacity: v});
    return {w, p};
  });
  const group = (<Node>{hw.node}{kernel.node}{ctrs.flatMap(c => [c.w, c.p.node])}</Node>) as Node;
  return {group, hw, kernel, ctrs};
}
function wallLite(x: number, drawn: boolean) {
  return (
    <Rect x={x} y={30} width={230} height={150} stroke={C.accent} lineWidth={2} radius={6}
          lineDash={[12, 8]} end={drawn ? 1 : 0} />
  ) as Rect;
}
