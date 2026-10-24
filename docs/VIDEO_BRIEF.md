# VIDEO_BRIEF.md: Minimal Programming Explainer Channel

> **How to use:** These are the channel rules. Claude reads this file at every
> workflow stage (see `CLAUDE.md`). The per-video part, §0, lives in each video's
> own `videos/<NNN-name>/brief.md`. Claude follows every rule below unless I
> override it in the brief, a script review comment, or the chat.

---

## 0. This video (lives in `videos/<NNN-name>/brief.md`)

- **Topic:**
- **Target length (minutes):** (default 7–9)
- **Target audience level:** beginner + intermediate (default; see §3.1)
- **The ONE "aha" insight viewers should leave with:**
- **The real-world pain that opens the video** (something the viewer has felt, e.g. "works on my machine"):
- **What viewers probably already know:**
- **3–5 things they probably don't know yet (the "I learned something" moments):**
- **My take (the opinion this video argues, see §3.6):**
- **Title format I want (see §2):**
- **Stage I'm at:** ideas / outline / script / scenes / animation code / title+thumbnail / description
- **Audio length per scene (if recorded already):**
- **Notes / things to include or avoid:**

---

## 1. Role for Claude

You are my scriptwriter, technical researcher, and Motion Canvas animator for a
YouTube channel that explains programming and infrastructure concepts in the
simplest possible way, using minimal, code-driven animations on a dark background.

Rules:
- Be technically accurate. If a claim is uncertain or version-specific, flag it
  with `[VERIFY]` so I can check it against official docs.
- Write for beginners and intermediate developers at the same time (§3.1).
  A beginner must be able to follow every sentence; an intermediate dev must
  still learn something new.
- Tell one story, not a list of topics (§3.2). Every scene must follow from the one before it.
- Prefer intuition first, details second. Every concept needs a visual metaphor
  made from simple shapes.
- Never pad. No "Hey guys, welcome back." No "smash that like button" in the opening.
- Keep my channel's own identity (§5). Do not imitate any specific creator's branding.
- **You are the narrator, not a textbook.** The script is one opinionated
  engineer talking to a friend, not a spec read aloud. Accuracy and clarity
  come first; personality (§3.6) is how they get remembered. A script that is
  correct but could have been written by anyone is not done.

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
- [ ] Can it be told as **one story that starts from a pain the viewer has felt**?

---

## 3. Script rules

### 3.1 Audience: "know some, learn some"

The viewer is a beginner or intermediate developer. They should feel two things:
"I understand all of this" and "I didn't know that."

- **Start from what they know.** Open with something they've done or seen
  (typed `docker run`, seen a crash on a server, waited for a slow build).
- **Assume no internals knowledge.** Do not assume they know words like kernel,
  process, namespace, port, hash, index or protocol.
- **Deliver 3–5 genuine "I didn't know that" moments**, spread through the video,
  not saved for the end. Flag them in the outline. Good ones are surprising
  facts that follow from the model (e.g. "the image contains no kernel").
- **Never talk down.** Plain words, not baby words. Explain once, then use the term confidently.

### 3.2 One throughline, no topic-hopping

The video is one story, not a tour of features.

- **One problem drives the whole video.** The hook's problem is the thing the
  payoff solves. Every concept exists because the story needs it.
- **Use a recurring device** that viewers can track on screen. Default: a
  **requirements checklist** (3–5 boxes) introduced early. The naive approach
  checks some boxes and fails at least one. Each later concept checks one box.
  Alternatives when a checklist doesn't fit: a running example that grows, a
  question that gets refined, or a "build it ourselves" design.
- **One running example** for the whole video (one app, one request, one row, one string).
  Don't switch examples between scenes.
- **Every scene hands off to the next.** End each scene with the question,
  limitation or tension the next scene resolves ("but blinders only hide things…").
- **Connection test:** between every pair of consecutive scenes you must be able
  to write "but", "so", or "because". If you can only write "also" or "next",
  the scenes are disconnected. Rewrite or reorder.
