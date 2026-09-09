/**
 * Web Audio processing utilities for client-side audio manipulations
 */

// Helper to get or create AudioContext
let sharedAudioCtx: AudioContext | null = null;
export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * Decode File to AudioBuffer
 */
export async function decodeAudioFile(file: File | Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

/**
 * Generate waveform peak data for UI canvas
 */
export function extractWaveformPeaks(buffer: AudioBuffer, samples = 200): number[] {
  const rawData = buffer.getChannelData(0);
  const blockSize = Math.floor(rawData.length / samples);
  const peaks: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j] || 0);
    }
    peaks.push(Math.min(1, (sum / blockSize) * 2.5));
  }
  return peaks;
}

/**
 * Trim AudioBuffer between startSec and endSec
 */
export function trimAudioBuffer(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const ctx = getAudioContext();
  const sampleRate = buffer.sampleRate;
  const startOffset = Math.max(0, Math.floor(startSec * sampleRate));
  const endOffset = Math.min(buffer.length, Math.floor(endSec * sampleRate));
  const frameCount = Math.max(1, endOffset - startOffset);

  const trimmed = ctx.createBuffer(buffer.numberOfChannels, frameCount, sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const channelData = buffer.getChannelData(ch);
    const trimmedData = trimmed.getChannelData(ch);
    for (let i = 0; i < frameCount; i++) {
      trimmedData[i] = channelData[startOffset + i];
    }
  }

  return trimmed;
}

/**
 * Join multiple AudioBuffers sequentially
 */
export function joinAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
  const ctx = getAudioContext();
  if (buffers.length === 0) {
    return ctx.createBuffer(2, ctx.sampleRate, ctx.sampleRate);
  }

  const sampleRate = buffers[0].sampleRate;
  const numberOfChannels = Math.max(...buffers.map(b => b.numberOfChannels));
  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);

  const combined = ctx.createBuffer(numberOfChannels, totalLength, sampleRate);

  for (let ch = 0; ch < numberOfChannels; ch++) {
    const combinedData = combined.getChannelData(ch);
    let offset = 0;
    for (const buf of buffers) {
      const sourceChannel = ch < buf.numberOfChannels ? buf.getChannelData(ch) : buf.getChannelData(0);
      combinedData.set(sourceChannel, offset);
      offset += buf.length;
    }
  }

  return combined;
}

/**
 * Reverse AudioBuffer
 */
export function reverseAudioBuffer(buffer: AudioBuffer): AudioBuffer {
  const ctx = getAudioContext();
  const reversed = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dest = reversed.getChannelData(ch);
    for (let i = 0; i < buffer.length; i++) {
      dest[i] = src[buffer.length - 1 - i];
    }
  }

  return reversed;
}

/**
 * Apply Gain (Volume Change) and optional Fade In / Fade Out
 */
export function processAudioEffects(
  buffer: AudioBuffer,
  options: {
    volume?: number; // 0.0 to 3.0
    fadeInSec?: number;
    fadeOutSec?: number;
  }
): AudioBuffer {
  const ctx = getAudioContext();
  const processed = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const { volume = 1.0, fadeInSec = 0, fadeOutSec = 0 } = options;
  const sampleRate = buffer.sampleRate;
  const fadeInFrames = Math.floor(fadeInSec * sampleRate);
  const fadeOutFrames = Math.floor(fadeOutSec * sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dest = processed.getChannelData(ch);

    for (let i = 0; i < buffer.length; i++) {
      let gain = volume;

      if (fadeInFrames > 0 && i < fadeInFrames) {
        gain *= (i / fadeInFrames);
      }
      if (fadeOutFrames > 0 && i > (buffer.length - fadeOutFrames)) {
        gain *= ((buffer.length - i) / fadeOutFrames);
      }

      dest[i] = Math.max(-1, Math.min(1, src[i] * gain));
    }
  }

  return processed;
}

/**
 * Vocal Remover (Karaoke) via Center Channel Cancellation
 * Centers in stereo are cancelled: Left' = (L - R), Right' = (R - L)
 * Mode: 'instrumental' (removes vocal) or 'vocals' (isolates mid)
 */
export function extractVocalsOrKaraoke(buffer: AudioBuffer, mode: 'instrumental' | 'vocals'): AudioBuffer {
  const ctx = getAudioContext();
  const processed = ctx.createBuffer(2, buffer.length, buffer.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0);

  const outLeft = processed.getChannelData(0);
  const outRight = processed.getChannelData(1);

  for (let i = 0; i < buffer.length; i++) {
    const l = left[i];
    const r = right[i];

    if (mode === 'instrumental') {
      // Center cancellation (Lead vocals are usually panned dead center in music mixes)
      const diff = (l - r) * 0.707;
      // Preserve bass frequencies to keep beat punchy
      outLeft[i] = diff;
      outRight[i] = -diff;
    } else {
      // Mid channel isolation
      const mid = (l + r) * 0.5;
      outLeft[i] = mid;
      outRight[i] = mid;
    }
  }

  return processed;
}

/**
 * Change Audio Speed / Tempo & Pitch using offline audio context
 */
export async function changeAudioSpeedAndPitch(
  buffer: AudioBuffer,
  speed: number, // 0.5 to 2.0
  semitones = 0 // -12 to +12
): Promise<AudioBuffer> {
  const targetDuration = buffer.duration / speed;
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.ceil(targetDuration * buffer.sampleRate),
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;

  if (semitones !== 0 && 'detune' in source) {
    source.detune.value = semitones * 100;
  }

  source.connect(offlineCtx.destination);
  source.start(0);

  return await offlineCtx.startRendering();
}

/**
 * Convert AudioBuffer to standard 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Write WAV Header
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave and write PCM samples
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channelData[ch][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer (-32768 to 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}
