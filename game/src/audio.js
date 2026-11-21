// audio.js — every sound is synthesized with WebAudio, no files.
// One job: footsteps, alert stings, pickups and jingles, plus mute.
// The context is created on the first user gesture, so it never
// autoplays and never needs a network request.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // A short filtered noise burst: a footstep. `loud` 0..1 scales it.
  footstep(loud) {
    if (!this.ctx || this.muted || loud <= 0.02) return;
    const t = this.ctx.currentTime;
    const dur = 0.07;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22 * loud, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
  }

  // A sine blip at `freq` Hz for `dur` seconds.
  tone(freq, dur, type, vol, when = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  pickup() {
    this.tone(740, 0.12, 'sine', 0.25);
    this.tone(1108, 0.18, 'sine', 0.22, 0.07);
  }

  suspicious() {
    this.tone(392, 0.14, 'triangle', 0.22);
    this.tone(330, 0.16, 'triangle', 0.2, 0.1);
  }

  alerted() {
    this.tone(220, 0.16, 'sawtooth', 0.2);
    this.tone(311, 0.2, 'sawtooth', 0.22, 0.12);
    this.tone(440, 0.26, 'sawtooth', 0.2, 0.24);
  }

  caught() {
    this.tone(160, 0.5, 'sawtooth', 0.28);
    this.tone(110, 0.6, 'sawtooth', 0.24, 0.15);
  }

  levelClear() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'sine', 0.24, i * 0.1));
  }

  victory() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.24, i * 0.12));
  }

  click() {
    this.tone(660, 0.05, 'square', 0.12);
  }
}
