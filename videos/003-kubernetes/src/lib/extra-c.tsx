// Helpers for scenes 15–17: the machine room after the scheduler and kubelets
// have done their work (three nodes running web, notebook filled in).
import {Node} from '@motion-canvas/2d';
import {apiLink, controller, CTRL_X, CTRL_Y, notebook, servers} from './figures';
import {C} from './theme';

/** Polyline arrow from a controller's top edge to the API server box, along `lane` (LANE). */
export const toApi = apiLink;

/** Nodes, notebook and the two paperwork controllers, all visible. */
export function machineRoom() {
  const sv = servers({names: 'node', frames: true});
  sv.list.forEach(s => { s.web.opacity(1); s.kubelet.opacity(1); });
  const nb = notebook({visible: true});
  nb.deploy.node.opacity(1);
  ['node-2', 'node-1', 'node-3'].forEach((n, i) => {
    const p = nb.pods[i];
    p.node.opacity(1);
    p.field.text(`node: ${n}`);
    p.field.fill(C.text);
  });
  const replica = controller('replica controller', {x: CTRL_X.replica, y: CTRL_Y});
  const scheduler = controller('scheduler', {x: CTRL_X.scheduler, y: CTRL_Y});
  replica.node.opacity(1);
  scheduler.node.opacity(1);
  const group = (<Node>{sv.group}{nb.group}{replica.node}{scheduler.node}</Node>) as Node;
  return {group, sv, nb, replica, scheduler};
}
