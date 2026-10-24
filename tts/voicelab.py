"""
Voice lab: find the reference clip + settings that make Chatterbox sound most
like the pilot's ElevenLabs voice.

    npm run voice:test                      (= voicelab.py all, from the repo root)
    python voicelab.py candidates           cut candidate reference clips from the pilot audio
    python voicelab.py bakeoff [--quick]    synthesize held-out pilot sentences with every
                                            candidate x setting, score against ElevenLabs
    python voicelab.py apply <run> <rank>   write a result into voice/voice.json + reference.wav
    python voicelab.py say "text"           one-off line with the current channel voice

Scoring of each config's generated sentences:
  similarity  mean cosine of speaker embeddings (Chatterbox's voice encoder) against
              ElevenLabs sentences with DIFFERENT words, so shared content can't inflate it.
              `baseline` is ElevenLabs vs itself on the same comparison: the ceiling.
  pace        generated duration / ElevenLabs duration of the same sentence; 1.00 = same speed
  wer         Whisper's transcript vs the script; catches skipped or garbled words
Final score = similarity/baseline - 0.25*|1 - pace| - 0.5*wer. Listen to the top few before
choosing: the numbers find candidates, your ears decide.

    python voicelab.py rescore <run>        recompute scores of an earlier run from its audio
"""
from __future__ import annotations

import argparse
import itertools
import json
import shutil
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

import server  # reuses the exact generation + alignment path of the voice server
from server import ENGINE, SR, VOICE_DIR, load_config

ROOT = server.ROOT
PILOT = ROOT / "videos" / "001-docker"
CAND_DIR = VOICE_DIR / "candidates"
TESTS = VOICE_DIR / "tests"


# ── pilot audio + ElevenLabs alignment ───────────────────────────────────────
def pilot_scenes():
    """[(scene_id, wav24k, alignment)] from the pilot's ElevenLabs cache (exact char times)."""
    out = []
    for js in sorted((PILOT / "audio" / "cache").glob("scene*.json")):
        pcm = js.with_suffix(".pcm")
        if not pcm.exists():
            continue
        wav = np.frombuffer(pcm.read_bytes(), dtype="<i2").astype(np.float32) / 32768
        out.append((js.stem.split("-")[0], wav, json.loads(js.read_text("utf-8"))))
    if not out:
        sys.exit(f"No ElevenLabs cache found in {PILOT / 'audio/cache'}")
    return out


def sentences(al):
    """Sentence spans with times from an ElevenLabs alignment."""
    ch, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    text = "".join(ch)
    out, a = [], 0
    for i, c in enumerate(text):
        if c in ".?!" and (i + 1 == len(text) or text[i + 1] == " "):
            seg = text[a:i + 1].strip()
            if seg:
                s0 = a + (len(text[a:i + 1]) - len(text[a:i + 1].lstrip()))
                out.append((seg, st[s0], en[i]))
            a = i + 1
    return out


# ── candidates ───────────────────────────────────────────────────────────────
def cmd_candidates(args):
    """Clips of 9-13 s made of whole sentences: natural start and end, typical delivery."""
    CAND_DIR.mkdir(parents=True, exist_ok=True)
    for f in CAND_DIR.glob("*.wav"):
        f.unlink()
    held = set(HELD_OUT_SCENES)
    pool = []
    for sid, wav, al in pilot_scenes():
        if sid in held:
            continue  # never clone from the sentences we test on
        sents = sentences(al)
        for i in range(len(sents)):
            for j in range(i, len(sents)):
                t0, t1 = max(0.0, sents[i][1] - 0.05), sents[j][2] + 0.12
                if 9.0 <= t1 - t0 <= 13.0:
                    clip = wav[int(t0 * SR):int(t1 * SR)]
                    words = sum(len(s[0].split()) for s in sents[i:j + 1])
                    pool.append((sid, i, j, t0, t1, clip, words / (t1 - t0)))
    if not pool:
        sys.exit("No 9-13 s sentence runs found")
    # prefer typical speaking rate (median), spread across different scenes
    med = float(np.median([p[6] for p in pool]))
    pool.sort(key=lambda p: abs(p[6] - med))
    chosen, used = [], set()
    for p in pool:
        if p[0] in used:
            continue
        chosen.append(p)
        used.add(p[0])
        if len(chosen) == args.n:
            break
    for k, (sid, i, j, t0, t1, clip, wps) in enumerate(chosen, 1):
        name = f"cand{k:02d}-{sid}.wav"
        sf.write(CAND_DIR / name, server.trim(clip, pad=0.05), SR, subtype="PCM_16")
        print(f"{name}  {t1 - t0:5.1f}s  {wps * 60:4.0f} wpm  sentences {i + 1}-{j + 1}")
    print(f"\n→ {CAND_DIR}")


# ── bakeoff ──────────────────────────────────────────────────────────────────
HELD_OUT_SCENES = ["scene05", "scene13", "scene19"]  # test material, excluded from candidates


