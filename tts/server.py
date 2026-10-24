"""
Local voice server for Under the Abstraction.

    npm run tts                       (from the repo root)
    .venv/Scripts/python server.py    (from tts/)

POST /synthesize {"text": "..."} returns the same shape as ElevenLabs'
/with-timestamps endpoint, so tools/voiceover.mjs treats both providers alike:

    {"sample_rate": 24000, "audio_base64": <16-bit mono PCM>,
     "alignment": {"characters": [...], "character_start_times_seconds": [...],
                   "character_end_times_seconds": [...]},
     "takes": 1, "wer": 0.0}

How a scene is made
  1. Split the text into sentences and group them into chunks of at most
     `max_chars`; Chatterbox is most stable on short inputs.
  2. Generate each chunk with the channel voice (voice/reference.wav +
     voice/voice.json), trim its silence, join the chunks with natural pauses.
  3. Whisper transcribes each chunk with word timestamps. The script's words
     are matched to Whisper's words, which gives every character a time.
  4. If Whisper heard something too different from the script (a skipped or
     garbled word), the chunk is re-generated with the next seed.
  5. The scene is loudness-normalised so every scene and video sounds the same.
"""
from __future__ import annotations

import argparse
import base64
import difflib
import hashlib
import json
import os
import re
import sys
import threading
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VOICE_DIR = ROOT / "voice"
SR = 24000

# Windows consoles/pipes default to cp1252; our logs use ✔ and …
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def _go_offline_if_cached() -> None:
    """The models live in the Hugging Face cache after the first download. Without this,
    every load still asks the Hub "is there a newer version?" (slow, needs internet).
    If everything this voice needs is cached, go fully offline. Must run before any
    huggingface_hub import, which reads HF_HUB_OFFLINE once."""
    if "HF_HUB_OFFLINE" in os.environ:
        return  # the user decided
    try:
        cfg = json.loads((VOICE_DIR / "voice.json").read_text("utf-8"))
    except Exception:
        cfg = {}
    hub = Path(os.environ.get("HF_HUB_CACHE") or Path(os.environ.get("HF_HOME") or Path.home() / ".cache/huggingface") / "hub")
    tts_repo = "ResembleAI--chatterbox-turbo" if cfg.get("engine") == "chatterbox-turbo" else "ResembleAI--chatterbox"
    needed = [tts_repo, "ResembleAI--chatterbox",  # the voice lab's speaker encoder comes from the base repo
              f"Systran--faster-whisper-{cfg.get('align_model', 'small.en')}"]
    missing = [r for r in needed if not any((hub / f"models--{r}" / "snapshots").glob("*/*"))]
    if missing:
        print(f"[hf] first use of {', '.join(m.replace('--', '/') for m in missing)}: downloading from the Hub", flush=True)
    else:
        os.environ["HF_HUB_OFFLINE"] = "1"
        print("[hf] all models cached: offline mode (no Hub requests)", flush=True)


_go_offline_if_cached()

# Windows: faster-whisper (CTranslate2) needs cuBLAS/cuDNN DLLs; the CUDA build of
# torch ships them, so make them findable before either library loads.
if sys.platform == "win32":
    try:
        import importlib.util

        spec = importlib.util.find_spec("torch")
        if spec and spec.origin:
            lib = Path(spec.origin).parent / "lib"
            if lib.exists():
                os.add_dll_directory(str(lib))
                os.environ["PATH"] = str(lib) + os.pathsep + os.environ.get("PATH", "")
    except Exception:
        pass

import torch  # noqa: E402

DEFAULTS = {
    "engine": "chatterbox",  # chatterbox | chatterbox-turbo
    "reference": "reference.wav",
    "exaggeration": 0.45,  # 0.25 flat … 0.5 neutral … 1.0 dramatic
    "cfg_weight": 0.5,  # lower = slower, more deliberate pacing
    "temperature": 0.7,
    "seed": 42,
    "max_chars": 260,
    "sentence_pause": 0.28,  # silence inserted between chunks (s)
    "target_lufs": -18.0,
    "max_wer": 0.12,  # re-roll a chunk if Whisper's transcript differs more than this
    "max_takes": 4,
    "align_model": "small.en",
    "align_device": "auto",  # auto | cuda | cpu
}


