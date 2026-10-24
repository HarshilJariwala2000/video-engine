// Binds the shared scene timing helpers to this video's generated timings.
import {createSetup} from '@shared/sync';
import timings from '../timings.json';

export const setup = createSetup(timings);
