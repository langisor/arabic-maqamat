import * as Tone from "tone"
import { AudioTransport } from "./audio-transport"

/** Shared output stage for every sound source in the app. */
export class AudioOutput {
  private static limiter: Tone.Limiter | null = null
  private static masterGain: Tone.Gain | null = null
  private static volume = 0.8

  private static initialize(): void {
    if (this.masterGain) return

    this.limiter = new Tone.Limiter(-0.5).toDestination()
    this.masterGain = new Tone.Gain(this.volume).connect(this.limiter)
  }

  public static getInput(): Tone.Gain {
    this.initialize()
    return this.masterGain!
  }

  public static start(): Promise<void> {
    this.initialize()
    return AudioTransport.ensureAudioContext(
      () => Tone.context.state === "running" ? Promise.resolve() : Tone.start(),
      () => Tone.context.state === "running",
    )
  }

  public static getVolume(): number {
    return this.volume
  }

  public static setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain) this.masterGain.gain.rampTo(this.volume, 0.05)
  }
}
