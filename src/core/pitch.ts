// src/core/pitch.ts

export type DiatonicBase = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export type MicrotonalAccidental = 
  | '𝄫'  // double flat (-4 quarter tones / -200 cents)
  | '♭'   // flat (-2 quarter tones / -100 cents)
  | '𝄳'  // half-flat / quarter-tone flat (-1 quarter tone / -50 cents)
  | '♮'   // natural (0)
  | '𝄵'  // half-sharp / quarter-tone sharp (+1 quarter tone / +50 cents)
  | '♯'   // sharp (+2 quarter tones / +100 cents)
  | '𝄪';  // double sharp (+4 quarter tones / +200 cents)

export interface PitchConfig {
  readonly diatonic: DiatonicBase;
  readonly accidental: MicrotonalAccidental;
  readonly octave: number;
}

export class ArabicPitch {
  public readonly diatonic: DiatonicBase;
  public readonly accidental: MicrotonalAccidental;
  public readonly octave: number;

  private static readonly DIATONIC_QT_OFFSETS: Record<DiatonicBase, number> = {
    C: 0,
    D: 4,   // 200 cents = 4 quarter-tones
    E: 8,   // 400 cents = 8 quarter-tones
    F: 10,  // 500 cents = 10 quarter-tones
    G: 14,  // 700 cents = 14 quarter-tones
    A: 18,  // 900 cents = 18 quarter-tones
    B: 22   // 1100 cents = 22 quarter-tones
  };

  private static readonly ACCIDENTAL_QT_MODIFIERS: Record<MicrotonalAccidental, number> = {
    '𝄫': -4,
    '♭': -2,
    '𝄳': -1,
    '♮': 0,
    '𝄵': +1,
    '♯': +2,
    '𝄪': +4
  };

  constructor(diatonic: DiatonicBase, accidental: MicrotonalAccidental = '♮', octave: number = 4) {
    this.diatonic = diatonic;
    this.accidental = accidental;
    this.octave = octave;
  }

  /**
   * Absolute quarter-tone index across all octaves where C0 = 0.
   * 1 octave = 24 quarter-tones.
   */
  public toQuarterToneIndex(): number {
    const baseQt = ArabicPitch.DIATONIC_QT_OFFSETS[this.diatonic];
    const accQt = ArabicPitch.ACCIDENTAL_QT_MODIFIERS[this.accidental];
    return this.octave * 24 + baseQt + accQt;
  }

  /**
   * Cents relative to C in the current octave (0 to 1200).
   */
  public toOctaveCents(): number {
    const semitonesWithinOctave = (this.toQuarterToneIndex() % 24 + 24) % 24;
    return semitonesWithinOctave * 50;
  }

  /**
   * Absolute frequency calculated from A440 (A4 with natural accidental = 440.0 Hz).
   * In 24-EDO, A4 natural is index 4 * 24 + 18 = 114.
   */
  public toFrequency(a4ReferenceHz: number = 440.0): number {
    const a4QtIndex = 4 * 24 + ArabicPitch.DIATONIC_QT_OFFSETS['A']; // 114
    const deltaQt = this.toQuarterToneIndex() - a4QtIndex;
    return a4ReferenceHz * Math.pow(2, deltaQt / 24);
  }

  /**
   * Distance in quarter-tones to another pitch.
   */
  public diffQuarterTones(other: ArabicPitch): number {
    return other.toQuarterToneIndex() - this.toQuarterToneIndex();
  }

  /**
   * Distance in cents to another pitch.
   */
  public diffCents(other: ArabicPitch): number {
    return this.diffQuarterTones(other) * 50;
  }

  public toString(): string {
    const accDisplay = this.accidental === '♮' ? '' : this.accidental;
    return `${this.diatonic}${accDisplay}${this.octave}`;
  }

  public toScientificString(): string {
    return `${this.diatonic}${this.accidental}`;
  }

  public toDisplayString(): string {
    return `${this.diatonic}${this.accidental === '♮' ? '' : this.accidental}`;
  }

  public equals(other: ArabicPitch): boolean {
    return this.toQuarterToneIndex() === other.toQuarterToneIndex();
  }

  /**
   * Reconstitute pitch from absolute quarter-tone index.
   * Uses canonical Arabic 24-EDO spelling table with optional preferred diatonic base.
   */
  public static fromQuarterToneIndex(qtIndex: number, preferredBase?: DiatonicBase): ArabicPitch {
    const octave = Math.floor(qtIndex / 24);
    const mod = ((qtIndex % 24) + 24) % 24;

    // If a preferred base is supplied, check if mod can be spelled with that base
    if (preferredBase) {
      const baseQt = ArabicPitch.DIATONIC_QT_OFFSETS[preferredBase];
      const delta = mod - baseQt;
      // Also check octave wraparound for delta (e.g. C to B)
      const normalizedDelta = delta > 12 ? delta - 24 : delta < -12 ? delta + 24 : delta;
      for (const [acc, modifier] of Object.entries(ArabicPitch.ACCIDENTAL_QT_MODIFIERS) as [MicrotonalAccidental, number][]) {
        if (modifier === normalizedDelta) {
          return new ArabicPitch(preferredBase, acc, octave);
        }
      }
    }

    // Canonical Arabic 24-EDO diatonic spellings (index mod 24, where C=0)
    const CANONICAL_MAP: [DiatonicBase, MicrotonalAccidental][] = [
      ['C', '♮'], // 0
      ['C', '𝄵'], // 1
      ['D', '♭'], // 2
      ['D', '𝄳'], // 3
      ['D', '♮'], // 4
      ['D', '𝄵'], // 5
      ['E', '♭'], // 6
      ['E', '𝄳'], // 7 (Sikah)
      ['E', '♮'], // 8
      ['E', '𝄵'], // 9
      ['F', '♮'], // 10
      ['F', '𝄵'], // 11
      ['F', '♯'], // 12
      ['G', '𝄳'], // 13
      ['G', '♮'], // 14
      ['G', '𝄵'], // 15
      ['A', '♭'], // 16
      ['A', '𝄳'], // 17
      ['A', '♮'], // 18
      ['A', '𝄵'], // 19
      ['B', '♭'], // 20
      ['B', '𝄳'], // 21 (Awj / Iraq)
      ['B', '♮'], // 22
      ['B', '𝄵']  // 23
    ];

    const [diatonic, accidental] = CANONICAL_MAP[mod];
    return new ArabicPitch(diatonic, accidental, octave);
  }

  public transpose(quarterTones: number, preferredBase?: DiatonicBase): ArabicPitch {
    return ArabicPitch.fromQuarterToneIndex(this.toQuarterToneIndex() + quarterTones, preferredBase);
  }
}
