"""
Composes the channel's intro cues and outro bed from code, so the music is
original and 100% owned by the channel (no licences, no Content ID claims).

    tts/.venv/Scripts/python tools/music/compose.py          (or: npm run music)

Mood: a tense D-minor "something is hidden" build that resolves to D major
(with an added 9th) at the reveal. Every hit lands on a beat time from
shared/brand/brand.json, the same file the intro animations read, so music and
picture can't drift apart.

Writes shared/brand/music/<name>.wav       48 kHz stereo (previews, archive)
       shared/brand/music/<name>-24k.wav   24 kHz mono (mixed into voiceover.wav)
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = Path(__file__).resolve().parents[2]
BRAND = json.loads((ROOT / "shared/brand/brand.json").read_text("utf-8"))
OUT = ROOT / "shared/brand/music"
SR = 48000
RNG = np.random.default_rng(7)


def hz(note: str) -> float:
    """'D4' → 293.66 Hz (sharps as '#')."""
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    name, octave = note[:-1], int(note[-1])
    return 440.0 * 2 ** ((names[name] + 12 * (octave + 1) - 69) / 12)


class Track:
    """A stereo buffer you place sounds into at absolute times."""

    def __init__(self, dur: float):
        self.n = int(round(dur * SR))
        self.buf = np.zeros((2, self.n))

    def add(self, t: float, x: np.ndarray, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i >= self.n:
            return
        x = x[: self.n - i]
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.buf[0, i:i + x.size] += x * gain * l * 1.414
        self.buf[1, i:i + x.size] += x * gain * r * 1.414


def t_(dur):
    return np.arange(int(round(dur * SR))) / SR


def env(dur, a=0.01, d=0.1, s=0.7, r=0.2):
    n = int(round(dur * SR))
    e = np.full(n, float(s))
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na, endpoint=False) if na else e[:na]
    nd = min(nd, n - na)
    e[na:na + nd] = np.linspace(1, s, nd, endpoint=False)
    nr = min(nr, n)
    e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, fc, order=2):
    b, a = signal.butter(order, min(fc / (SR / 2), 0.99), "low")
    return signal.lfilter(b, a, x)


def highpass(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def bandpass(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi / (SR / 2), 0.99)], "band")
    return signal.lfilter(b, a, x)


def saw(f, dur, harmonics=24):
    t = t_(dur)
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        if f * k > SR / 2.2:
            break
        out += ((-1) ** (k + 1)) * np.sin(2 * np.pi * f * k * t) / k
    return out * 0.6


# ── instruments ──────────────────────────────────────────────────────────────
def drone(dur, root="D2", fade_in=1.5, fade_out=0.8):
    t = t_(dur)
    f = hz(root)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.23 * t)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t + 0.3)
         + 0.25 * np.sin(2 * np.pi * 1.5 * f * t) + 0.12 * saw(f * 2.002, dur, 8))
    x = lowpass(x * lfo, 700)
    e = np.ones_like(t)
    e[: int(fade_in * SR)] = np.linspace(0, 1, int(fade_in * SR)) ** 2
    e[-int(fade_out * SR):] *= np.linspace(1, 0, int(fade_out * SR))
    return x * e


def boom(dur=1.8):
    t = t_(dur)
    f = 38 + 70 * np.exp(-t * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 2.6)
    click = bandpass(RNG.standard_normal(t.size), 60, 900) * np.exp(-t * 40) * 0.5
    return np.tanh((x + click) * 1.6)


def thud():
    t = t_(0.5)
    f = 55 + 40 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12) + \
        lowpass(RNG.standard_normal(t.size), 400) * np.exp(-t * 30) * 0.4


def tick(bright=1.0):
    t = t_(0.06)
    n = bandpass(RNG.standard_normal(t.size), 2500, 7000) * np.exp(-t * 120)
    s = np.sin(2 * np.pi * (1600 + 600 * bright) * t) * np.exp(-t * 90) * 0.5
    return (n + s) * 0.5


def pluck(note, dur=1.2, bright=3000):
    t = t_(dur)
    f = hz(note)
    x = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)
         + 0.25 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 10))
    return lowpass(x, bright) * np.exp(-t * 4.5) * env(dur, a=0.003, d=0.05, s=1, r=0.05)


def echo(x, delay=0.375, fb=0.38, n=4):
    out = np.copy(x)
    d = int(delay * SR)
    pad = np.zeros(x.size + d * n)
    pad[: x.size] = x
    for k in range(1, n + 1):
        pad[k * d:k * d + x.size] += x * fb ** k
    return lowpass(pad, 3200)


def pad(notes, dur, attack=0.9, release=1.2, cutoff=1800):
    x = np.zeros(int(round(dur * SR)))
    for nt in notes:
        f = hz(nt)
        for det in (-0.12, 0.0, 0.11):  # detuned unison, in semitones
            x += saw(f * 2 ** (det / 12), dur, 16)
    x = lowpass(x / (3 * len(notes)), cutoff)
    return x * env(dur, a=attack, d=0.2, s=1.0, r=release)


def shimmer(notes, dur):
    t = t_(dur)
    x = np.zeros_like(t)
    for i, nt in enumerate(notes):
        f = hz(nt)
        x += np.sin(2 * np.pi * f * t) * (0.6 + 0.4 * np.sin(2 * np.pi * (3.1 + i * 0.7) * t + i))
    return x / len(notes) * env(dur, a=0.6, d=0.1, s=1.0, r=min(1.5, dur / 2))


def riser(dur):
    t = t_(dur)
    p = (t / dur) ** 2.2
    noise = RNG.standard_normal(t.size)
    lo = bandpass(noise, 300, 2000) * (1 - p)
    hi = bandpass(noise, 2000, 9000) * p
    sweep = np.sin(2 * np.pi * np.cumsum(180 + 900 * p) / SR) * 0.15
    return (lo * 0.5 + hi + sweep) * p * 0.6


def whoosh(dur=0.45):
    t = t_(dur)
    e = np.sin(np.pi * t / dur) ** 2
    return bandpass(RNG.standard_normal(t.size), 400, 4000) * e * 0.5


def reverb(st: np.ndarray, decay=2.4, mix=0.28):
    n = int(decay * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, st.shape[1] + n))
    for ch in range(2):
        ir = RNG.standard_normal(n) * np.exp(-t * 6.9 / decay)
        ir = lowpass(ir, 5000)
        ir /= np.sqrt(np.sum(ir ** 2))
        wet = signal.fftconvolve(st[ch], ir)  # len = signal + ir - 1
        out[ch, : wet.size] = wet[: out.shape[1]]
    dry = np.zeros_like(out)
    dry[:, : st.shape[1]] = st
    return dry * (1 - mix) + out * mix


# ── mastering ────────────────────────────────────────────────────────────────
def master(tr: Track, dur: float, rev=0.28, tail_fade=0.35):
    x = reverb(tr.buf, mix=rev)[:, : tr.n]
    x[:, -int(tail_fade * SR):] *= np.linspace(1, 0, int(tail_fade * SR))
    x = np.tanh(x / max(1e-9, np.max(np.abs(x))) * 1.15) / np.tanh(1.15)
    # loudness ≈ voice (-18 LUFS); peak under -1 dBFS
    try:
        import pyloudnorm as pyln
        lufs = pyln.Meter(SR).integrated_loudness(x.T)
        x *= 10 ** ((-18.0 - lufs) / 20)
    except Exception:
        x *= 0.5
    x *= min(1.0, 0.89 / np.max(np.abs(x)))
    return x


def save(name, x):
    OUT.mkdir(parents=True, exist_ok=True)
    sf.write(OUT / f"{name}.wav", x.T, SR, subtype="PCM_16")
    mono = signal.resample_poly(x.mean(axis=0), 1, 2)  # 48k → 24k
    try:  # folding stereo to mono partly cancels the reverb: re-level to match the voice
        import pyloudnorm as pyln
        mono *= 10 ** ((-18.0 - pyln.Meter(24000).integrated_loudness(mono)) / 20)
    except Exception:
        pass
    mono *= min(1.0, 0.89 / np.max(np.abs(mono)))
    sf.write(OUT / f"{name}-24k.wav", mono, 24000, subtype="PCM_16")
    print(f"✔ {name}: {x.shape[1] / SR:.3f}s")


MINOR9 = ["D4", "F4", "A4", "C5", "E5"]
RESOLVE = ["D3", "A3", "D4", "F#4", "E5"]           # D major add9: the "discovery" chord
SPARKLE = ["F#5", "A5", "E6", "D6"]


def intro_a():
    c = BRAND["intros"]["A"]
    b, dur = c["beats"], c["duration"]
    tr = Track(dur)
    tr.add(0, drone(dur, fade_in=1.8, fade_out=0.6), 0.55)
    for i, t in enumerate(np.arange(0.5, b["lidLand"], 0.45)):   # slow heartbeat ticks
        tr.add(t, tick(0.3), 0.35, pan=-0.2 if i % 2 else 0.2)
    tr.add(b["core"], echo(pluck("D4", 1.4, 1800)), 0.5)
    tr.add(b["lidLand"], thud(), 0.9)
    for i, t in enumerate(b["rattle"]):                           # lid rattles: rising ticks
        tr.add(t, tick(0.5 + i * 0.3), 0.55)
        tr.add(t, pluck(MINOR9[min(i + 1, 4)], 0.6, 2400), 0.3)
    tr.add(b["lidLand"] - 0.1, riser(b["lift"] - b["lidLand"] + 0.1), 0.9)
    tr.add(b["lift"], boom(), 1.0)
    tr.add(b["lift"], pad(RESOLVE, dur - b["lift"], attack=0.25, release=1.0), 0.8)
    tr.add(b["lift"], whoosh(0.4), 0.5)
    n = 6
    for i in range(n):                                            # typing arpeggio
        t = b["type"] + i * (b["typeEnd"] - b["type"]) / n
        tr.add(t, pluck(SPARKLE[i % 4], 0.9, 5000), 0.22, pan=(i % 3 - 1) * 0.4)
    tr.add(b["type"], shimmer(SPARKLE, dur - b["type"]), 0.18)
    return master(tr, dur)


def intro_b():
    c = BRAND["intros"]["B"]
    b, dur = c["beats"], c["duration"]
    tr = Track(dur)
    tr.add(0, drone(dur, fade_in=1.0, fade_out=0.6), 0.5)
    for t in np.arange(0.4, b["core"], 0.375):                    # steady pulse while descending
        tr.add(t, tick(0.2), 0.28)
    for i, t in enumerate(b["layers"]):                           # one note per layer passed
        tr.add(t, echo(pluck(MINOR9[i], 1.3, 2200 + i * 500)), 0.55, pan=(-1) ** i * 0.3)
        tr.add(t, whoosh(0.35), 0.25)
    tr.add(b["layers"][2], riser(b["core"] - b["layers"][2]), 0.85)
    tr.add(b["core"], boom(), 1.0)
    tr.add(b["core"], pad(RESOLVE, dur - b["core"], attack=0.2, release=1.0), 0.85)
    tr.add(b["lid"], thud(), 0.45)
    tr.add(b["lid"], tick(1.0), 0.4)
    tr.add(b["wordmark"], shimmer(SPARKLE, dur - b["wordmark"]), 0.2)
    for i, nt in enumerate(["A5", "D6", "E6"]):
        tr.add(b["wordmark"] + i * 0.18, pluck(nt, 0.9, 6000), 0.2)
    return master(tr, dur)


def intro_c():
    c = BRAND["intros"]["C"]
    b, dur = c["beats"], c["duration"]
    tr = Track(dur)
    tr.add(0, drone(dur, root="D2", fade_in=0.8, fade_out=0.6), 0.45)
    for _ in range(40):                                           # glitchy scramble ticks
        t = RNG.uniform(b["scramble"], b["lockEnd"])
        tr.add(t, tick(RNG.uniform(0, 1.5)), RNG.uniform(0.08, 0.2), pan=RNG.uniform(-0.8, 0.8))
    letters = len(BRAND["name"].replace(" ", ""))
    scale = ["D5", "E5", "F5", "A5", "C6", "D6", "E6", "F6", "A6"]
    for i in range(letters):                                      # each locked letter: a rising note
        t = b["lockStart"] + i * (b["lockEnd"] - b["lockStart"]) / letters
        tr.add(t, pluck(scale[min(i * len(scale) // letters, len(scale) - 1)], 0.35, 6000), 0.16,
               pan=(i / letters - 0.5))
    tr.add(b["assemble"], riser(b["core"] - b["assemble"]), 0.85)
    tr.add(b["core"], boom(), 1.0)
    tr.add(b["core"], pad(RESOLVE, dur - b["core"], attack=0.2, release=1.0), 0.85)
    tr.add(b["lidOpen"], whoosh(0.4), 0.55)
    tr.add(b["tagline"], shimmer(SPARKLE, dur - b["tagline"]), 0.2)
    return master(tr, dur)


def outro_bed(dur=30.0):
    """Calm, warm loop for the summary + end card: the intro's resolve, unhurried."""
    tr = Track(dur)
    tr.add(0, drone(dur, fade_in=2.0, fade_out=2.5), 0.4)
    chords = [RESOLVE, ["B2", "F#3", "B3", "D4", "C#5"], ["G2", "D3", "G3", "B3", "A4"], ["A2", "E3", "A3", "C#4", "E5"]]
    for i, t in enumerate(np.arange(0, dur, 4.0)):
        tr.add(t, pad(chords[i % 4], 4.6, attack=1.2, release=1.4, cutoff=1400), 0.5)
    arp = ["D5", "A4", "F#5", "E5", "B4", "F#5", "D5", "G4", "B4", "E5", "A4", "C#5"]
    for i, t in enumerate(np.arange(1.0, dur - 2, 1.0)):
        tr.add(t, pluck(arp[i % len(arp)], 1.0, 2500), 0.18, pan=(-1) ** i * 0.35)
    x = master(tr, dur, rev=0.35, tail_fade=2.0)
    return x


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    save(BRAND["intros"]["A"]["music"], intro_a())
    save(BRAND["intros"]["B"]["music"], intro_b())
    save(BRAND["intros"]["C"]["music"], intro_c())
    save(BRAND["outro"]["bed"], outro_bed())
