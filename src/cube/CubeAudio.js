// CubeAudio.js - Low-latency synthetic mechanical turning sound effects via Web Audio API

class CubeAudio {
  constructor() {
    this.ctx = null;
    this.isEnabled = true;
    // Restore preference from localStorage
    try {
      const stored = localStorage.getItem('rubiks_sound_enabled');
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    } catch (_) {}
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  toggleSound() {
    this.isEnabled = !this.isEnabled;
    try {
      localStorage.setItem('rubiks_sound_enabled', String(this.isEnabled));
    } catch (_) {}
    return this.isEnabled;
  }

  setSound(enabled) {
    this.isEnabled = Boolean(enabled);
    try {
      localStorage.setItem('rubiks_sound_enabled', String(this.isEnabled));
    } catch (_) {}
  }

  // Play crisp tactile snap when a layer twist completes
  playTurnSound(intensity = 1.0) {
    if (!this.isEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // 1. High-frequency click burst (plastic sticker/edge snap)
      const bufferSize = this.ctx.sampleRate * 0.025; // 25ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600 + Math.random() * 400, now);
      filter.Q.setValueAtTime(3.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35 * intensity, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.025);

      // 2. Low-frequency core mechanical body thump
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.035);

      oscGain.gain.setValueAtTime(0.25 * intensity, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (_) {
      // Audio playback might be blocked before first user interaction
    }
  }

  // Play subtle beep for timer alerts (e.g. 8s, 12s inspection or timer start)
  playBeep(freq = 880, duration = 0.08) {
    if (!this.isEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }
}

export const cubeAudio = new CubeAudio();
