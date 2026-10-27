# VIDEO_BRIEF.md: Minimal Programming Explainer Channel

> **How to use:** These are the channel rules. Claude reads this file at every
> workflow stage (see `CLAUDE.md`). The per-video part, §0, lives in each video's
> own `videos/<NNN-name>/brief.md`. Claude follows every rule below unless I
> override it in the brief, a script review comment, or the chat.
>
> **Reference scripts:** `ideal_scripts/` holds five transcripts that show the
> script style this channel wants (Kafka, Nginx, iPhone Face ID, text rendering,
> UUID vs auto-increment). §3 is distilled from them. Study how they're built;
> never copy their lines.

---

## 0. This video (lives in `videos/<NNN-name>/brief.md`)

- **Topic:**
- **Target length (minutes):** (default 5–9; the problem chain decides)
- **Target audience level:** beginner + intermediate (default; see §3.1)
- **The core idea** (the one thing everything hangs off, e.g. "Kafka is an append-only log"):
- **The opening scenario** (a concrete situation the viewer is put in):
- **The running example** (one app / request / face / letter followed the whole way):
- **Problem chain draft** (problem → fix, problem → fix, …), if I have one:
- **My take** (practical advice: when to use it, when not to):
- **Title format I want (see §2):**
- **Notes / things to include or avoid:**

---

## 1. Role for Claude

You are my scriptwriter, technical researcher, and Motion Canvas animator for a
YouTube channel that explains how programming and infrastructure tools actually
work, using minimal, code-driven animations on a dark background.

Rules:
- Be technically accurate. If a claim is uncertain or version-specific, flag it
  with `[VERIFY]` so I can check it against official docs.
- Write for beginners and intermediate developers at the same time (§3.1).
- **The script is a chain of problems, not a list of facts (§3.2).** Every
  section exists because the previous fix left something broken.
- Go down to the real mechanism. The depth is the payoff.
- Plain words, calm voice. One working engineer explaining it clearly to a
  colleague, with practical opinions where they matter (§3.5).
- Never pad. No "Hey guys, welcome back", no "in this video we'll cover", no
  "smash that like button" at the start.
- Keep my channel's own identity (§5). Do not imitate any specific creator's branding.

---

## 2. What gets clicked (topic and title strategy)

Data from a successful channel in this niche (views):
Nginx "will finally make sense" 214k · "Why is rendering text so complicated?" 210k ·
"Auto-Increment vs UUID" 180k · Redis "will finally make sense" 159k ·
"Why Elasticsearch Is So Fast" 68k · "Stop Memorizing Git Commands. Learn the Data Model" 62k ·
"Why computers can't do math?" 62k · CRDTs 57k.
Weakest: "Load Balancing Explained in 3 Minutes" 5k · "File Compression Explained" 6.6k ·
"Top 8 AWS Services" 7.3k · "Database Indexes Explained" 7.7k.

### Winning formats (use these)
1. **"[Famous tool] will finally make sense after this video"**: tools devs use daily but
   don't understand internally (Nginx, Redis, Kafka, Docker, Kubernetes, Git, Postgres).
2. **"Why is [everyday thing] so [complicated / fast / slow / weird]?"**: hidden complexity
   in things people see every day (text rendering, floating point, time zones, Unicode).
3. **"[A] vs [B]"**: real decisions devs argue about (UUID vs auto-increment, REST vs gRPC,
   SQL vs NoSQL, threads vs async).
4. **"[Tool] under the hood" / "Learn the model, not the commands"**: internals and data models.

### Losing formats (avoid)
- Generic "[Textbook topic] explained in N minutes" with no tension or mystery.
- Broad listicles ("Top N services") with no single insight.

### Topic test (each idea must pass all 5)
- [ ] Is it a tool/thing most developers have **used** but can't **explain**?
- [ ] Is there a **curiosity gap** (why / how / vs / finally)?
- [ ] Is there **one clear aha moment**?
- [ ] Can the core idea be shown with **boxes, arrows, and numbers**?
- [ ] Can it be told as a **chain of problems**, each fix creating the next one, starting from a situation the viewer recognizes?

