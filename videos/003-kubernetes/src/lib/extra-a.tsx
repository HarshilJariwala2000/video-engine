// Helpers shared by scenes 05–09 only.
import {Circle, Line, Node, Txt} from '@motion-canvas/2d';
import {CLUSTER, servers} from './figures';
import {wall} from './ui';
import {C, FS, MONO, W} from './theme';

/** The dashed "cluster" frame around the three servers, as scene 04 leaves it. */
export function clusterFrame(visible = true) {
  return wall({x: CLUSTER.x, y: CLUSTER.y, w: CLUSTER.w, h: CLUSTER.h, tag: 'cluster', drawn: visible});
}

/** Servers as scene 05 leaves them: server-2 dead (red, empty), web running on 1 and 3. */
export function crashState() {
  const sv = servers({frames: true});
  const [s1, s2, s3] = sv.list;
  s1.web.opacity(1);
  s3.web.opacity(1);
  s2.frame.stroke(C.bad);
  s2.tag.fill(C.bad);
  return {...sv, s1, s2, s3};
}

/** Thermostat dial (scene 07 → 08). */
export function dial(o: {x?: number; y?: number; opacity?: number} = {}) {
  const needle = (<Line points={[[0, 0], [0, -70]]} stroke={C.accent} lineWidth={W.main} lineCap="round" rotation={-40} />) as Line;
  const ticks = [-120, -60, 0, 60, 120].map(a => (
    <Line points={[[0, -96], [0, -84]]} stroke={C.dim} lineWidth={W.fine} rotation={a} />
  ) as Line);
  const node = (
    <Node x={o.x ?? 0} y={o.y ?? 0} opacity={o.opacity ?? 0}>
      <Circle size={220} stroke={C.text} lineWidth={W.main} />
      {ticks}
      {needle}
      <Circle size={16} fill={C.accent} />
      <Txt text="thermostat" fontFamily={MONO} fontSize={FS.label} fill={C.dim} y={140} />
    </Node>
  ) as Node;
  return {node, needle};
}
