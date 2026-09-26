// src/audio/microtonal-audio.ts
import * as Tone from 'tone';
import { ArabicPitch } from '../core/pitch';

export type TimbreType = 'violin' | 'oud' | 'kanun';

export class MicrotonalAudioEngine {
  private static isInitialized = false;
  private static referenceA4 = 440.0;

  // Master Nodes
  private static masterGain: Tone.Gain | null = null;
  private static masterLimiter: Tone.Limiter | null = null;
  private static masterReverb: Tone.Freeverb | null = null;

  // Synths & FX
  private static violinSynth: Tone.PolySynth | null = null;
  private static violinFilter: Tone.Filter | null = null;
  private static violinVibrato: Tone.Vibrato | null = null;

  private static oudSynth: Tone.PolySynth | null = null;
  private static oudFilter: Tone.Filter | null = null;

  private static kanunSynth: Tone.PolySynth | null = null;
  private static kanunFilter: Tone.Filter | null = null;

  // Drone Nodes
  private static droneOsc1: Tone.Oscillator | null = null;
  private static droneOsc2: Tone.Oscillator | null = null;
  private static droneSubOsc: Tone.Oscillator | null = null;
  private static droneFifthOsc: Tone.Oscillator | null = null;
  private static droneGain: Tone.Gain | null = null;
  private static droneFilter: Tone.Filter | null = null;
  private static droneChorus: Tone.Chorus | null = null;
  private static isDroneRunning = false;

  // Sequencer state
  private static activePitchCancelToken = 0;

