// src/audio/metronome-engine.ts
import * as Tone from 'tone';

export type MetronomeSoundType = 'dum-tak' | 'woodblock' | 'digital' | 'silent';

export interface TimeSignatureOption {
  id: string;
  name: string; // e.g. "4/4"
  beatsPerBar: number;
  beatUnit: 4 | 8;
  arabicName: string;
  arabicTransliteration: string;
  description: string;
  downbeats: number[]; // 0-indexed strong downbeats
  secondaryAccents: number[]; // 0-indexed secondary accents
  beatSyllables?: string[]; // e.g. ["Dum", "Tak", "Dum", "Tak"]
}

export const TIME_SIGNATURE_PRESETS: TimeSignatureOption[] = [
  {
    id: '4-4-maqsum',
    name: '4/4',
    beatsPerBar: 4,
    beatUnit: 4,
    arabicName: 'مقصوم / واحدة / بلدي',
    arabicTransliteration: 'Maqsum / Wahda / Baladi',
    description: 'Foundational 4-beat cycle for Rast, Bayati, and Nahawand maqamat',
    downbeats: [0],
    secondaryAccents: [2],
    beatSyllables: ['Dum', 'Tak', 'Dum', 'Tak']
  },
  {
    id: '2-4-malfuf',
    name: '2/4',
    beatsPerBar: 2,
    beatUnit: 4,
    arabicName: 'ملفوف / أيوب',
    arabicTransliteration: 'Malfuf / Ayyub',
    description: 'Fast driving 2-beat meter used in Wasla intros and Sufi rhythms',
    downbeats: [0],
    secondaryAccents: [],
    beatSyllables: ['Dum', 'Tak']
  },
  {
    id: '3-4-darj',
    name: '3/4',
    beatsPerBar: 3,
    beatUnit: 4,
    arabicName: 'دارج / سماعي دارج',
    arabicTransliteration: 'Darj / Samai Darij',
    description: 'Classical 3-beat Muwashah & instrumental Darj suite pieces',
    downbeats: [0],
    secondaryAccents: [],
    beatSyllables: ['Dum', 'Tak', 'Tak']
  },
  {
    id: '6-8-yuruk',
    name: '6/8',
    beatsPerBar: 6,
    beatUnit: 8,
    arabicName: 'يورك سماعي / مدوّر',
    arabicTransliteration: 'Yuruk Semai / Mudawwar',
    description: 'Flowing 6-beat cycle common in Ottoman-Arab classical repertoire',
    downbeats: [0],
    secondaryAccents: [3],
    beatSyllables: ['Dum', 'Tak', 'Tik', 'Tak', 'Dum', 'Tak']
  },
  {
    id: '7-8-dawr-hindi',
    name: '7/8',
    beatsPerBar: 7,
    beatUnit: 8,
    arabicName: 'دور هندي',
    arabicTransliteration: 'Dawr Hindi',
    description: '7-beat meter (3+2+2) celebrated in classical Muwashahat compositions',
    downbeats: [0],
    secondaryAccents: [3, 5],
    beatSyllables: ['Dum', 'Tik', 'Tik', 'Tak', 'Tik', 'Tak', 'Tik']
  },
  {
    id: '8-4-masmudi',
    name: '8/4',
    beatsPerBar: 8,
    beatUnit: 4,
    arabicName: 'مصمودي كبير',
    arabicTransliteration: 'Masmudi Kabir',
    description: 'Ceremonial 8-beat slow cycle with two distinct Dum beats (Dum Dum - - Tak Dum - Tak)',
    downbeats: [0, 1],
    secondaryAccents: [4, 6],
    beatSyllables: ['Dum', 'Dum', 'Tik', 'Tik', 'Tak', 'Tik', 'Tak', 'Tik']
  },
  {
    id: '10-8-samai',
    name: '10/8',
    beatsPerBar: 10,
    beatUnit: 8,
    arabicName: 'سماعي ثقيل',
    arabicTransliteration: 'Samai Thaqil',
    description: 'Quintessential 10-beat Wasla suite meter (Dum . . Tak . Tak . Dum . Tak .)',
    downbeats: [0, 6],
    secondaryAccents: [3, 8],
    beatSyllables: ['Dum', 'Tik', 'Tik', 'Tak', 'Tik', 'Tak', 'Dum', 'Tik', 'Tak', 'Tik']
  },
  {
    id: '5-4-khamsi',
    name: '5/4',
    beatsPerBar: 5,
    beatUnit: 4,
    arabicName: 'خماسي',
    arabicTransliteration: 'Quintupal / 5-Beat',
    description: 'Modern and classical 5-beat compound practice meter',
    downbeats: [0],
    secondaryAccents: [3],
    beatSyllables: ['Dum', 'Tak', 'Tik', 'Tak', 'Tik']
  },
  {
    id: '9-8-aqsaq',
    name: '9/8',
    beatsPerBar: 9,
    beatUnit: 8,
    arabicName: 'أقصاق',
    arabicTransliteration: 'Aqsaq (9/8)',
    description: 'Classical asymmetrical syncopated cycle (2+2+2+3)',
    downbeats: [0],
    secondaryAccents: [2, 4, 6],
    beatSyllables: ['Dum', 'Tik', 'Tak', 'Tik', 'Tak', 'Tik', 'Dum', 'Tik', 'Tak']
  }
];

