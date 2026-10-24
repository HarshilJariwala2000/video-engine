# Under the Abstraction: studio

Everything needed to make videos for the channel, in one repo: one folder per
video, a shared animation library, a local AI voice, and a web UI that walks each
video through **ideas → script → review → voice → animation → thumbnails → publish**.

```
npm run studio      →  http://localhost:7860
```

## One-time setup

```powershell
npm install                       # Motion Canvas, Vite, playwright-core (uses your installed Edge)
cd tts; uv sync; cd ..            # local voice: Python 3.11 + PyTorch CUDA 12.8 + Chatterbox (~5 GB)
copy .env.example .env            # TTS_PROVIDER=local is the default
claude                            # open Claude Code here once and accept "trust this folder"
```

The first voice-server start downloads the Chatterbox model (~3 GB) and Whisper
small.en (~0.5 GB) into the Hugging Face cache.

## Making a video

| Step | In the Studio | Same thing in a terminal |
|---|---|---|
| 1. Ideas | **Ideas → Brainstorm** (optional focus) | `claude` → `/brainstorm databases` |
| 2. Script | **Start video + write script** on an idea card | `npm run new redis -- --title "…"` then `/write-script 002` |
| 3. Review | Comment per scene (select words to quote), **Request changes** → Claude revises; repeat; **Approve** | edit `video.json` reviews, `/revise-script 002` |
| 4. Voice | **Voice → Generate voiceover** (starts the voice server if needed) | `npm run tts` and `npm run voice 002` |
| 5. Animation | **Animation → Build animation**; scrub it with **Start editor** | `/build-video 002`, `npm run edit 002` |
| 6. Thumbnails | **Thumbnails → Design 4 thumbnails**; click one to select | `/thumbnails 002`, `npm run thumbs 002` |
| 7. Publish | Render from the editor (Video Settings → FFmpeg), copy description/chapters/tags, upload captions.srt | output in `videos/002-…/output/` |

Every Claude step uses the skills in `.claude/skills/`, so the Studio buttons and
typing `/write-script` in Claude Code do exactly the same thing. Every Claude job
in the Studio has a reply box: answer Claude in the same session ("make scene 4
shorter") without starting over.

## The voice

The pilot used ElevenLabs. Videos now use **Chatterbox** (Resemble AI, MIT
license, so it's fine for a monetized channel), running locally on the RTX 5060,
cloned from an 11.8 s clip of the pilot's narration (`voice/reference.wav`).

- **How close is it?** The voice lab scores clones with a speaker-embedding model
  against ElevenLabs sentences the clone never saw. ElevenLabs vs itself scores
  0.870; the chosen config scores 0.860 (98.9%), at 0.997× its speaking pace.
  That's a measurement, not a guarantee: compare by ear on the **Voice** page,
  which has the full pilot script in both voices side by side.
- **Speed:** about 0.8× real time (a 7-minute video takes about 6 minutes).
- **Quality gate:** Whisper transcribes every chunk; if words were skipped or
  garbled, that chunk is re-generated with another seed automatically.
- **Sync:** Whisper's word timestamps replace ElevenLabs' character timestamps,
  so `{cue}` markers, captions and chapters work exactly as before.
- **Tuning:** Studio → Voice (settings, "try a line", bake-off), or
  `npm run voice:test`. The settings in `voice/voice.json` apply to every video.
- **Watermark:** Chatterbox embeds an inaudible Perth watermark in its output.
  Still mark videos as "altered or synthetic content" in YouTube Studio.
- **Two engines, your pick per video:** Studio → Voice has **Generate with local AI** (free, GPU)
  and **Generate with ElevenLabs** (credits; shows the character count first). Terminal:
  `npm run voice 002 -- --provider elevenlabs`. Each engine keeps its own cache, so switching back
  and forth never re-generates scenes you already have. `TTS_PROVIDER` in `.env` is just the default.

## Layout

See `CLAUDE.md` for the full map (it's also what Claude reads). In short:
`videos/NNN-name/` holds everything for one video; `shared/motion/` is the
channel's animation toolkit (`@shared/ui`, `@shared/theme`, …);
`docs/VIDEO_BRIEF.md` holds the channel rules.

## Commands

```
npm run studio                 web UI
npm run new <name> -- --title  scaffold a video
npm run script <video>         SCRIPT.md from narration/script.mjs
npm run voice:estimate <video> word-count timings (no TTS)
npm run tts                    local voice server (port 7861)
npm run voice <video>          voiceover (cached per scene; -- --only scene05 re-rolls one)
npm run edit <video>           Motion Canvas editor (port 9000)
npm run check <video>          typecheck + headless load + audio/animation sync check
npm run thumbs <video>         render thumbnails to PNG + phone-size preview
npm run voice:test             voice lab (bake-off against the pilot's voice)
npm run typecheck              every video + shared lib
```
`<video>` can be the folder name or just its number (`002`).