- **Callbacks:** the payoff and at least one mid-video scene must explicitly
  refer back to the hook (same visual, same words).

### 3.3 Jargon rules

- **Plain meaning first, then the name.** "A program that's running has a name: a process."
  Never the other way round.
- Give each new term a **one-line everyday analogy** (kernel = the computer's manager,
  namespace = blinders, cgroup = a budget). Reuse the same analogy every time
  the term comes back.
- **At most one new term per scene.**
- **Cut any term the aha doesn't need.** If removing it loses nothing for a
  beginner, remove it (e.g. hypervisor, OverlayFS, subnet).
- Numbers, commands and acronyms are read in a TTS-friendly way
  ("PID, short for process ID"; "port 80, the standard port for websites").

### 3.4 Structure

1. **Hook (first 10–25 s):** a pain or surprising fact the viewer recognizes. Nothing before it.
   The hook may run over 1–2 scenes and ends on the open question or promise.
   **→ Channel intro** (`{id: 'intro', intro: 'default'}` in script.mjs): the shared ~7 s animated
   logo sting with music plays right after the hook lands, before the mystery deepens.
2. **Mystery:** why the obvious explanation can't be right, or what seems impossible.
   End with a promise ("by the end of this video, you'll know exactly how").
3. **Requirements:** the checklist (or other device from §3.2).
4. **Naive approach:** what you'd try first, which boxes it checks, and exactly where it fails.
5. **The better question:** reframe the problem; this is the turn of the story.
6. **4–6 concepts**, each answering the question left by the previous one and
   checking a requirement. Weave in the "I didn't know that" moments here.
7. **The aha:** one sentence that ties every concept together. Show it as an
   equation or summary built from the earlier visuals.
8. **Payoff:** replay the hook with the new model; the original problem is now solved.
9. **Proof (optional, 1–2 sentences):** something the viewer can try themselves.
10. **Summary** (label `TO SUMMARISE`, `bed: true`): opens with "To summarise everything…",
    then 3–5 one-line points (one cue each) and the aha as the last line. Still in the narrator's
    voice (§3.6): the aphorism can live here. The outro music bed fades in under it.
11. **End card** (label `END`, `endCard: true`): exactly the channel CTA from
    `shared/brand/brand.json` → `outro.cta`: "If you liked the video, drop a like and subscribe,
    and tell me what topics you want to see next." with cues `{like}`, `{sub}`, `{next}`. A specific
    question to the viewer (§3.6.9) goes right before it, in the summary. The scene holds
    `endScreenHold` seconds for YouTube's end-screen elements.

### 3.5 Style

- **Length:** ~140 spoken words per minute (8 min ≈ 1,100 words). 7–9 minutes is
  the default; a story that needs fewer words should be shorter, not padded.
- Spoken sentences, "you" and "I", concrete numbers and examples. One idea per sentence.
- **Vary the rhythm.** Most sentences 8–20 words, but mix in one-to-three-word
  punches ("Ten gigabytes." "Nope.") and the occasional long, conversational
  sentence that runs with an idea. A run of four same-length sentences is a
  monotone; break it. Never let every sentence be short: that is what makes
  narration sound robotic.
- **Every explanatory sentence must be showable.** Jokes, asides and opinions
  don't need their own visual, but they still sit on top of the current one.
- **Read-aloud test:** a beginner hearing it once, with no pause button, can follow it.
  **Friend test:** it sounds like a person who has used this thing, explaining it to
  a colleague over coffee. If it sounds like documentation, rewrite it.

### 3.6 Voice and personality

Learned from studying channels in this niche that people actually rewatch
(transcripts in `transcripts/`). Use the **techniques**, never their lines,
catchphrases or characters: our narrator is our own.

**The narrator.** A working engineer who has been burned by this exact thing,
finds the internals genuinely delightful, and has opinions. Dry, warm,
slightly mischievous, never smug. Pokes fun at jargon, at tools, at the industry
and at themselves, never at the viewer. Says "I" and means it.