def test_set(limit_per_scene=2):
    tests = []
    scenes = {sid: (wav, al) for sid, wav, al in pilot_scenes()}
    for sid in HELD_OUT_SCENES:
        if sid not in scenes:
            continue
        wav, al = scenes[sid]
        picked = [s for s in sentences(al) if 6 <= len(s[0].split()) <= 22][:limit_per_scene]
        for text, t0, t1 in picked:
            tests.append({"id": f"{sid}-{len(tests) + 1}", "text": text,
                          "ref": wav[max(0, int(t0 * SR)):int(t1 * SR) + int(0.05 * SR)], "dur": t1 - t0})
    return tests


_VE = None


def voice_encoder():
    """Chatterbox's speaker encoder on its own (small; no TTS model needed)."""
    global _VE
    if _VE is None:
        import safetensors.torch as st
        from chatterbox.models.voice_encoder import VoiceEncoder
        from huggingface_hub import hf_hub_download

        _VE = VoiceEncoder()
        _VE.load_state_dict(st.load_file(hf_hub_download("ResembleAI/chatterbox", "ve.safetensors")))
        _VE.eval()
    return _VE


def embed(wavs):
    """L2-normalised speaker embeddings (16 kHz input)."""
    import librosa

    w16 = [librosa.resample(np.asarray(w, dtype=np.float32), orig_sr=SR, target_sr=16000) for w in wavs]
    e = np.asarray(voice_encoder().embeds_from_wavs(w16, sample_rate=16000), dtype=np.float32)
    return e / (np.linalg.norm(e, axis=1, keepdims=True) + 1e-9)


def other_sentences(n=12):
    """ElevenLabs sentences from scenes that are neither test material nor (ideally) references."""
    out = []
    for sid, wav, al in pilot_scenes():
        if sid in HELD_OUT_SCENES:
            continue
        for text, t0, t1 in sentences(al)[:2]:
            if 6 <= len(text.split()) <= 22:
                out.append(wav[max(0, int(t0 * SR)):int(t1 * SR)])
    return out[:n]


def score(sim, baseline, pace, wer):
    return sim / baseline - 0.25 * abs(1 - pace) - 0.5 * wer


def cmd_bakeoff(args):
    cands = sorted(CAND_DIR.glob("*.wav"))
    if not cands:
        print("No candidates yet, cutting them first …")
        cmd_candidates(argparse.Namespace(n=4))
        cands = sorted(CAND_DIR.glob("*.wav"))
    if args.quick:
        cands = cands[:2]

    engines = args.engines.split(",")
    grid = {
        "chatterbox": [dict(exaggeration=e, cfg_weight=c) for e, c in
                       ([(0.5, 0.5)] if args.quick else [(0.35, 0.5), (0.5, 0.5), (0.5, 0.3), (0.65, 0.4)])],
        "chatterbox-turbo": [dict()],
    }
    tests = test_set(1 if args.quick else 2)
    run = TESTS / time.strftime("bakeoff-%Y%m%d-%H%M%S")
    (run / "audio").mkdir(parents=True)
    for t in tests:
        sf.write(run / "audio" / f"elevenlabs-{t['id']}.wav", t["ref"], SR, subtype="PCM_16")

    base = load_config()
    results = []
    combos = [(eng, ref, s) for eng in engines for ref in cands for s in grid.get(eng, [dict()])]
    print(f"{len(combos)} combos x {len(tests)} sentences → {run}\n")
    other = embed(other_sentences())
    baseline = float((embed([t["ref"] for t in tests]) @ other.T).mean())
    print(f"baseline (ElevenLabs vs itself, different sentences): {baseline:.3f}\n")
    for n, (eng, ref, s) in enumerate(combos, 1):
        cfg = {**base, "engine": eng, "reference": str(ref.relative_to(VOICE_DIR)), **s}
        tag = f"{eng}-{ref.stem}" + "".join(f"-{k[:3]}{v}" for k, v in s.items())
        paces, wers, files, wavs = [], [], [], []
        t0 = time.time()
        for t in tests:
            wav = server.generate_chunk(cfg, t["text"], cfg["seed"])
            heard = server.transcribe_words(cfg, wav, t["text"])
            _, wer = server.align_chunk(t["text"], heard, wav.size / SR)
            f = run / "audio" / f"{tag}-{t['id']}.wav"
            sf.write(f, server.loudness_normalise(wav, cfg["target_lufs"]), SR, subtype="PCM_16")
            files.append(f.name)
            wavs.append(wav)
            paces.append((wav.size / SR) / t["dur"])
            wers.append(wer)
        sim = float((embed(wavs) @ other.T).mean())
        pace, wer = float(np.mean(paces)), float(np.mean(wers))
        sc = score(sim, baseline, pace, wer)
        results.append({"tag": tag, "engine": eng, "reference": cfg["reference"], "settings": s,
                        "similarity": round(sim, 4), "pace": round(pace, 3), "wer": round(wer, 3),
                        "score": round(sc, 4), "files": files})
        print(f"[{n:2d}/{len(combos)}] {tag:55s} sim {sim:.3f}  pace {pace:.2f}  wer {wer:.2f}  "
              f"→ {sc:.3f}  ({time.time() - t0:.0f}s)")

    results.sort(key=lambda r: -r["score"])
    report = {"run": run.name, "created": time.strftime("%Y-%m-%d %H:%M"), "baseline": round(baseline, 4),
              "tests": [{"id": t["id"], "text": t["text"], "elevenlabs": f"elevenlabs-{t['id']}.wav"} for t in tests],
              "results": results}
    (run / "report.json").write_text(json.dumps(report, indent=2), "utf-8")
    print(f"\nTop 5 (listen to them in the Studio → Voice, or in {run / 'audio'}):")
    for i, r in enumerate(results[:5], 1):
        print(f"  {i}. {r['tag']:55s} score {r['score']:.3f}")
    print(f"\nApply #1:  python voicelab.py apply {run.name} 1")
    if args.apply:
        apply(run.name, 1)


