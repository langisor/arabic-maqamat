// src/audio/microtonal-audio.ts
import * as Tone from "tone"
import { ArabicPitch } from "../core/pitch"
import { AudioTransport, type TransportSession } from "./audio-transport"

export type TimbreType = "violin" | "oud"

export class MicrotonalAudioEngine {
  private static isInitialized = false
  private static referenceA4 = 440.0

  // Master Nodes
  private static masterGain: Tone.Gain | null = null
  private static masterLimiter: Tone.Limiter | null = null
  private static masterReverb: Tone.Freeverb | null = null

  // Synths & FX
  private static violinSynth: Tone.PolySynth | null = null
  private static violinFilter: Tone.Filter | null = null
  private static violinVibrato: Tone.Vibrato | null = null
  private static oudSampler: Tone.Sampler | null = null
  private static oudSamplerReady: Promise<void> | null = null
  private static oudFilter: Tone.Filter | null = null

  // Drone Nodes
  private static droneOsc1: Tone.Oscillator | null = null
  private static droneOsc2: Tone.Oscillator | null = null
  private static droneSubOsc: Tone.Oscillator | null = null
  private static droneFifthOsc: Tone.Oscillator | null = null
  private static droneGain: Tone.Gain | null = null
  private static droneFilter: Tone.Filter | null = null
  private static droneChorus: Tone.Chorus | null = null
  private static isDroneRunning = false

  // Sequencer and drone transport ownership
  private static sequenceVoices = new Map<
    string,
    { timbre: TimbreType; frequencies: number[] }
  >()
  private static droneSession: TransportSession | null = null