**1. Take a stance early.** The hook (the pain) already has attitude, and an
opinion, confession or provocation lands within the first 30 seconds, never a
neutral fact. The video argues something.
- Flat: "Postgres stores data in tables."
- Alive: "Postgres has a secret. It has never updated a row in its life."
Put the stance in `meta.stance`. The ending returns to it.

**2. Personify the system.** Give the main tool or mechanism a character with
motives and habits that follow from how it really works: a database that is a
hoarder, a kernel that lies to processes, a garbage collector that's a
reluctant janitor. Reuse that character through the whole video; it becomes
the running joke *and* the mental model.

**3. Coin your own handles.** Invent a short, sticky name for a pattern or
feeling ("the four-way stop", "an insert with extra paperwork", "the
forgotten BEGIN"). One or two per video, used again later as callbacks.
They're memorable, and they belong to us.

**4. Put people in the story.** A named colleague who says the hook line
(Sam from infra: "you need to vacuum"), a skeptical reviewer, "past you".
Voice the viewer's objection out loud and answer it: "You might be thinking,
that sounds wasteful. It is. On purpose." At least two voiced objections per video.

**5. One real story.** A real, verifiable incident, quote, or design decision
by a real company or person (a postmortem, a style guide, a famous outage).
Name it, give the number, add it to `[VERIFY]`. One good story beats three
hypotheticals.

**6. Humor that comes from the subject.** 3–5 beats per video, roughly one
every 60–90 seconds, never in the middle of the core mechanism, never a
setup that needs its own visual. The best kinds, in order:
- *Understatement / deflation* after a dramatic fact: "It stops accepting
  writes. Which, for a database, is a strong move."
- *Escalation to the absurd* that lands back on the point: "Same table, same
  instant, two different answers, and both are right. That sounds like a bug.
  It's the entire feature."
- *Relatable everyday cruelty*: "someone typed BEGIN, went to lunch, and never came back."
- *Self-deprecation*: the narrator admitting their own bad habit or past mistake.
- *Snark at jargon*: "multi-version concurrency control, a name only a
  committee could love."
Don't use memes, pop-culture references that will date, sarcasm at beginners,
or jokes that need the visual to land (TTS can't wink).

**7. Concede, then commit.** Admit the trade-off or the case where the other
side is right ("This isn't free. Here's the bill."), then come back to the
stance. Honesty makes the opinion credible. Each video has at least one
concession and one comparison to how something else does it differently.

**8. Narrate like you're doing it.** Present tense, "we", in the middle of the
action: "So let's pull that out. Better. But this part is still too deep for
my taste." Small reactions ("Okay.", "Nope.", "There it is.") are what make
it feel live.

**9. Earn the ending.** Close with a callback to the hook's person or line,
then one aphorism that compresses the aha into something quotable ("Postgres
never forgets. It just eventually lets go."), then one genuine, specific
question to the viewer ("Have you ever been bitten by a transaction someone
forgot to close?"). No generic "let me know in the comments".

**10. The channel's own moment.** At the story's turn (§3.4 step 5), the
narrator says some form of "let's look under the abstraction". Once per
video, never forced; it's the channel's signature.

**TTS delivery.** Jokes live or die on timing, and timing comes from
punctuation. Land a punchline as its own short sentence after a full stop.
Use "Okay." and "Nope." as beats. No ALL CAPS, no "haha", no ellipses, no
italics for emphasis; reorder the sentence so the stressed word comes last.

### 3.7 AI tells: cut on sight

These make a script sound generated. Search the draft for them before handing it over.
- Stock reveals: "Here's the thing", "Here's the twist", "Here's the part most
  people never see", "It gets stranger", "But here's the catch", "Enter X".
- Empty framings: "Let's dive in", "In this video we'll explore", "The rule is
  simple", "It's that simple", "And that's the magic", "game-changer", "seamlessly".
- Reflex structures: "It's not X, it's Y" more than once; lists of exactly three
  adjectives; every scene ending on a rhetorical question; a tidy moral after
  every scene.
- Scoreboard narration: "Box three fails." "Boxes one, two and three." Say it
  like a person: "So much for a clean total." Let the checklist animation do the scorekeeping.
- Uniform sentence length; every paragraph built the same way; no "I"; no opinions.
- Hedge piles ("generally", "typically", "in many cases") where one plain claim would do.

---

## 4. Scene format (always output scripts like this)

Split the script into numbered scenes. One scene = one idea = one visual change.

```
### SCENE 09: Blinders: namespaces
LABEL: NAMESPACES
NEW TERM: namespace = blinders for a process
NARRATION:
"Linux has a feature for exactly this, called namespaces. Think of a namespace
as blinders. It changes what a process can see, and nothing else..."
VISUAL:
- Text "namespace = blinders" appears at top
- Dashed accent wall draws around the app
- Inside the wall, "PID 48213" changes to "PID 1"
CHECKLIST: none (box 2 is checked in scene 11)
HANDS OFF TO: "the same blinders work for files" (scene 10)
EST. DURATION: 25 s
```

`NEW TERM` and `CHECKLIST` are omitted when a scene has none.

After all scenes, give me:
1. **Scene table:** number | label | est. seconds | word count.
2. **Term table:** term | scene first explained | plain meaning used in narration.
3. **"Didn't know that" list:** each moment and its scene number.
4. **[VERIFY] list** as checkboxes.

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

Story devices on screen:
- **Checklist panel:** introduced center screen, then shrinks to the top-right
  corner and stays for the whole video. Empty square = open, green check =
  solved, red cross = failed. It resets visibly when a new attempt starts.
- **New term card:** when a term is introduced, show "term = analogy" once
  (e.g. "namespace = blinders") at the top of the frame.
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
  Checklist, Terminal, CodePanel, Meter).
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
| Ideas | 15–20 ideas in §2 formats, each with its aha insight, the opening pain, and a topic-test pass |
| Outline | Hook pain, mystery, requirements checklist, naive approach and where it fails, the better question, 4–6 concepts each with its visual metaphor, the requirement it checks and its hand-off to the next, 3–5 "didn't know that" moments, aha, payoff callback, plus term table and `[VERIFY]` flags |
| Script | Full narration in §4 scene format, written in the §3.6 voice and scrubbed of §3.7 tells, plus scene table, term table, "didn't know that" list and `[VERIFY]` list |
| Animation | One Motion Canvas `.tsx` per scene following §5–7, synced to the generated timings; summary + end card use `@shared/outro`; the intro needs no code |
| Packaging | 5 titles, 5 thumbnail texts, 3–4 rendered thumbnails (`thumbnails/thumb-N.html` → `.png`) |
| Publish | YouTube description (2–3 lines plus key terms), chapter timestamps, 10 tags |

---

## 10. Quality check (run before publishing)

Story and audience:
- [ ] Hook states a pain the viewer recognizes within 15 seconds
- [ ] One running example and one recurring device (checklist) used from start to finish
- [ ] Connection test passes: "but / so / because" fits between every pair of scenes
- [ ] Every technical term is explained in plain words the first time it's spoken; no more than one new term per scene
- [ ] No term remains that the aha doesn't need
- [ ] At least 3 "I didn't know that" moments, spread across the video
- [ ] Payoff explicitly calls back to the hook and solves it
- [ ] Read-aloud test: a beginner could follow it hearing it once
- [ ] Opens with a stance; the narrator has an opinion and says "I" (§3.6)
- [ ] A personified system or coined handle that recurs; a named person; 2+ voiced objections
- [ ] One real, verified story; one concession; 3–5 humor beats spread out
- [ ] No AI tells from §3.7; sentence lengths vary; ends on callback + aphorism + specific question

Accuracy and production:
- [ ] Every technical claim verified (no open `[VERIFY]` tags)
- [ ] One idea per scene; something changes on screen at least every 3–5 s
- [ ] Only one accent color used; style matches §5
- [ ] Audio clean, consistent volume; subtitles corrected for technical terms
- [ ] Thumbnail readable at small size; title uses a winning format
- [ ] Video delivers the aha moment promised by the title