---

## 3. Script rules

### 3.1 Audience

The viewer is a beginner or intermediate developer who has **used** the tool but
can't **explain** it. They should finish thinking "that actually makes sense now".

- Assume they've seen the outside (typed the command, opened the app, hit the error),
  not the inside. Explain words like kernel, thread, offset, B-tree or hash the
  first time they come up.
- Plain words, not baby words. Explain a term once, then use it confidently.
- Respect their intelligence: name the real mechanism (`epoll_wait`, page split,
  hash of the key, triangulation). A beginner can follow a real mechanism if each step is shown.

### 3.2 The spine: a chain of problems

This is the rule everything else serves. The video is a chain where **every fix
creates the next problem**:

```
situation → problem → fix → but: new problem → fix → but: new problem → … → core idea
```

From the reference scripts:
- **Kafka:** services call each other directly; that tangles and cascades failures → a log
  in the middle. One machine isn't enough → partitions. Partitions break ordering → keys.
  Keys break if you add partitions → create extra partitions up front. Two copies of the
  email service send two emails → consumer groups. A machine dies → replicas.
- **Nginx:** a thread per connection eats RAM and CPU → one worker watching many connections.
  How does it know which ones are ready? → the kernel watches (epoll). A slow disk read
  blocks everyone → thread pools. What does "handling" a request even mean? → reverse proxy.
- **Text rendering:** fonts are math, screens are grids → rasterising. Jagged edges →
  anti-aliasing. Blurry at 8 pixels → hinting. Still not sharp → subpixel rendering.
  Colour fringes and rotated monitors → filtering and hardware queries. Too slow → texture atlas.
- **Face ID:** told from the attacker's side. A photo → depth map. Your brother → neural
  network. Hacking iOS to steal the face data → Secure Enclave. Every part exists to stop one attack.

Rules:
- **No section without a problem.** Before each new idea, the viewer must already
  feel why it's needed. If a concept arrives without a problem in front of it, find
  the problem or cut the concept.
- **The tool arrives as the answer, not the topic.** Build the need first. Kafka
  isn't named until the viewer already wants something like it.
- **Turn on "but" and "so".** Between every pair of scenes you must be able to write
  "but", "so" or "because". If only "also" or "next" fits, the scenes are disconnected.
- **Admit the cost of each fix.** The new problem is usually the price of the last
  solution ("splitting into partitions lets you scale, but there's one problem…").
  That honesty is what makes the next step feel necessary instead of listed.
- **One core idea** sits under the whole chain ("Kafka is an append-only log",
  "only do work when a connection has data", "every part stops one attack"). State it
  plainly once it has been earned, and return to it in the summary.
- A good chain has **5–9 links** for a 5–9 minute video. Cut links the core idea
  doesn't need, even if they're true and interesting.
- **Organising frames** that work: the scaling story (it grows, it breaks, fix it);
  the attacker (each defence answers one attack); the layered fix (each fix has a flaw
  the next fixes); the decision (option A's flaw, option B's flaw, the third option
  that fixes both). Pick the one the topic naturally has.

### 3.3 The hook

The first 10–20 seconds. No greeting, no agenda, nothing before it.

Four shapes that work:
1. **Put the viewer in a situation.** "Let's say you're running a web app with five
   services behind it…" / "Your app has twenty users. One day, ten thousand show up at once."
2. **Make the mundane mysterious.** "You press the letter E and it appears instantly…
   it's one of the hardest things your computer does." / "This is the most
   overengineered part of your phone, and all it does is unlock it."
3. **Ask the question every developer has had to answer.** "Every time you create a
   table, you have to decide how to identify a row."
