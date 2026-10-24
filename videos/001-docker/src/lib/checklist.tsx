// This video's requirements checklist (VIDEO_BRIEF §3.2). Visuals live in @shared/checklist.
import {createChecklist} from '@shared/checklist';

export type {Mark} from '@shared/checklist';
export const ITEMS = ['own files', "can't see others", "can't hog the machine", 'cheap + quick to start'];
export const checklist = createChecklist(ITEMS, 'our app needs:');
