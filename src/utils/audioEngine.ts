import type { AmbientNoiseMode } from '../types';

let sharedAudioCtx: AudioContext | null = null;
let activeNoiseSource: AudioBufferSourceNode | null = null;
let activeNoiseGain: GainNode | null = null;
let activeNoiseMode: AmbientNoiseMode = 'off';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Pure Web Audio harmonic chime (C5 -> E5 -> G5 soft bell) with zero external audio dependencies.
 */
export function playCompletionChime(volume: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const safeVol = Math.min(1, Math.max(0.05, volume));
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.16);

    const startAt = now + idx * 0.16;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(safeVol * 0.28, startAt + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.9);
  });
}

function createNoiseBuffer(ctx: AudioContext, mode: Exclude<AmbientNoiseMode, 'off'>): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 4; // 4-second seamless loop
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  if (mode === 'pink') {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }
  } else if (mode === 'brown') {
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 1.8;
    }
  } else {
    // Gentle rain: soft white noise with gentle amplitude modulation
    for (let i = 0; i < length; i++) {
      const env = 0.85 + 0.15 * Math.sin((i / sampleRate) * 0.9);
      data[i] = (Math.random() * 2 - 1) * 0.25 * env;
    }
  }

  // Crossfade last 2048 samples with start for click-free looping
  const fadeSamples = Math.min(2048, Math.floor(length / 8));
  for (let i = 0; i < fadeSamples; i++) {
    const t = i / fadeSamples;
    data[length - fadeSamples + i] =
      data[length - fadeSamples + i] * (1 - t) + data[i] * t;
  }

  return buffer;
}

export function stopAmbientNoise(): void {
  if (activeNoiseSource) {
    try {
      activeNoiseSource.stop();
      activeNoiseSource.disconnect();
    } catch {
      // already stopped
    }
    activeNoiseSource = null;
  }
  if (activeNoiseGain) {
    try {
      activeNoiseGain.disconnect();
    } catch {
      // ignore
    }
    activeNoiseGain = null;
  }
  activeNoiseMode = 'off';
}

export function setAmbientNoise(mode: AmbientNoiseMode, volume: number): void {
  if (mode === 'off') {
    stopAmbientNoise();
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) return;

  const targetGain = Math.min(0.45, Math.max(0.01, volume * 0.42));

  if (activeNoiseMode === mode && activeNoiseGain && activeNoiseSource) {
    activeNoiseGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.08);
    return;
  }

  stopAmbientNoise();

  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, mode);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  if (mode === 'rain') {
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    filter.Q.value = 0.65;
  } else if (mode === 'brown') {
    filter.type = 'lowpass';
    filter.frequency.value = 420;
  } else {
    filter.type = 'lowpass';
    filter.frequency.value = 1600;
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.15);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  activeNoiseSource = source;
  activeNoiseGain = gain;
  activeNoiseMode = mode;
}