  /**
   * Initializes Tone.js audio graph with professional Arabic acoustic modeling.
   */
  private static initAudio(): void {
    if (this.isInitialized) return

    // 1. Master Output Chain with Brickwall Limiter to avoid clipping
    this.masterLimiter = new Tone.Limiter(-0.5).toDestination()
    this.masterGain = new Tone.Gain(0.85).connect(this.masterLimiter)

    // 2. Master Acoustic Reverb (simulates historic Ottoman / Andalusian stone courtyard or concert hall)
    this.masterReverb = new Tone.Freeverb({
      roomSize: 0.65,
      dampening: 2600,
      wet: 0.2,
    }).connect(this.masterGain)

    // 3. Acoustic Arabic Violin Model:
    // Bowed strings have rich harmonics (sawtooth base with dual mode spread),
    // vocal formant filtering, subtle left-hand vibrato (5.2Hz), and smooth bowing envelope.
    this.violinVibrato = new Tone.Vibrato({
      frequency: 5.2,
      depth: 0.16,
      type: "sine",
    }).connect(this.masterReverb)

    this.violinFilter = new Tone.Filter({
      frequency: 3400,
      type: "lowpass",
      rolloff: -24,
      Q: 1.8,
    }).connect(this.violinVibrato)

    this.violinSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "fatsawtooth",
        count: 2,
        spread: 12,
      },
      envelope: {
        attack: 0.06, // gentle bow grip
        decay: 0.22,
        sustain: 0.85, // singing bowed sustain
        release: 0.22, // natural string body ring down
      },
    }).connect(this.violinFilter)
    this.violinSynth.volume.value = -2

    // 4. Acoustic Oud Model:
    // Plucked pear-shaped lute with wooden body resonance, fast percussive transient,
    // and rapid filter decay.
    const oudFilter = new Tone.Filter({
      frequency: 2900,
      type: "lowpass",
      rolloff: -12,
      Q: 1.2,
    }).connect(this.masterReverb)
    this.oudFilter = oudFilter

    this.oudSamplerReady = new Promise<void>((resolve, reject) => {
      this.oudSampler = new Tone.Sampler({
        urls: {
          A2: "A2.mp3",
          B2: "B2.mp3",
          C4: "C4.mp3",
          D4: "D4.mp3",
          E4: "E4.mp3",
          Eb4: "Eb4.mp3",
          G2: "G2.mp3",
          G3: "G3.mp3",
        },
        baseUrl: `${import.meta.env.BASE_URL}samples/oud/`,
        attack: 0.004,
        release: 0.35,
        onload: resolve,
        onerror: reject,
      }).connect(oudFilter)
      this.oudSampler.volume.value = 0
    })
    void this.oudSamplerReady.catch(() => {})

    // 5. Qarar Drone Subsystem (Root drone for Taqsim & Wasla)
    this.droneGain = new Tone.Gain(0).connect(this.masterReverb)
    this.droneChorus = new Tone.Chorus({
      frequency: 0.4,
      delayTime: 3.5,
      depth: 0.6,
      wet: 0.4,
    }).start()

    this.droneFilter = new Tone.Filter({
      frequency: 620,
      type: "lowpass",
      rolloff: -24,
    }).connect(this.droneChorus)

    this.droneChorus.connect(this.droneGain)

    this.isInitialized = true
  }

  /**
   * Unlocks Tone.js Web Audio context on user gesture.
   */
  public static startAudioContext(): Promise<void> {
    if (!this.isInitialized) {
      this.initAudio()
    }
    return AudioTransport.ensureAudioContext(
      () =>
        Tone.context.state === "running" ? Promise.resolve() : Tone.start(),
      () => Tone.context.state === "running"
    ).then(() => {
      if (!this.oudSamplerReady) {
        throw new Error("Oud sampler was not initialized.")
      }
      return this.oudSamplerReady
    })
  }

  private static requestAudioContext(): void {
    void this.startAudioContext().catch(() => {})
  }

  /**
   * Compatibility accessor returning the raw AudioContext.
   */
  public static getAudioContext(): AudioContext {
    this.requestAudioContext()
    return Tone.getContext().rawContext as AudioContext
  }

  /**
   * Sets the reference concert pitch for A4 (default: 440.0 Hz).
   */
  public static setReferenceA4(freq: number): void {
    if (freq > 400 && freq < 470) {
      this.referenceA4 = freq
    }
  }

  public static getReferenceA4(): number {
    return this.referenceA4
  }

  /**
   * Controls master volume (0.0 to 1.0).
   */
  public static setMasterVolume(vol: number): void {
    this.requestAudioContext()
    if (this.masterGain) {
      const clamped = Math.max(0, Math.min(1, vol))
      this.masterGain.gain.rampTo(clamped, 0.05)
    }
  }

  /**
   * Controls master reverb wetness (0.0 to 1.0).
   */
  public static setReverbWet(wet: number): void {
    this.requestAudioContext()
    if (this.masterReverb) {
      this.masterReverb.wet.value = Math.max(0, Math.min(1, wet))
    }
  }

  /**
   * Play an Arabic pitch with exact 24-EDO frequency using Tone.js modeled timbres.
   */
  public static playPitch(
    pitch: ArabicPitch,
    durationSeconds: number = 0.8,
    timbre: TimbreType = "violin",
    velocity: number = 0.7
  ): void {
    AudioTransport.stopAll()
    this.requestAudioContext()
    const octaveAdjustedPitch = timbre === "oud" ? pitch.transpose(-24) : pitch
    const freq = octaveAdjustedPitch.toFrequency(this.referenceA4)
    const now = Tone.now()

    try {
      this.triggerFrequency(
        freq,
        durationSeconds,
        timbre,
        this.scaleVelocity(timbre, velocity),
        now
      )
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
    timbre: TimbreType = "violin",
    velocity: number = 0.7
  ): void {
    AudioTransport.stopAll()
    this.requestAudioContext()
    const now = Tone.now()
    try {
      const octaveAdjustedFrequency = timbre === "oud" ? freq / 2 : freq
      this.triggerFrequency(
        octaveAdjustedFrequency,
        durationSeconds,
        timbre,
        velocity,
        now
      )
    } catch {
      // Fallback safe
    }
  }

  private static triggerFrequency(
    frequency: number,
    durationSeconds: number,
    timbre: TimbreType,
    velocity: number,
    audioTime: number
  ): void {
    const instrument = timbre === "oud" ? this.oudSampler : this.violinSynth
    instrument?.triggerAttackRelease(
      frequency,
      durationSeconds,
      audioTime,
      velocity
    )
  }

  private static scaleVelocity(timbre: TimbreType, velocity: number): number {
    if (timbre === "violin") return Math.min(1, velocity * 0.9)
    if (timbre === "oud") return Math.min(1, velocity * 1.1)
    return Math.min(1, velocity)
  }

  /**
   * Plays a sequence of pitches with precise interval timing and UI callbacks.
   */
  public static playSequence(
    pitches: ArabicPitch[],
    intervalMs: number = 550,
    timbre: TimbreType = "violin",
    onStepChange?: (index: number) => void,
    onComplete?: () => void,
    audioTime?: number,
    scope: string = "microtonal-sequence"
  ): void {
    this.stopSequence(scope)
    this.requestAudioContext()

    if (pitches.length === 0) {
      if (onComplete) onComplete()
      return
    }

    const session = AudioTransport.startSession(scope, "Sequence")
    const voices = { timbre, frequencies: [] as number[] }
    this.sequenceVoices.set(scope, voices)

    session.onCancel(() => {
      if (this.sequenceVoices.get(scope) === voices) {
        this.releaseSequenceVoices(voices)
        this.sequenceVoices.delete(scope)
      }
    })

    const startTime = audioTime ?? Tone.now()
    const intervalSeconds = intervalMs / 1000

    pitches.forEach((pitch, index) => {
      const stepTime = startTime + index * intervalSeconds
      Tone.getDraw().schedule(() => {
        if (!session.isActive()) return
        const octaveAdjustedPitch =
          timbre === "oud" ? pitch.transpose(24) : pitch

        console.log("transform pitch to ", pitch.toString())
        const frequency = octaveAdjustedPitch.toFrequency(this.referenceA4)
        voices.frequencies.push(frequency)
        this.triggerFrequency(
          frequency,
          intervalSeconds * 0.92,
          timbre,
          this.scaleVelocity(timbre, 0.75),
          Tone.now()
        )
        if (onStepChange) onStepChange(index)
      }, stepTime)
    })

    Tone.getDraw().schedule(
      () => {
        if (!session.isActive()) return
        if (onStepChange) onStepChange(-1)
        if (onComplete) onComplete()
        if (this.sequenceVoices.get(scope) === voices) {
          this.sequenceVoices.delete(scope)
        }
        session.finish()
      },
      startTime + pitches.length * intervalSeconds
    )
  }

  /**
   * Plays a rhythmically varied sequence where each note specifies duration in quarter beats.
   * Enables precise rhythmic synchronization for scales, sequences of 3/4, and position shift drills.
   */
  public static playRhythmicSequence(
    notes: { pitch: ArabicPitch; durationQuarter: number }[],
    tempoBpm: number = 80,
    timbre: TimbreType = "violin",
    onStepChange?: (index: number) => void,
    onComplete?: () => void,
    audioTime?: number,
    scope: string = "microtonal-sequence"
  ): void {
    this.stopSequence(scope)
    this.requestAudioContext()

    if (notes.length === 0) {
      if (onComplete) onComplete()
      return
    }

    const session = AudioTransport.startSession(scope, "Sequence")
    const voices = { timbre, frequencies: [] as number[] }
    this.sequenceVoices.set(scope, voices)

    session.onCancel(() => {
      if (this.sequenceVoices.get(scope) === voices) {
        this.releaseSequenceVoices(voices)
        this.sequenceVoices.delete(scope)
      }
    })

    const startTime = audioTime ?? Tone.now()
    const secondsPerQuarter = 60 / tempoBpm
    let accumulatedSeconds = 0

    notes.forEach((note, index) => {
      const stepTime = startTime + accumulatedSeconds
      const noteDurationSec = Math.max(
        0.08,
        note.durationQuarter * secondsPerQuarter
      )
      Tone.getDraw().schedule(() => {
        if (!session.isActive()) return
        voices.frequencies.push(note.pitch.toFrequency(this.referenceA4))
        this.triggerFrequency(
          note.pitch.toFrequency(this.referenceA4),
          noteDurationSec * 0.92,
          timbre,
          this.scaleVelocity(timbre, 0.75),
          Tone.now()
        )
        if (onStepChange) onStepChange(index)
      }, stepTime)
      accumulatedSeconds += noteDurationSec
    })

    Tone.getDraw().schedule(() => {
      if (!session.isActive()) return
      if (onStepChange) onStepChange(-1)
      if (onComplete) onComplete()
      if (this.sequenceVoices.get(scope) === voices) {
        this.releaseSequenceVoices(voices)
      }
      session.finish()
    }, startTime + accumulatedSeconds)
  }

  /**
   * Stops any currently active playback sequence immediately.
   */
  public static stopSequence(scope?: string): void {
    if (scope) {
      AudioTransport.stopScope(scope)
      return
    }
    AudioTransport.stopWhere(({ activity }) => activity === "Sequence")
  }

  /**
   * Continuous background drone (Qarar / Tanpura) on the Maqam root note.
   */
  public static toggleDrone(pitch: ArabicPitch, enable: boolean): void {
    this.requestAudioContext()
    if (!enable) {
      const session = this.droneSession
      if (!session?.isActive()) return
      this.droneGain?.gain.rampTo(0, 0.4)
      session.setTimeout(() => {
        this.disposeDrone()
        this.droneSession = null
        session.finish()
      }, 450)
      return
    }

    if (this.droneSession?.isActive()) AudioTransport.stopScope("drone")
    const session = AudioTransport.startSession("drone", "Drone")
    this.droneSession = session
    session.onCancel(() => {
      this.disposeDrone()
      if (this.droneSession === session) this.droneSession = null
    })
    this.startDrone(pitch)
  }

  private static startDrone(pitch: ArabicPitch): void {
    if (!this.droneFilter || !this.droneGain) return
    const freq = pitch.toFrequency(this.referenceA4)

    // Multi-voice acoustic drone:
    // 1. Root fundamental (warm sawtooth)
    // 2. Beating chorused fundamental (+0.2% detuned sine)
    // 3. Deep sub-octave support (sine at freq * 0.5)
    // 4. Subtle 5th overtone (sine at freq * 1.5)
    this.droneOsc1 = new Tone.Oscillator(freq, "sawtooth").connect(
      this.droneFilter
    )
    this.droneOsc2 = new Tone.Oscillator(freq * 1.0025, "sine").connect(
      this.droneFilter
    )
    this.droneSubOsc = new Tone.Oscillator(freq * 0.5, "sine").connect(
      this.droneFilter
    )
    this.droneFifthOsc = new Tone.Oscillator(freq * 1.498, "sine").connect(
      this.droneFilter
    )

    this.droneOsc1.volume.value = -8
    this.droneOsc2.volume.value = -6
    this.droneSubOsc.volume.value = -4
    this.droneFifthOsc.volume.value = -14

    this.droneOsc1.start()
    this.droneOsc2.start()
    this.droneSubOsc.start()
    this.droneFifthOsc.start()

    // Gentle fade in
    this.droneGain.gain.rampTo(0.25, 0.8)
    this.isDroneRunning = true
  }

  private static disposeDrone(): void {
    this.droneOsc1?.stop().dispose()
    this.droneOsc2?.stop().dispose()
    this.droneSubOsc?.stop().dispose()
    this.droneFifthOsc?.stop().dispose()
    this.droneOsc1 = null
    this.droneOsc2 = null
    this.droneSubOsc = null
    this.droneFifthOsc = null
    this.droneGain?.gain.setValueAtTime(0, Tone.now())
    this.isDroneRunning = false
  }

  private static releaseSequenceVoices(voices: {
    timbre: TimbreType
    frequencies: number[]
  }): void {
    if (voices.frequencies.length === 0) return
    const instrument =
      voices.timbre === "oud" ? this.oudSampler : this.violinSynth
    try {
      instrument?.triggerRelease(voices.frequencies, Tone.now())
    } catch {
      // The audio context may have been interrupted.
    }
  }

  /**
   * Helper to check if drone is active.
   */
  public static isDroneActive(): boolean {
    return this.isDroneRunning
  }

  public static stopAllPlayback(): void {
    try {
      this.violinSynth?.releaseAll()
      this.oudSampler?.releaseAll()
    } catch {
      // The audio context may have been interrupted.
    }
    this.disposeDrone()
  }
}

AudioTransport.registerGlobalStopHandler(() =>
  MicrotonalAudioEngine.stopAllPlayback()
)
