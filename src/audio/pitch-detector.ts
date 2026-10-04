// src/audio/pitch-detector.ts
import { ArabicPitch } from '../core/pitch';
import { Maqam } from '../theory/maqam';

export interface PitchDetectionResult {
  readonly frequency: number;
  readonly clarity: number; // 0.0 to 1.0 confidence
  readonly volumeRms: number;
  readonly volumeDb: number;
  readonly quarterToneIndex: number;
  readonly closestPitch: ArabicPitch;
  readonly targetFrequency: number;
  readonly centsDeviation: number; // -25 to +25 cents relative to closest 24-EDO pitch
  readonly inTune: boolean; // within tolerance (default ±7 cents)
  readonly status: 'in-tune' | 'sharp' | 'flat' | 'too-quiet';
  readonly isMaqamNote: boolean;
  readonly maqamDegreeIndex?: number;
  readonly maqamRole?: 'Qarar' | 'Ghammaz' | 'Scale Tone' | 'Non-Maqam';
}

export interface PitchDetectorOptions {
  referenceA4?: number; // default 440.0 Hz
  clarityThreshold?: number; // default 0.65
  volumeThresholdRms?: number; // default 0.015 (-36 dB)
  inTuneCentsTolerance?: number; // default 7.0 cents
  smoothingFactor?: number; // default 0.35 for needle stability
}

/**
 * High-precision autocorrelation pitch detector with parabolic peak interpolation
 * and 24-EDO microtonal quantization for Arabic modal music and fretless violin/oud.
 */
export class MicrotonalPitchDetector {
  private readonly sampleRate: number;
  private readonly bufferSize: number;
  private readonly minPeriod: number;
  private readonly maxPeriod: number;
  private referenceA4: number;
  private clarityThreshold: number;
  private volumeThresholdRms: number;
  private inTuneCentsTolerance: number;
  private smoothedFrequency: number = 0;
  private smoothedCents: number = 0;

  constructor(
    sampleRate: number = 44100,
    bufferSize: number = 2048,
    options: PitchDetectorOptions = {}
  ) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    this.referenceA4 = options.referenceA4 ?? 440.0;
    this.clarityThreshold = options.clarityThreshold ?? 0.65;
    this.volumeThresholdRms = options.volumeThresholdRms ?? 0.015;
    this.inTuneCentsTolerance = options.inTuneCentsTolerance ?? 7.0;

