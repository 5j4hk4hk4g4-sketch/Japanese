interface AudioManifestEntry {
  file: string;
  hash: string;
  voice: string;
  text: string;
}

type AudioManifest = Record<string, AudioManifestEntry>;

class AudioManager {
  private manifest: AudioManifest | null = null;
  private manifestLoading: Promise<AudioManifest | null> | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private sfxEnabled = true;

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  private getBaseUrl(): string {
    return import.meta.env.BASE_URL ?? '/';
  }

  private async loadManifest(): Promise<AudioManifest | null> {
    if (this.manifest) return this.manifest;
    if (this.manifestLoading) return this.manifestLoading;
    if (typeof fetch === 'undefined') return null;

    this.manifestLoading = fetch(`${this.getBaseUrl()}audio/manifest.json`)
      .then((res) => (res.ok ? (res.json() as Promise<AudioManifest>) : null))
      .then((data) => {
        this.manifest = data;
        return data;
      })
      .catch(() => null);

    return this.manifestLoading;
  }

  stopVoice() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  async playVoice(
    audioId: string,
    fallbackText: string,
    opts?: { rate?: 1 | 0.75 },
  ): Promise<void> {
    const rate = opts?.rate ?? 1;
    this.stopVoice();

    const manifest = await this.loadManifest();
    const entry = manifest?.[audioId];

    if (entry?.file && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(`${this.getBaseUrl()}audio/${entry.file}`);
        audio.playbackRate = rate;
        this.activeAudio = audio;
        await audio.play();
        return;
      } catch {
        // Fallback to Web Speech API
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(fallbackText);
      utter.lang = 'ja-JP';
      utter.rate = rate === 0.75 ? 0.76 : 0.96;
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ja'));
      if (jaVoice) utter.voice = jaVoice;
      window.speechSynthesis.speak(utter);
    }
  }

  private ensureAudioContext(): AudioContext | null {
    if (!this.sfxEnabled || typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!this.audioCtx) {
      this.audioCtx = new Ctx();
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType, gain = 0.08, delay = 0) {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playTap() {
    this.playTone(520, 0.06, 'triangle', 0.05);
  }

  playCorrect(combo = 1) {
    const boost = Math.min(combo - 1, 5) * 35;
    this.playTone(523.25 + boost, 0.12, 'sine', 0.07, 0);
    this.playTone(659.25 + boost, 0.16, 'sine', 0.08, 0.07);
  }

  playWrong() {
    this.playTone(230, 0.14, 'triangle', 0.06, 0);
    this.playTone(185, 0.18, 'triangle', 0.06, 0.09);
  }

  playStageClear() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'sine', 0.08, idx * 0.09);
    });
  }
}

export const audioManager = new AudioManager();