  /**
   * Initializes Tone.js audio graph with professional Arabic acoustic modeling.
   */
  private static initAudio(): void {
    if (this.isInitialized) return;

    // 1. Master Output Chain with Brickwall Limiter to avoid clipping
    this.masterLimiter = new Tone.Limiter(-0.5).toDestination();
    this.masterGain = new Tone.Gain(0.85).connect(this.masterLimiter);

    // 2. Master Acoustic Reverb (simulates historic Ottoman / Andalusian stone courtyard or concert hall)
    this.masterReverb = new Tone.Freeverb({
      roomSize: 0.65,
      dampening: 2600,
      wet: 0.20
    }).connect(this.masterGain);

    // 3. Acoustic Arabic Violin Model:
    // Bowed strings have rich harmonics (sawtooth base with dual mode spread),
    // vocal formant filtering, subtle left-hand vibrato (5.2Hz), and smooth bowing envelope.
    this.violinVibrato = new Tone.Vibrato({
      frequency: 5.2,
      depth: 0.16,
      type: 'sine'
    }).connect(this.masterReverb);

    this.violinFilter = new Tone.Filter({
      frequency: 3400,
      type: 'lowpass',
      rolloff: -24,
      Q: 1.8
    }).connect(this.violinVibrato);

    this.violinSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        count: 2,
        spread: 12
      },
      envelope: {
        attack: 0.06,  // gentle bow grip
        decay: 0.22,
        sustain: 0.85, // singing bowed sustain
        release: 0.22  // natural string body ring down
      }
    }).connect(this.violinFilter);
    this.violinSynth.volume.value = -2;

    // 4. Acoustic Oud Model:
    // Plucked pear-shaped lute with wooden body resonance, fast percussive transient,
    // and rapid filter decay.
    this.oudFilter = new Tone.Filter({
      frequency: 2900,
      type: 'lowpass',
      rolloff: -12,
      Q: 1.2
    }).connect(this.masterReverb);

    this.oudSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle8' // rich warm acoustic harmonics
      },
      envelope: {
        attack: 0.004, // snappy risha / plectrum pluck
        decay: 0.85,   // wooden bowl resonance
        sustain: 0.02,
        release: 0.35
      }
    }).connect(this.oudFilter);
    this.oudSynth.volume.value = 0;

    // 5. Kanun (Arabian 78-string Zither) Model:
    // Crisp nylon/gut pluck with bright singing metallic/nylon overtone and longer sustain.
    this.kanunFilter = new Tone.Filter({
      frequency: 4400,
      type: 'lowpass',
      rolloff: -12,
      Q: 1.4
    }).connect(this.masterReverb);

    this.kanunSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'pulse',
        width: 0.28
      },
      envelope: {
        attack: 0.002,
        decay: 1.4,
        sustain: 0.06,
        release: 0.45
      }
    }).connect(this.kanunFilter);
    this.kanunSynth.volume.value = -3;

    // 6. Qarar Drone Subsystem (Root drone for Taqsim & Wasla)
    this.droneGain = new Tone.Gain(0).connect(this.masterReverb);
    this.droneChorus = new Tone.Chorus({
      frequency: 0.4,
      delayTime: 3.5,
      depth: 0.6,
      wet: 0.4
    }).start();

    this.droneFilter = new Tone.Filter({
      frequency: 620,
      type: 'lowpass',
      rolloff: -24
    }).connect(this.droneChorus);
    this.droneChorus.connect(this.droneGain);

    this.isInitialized = true;
  }

  /**
   * Unlocks Tone.js Web Audio context on user gesture.
   */
  public static async startAudioContext(): Promise<void> {
    if (!this.isInitialized) {
      this.initAudio();
    }
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
  }

  /**
   * Compatibility accessor returning the raw AudioContext.
   */
  public static getAudioContext(): AudioContext {
    this.startAudioContext();
    return Tone.getContext().rawContext as AudioContext;
  }

  /**
   * Sets the reference concert pitch for A4 (default: 440.0 Hz).
   */
  public static setReferenceA4(freq: number): void {
    if (freq > 400 && freq < 470) {
      this.referenceA4 = freq;
    }
  }

  public static getReferenceA4(): number {
    return this.referenceA4;
  }

  /**
   * Controls master volume (0.0 to 1.0).
   */
  public static setMasterVolume(vol: number): void {
    this.startAudioContext();
    if (this.masterGain) {
      const clamped = Math.max(0, Math.min(1, vol));
      this.masterGain.gain.rampTo(clamped, 0.05);
    }
  }

  /**
   * Controls master reverb wetness (0.0 to 1.0).
   */
  public static setReverbWet(wet: number): void {
    this.startAudioContext();
    if (this.masterReverb) {
      this.masterReverb.wet.value = Math.max(0, Math.min(1, wet));
    }
  }

  /**
   * Play an Arabic pitch with exact 24-EDO frequency using Tone.js modeled timbres.
   */
  public static playPitch(
    pitch: ArabicPitch,
    durationSeconds: number = 0.8,
    timbre: TimbreType = 'violin',
    velocity: number = 0.7
  ): void {
    this.startAudioContext();
    const freq = pitch.toFrequency(this.referenceA4);
    const now = Tone.now();

    try {
      if (timbre === 'violin' && this.violinSynth) {
        this.violinSynth.triggerAttackRelease(freq, durationSeconds, now, Math.min(1, velocity * 0.9));
      } else if (timbre === 'oud' && this.oudSynth) {
        this.oudSynth.triggerAttackRelease(freq, durationSeconds, now, Math.min(1, velocity * 1.1));
      } else if (timbre === 'kanun' && this.kanunSynth) {
        this.kanunSynth.triggerAttackRelease(freq, durationSeconds, now, Math.min(1, velocity * 1.0));
      } else if (this.violinSynth) {
        this.violinSynth.triggerAttackRelease(freq, durationSeconds, now, velocity);
      }
    } catch {
      // In case Tone context was interrupted
    }
  }

  /**
   * Play an arbitrary exact frequency in Hz (useful for 24-EDO cents demonstrations).
   */
  public static playFrequency(
    freq: number,
    durationSeconds: number = 0.8,
    timbre: TimbreType = 'violin',
    velocity: number = 0.7
  ): void {
    this.startAudioContext();
    const now = Tone.now();

    try {
      if (timbre === 'violin' && this.violinSynth) {
        this.violinSynth.triggerAttackRelease(freq, durationSeconds, now, velocity);
      } else if (timbre === 'oud' && this.oudSynth) {
        this.oudSynth.triggerAttackRelease(freq, durationSeconds, now, velocity);
      } else if (this.kanunSynth) {
        this.kanunSynth.triggerAttackRelease(freq, durationSeconds, now, velocity);
      }
    } catch {
      // Fallback safe
    }
  }

  /**
   * Plays a sequence of pitches with precise interval timing and UI callbacks.
   */
  public static playSequence(
    pitches: ArabicPitch[],
    intervalMs: number = 550,
    timbre: TimbreType = 'violin',
    onStepChange?: (index: number) => void,
    onComplete?: () => void,
    audioTime?: number
  ): void {
    this.stopSequence();
    this.startAudioContext();

    if (pitches.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    const currentToken = ++this.activePitchCancelToken;
    const startTime = audioTime ?? Tone.now();
    const intervalSeconds = intervalMs / 1000;

    pitches.forEach((pitch, index) => {
      const stepTime = startTime + index * intervalSeconds;
      Tone.getDraw().schedule(() => {
        if (this.activePitchCancelToken !== currentToken) return;
        this.playPitch(pitch, intervalSeconds * 0.92, timbre, 0.75);
        if (onStepChange) onStepChange(index);
      }, stepTime);
    });

    Tone.getDraw().schedule(() => {
      if (this.activePitchCancelToken !== currentToken) return;
      if (onStepChange) onStepChange(-1);
      if (onComplete) onComplete();
    }, startTime + pitches.length * intervalSeconds);
  }

  /**
   * Stops any currently active playback sequence immediately.
   */
  public static stopSequence(): void {
    this.activePitchCancelToken++;

    // Release any lingering active voices
    try {
      if (this.violinSynth) this.violinSynth.releaseAll();
      if (this.oudSynth) this.oudSynth.releaseAll();
      if (this.kanunSynth) this.kanunSynth.releaseAll();
    } catch {
      // safe
    }
  }

  /**
   * Continuous background drone (Qarar / Tanpura) on the Maqam root note.
   */
  public static toggleDrone(pitch: ArabicPitch, enable: boolean): void {
    this.startAudioContext();

    if (!enable) {
      if (this.isDroneRunning && this.droneGain) {
        this.droneGain.gain.rampTo(0, 0.4);
        setTimeout(() => {
          this.droneOsc1?.stop().dispose();
          this.droneOsc2?.stop().dispose();
          this.droneSubOsc?.stop().dispose();
          this.droneFifthOsc?.stop().dispose();
          this.droneOsc1 = null;
          this.droneOsc2 = null;
          this.droneSubOsc = null;
          this.droneFifthOsc = null;
          this.isDroneRunning = false;
        }, 450);
      }
      return;
    }

    // Stop existing drone if already running
    if (this.isDroneRunning) {
      this.toggleDrone(pitch, false);
      setTimeout(() => {
        this.toggleDrone(pitch, true);
      }, 500);
      return;
    }

    if (!this.droneFilter || !this.droneGain) return;

    const freq = pitch.toFrequency(this.referenceA4);

    // Multi-voice acoustic drone:
    // 1. Root fundamental (warm sawtooth)
    // 2. Beating chorused fundamental (+0.2% detuned sine)
    // 3. Deep sub-octave support (sine at freq * 0.5)
    // 4. Subtle 5th overtone (sine at freq * 1.5)
    this.droneOsc1 = new Tone.Oscillator(freq, 'sawtooth').connect(this.droneFilter);
    this.droneOsc2 = new Tone.Oscillator(freq * 1.0025, 'sine').connect(this.droneFilter);
    this.droneSubOsc = new Tone.Oscillator(freq * 0.5, 'sine').connect(this.droneFilter);
    this.droneFifthOsc = new Tone.Oscillator(freq * 1.498, 'sine').connect(this.droneFilter);

    this.droneOsc1.volume.value = -8;
    this.droneOsc2.volume.value = -6;
    this.droneSubOsc.volume.value = -4;
    this.droneFifthOsc.volume.value = -14;

    this.droneOsc1.start();
    this.droneOsc2.start();
    this.droneSubOsc.start();
    this.droneFifthOsc.start();

    // Gentle fade in
    this.droneGain.gain.rampTo(0.25, 0.8);
    this.isDroneRunning = true;
  }

  /**
   * Helper to check if drone is active.
   */
  public static isDroneActive(): boolean {
    return this.isDroneRunning;
  }
}