export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  timeSignature: TimeSignatureOption;
  currentBeat: number; // 0 to beatsPerBar - 1
  isDownbeat: boolean;
  isAccent: boolean;
  soundType: MetronomeSoundType;
  volume: number; // 0.0 to 1.0
}

type BeatListener = (state: {
  beatIndex: number;
  isDownbeat: boolean;
  isAccent: boolean;
  beatsPerBar: number;
  syllable?: string;
  time: number;
}) => void;

type StateListener = (isPlaying: boolean) => void;

export class MetronomeAudioEngine {
  private static isInitialized = false;

  // Audio Nodes
  private static masterGain: Tone.Gain | null = null;
  private static limiter: Tone.Limiter | null = null;
  private static dumSynth: Tone.MembraneSynth | null = null;
  private static takSynth: Tone.Synth | null = null;
  private static woodblockSynth: Tone.Synth | null = null;
  private static digitalSynth: Tone.Synth | null = null;

  // Settings
  private static bpm = 96;
  private static timeSignature: TimeSignatureOption = TIME_SIGNATURE_PRESETS[0];
  private static soundType: MetronomeSoundType = 'dum-tak';
  private static volume = 0.75;
  private static isPlaying = false;

  // Scheduler timing
  private static timerId: number | null = null;
  private static nextBeatAudioTime = 0;
  private static currentBeatIndex = 0;
  private static readonly LOOKAHEAD_SEC = 0.08; // 80ms lookahead
  private static readonly SCHEDULE_INTERVAL_MS = 25; // 25ms timer frequency

  // Listeners
  private static beatListeners: Set<BeatListener> = new Set();
  private static stateListeners: Set<StateListener> = new Set();

