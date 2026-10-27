---
name: revise-script
description: Apply the user's latest script review (per-scene comments + general notes stored in videos/<video>/video.json) to narration/script.mjs, snapshot the previous version, and return the video to review. Argument is the video folder or its number.
---

# Revise a script from review feedback

Video: $ARGUMENTS

1. Read `videos/<video>/video.json`. The last entry of `reviews` with
   `"decision": "changes"` and no `"addressed": true` is the one to apply. It has
   `version`, `general` (free text) and `comments: [{scene, quote?, text}]`.
   (`quote` is the narration excerpt the user highlighted, if any.)
   If there is no such review, stop and say so.
2. Read `docs/VIDEO_BRIEF.md`, `videos/<video>/brief.md` and the current `narration/script.mjs`.
3. Snapshot: copy `narration/script.mjs` to `narration/history/script.v<scriptVersion>.mjs`.
4. Apply **every** comment. The user's comments override the brief. If a comment
   is ambiguous, make the most reasonable interpretation and note it in your reply.
   Keep the narrator's voice (VIDEO_BRIEF §3.5, `ideal_scripts/` as reference):
   rewritten lines must sound like the same calm, practical person and must not
   reintroduce anything from §3.8.
   After local edits, re-check the chain (VIDEO_BRIEF §3.2): every scene still starts
   from a problem the previous one left, `leaves` still matches what the next scene
   answers, "but / so / because" fits between all neighbouring scenes, `meta.chain`
   still matches the scenes, cue/visual bullets still line up, scene ids still
   consecutive (renumber if you add/remove scenes and update `leaves` references).
   If the script is in the old format (checklist, `didntKnow`, `handsOff`) and the user
   asks for a rewrite, convert it to the new format with the write-script skill.
5. `npm run script <video>` and `npm run voice:estimate <video>`; fix any error.
6. In video.json: bump `scriptVersion`, and on the review you applied set
   `"addressed": true` and `"addressedIn": <new version>` (edit the JSON carefully; keep everything else).
7. `npm run stage <video> review "Script v<N> addresses review of v<M>"`.
8. Reply with a short changelog: one line per comment saying what you changed
   (or why you interpreted it a certain way), then the new length estimate.