    // Detect frequencies between 75 Hz (around D2) and 1400 Hz (around F6)
    this.minPeriod = Math.floor(sampleRate / 1400);
    this.maxPeriod = Math.ceil(sampleRate / 75);
  }

  public setReferenceA4(hz: number): void {
    if (hz >= 400 && hz <= 480) {
      this.referenceA4 = hz;
    }
  }

  public getReferenceA4(): number {
    return this.referenceA4;
  }

  public setVolumeThresholdRms(threshold: number): void {
    this.volumeThresholdRms = Math.max(0.001, Math.min(0.2, threshold));
  }

  /**
   * Process a time-domain audio buffer (from Web Audio AnalyserNode.getFloatTimeDomainData)
   * and detect the fundamental frequency and 24-EDO microtonal deviation.
   */
  public detectPitch(
    buffer: Float32Array,
    currentMaqam?: Maqam
  ): PitchDetectionResult | null {
    // 1. Calculate RMS Volume
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    const volumeDb = rms > 0 ? 20 * Math.log10(rms) : -100;

    if (rms < this.volumeThresholdRms) {
      this.smoothedFrequency = 0;
      this.smoothedCents = 0;
      return null;
    }

    // 2. Normalized Square Difference Function (NSDF / YIN-style autocorrelation)
    const nsdf = new Float32Array(this.maxPeriod);
    for (let tau = 0; tau < this.maxPeriod; tau++) {
      let acf = 0;
      let divisor = 0;
      for (let i = 0; i < this.bufferSize - tau; i++) {
        acf += buffer[i] * buffer[i + tau];
        divisor += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
      }
      nsdf[tau] = divisor > 0 ? (2 * acf) / divisor : 0;
    }

    // 3. Peak Picking with Parabolic Interpolation (MPM Algorithm)
    const peaks: { tau: number; val: number }[] = [];
    let globalMax = 0;
    let passedZeroCross = false;

    for (let tau = this.minPeriod; tau < this.maxPeriod - 1; tau++) {
      if (!passedZeroCross) {
        if (nsdf[tau] < 0) {
          passedZeroCross = true;
        }
        continue;
      }

      if (nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1] && nsdf[tau] > 0) {
        peaks.push({ tau, val: nsdf[tau] });
        if (nsdf[tau] > globalMax) {
          globalMax = nsdf[tau];
        }
      }
    }

    if (peaks.length === 0 || globalMax < this.clarityThreshold) {
      return null;
    }

    // Select the first peak that achieves at least 80% of globalMax (prevents octave errors)
    const thresholdCutoff = Math.max(this.clarityThreshold, globalMax * 0.8);
    const chosenPeak = peaks.find((p) => p.val >= thresholdCutoff) ?? peaks[0];
    const bestPeriod = chosenPeak.tau;
    const maxCorrelation = chosenPeak.val;

    // Refine period using parabolic interpolation around the peak
    const y1 = nsdf[bestPeriod - 1];
    const y2 = nsdf[bestPeriod];
    const y3 = nsdf[bestPeriod + 1];
    const denominator = 2 * (y1 - 2 * y2 + y3);
    const delta = denominator !== 0 ? (y1 - y3) / denominator : 0;
    const refinedPeriod = bestPeriod + delta;
    const rawFrequency = this.sampleRate / refinedPeriod;

    // Discard out-of-range frequencies
    if (rawFrequency < 70 || rawFrequency > 1450) {
      return null;
    }

    // Temporal smoothing
    if (this.smoothedFrequency === 0) {
      this.smoothedFrequency = rawFrequency;
    } else {
      const smoothing = Math.abs(rawFrequency - this.smoothedFrequency) < 20 ? 0.35 : 0.7;
      this.smoothedFrequency = this.smoothedFrequency + smoothing * (rawFrequency - this.smoothedFrequency);
    }

    const frequency = this.smoothedFrequency;

    // 4. Microtonal 24-EDO Quantization & Cents Error
    // In 24-EDO: Quarter-tone index where A4 = index 114
    const exactQuarterToneIndex = 24 * Math.log2(frequency / this.referenceA4) + 114;
    const nearestQuarterToneInt = Math.round(exactQuarterToneIndex);

    // Closest pitch representation
    const closestPitch = ArabicPitch.fromQuarterToneIndex(nearestQuarterToneInt);
    const targetFrequency = closestPitch.toFrequency(this.referenceA4);

    // Exact cents deviation in the range [-25 cents, +25 cents]
    const rawCents = 1200 * Math.log2(frequency / targetFrequency);
    if (this.smoothedCents === 0) {
      this.smoothedCents = rawCents;
    } else {
      this.smoothedCents = this.smoothedCents + 0.4 * (rawCents - this.smoothedCents);
    }
    const centsDeviation = Math.round(this.smoothedCents * 10) / 10;

    const inTune = Math.abs(centsDeviation) <= this.inTuneCentsTolerance;
    let status: 'in-tune' | 'sharp' | 'flat' | 'too-quiet';
    if (inTune) {
      status = 'in-tune';
    } else if (centsDeviation > 0) {
      status = 'sharp';
    } else {
      status = 'flat';
    }

    // 5. Active Maqam Scale Matching
    let isMaqamNote = false;
    let maqamDegreeIndex: number | undefined;
    let maqamRole: 'Qarar' | 'Ghammaz' | 'Scale Tone' | 'Non-Maqam' = 'Non-Maqam';

    if (currentMaqam) {
      const scale = currentMaqam.getScale();
      const degIdx = scale.findIndex((p) => p.equals(closestPitch));
      if (degIdx !== -1) {
        isMaqamNote = true;
        maqamDegreeIndex = degIdx;
        if (degIdx === 0) {
          maqamRole = 'Qarar';
        } else if (closestPitch.equals(currentMaqam.getGhammaz())) {
          maqamRole = 'Ghammaz';
        } else {
          maqamRole = 'Scale Tone';
        }
      }
    }

    return {
      frequency: Math.round(frequency * 10) / 10,
      clarity: Math.round(maxCorrelation * 100) / 100,
      volumeRms: Math.round(rms * 1000) / 1000,
      volumeDb: Math.round(volumeDb),
      quarterToneIndex: nearestQuarterToneInt,
      closestPitch,
      targetFrequency: Math.round(targetFrequency * 10) / 10,
      centsDeviation,
      inTune,
      status,
      isMaqamNote,
      maqamDegreeIndex,
      maqamRole,
    };
  }

  public reset(): void {
    this.smoothedFrequency = 0;
    this.smoothedCents = 0;
  }
}
