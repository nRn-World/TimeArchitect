// Original audio, synthesized at runtime with WebAudio. No recordings.
export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.ambientNodes = [];
    this.volumes = { music: 0.55, sfx: 0.7 };
    this.ambientOn = false;
    this.muted = false;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      return null;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.volumes.music * 0.22;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.volumes.sfx * 0.5;
    this.sfxGain.connect(this.master);
    return this.ctx;
  }

  setVolumes({ music, sfx }) {
    this.volumes = { music, sfx };
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setTargetAtTime(music * 0.22, now, 0.1);
    this.sfxGain.gain.cancelScheduledValues(now);
    this.sfxGain.gain.setTargetAtTime(sfx * 0.5, now, 0.1);
  }

  startAmbient() {
    const ctx = this.unlock();
    if (!ctx || this.ambientOn) return;
    this.ambientOn = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.6;
    filter.connect(this.musicGain);

    const drone = (frequency, type, gainValue, detune) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      this.ambientNodes.push(osc, gain);
      return osc;
    };

    drone(55, 'sine', 0.18, 0);
    drone(82.5, 'sine', 0.1, 4);
    drone(110, 'triangle', 0.05, -6);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.ambientNodes.push(lfo, lfoGain, filter);
  }

  stopAmbient() {
    for (const node of this.ambientNodes) {
      try {
        if (typeof node.stop === 'function') node.stop();
        node.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.ambientNodes = [];
    this.ambientOn = false;
  }

  tone({ freq = 440, to = null, type = 'sine', dur = 0.2, gain = 0.2, delay = 0 }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + dur);
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  noise({ dur = 0.12, gain = 0.12, delay = 0, cutoff = 1200 }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const env = ctx.createGain();
    env.gain.value = gain;
    source.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    source.start(start);
  }

  play(name) {
    const ctx = this.unlock();
    if (!ctx) return;
    switch (name) {
      case 'step':
        this.tone({ freq: 210, to: 150, type: 'triangle', dur: 0.08, gain: 0.1 });
        this.noise({ dur: 0.05, gain: 0.05, cutoff: 900 });
        break;
      case 'bump':
        this.tone({ freq: 88, to: 62, type: 'sine', dur: 0.14, gain: 0.16 });
        break;
      case 'select':
        this.tone({ freq: 620, type: 'sine', dur: 0.09, gain: 0.1 });
        break;
      case 'rewind':
        this.tone({ freq: 520, to: 170, type: 'sawtooth', dur: 0.32, gain: 0.08 });
        break;
      case 'pause':
        this.tone({ freq: 190, to: 120, type: 'square', dur: 0.18, gain: 0.08 });
        this.noise({ dur: 0.08, gain: 0.06, cutoff: 600 });
        break;
      case 'play':
        this.tone({ freq: 300, to: 520, type: 'sine', dur: 0.16, gain: 0.1 });
        break;
      case 'fast':
        this.tone({ freq: 700, type: 'sine', dur: 0.06, gain: 0.08 });
        this.tone({ freq: 980, type: 'sine', dur: 0.06, gain: 0.07, delay: 0.06 });
        break;
      case 'collect':
        this.tone({ freq: 660, type: 'sine', dur: 0.5, gain: 0.14 });
        this.tone({ freq: 990, type: 'sine', dur: 0.55, gain: 0.1, delay: 0.04 });
        this.tone({ freq: 1320, type: 'sine', dur: 0.6, gain: 0.06, delay: 0.09 });
        break;
      case 'fail':
        this.tone({ freq: 240, to: 60, type: 'sawtooth', dur: 0.6, gain: 0.13 });
        this.noise({ dur: 0.4, gain: 0.1, cutoff: 500 });
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((freq, index) => {
          this.tone({ freq, type: 'sine', dur: 0.55, gain: 0.11, delay: index * 0.1 });
        });
        break;
      case 'enter':
        this.tone({ freq: 300, to: 460, type: 'sine', dur: 0.3, gain: 0.09 });
        break;
      case 'ui':
      default:
        this.tone({ freq: 820, type: 'sine', dur: 0.05, gain: 0.05 });
        break;
    }
  }
}