  /**
   * Initializes Tone.js audio graph for metronome sounds.
   */
  private static initAudio(): void {
    if (this.isInitialized) return;

    this.limiter = new Tone.Limiter(-0.5).toDestination();
    this.masterGain = new Tone.Gain(this.volume).connect(this.limiter);

    // 1. Dum Synth (Resonant Arabic percussion bass / membrane)
    this.dumSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 3,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.002,
        decay: 0.25,
        sustain: 0.01,
        release: 0.15
      }
    }).connect(this.masterGain);
    this.dumSynth.volume.value = 1;

    // 2. Tak Synth (Snappy rimshot / wood resonance)
    this.takSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.04,
        sustain: 0,
        release: 0.04
      }
    }).connect(this.masterGain);
    this.takSynth.volume.value = -2;

    // 3. Woodblock Synth (Acoustic wooden tick)
    this.woodblockSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.035,
        sustain: 0,
        release: 0.035
      }
    }).connect(this.masterGain);
    this.woodblockSynth.volume.value = 0;

    // 4. Digital Beep Synth (Electronic metronome)
    this.digitalSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.001,
        decay: 0.03,
        sustain: 0,
        release: 0.03
      }
    }).connect(this.masterGain);
    this.digitalSynth.volume.value = -4;

    this.isInitialized = true;
  }

  /**
   * Unlocks Tone.js Web Audio context.
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
   * Starts the metronome.
   */
  public static async start(): Promise<void> {
    await this.startAudioContext();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentBeatIndex = 0;
    this.nextBeatAudioTime = Tone.now() + 0.05;

    this.notifyState(true);
    this.runScheduler();
  }

  /**
   * Stops the metronome.
   */
  public static stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentBeatIndex = 0;
    this.notifyState(false);
  }

  /**
   * Toggles metronome playback.
   */
  public static async toggle(): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    } else {
      await this.start();
    }
  }

  /**
   * Scheduler loop that schedules audio pulses in advance using Web Audio timeline.
   */
  private static runScheduler(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }

    this.timerId = window.setInterval(() => {
      if (!this.isPlaying) return;

      const currentTime = Tone.now();
      const lookaheadLimit = currentTime + this.LOOKAHEAD_SEC;

      while (this.nextBeatAudioTime < lookaheadLimit) {
        this.scheduleBeat(this.currentBeatIndex, this.nextBeatAudioTime);

        // Calculate step duration based on time signature beat unit:
        // beatUnit === 4: quarter note = 60 / bpm seconds
        // beatUnit === 8: eighth note  = (60 / bpm) * 0.5 seconds
        const stepSeconds =
          this.timeSignature.beatUnit === 8
            ? (60 / this.bpm) * 0.5
            : 60 / this.bpm;

        this.nextBeatAudioTime += stepSeconds;
        this.currentBeatIndex = (this.currentBeatIndex + 1) % this.timeSignature.beatsPerBar;
      }
    }, this.SCHEDULE_INTERVAL_MS);
  }

  /**
   * Schedules sound playback and synchronized visual animation for a specific beat.
   */
  private static scheduleBeat(beatIndex: number, audioTime: number): void {
    const isDownbeat = this.timeSignature.downbeats.includes(beatIndex);
    const isAccent = this.timeSignature.secondaryAccents.includes(beatIndex);
    const beatsPerBar = this.timeSignature.beatsPerBar;
    const syllable = this.timeSignature.beatSyllables?.[beatIndex];

    // 1. Audio Click Synthesis
    if (this.soundType !== 'silent') {
      try {
        switch (this.soundType) {
          case 'dum-tak':
            if (isDownbeat && this.dumSynth) {
              // Resonant Dum
              this.dumSynth.triggerAttackRelease('D2', '16n', audioTime, 1.0);
            } else if (isAccent && this.takSynth) {
              // Strong Tak
              this.takSynth.triggerAttackRelease(1400, '32n', audioTime, 0.9);
            } else if (this.takSynth) {
              // Regular Tak / Tik
              this.takSynth.triggerAttackRelease(950, '32n', audioTime, 0.65);
            }
            break;

          case 'woodblock':
            if (this.woodblockSynth) {
              const freq = isDownbeat ? 1280 : isAccent ? 980 : 800;
              const vel = isDownbeat ? 1.0 : isAccent ? 0.8 : 0.6;
              this.woodblockSynth.triggerAttackRelease(freq, '32n', audioTime, vel);
            }
            break;

          case 'digital':
            if (this.digitalSynth) {
              const freq = isDownbeat ? 1600 : isAccent ? 1200 : 800;
              const vel = isDownbeat ? 0.9 : 0.6;
              this.digitalSynth.triggerAttackRelease(freq, '32n', audioTime, vel);
            }
            break;
        }
      } catch {
        // Safe against audio glitches
      }
    }

    // 2. Synchronized Visual Animation Callback via Tone.Draw
    try {
      Tone.getDraw().schedule(() => {
        if (!this.isPlaying) return;
        this.notifyBeat({
          beatIndex,
          isDownbeat,
          isAccent,
          beatsPerBar,
          syllable,
          time: audioTime
        });
      }, audioTime);
    } catch {
      // Fallback: direct notification if Draw was interrupted
      this.notifyBeat({
        beatIndex,
        isDownbeat,
        isAccent,
        beatsPerBar,
        syllable,
        time: audioTime
      });
    }
  }

  // --- Controls & Getters ---

  public static setBpm(newBpm: number): void {
    const clamped = Math.max(30, Math.min(280, Math.round(newBpm)));
    this.bpm = clamped;
  }

  public static getBpm(): number {
    return this.bpm;
  }

  public static setTimeSignature(sig: TimeSignatureOption): void {
    this.timeSignature = sig;
    this.currentBeatIndex = 0;
  }

  public static getTimeSignature(): TimeSignatureOption {
    return this.timeSignature;
  }

  public static setSoundType(sound: MetronomeSoundType): void {
    this.soundType = sound;
  }

  public static getSoundType(): MetronomeSoundType {
    return this.soundType;
  }

  public static setVolume(vol: number): void {
    this.startAudioContext();
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    if (this.masterGain) {
      this.masterGain.gain.rampTo(clamped, 0.05);
    }
  }

  public static getVolume(): number {
    return this.volume;
  }

  public static getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // --- Subscriptions ---

  public static subscribeBeat(listener: BeatListener): () => void {
    this.beatListeners.add(listener);
    return () => {
      this.beatListeners.delete(listener);
    };
  }

  public static subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private static notifyBeat(info: {
    beatIndex: number;
    isDownbeat: boolean;
    isAccent: boolean;
    beatsPerBar: number;
    syllable?: string;
    time: number;
  }): void {
    this.beatListeners.forEach(fn => fn(info));
  }

  private static notifyState(isPlaying: boolean): void {
    this.stateListeners.forEach(fn => fn(isPlaying));
  }
}
