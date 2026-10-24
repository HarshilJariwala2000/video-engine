// Helpers shared by scenes 10–14 (the paperwork loops and the hub).
import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {API_IN, CTRL_H, CTRL_Y, NOTE_LEFT, SERVER_X, SERVER_Y, SW} from './figures';
import {arrow, mono} from './ui';
import {C, FS, MONO, W} from './theme';

type XY = [number, number];

/** "running: N" counter, left of the reconcile stamp, above server-1. */
export const RUNNING_POS: XY = [-620, 30];
export function running(text = 'running: 0', visible = false) {
  return mono(text, {x: RUNNING_POS[0], y: RUNNING_POS[1], size: 30, fill: C.text, opacity: visible ? 1 : 0});
}

export {LANE} from './figures';
/** Controller → API server link: up from the controller, then right into the
 *  API SERVER box's left edge along its own lane (LANE), so links never cross. */
export function ctrlLink(x: number, laneY: number, visible = false) {
  const l = arrow([[x, CTRL_Y - CTRL_H / 2 - 4], [x, laneY], [API_IN, laneY]]);
  if (visible) { l.opacity(1); l.end(1); }
  return l;
}

/** Kubelet (inside node i) → notebook: out through the gap right of the node,
 *  then right just above the node tags. */
export function kubeletLink(i: number) {
  const x0 = SERVER_X[i] + 100, gapX = SERVER_X[i] + SW / 2 + 30, y = SERVER_Y - 168;
  return arrow([[x0, SERVER_Y + 80], [gapX, SERVER_Y + 80], [gapX, y], [NOTE_LEFT - 6, y]]);
}

/** A pod: dashed rounded accent outline (not running yet), with a name inside. */
export function podShape(o: {x?: number; y?: number; w?: number; h?: number; label?: string; opacity?: number} = {}) {
  const label = (<Txt text={o.label ?? 'web'} fontFamily={MONO} fontSize={26} fill={C.text} />) as Txt;
  const node = (
    <Rect x={o.x ?? 0} y={o.y ?? 0} width={o.w ?? 200} height={o.h ?? 90} radius={18} stroke={C.accent}
          lineWidth={W.line} lineDash={[12, 8]} opacity={o.opacity ?? 0}>
      {label}
    </Rect>
  ) as Rect;
  return {node, label};
}

/** Conductor's baton: a thin stick with a grip. */
export function baton(o: {x?: number; y?: number} = {}) {
  return (
    <Node x={o.x ?? 0} y={o.y ?? 0} opacity={0} rotation={-35}>
      <Line points={[[-70, 0], [60, 0]]} stroke={C.text} lineWidth={W.line} lineCap="round" />
      <Rect x={-58} width={34} height={16} radius={8} fill={C.dim} />
    </Node>
  ) as Node;
}

/** A plain office desk icon (scene 14). */
export function desk(o: {x?: number; y?: number} = {}) {
  return (
    <Node x={o.x ?? 0} y={o.y ?? 0} opacity={0}>
      <Line points={[[-70, 0], [70, 0]]} stroke={C.text} lineWidth={W.main} lineCap="round" />
      <Line points={[[-56, 0], [-56, 60]]} stroke={C.text} lineWidth={W.line} />
      <Line points={[[56, 0], [56, 60]]} stroke={C.text} lineWidth={W.line} />
      <Rect x={-26} y={-26} width={46} height={34} radius={3} stroke={C.text} lineWidth={W.line} />
      <Txt text="office" fontFamily={MONO} fontSize={FS.small} fill={C.dim} y={88} />
    </Node>
  ) as Node;
}