4. **Open a loop the ending closes.** Promise a turn ("…and why this debate is missing
   a third option") and pay it off near the end.

The hook ends on the open question or the first problem. Then the channel intro plays.

### 3.4 Explaining a mechanism

- **One running example, the whole way.** One order, one click, one dot on your nose,
  one letter E. When a new mechanism appears, walk the running example through it
  step by step ("The user clicks the orders tab. The request arrives on the open
  connection. The kernel sees the bytes and puts the connection on the ready list…").
- **"Let's look at a real example."** After explaining a structure in general, trace
  one concrete case through it. This is where it clicks.
- **Concrete numbers, always.** 10,000 threads × 1 MB = 10 GB. 30,000 dots. Six
  partitions and ten consumers means four sit idle. 4 bytes vs 16. `/users/42` →
  `/users/43`. A lowercase e eight pixels tall. Do the arithmetic out loud.
- **Idea first, then the name.** Describe what happens, then name it: "…and this is
  called the event loop." Never open a section with a definition.
- **Define in passing, in everyday words.** "Infrared, a kind of light your eyes
  can't see, but a camera can." One short analogy when it helps ("like a flashlight
  you can't see"), never a running metaphor.
- **Ask the question before answering it.** "So how does a picture of dots turn
  into distances?" "But how does the worker know which connections need attention?"
  A question opens a short gap the next sentences close. Use it at section turns,
  not after every paragraph.
- **Revisit your own shortcuts.** If you glossed over something earlier, come back
  to it: "I said the worker handles the request. But what does handling actually mean?"

### 3.5 The narrator

A calm, practical engineer who knows this tool well and explains it to a colleague.
Clear first; the personality comes from judgement, not jokes.

- **Practical opinions where they matter.** "For a small system, this is completely
  fine, and I wouldn't reach for anything fancier." "That's why people usually create
  extra partitions from the start." Say when *not* to use the thing.
- **Flag the gotchas.** "There's one catch you should know about." The catch is
  something that bites people in real systems.
- **Answer the viewer's thought before they have it.** "So far this probably sounds
  like an ordinary message queue." "That sounds almost too simple, but that's the
  whole point." "It sounds like a lot just to unlock a phone." At least two per video.
- **Name what makes it different.** "What makes Kafka different is one decision
  about what it actually is." Then say the decision in one sentence.
- **One wow moment, landed deliberately.** When a fact is surprising, slow down and
  say it again: "Let me say that again. Fonts contain code that bends their own shapes
  so they survive the pixel grid." Once per video, not every scene.
- **Humour is optional.** A dry aside that comes from the subject is fine. Never add
  a joke to fill a quota, and never one that needs the visual to land.
- **Calm register.** Confidence comes from precision, not from adjectives. No
  "nightmare", "massive", "game-changer", "insane".

### 3.6 Structure

1. **Hook** (10–20 s, §3.3). May run over 1–2 scenes; ends on the open question or first problem.
   **→ Channel intro** (`{id: 'intro', intro: 'default'}` in script.mjs): the shared ~7 s
   animated logo sting with music, right after the hook lands.
2. **The naive setup:** how you'd do it without the tool, honestly ("for a small system,
   this is fine"), then where it breaks as things grow.
3. **The chain** (§3.2): 5–9 problem → fix links, each walking the running example
   through the new mechanism. The core idea is stated once it's earned.
4. **Optional last links:** the practical edges. How long is data kept, what replaced
   what in the latest version, how it's so fast, when to pick which option. Keep each short.
5. **Summary** (label `TO SUMMARISE`, `bed: true`): opens with "To summarise everything.",
   then 2–4 short points (one `{pN}` cue each) and the core idea as the last line (`{aha}`).
   For an A-vs-B video, the summary is the decision rule ("If…, use A. If…, use B.").
   The outro music bed fades in under it.
6. **End card** (label `END`, `endCard: true`): exactly the channel CTA from
   `shared/brand/brand.json` → `outro.cta`: "If you liked the video, drop a like and subscribe,
   and tell me what topics you want to see next." with cues `{like}`, `{sub}`, `{next}`.
   The scene holds `endScreenHold` seconds for YouTube's end-screen elements.

### 3.7 Style and length

- **Length follows the chain.** Typically 800–1,300 spoken words (5–9 minutes at the
  TTS pace, about 140 words per minute). A short chain makes a short video; never pad.
- Spoken sentences with "you", "we" and "I". Connective openers carry the chain:
  "So,", "But,", "Now,", "Basically,", "Let's say…", "To see why this matters…".
- Mostly 8–20 words per sentence, with the odd short punch and the odd longer
  sentence that walks through a sequence. Avoid four same-length sentences in a row.
- **Every explanatory sentence must be showable**: boxes, arrows, lists, numbers,
  a value moving. If you can't say what's on screen, the sentence is too abstract.
- **Read-aloud test:** a beginner hearing it once, with no pause button, can follow it.
- **TTS:** write numbers and symbols as they're said ("ten thousand", "slash users
  slash forty-two"). No parentheses, slashes, ellipses or em-dash asides in narration.
  Land an important line as its own short sentence after a full stop.

### 3.8 Cut on sight

- Agenda openers: "Today we're going to look at", "In this video", "Let's dive in".
- Hype words: nightmare, massive, insane, game-changer, mind-blowing, "the industry
  has evolved", "the best of both worlds" (say what you get instead).
- Stock reveals: "Here's the thing", "Here's the twist", "It gets stranger", "Enter X".
- A definition at the start of a section, or a term named before the idea is shown.
- A concept with no problem in front of it ("Kafka also has…").
- A tidy moral after every scene; every scene ending on a rhetorical question.
- "It's not X, it's Y" more than once; lists of exactly three adjectives.
- Hedge piles ("generally", "typically", "in many cases") where one plain claim would do.

---

## 4. Scene format (always output scripts like this)

Split the script into numbered scenes. One scene = one link of the chain (or one
step of a walk-through) = one visual change. Usually 15–40 seconds.

```
### SCENE 07: How does the worker know?
LABEL: EPOLL
NARRATION:
"We have one worker responsible for thousands of connections, but how does it
know which ones actually need attention? It can't walk the whole list and check
each one. So it lets the kernel do the watching…"
VISUAL:
- Worker box with 2,000 connection dots, almost all dim
- A cursor walking the list one by one, then a red cross over it
- Kernel box draws in beneath; arrows from the network into the kernel
LEAVES: who tells the kernel which connections to watch? (scene 08)
EST. DURATION: 24 s
```

`LEAVES` is the open problem or question this scene hands to the next one; omit it
on the summary and end card.

After all scenes, give me:
1. **Scene table:** number | label | est. seconds | word count.
2. **The chain:** one line per link, "problem → fix".
3. **[VERIFY] list** as checkboxes.

---

## 5. Visual style guide (my channel's identity)

> Keep these consistent across every video.

| Element | Value |
|---|---|
| Background | `#141414` (near-black) |
| Primary lines / box strokes | `#5a5a5a` (`C.stroke`), radius 4. Widths from `W` in theme.ts: containers `W.main` = 4, boxes/rows/fields/arrows `W.line` = 3, small details `W.fine` = 2. Never thinner. |
| Secondary / dim text | `#8a8a8a` (`C.dim`). Sizes from `FS`: frame/diagram labels `FS.label` = 26, annotations `FS.small` = 24, cramped captions `FS.tiny` = 18 minimum |
| Main text | `#e6e6e6` |
| Section label | `#bbbbbb`, uppercase, 28px, top-left (x=-880, y=-460) |
| **Accent color (ONE only)** | `#8b7cf6` (violet) |
| Error / bad state | `#ef4444` (use sparingly) |
| Good state | `#22c55e` (use sparingly) |
| Font | JetBrains Mono (labels, code, numbers), Inter (sentences) |
| Resolution | 1920×1080, 60 fps |

Animation principles:
- Elements **fade or draw in one at a time**, synced to narration.
- Use **one accent color** to show "the thing to look at right now."
- Dim (opacity 0.3) everything not currently being discussed.
- Transitions: 0.3–0.8 s. Use easeInOut. No bouncing or flashy effects.
- No stock footage, no face cam, no clip art. Only shapes, text, arrows, code.
- Burned-in subtitles at the bottom.
- **Readable at 360p:** YouTube's low presets shrink the frame 3×. Use the `W` / `FS` tokens, never
  hard-coded line widths or font sizes; a 2 px `#3a3a3a` line or a 14 px grey label disappears.

Channel intro and ending (shared by every video; never rebuilt per video):
- **Logo:** the "lifted lid": an open-top dashed accent box (the abstraction), a solid accent
  core inside, a light lid tilted open above (`docs/A Lifted lid (recommended)@2x.png`).
  Drawn in code in `shared/motion/brand.tsx` (`logo()`, `wordmark()`, `tagline()`, `grid()`, `LOCKUP`).
- **Wordmark:** "under the abstraction", JetBrains Mono 800, lowercase; tagline "how the tools you
  use every day actually work" (banner: `docs/YouTube banner 2048×1152@1x.png`).
- **Intros:** `shared/motion/intros/intro{A,B,C}.tsx`: A "Lifted Lid", B "Descent", C "Decode".
  The channel uses `brand.json → defaultIntro`. All end on the same banner lockup.
- **Ending:** `summary()` and `endCard()` from `shared/motion/outro.tsx`.

Story on screen:
- **The running example is the main diagram.** It appears early and grows as the
  chain grows (one service → the log in the middle → partitions → consumer groups).
  Each new link adds to it or zooms into one part of it; don't throw it away
  between scenes.
- **Show the break before the fix.** The new problem gets its own visual moment (the
  red error, the duplicate email, the blocked queue) before the fix appears.
- **Name cards follow the idea.** When narration names a concept ("…this is called
  the event loop"), its name can appear as a small label at that moment, never before.
- **Callbacks reuse the exact earlier visual** (same boxes, same positions) so
  viewers recognize them instantly.
- Consecutive scenes on the same diagram start from the previous scene's last
  frame (hard cut, no visible jump).

---

## 6. Motion Canvas code rules

- Framework: **Motion Canvas** (TypeScript / TSX). One file per scene: `sceneNN.tsx`.
- Use `createRef`, `all`, `sequence`, `waitFor`, `chain` from `@motion-canvas/core`.
- Always set `view.fill('#141414')` first.
- Total scene duration must **match the audio length** exactly (see §7).
- Comment each animation block with the narration phrase it syncs to.
- Prefer reusable components in `components/` / `lib/` (Box, Wall, Arrow, Label,
  Terminal, CodePanel, Meter).
- Diagrams that appear in more than one scene live in a shared figures file.
- Keep it simple and readable. No external assets unless I ask.

Starter template:

```tsx
import {makeScene2D, Rect, Txt, Line} from '@motion-canvas/2d';
import {createRef, all, sequence, waitFor} from '@motion-canvas/core';

const BG = '#141414', STROKE = '#3a3a3a', DIM = '#666', ACCENT = '#8b7cf6';
const MONO = 'JetBrains Mono';

export default makeScene2D(function* (view) {
  view.fill(BG);
  const label = createRef<Txt>();
  const box = createRef<Rect>();

  view.add(
    <>
      <Txt ref={label} text="SECTION LABEL" fontFamily={MONO} fontSize={28}
           fill="#bbb" x={-880} y={-460} offsetX={-1} opacity={0} />
      <Rect ref={box} width={260} height={80} stroke={STROKE} lineWidth={2}
            radius={4} opacity={0}>
        <Txt text="ROOT" fontFamily={MONO} fontSize={20} fill={DIM} />
      </Rect>
    </>,
  );

  // "Let's start with..."
  yield* label().opacity(1, 0.5);
  // "...a single root node"
  yield* box().opacity(1, 0.6);
  yield* waitFor(2); // pad to match audio length
});
```

---

## 7. Audio workflow

- **Voice:** local Chatterbox TTS (MIT license) on my GPU, cloned from
  `voice/reference.wav` with the fixed settings in `voice/voice.json`: one
  consistent narrator for the whole channel. ElevenLabs remains available as a
  fallback (`TTS_PROVIDER=elevenlabs`). Mark the video as altered/synthetic
  content in YouTube Studio (AI voice).
- **Animation follows audio.** Narration lives in one source file per video
  (`videos/<video>/narration/script.mjs`) with `{cue}` markers at the words where
  something appears on screen. Markers are not spoken.
- `npm run voice <video>` synthesizes each scene, gets word times from Whisper,
  re-rolls any take where words were skipped or garbled, writes cue times to
  `src/timings.json`, pads every scene to whole frames, and produces
  `voiceover.wav`, captions (`.srt`) and chapter timestamps.
- **Write for the ear of a TTS model:** spell out symbols and unusual
  abbreviations the way they're said ("five twelve megabytes", "see-groups" only
  if rewording fails). Avoid parentheses, slashes and em-dash asides in narration.
- Scenes wait on cues with `yield* s.at('cue')` and end with `yield* s.end()`.
- When Claude writes a script at the "scenes" stage, it also places the `{cue}`
  markers, at the word where each VISUAL bullet should start.
- Music is composed in code by `tools/music/compose.py` (`npm run music`), so it's original and
  owned by the channel: no licences, no Content ID claims. Mood: a tense D-minor "something is
  hidden" build resolving to D major at the reveal. Intro cues hit the beat times in
  `shared/brand/brand.json`; the outro bed sits about 21 dB under the voice.
- Background music under narration: none by default (the explanation needs the room).

---

## 8. Thumbnail rules

- Dark background (subtle grid or noise texture allowed).
- **One** big recognizable logo or icon, with a soft glow in my accent color.
- **2–4 words max**, uppercase, clean font, high contrast. One word may use the accent color.
- Text complements the title. It doesn't repeat it (title: "Nginx will finally make
  sense…", thumbnail: "HOW DOES IT WORK?").
- Must be readable at phone size.

---

## 9. Output checklist (what Claude delivers per stage)

| Stage | Deliverable |
|---|---|
| Ideas | 15–20 ideas in §2 formats, each with its core idea, opening scenario, running example and a draft problem chain, plus a topic-test pass |
| Script | Full narration in §4 scene format following §3, plus scene table, the chain, and `[VERIFY]` list |
| Animation | One Motion Canvas `.tsx` per scene following §5–7, synced to the generated timings; summary + end card use `@shared/outro`; the intro needs no code |
| Packaging | 5 titles, 5 thumbnail texts, 3–4 rendered thumbnails (`thumbnails/thumb-N.html` → `.png`) |
| Publish | YouTube description (2–3 lines plus key terms), chapter timestamps, 10 tags |

---

## 10. Quality check (run before publishing)

Story:
- [ ] The hook puts the viewer in a concrete situation (or makes something mundane mysterious) within 15 seconds; no agenda, no greeting
- [ ] The tool or concept arrives as the answer to a problem, not as the topic
- [ ] Every section starts from a problem the viewer already feels; "but / so / because" fits between every pair of scenes
- [ ] Each fix admits its cost, and that cost is the next problem
- [ ] One running example followed the whole way, walked step by step through each new mechanism
- [ ] Concrete numbers in every major link
- [ ] Ideas come before names; terms defined in passing in everyday words
- [ ] The core idea is stated once it's earned and returns in the summary
- [ ] At least two moments that answer the viewer's thought before they have it; at least one practical opinion or gotcha
- [ ] Nothing from §3.8; calm register; read-aloud test passes

Accuracy and production:
- [ ] Every technical claim verified (no open `[VERIFY]` tags)
- [ ] One idea per scene; something changes on screen at least every 3–5 s
- [ ] Only one accent color used; style matches §5
- [ ] Audio clean, consistent volume; subtitles corrected for technical terms
- [ ] Thumbnail readable at small size; title uses a winning format
- [ ] Video delivers what the title promises
