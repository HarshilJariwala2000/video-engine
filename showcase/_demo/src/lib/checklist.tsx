// This video's requirements checklist (VIDEO_BRIEF §3.2). Visuals live in @shared/checklist.
// Set ITEMS to the checklist wording from narration/script.mjs (meta.checklist).
import {createChecklist} from '@shared/checklist';

export type {Mark} from '@shared/checklist';
export const ITEMS: string[] = [];
export const checklist = createChecklist(ITEMS, 'we need:');