def cmd_rescore(args):
    """Re-rank an earlier run from its saved audio with the current similarity metric."""
    run = TESTS / args.run
    rep = json.loads((run / "report.json").read_text("utf-8"))
    other = embed(other_sentences())
    refs = [sf.read(run / "audio" / t["elevenlabs"])[0] for t in rep["tests"]]
    baseline = float((embed(refs) @ other.T).mean())
    for r in rep["results"]:
        wavs = [sf.read(run / "audio" / f)[0] for f in r["files"]]
        r["similarity"] = round(float((embed(wavs) @ other.T).mean()), 4)
        r["score"] = round(score(r["similarity"], baseline, r["pace"], r["wer"]), 4)
    rep["results"].sort(key=lambda r: -r["score"])
    rep["baseline"] = round(baseline, 4)
    (run / "report.json").write_text(json.dumps(rep, indent=2), "utf-8")
    print(f"baseline {baseline:.3f}")
    for i, r in enumerate(rep["results"][:5], 1):
        print(f"  {i}. {r['tag']:55s} sim {r['similarity']:.3f} ({r['similarity'] / baseline:.1%})  score {r['score']:.3f}")


def apply(run_name: str, rank: int):
    rep = json.loads((TESTS / run_name / "report.json").read_text("utf-8"))
    r = rep["results"][rank - 1]
    shutil.copyfile(VOICE_DIR / r["reference"], VOICE_DIR / "reference.wav")
    f = VOICE_DIR / "voice.json"
    cfg = json.loads(f.read_text("utf-8")) if f.exists() else {}
    cfg.update({"engine": r["engine"], "reference": "reference.wav", **r["settings"],
                "_chosen_from": f"{run_name} #{rank}: {r['tag']} (sim {r['similarity']}, pace {r['pace']})"})
    f.write_text(json.dumps(cfg, indent=2) + "\n", "utf-8")
    print(f"✔ voice/voice.json ← {r['tag']}")


def cmd_say(args):
    res = server.synthesize(args.text, "say")
    import base64

    pcm = np.frombuffer(base64.b64decode(res["audio_base64"]), dtype="<i2")
    TESTS.mkdir(parents=True, exist_ok=True)
    out = Path(args.out) if args.out else TESTS / f"say-{time.strftime('%H%M%S')}.wav"
    sf.write(out, pcm, SR, subtype="PCM_16")
    # remember exactly which voice made this take, so it can be adopted later (Studio → Use this voice)
    cfg = load_config()
    keep = ["engine", "exaggeration", "cfg_weight", "temperature", "seed", "sentence_pause", "reference"]
    out.with_suffix(".json").write_text(json.dumps({
        "text": args.text, "settings": {k: cfg[k] for k in keep}, "fingerprint": server.fingerprint(cfg),
    }, indent=2), "utf-8")
    print(f"✔ {out}  ({pcm.size / SR:.1f}s, takes {res['takes']}, WER {res['wer']})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("candidates"); c.add_argument("--n", type=int, default=4)
    b = sub.add_parser("bakeoff")
    b.add_argument("--quick", action="store_true")
    b.add_argument("--apply", action="store_true")
    b.add_argument("--engines", default="chatterbox,chatterbox-turbo")
    a = sub.add_parser("apply"); a.add_argument("run"); a.add_argument("rank", type=int)
    rs = sub.add_parser("rescore"); rs.add_argument("run")
    s = sub.add_parser("say"); s.add_argument("text"); s.add_argument("--out")
    al = sub.add_parser("all"); al.add_argument("--quick", action="store_true")
    args = ap.parse_args()

    if args.cmd == "candidates":
        cmd_candidates(args)
    elif args.cmd == "bakeoff":
        cmd_bakeoff(args)
    elif args.cmd == "apply":
        apply(args.run, args.rank)
    elif args.cmd == "rescore":
        cmd_rescore(args)
    elif args.cmd == "say":
        cmd_say(args)
    elif args.cmd == "all":
        cmd_candidates(argparse.Namespace(n=4))
        cmd_bakeoff(argparse.Namespace(quick=args.quick, apply=True, engines="chatterbox,chatterbox-turbo"))
