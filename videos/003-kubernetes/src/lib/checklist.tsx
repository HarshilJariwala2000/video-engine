// This video's requirements checklist (VIDEO_BRIEF §3.2). Visuals live in @shared/checklist.
import {createChecklist} from '@shared/checklist';

export type {Mark} from '@shared/checklist';
export const ITEMS = ['always 3 copies', 'picks the servers', 'heals on its own', 'one address'];
export const checklist = createChecklist(ITEMS, 'we need:');