def load_config() -> dict:
    cfg = dict(DEFAULTS)
    f = VOICE_DIR / "voice.json"
    if f.exists():
        cfg.update({k: v for k, v in json.loads(f.read_text("utf-8")).items() if not k.startswith("_")})
    return cfg


def reference_path(cfg: dict) -> Path:
    p = (VOICE_DIR / cfg["reference"]).resolve()
    if not p.exists():
        raise FileNotFoundError(
            f"Voice reference not found: {p}. Run `npm run voice:test -- --make-reference` or put a "
            "10-20 s clean clip of the voice there."
        )
    return p


def fingerprint(cfg: dict) -> str:
    keys = ["engine", "exaggeration", "cfg_weight", "temperature", "seed", "max_chars",
            "sentence_pause", "target_lufs", "max_wer", "max_takes"]
    h = hashlib.sha1(json.dumps({k: cfg[k] for k in keys}, sort_keys=True).encode())
    try:
        h.update(reference_path(cfg).read_bytes())
    except FileNotFoundError:
        h.update(b"no-reference")
    return h.hexdigest()[:12]


# ── models (loaded lazily, kept warm) ────────────────────────────────────────
class Engine:
    def __init__(self):
        self.lock = threading.Lock()
        self.tts = None
        self.tts_key = None
        self.tts_loaded = None
        self.whisper = None
        self.whisper_key = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def get_tts(self, cfg: dict):
        key = (cfg["engine"], str(reference_path(cfg)), cfg["exaggeration"])
        if self.tts is None or self.tts_loaded != key[0]:
            if self.tts is not None:  # switching engines: free VRAM first (8 GB cards)
                self.tts = None
                import gc

                gc.collect()
                torch.cuda.empty_cache()
            t0 = time.time()
            print(f"[tts] loading {cfg['engine']} on {self.device} …", flush=True)
            if cfg["engine"] == "chatterbox-turbo":
                from chatterbox.tts_turbo import ChatterboxTurboTTS
                self.tts = ChatterboxTurboTTS.from_pretrained(device=self.device)
            else:
                from chatterbox.tts import ChatterboxTTS
                self.tts = ChatterboxTTS.from_pretrained(device=self.device)
            print(f"[tts] ready in {time.time() - t0:.1f}s", flush=True)
            self.tts_loaded = key[0]
            self.tts_key = None
        if self.tts_key != key:
            # Speaker conditioning is computed once per reference clip, not per sentence.
            if cfg["engine"] == "chatterbox-turbo":
                self.tts.prepare_conditionals(key[1])
            else:
                self.tts.prepare_conditionals(key[1], exaggeration=cfg["exaggeration"])
            self.tts_key = key
        return self.tts

    def get_whisper(self, cfg: dict):
        want = cfg["align_device"]
        devices = ["cuda", "cpu"] if want == "auto" else [want]
        if self.whisper is not None and self.whisper_key[0] == cfg["align_model"]:
            return self.whisper
        from faster_whisper import WhisperModel

        last = None
        for dev in devices:
            if dev == "cuda" and not torch.cuda.is_available():
                continue
            try:
                ct = "float16" if dev == "cuda" else "int8"
                model = WhisperModel(cfg["align_model"], device=dev, compute_type=ct)
                # A tiny decode proves the CUDA libraries really load.
                list(model.transcribe(np.zeros(SR // 2, dtype=np.float32), language="en")[0])
                self.whisper, self.whisper_key = model, (cfg["align_model"], dev)
                print(f"[align] whisper {cfg['align_model']} on {dev}", flush=True)
                return model
            except Exception as e:  # fall back to CPU
                last = e
                print(f"[align] whisper on {dev} failed ({e}); trying next", flush=True)
        raise RuntimeError(f"Could not load Whisper: {last}")


ENGINE = Engine()


# ── text helpers ─────────────────────────────────────────────────────────────
def split_chunks(text: str, max_chars: int) -> list[tuple[int, int]]:
    """Sentence-aware chunks as (start, end) character spans of `text`."""
    spans, start = [], 0
    for m in re.finditer(r"[.!?]+[\"')\]]*(\s+|$)", text):
        spans.append((start, m.end()))
        start = m.end()
    if start < len(text):
        spans.append((start, len(text)))
    # split overly long sentences at commas / semicolons
    out = []
    for a, b in spans:
        while b - a > max_chars:
            seg = text[a:b]
            cut = max((m.end() for m in re.finditer(r"[,;:]\s", seg[:max_chars])), default=0)
            if cut == 0:
                cut = seg.rfind(" ", 0, max_chars) + 1 or max_chars
            out.append((a, a + cut))
            a += cut
        out.append((a, b))
    # merge short neighbours so very short sentences don't sound clipped
    merged: list[list[int]] = []
    for a, b in out:
        if merged and (b - merged[-1][0]) <= max_chars and (merged[-1][1] - merged[-1][0]) < 60:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return [(a, b) for a, b in merged if text[a:b].strip()]


def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9']", "", word.lower().replace("’", "'"))


def words_with_spans(text: str) -> list[tuple[str, int, int]]:
    return [(m.group(), m.start(), m.end()) for m in re.finditer(r"\S+", text)]


# ── audio helpers ────────────────────────────────────────────────────────────
def trim(wav: np.ndarray, thresh_db: float = -42.0, pad: float = 0.04) -> np.ndarray:
    if wav.size == 0:
        return wav
    frame = int(SR * 0.01)
    n = wav.size // frame
    if n == 0:
        return wav
    rms = np.sqrt(np.mean(wav[: n * frame].reshape(n, frame) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(np.abs(wav)) + 1e-9) + 1e-12)
    loud = np.where(db > thresh_db)[0]
    if loud.size == 0:
        return wav
    a = max(0, loud[0] * frame - int(pad * SR))
    b = min(wav.size, (loud[-1] + 1) * frame + int(pad * SR))
    return wav[a:b]


def loudness_normalise(wav: np.ndarray, target: float) -> np.ndarray:
    import pyloudnorm as pyln

    if wav.size < SR // 2:
        return wav
    meter = pyln.Meter(SR)
    lufs = meter.integrated_loudness(wav.astype(np.float64))
    if not np.isfinite(lufs):
        return wav
    out = wav * (10 ** ((target - lufs) / 20))
    peak = np.max(np.abs(out))
    if peak > 0.89:  # keep true-ish peak under about -1 dBFS
        out *= 0.89 / peak
    return out.astype(np.float32)


# ── generation + alignment ───────────────────────────────────────────────────
def generate_chunk(cfg: dict, text: str, seed: int) -> np.ndarray:
    tts = ENGINE.get_tts(cfg)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    if cfg["engine"] == "chatterbox-turbo":
        wav = tts.generate(text, temperature=cfg["temperature"])
    else:
        wav = tts.generate(text, exaggeration=cfg["exaggeration"], cfg_weight=cfg["cfg_weight"],
                           temperature=cfg["temperature"])
    return trim(wav.squeeze(0).detach().cpu().numpy().astype(np.float32))


def transcribe_words(cfg: dict, wav: np.ndarray, prompt: str):
    model = ENGINE.get_whisper(cfg)
    segments, _ = model.transcribe(wav, language="en", word_timestamps=True, beam_size=5,
                                   initial_prompt=prompt, condition_on_previous_text=False,
                                   vad_filter=False)
    return [(w.word.strip(), float(w.start), float(w.end)) for s in segments for w in (s.words or [])]


def align_chunk(text: str, heard: list, duration: float):
    """Times for each script word of `text` (list of (start, end)) + word error rate."""
    script = words_with_spans(text)
    a = [norm(w) for w, _, _ in script]
    b = [norm(w) for w, _, _ in heard]
    times: list[tuple[float, float] | None] = [None] * len(script)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    matched = 0
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k][1], heard[j1 + k][2])
            matched += i2 - i1
        elif tag == "replace" and j2 > j1:
            # e.g. script "eighty" vs heard "80": spread the heard span across the script words
            t0, t1 = heard[j1][1], heard[j2 - 1][2]
            n = i2 - i1
            for k in range(n):
                times[i1 + k] = (t0 + (t1 - t0) * k / n, t0 + (t1 - t0) * (k + 1) / n)
    # number-vs-words mismatches are not real errors; count only clear misses
    wer = 1 - matched / max(1, len(a))
    soft = sum(1 for tag, i1, i2, j1, j2 in sm.get_opcodes()
               if tag == "replace" and any(ch.isdigit() for w in b[j1:j2] for ch in w))
    wer = max(0.0, wer - soft / max(1, len(a)))

    # fill gaps by interpolating between known neighbours
    known = [i for i, t in enumerate(times) if t is not None]
    if not known:
        # no usable transcript: spread evenly by character count
        total = sum(len(w) for w, _, _ in script) or 1
        t = 0.0
        for i, (w, _, _) in enumerate(script):
            d = duration * len(w) / total
            times[i] = (t, t + d)
            t += d
        return times, 1.0
    for i in range(len(times)):
        if times[i] is None:
            # a run of unknown words between two known ones: share that gap evenly
            lo = max((k for k in known if k < i), default=-1)
            hi = min((k for k in known if k > i), default=len(times))
            t0 = times[lo][1] if lo >= 0 else 0.0
            t1 = times[hi][0] if hi < len(times) else duration
            t1 = max(t1, t0)
            m = hi - lo - 1
            for k in range(1, m + 1):
                times[lo + k] = (t0 + (t1 - t0) * (k - 1) / m, t0 + (t1 - t0) * k / m)
    # keep monotonic
    last = 0.0
    for i, (s, e) in enumerate(times):
        s = max(s, last)
        e = max(e, s + 0.01)
        times[i] = (s, e)
        last = s
    return times, wer


def synthesize(text: str, log_id: str = "") -> dict:
    cfg = load_config()
    text = re.sub(r"\s+", " ", text).strip()
    chunks = split_chunks(text, cfg["max_chars"])
    pause = np.zeros(int(cfg["sentence_pause"] * SR), dtype=np.float32)

    pieces: list[np.ndarray] = []
    char_start = [0.0] * len(text)
    char_end = [0.0] * len(text)
    t_offset = 0.0
    takes_total, wers = 0, []

    for ci, (a, b) in enumerate(chunks):
        seg = text[a:b].strip()
        lead_ws = len(text[a:b]) - len(text[a:b].lstrip())
        best = None
        for take in range(cfg["max_takes"]):
            seed = cfg["seed"] + 1000 * take + ci
            wav = generate_chunk(cfg, seg, seed)
            heard = transcribe_words(cfg, wav, seg)
            times, wer = align_chunk(seg, heard, wav.size / SR)
            takes_total += 1
            if best is None or wer < best[2]:
                best = (wav, times, wer)
            if wer <= cfg["max_wer"]:
                break
            print(f"[tts] {log_id} chunk {ci + 1}: take {take + 1} WER {wer:.2f} > {cfg['max_wer']}, re-rolling",
                  flush=True)
        wav, times, wer = best
        wers.append(wer)

        # per-character times for this chunk
        for (w, ws, we), (s, e) in zip(words_with_spans(seg), times):
            n = we - ws
            for k in range(n):
                idx = a + lead_ws + ws + k
                char_start[idx] = t_offset + s + (e - s) * k / n
                char_end[idx] = t_offset + s + (e - s) * (k + 1) / n
        pieces.append(wav)
        t_offset += wav.size / SR
        if ci < len(chunks) - 1:
            pieces.append(pause)
            t_offset += pause.size / SR

    # whitespace characters inherit the end of the previous word
    for i, ch in enumerate(text):
        if ch.isspace() or (char_start[i] == 0.0 and char_end[i] == 0.0 and i > 0):
            char_start[i] = char_end[i] = char_end[i - 1] if i > 0 else 0.0

    audio = loudness_normalise(np.concatenate(pieces) if pieces else np.zeros(1, np.float32), cfg["target_lufs"])
    pcm = (np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes()
    return {
        "sample_rate": SR,
        "audio_base64": base64.b64encode(pcm).decode(),
        "alignment": {
            "characters": list(text),
            "character_start_times_seconds": [round(t, 4) for t in char_start],
            "character_end_times_seconds": [round(t, 4) for t in char_end],
        },
        "takes": takes_total,
        "chunks": len(chunks),
        "wer": round(max(wers) if wers else 0.0, 3),
    }


# ── HTTP ─────────────────────────────────────────────────────────────────────
from pydantic import BaseModel  # noqa: E402  (module level so FastAPI can resolve the annotation)


class Req(BaseModel):
    text: str
    id: str | None = None
    previous_text: str | None = None  # accepted for ElevenLabs parity; unused
    next_text: str | None = None


def make_app():
    from fastapi import FastAPI, HTTPException

    app = FastAPI(title="Under the Abstraction voice")

    @app.get("/health")
    def health():
        cfg = load_config()
        ref_ok = (VOICE_DIR / cfg["reference"]).exists()
        info = {
            "ok": True,
            "engine": cfg["engine"],
            "device": ENGINE.device,
            "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
            "loaded": ENGINE.tts is not None,
            "reference": cfg["reference"] if ref_ok else None,
            "fingerprint": fingerprint(cfg),
            "config": cfg,
        }
        if torch.cuda.is_available():
            free, total = torch.cuda.mem_get_info()
            info["vram_free_gb"] = round(free / 1e9, 2)
            info["vram_total_gb"] = round(total / 1e9, 2)
        return info

    @app.post("/synthesize")
    def synth(req: Req):
        if not req.text.strip():
            raise HTTPException(400, "empty text")
        t0 = time.time()
        with ENGINE.lock:  # one GPU job at a time
            try:
                out = synthesize(req.text, req.id or "")
            except FileNotFoundError as e:
                raise HTTPException(412, str(e))
        dur = len(base64.b64decode(out["audio_base64"])) / 2 / SR
        print(f"[tts] {req.id or '-'}: {dur:.1f}s audio in {time.time() - t0:.1f}s, "
              f"{out['chunks']} chunks, {out['takes']} takes, worst WER {out['wer']}", flush=True)
        return out

    @app.post("/warmup")
    def warmup():
        cfg = load_config()
        with ENGINE.lock:
            ENGINE.get_tts(cfg)
            ENGINE.get_whisper(cfg)
        return {"ok": True}

    return app


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=7861)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--say", help="synthesize this text to --out and exit (no server)")
    ap.add_argument("--out", default="say.wav")
    args = ap.parse_args()

    if args.say:
        import soundfile as sf

        res = synthesize(args.say, "cli")
        pcm = np.frombuffer(base64.b64decode(res["audio_base64"]), dtype="<i2")
        sf.write(args.out, pcm, SR, subtype="PCM_16")
        print(f"wrote {args.out}  ({pcm.size / SR:.1f}s, takes {res['takes']}, WER {res['wer']})")
    else:
        import uvicorn

        print(f"[server] http://{args.host}:{args.port}  voice dir: {VOICE_DIR}", flush=True)
        uvicorn.run(make_app(), host=args.host, port=args.port, log_level="warning")
