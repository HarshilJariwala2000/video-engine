// This video's requirements checklist (VIDEO_BRIEF §3.2). Visuals live in @shared/checklist.
// Wording from narration/script.mjs (meta.checklist).
import {createChecklist} from '@shared/checklist';

export type {Mark} from '@shared/checklist';
export const ITEMS: string[] = ['readers never wait', "writers don't wait for readers", 'one clean moment', 'instant undo'];
export const checklist = createChecklist(ITEMS, 'our database needs:');
