// src/theory/jins.ts
import { ArabicPitch } from '../core/pitch';

export type JinsType = 'Trichord' | 'Tetrachord' | 'Pentachord';

export interface JinsDefinition {
  readonly id: string;
  readonly name: string;
  readonly arabicName: string;
  readonly type: JinsType;
  /**
   * Internal step increments in quarter-tones.
   * e.g., Rast [4, 3, 3] = whole tone (4), 3/4 tone (3), 3/4 tone (3).
   */
  readonly intervals: readonly number[];
  readonly description: string;
  readonly hasQuarterTones: boolean;
  readonly defaultRoot: ArabicPitch;
  readonly tonicCharacteristic: string;
}

export class Jins {
  constructor(
    public readonly definition: JinsDefinition,
    public readonly root: ArabicPitch
  ) {
    this.validateFormula();
  }

  private validateFormula(): void {
    const expectedNotes = this.definition.type === 'Trichord' ? 2 : this.definition.type === 'Tetrachord' ? 3 : 4;
    if (this.definition.intervals.length !== expectedNotes) {
      throw new Error(`Invalid interval length for ${this.definition.type} ${this.definition.name}. Expected ${expectedNotes}.`);
    }

    const totalQuarterTones = this.definition.intervals.reduce((a, b) => a + b, 0);
    if (this.definition.type === 'Trichord' && this.definition.id === 'sikah') {
      // Sikah trichord: 3 + 4 = 7 quarter tones (350 cents)
      if (totalQuarterTones !== 7) throw new Error(`Sikah trichord must span 7 quarter tones (350 cents).`);
    } else if (this.definition.type === 'Tetrachord' && this.definition.id !== 'saba') {
      // Tetrachords span 10 quarter-tones (500 cents = Perfect 4th)
      if (totalQuarterTones !== 10) throw new Error(`Standard tetrachord must span 10 quarter-tones (500 cents). Found: ${totalQuarterTones}`);
    } else if (this.definition.type === 'Pentachord') {
      // Pentachords span 14 quarter-tones (700 cents = Perfect 5th)
      if (totalQuarterTones !== 14) throw new Error(`Pentachord must span 14 quarter-tones (700 cents). Found: ${totalQuarterTones}`);
    }
  }

  public getPitches(): ArabicPitch[] {
    const pitches: ArabicPitch[] = [this.root];
    let currentQt = this.root.toQuarterToneIndex();

    for (const step of this.definition.intervals) {
      currentQt += step;
      pitches.push(ArabicPitch.fromQuarterToneIndex(currentQt));
    }
    return pitches;
  }

  public getTopPitch(): ArabicPitch {
    const pitches = this.getPitches();
    return pitches[pitches.length - 1];
  }

  public getTotalSpanCents(): number {
    return this.definition.intervals.reduce((a, b) => a + b, 0) * 50;
  }

  public transpose(newRoot: ArabicPitch): Jins {
    return new Jins(this.definition, newRoot);
  }
}

/**
 * Standard Ajnas Catalogue from Modules 2, 5, and 7
 */
export class AjnasLibrary {
  public static readonly RAST: JinsDefinition = {
    id: 'rast',
    name: 'Rast',
    arabicName: 'راست',
    type: 'Tetrachord',
    intervals: [4, 3, 3],
    description: 'Bright, stately root cell with neutral 3rd (Sikah)',
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch('C', '♮', 4),
    tonicCharacteristic: 'Grounding, noble, majestic foundation'
  };

  public static readonly BAYATI: JinsDefinition = {
    id: 'bayati',
    name: 'Bayati',
    arabicName: 'بياتي',
    type: 'Tetrachord',
    intervals: [3, 3, 4],
    description: 'Gentle, yearning opening with immediate neutral 2nd',
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch('D', '♮', 4),
    tonicCharacteristic: 'Deeply expressive, reflective, bittersweet'
  };

  public static readonly HIJAZ: JinsDefinition = {
    id: 'hijaz',
    arabicName: 'حجاز',
    name: 'Hijaz',
    type: 'Tetrachord',
    intervals: [2, 6, 2],
    description: 'Dramatic cell with augmented 2nd (6 qt = 300 cents), no quarter-tones',
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch('D', '♮', 4),
    tonicCharacteristic: 'Mystical, theatrical, yearning with augmented 2nd stretch'
  };

  public static readonly NAHAWAND: JinsDefinition = {
    id: 'nahawand',
    arabicName: 'نهاوند',
    name: 'Nahawand',
    type: 'Tetrachord',
    intervals: [4, 2, 4],
    description: 'Identical to natural minor tetrachord (whole-half-whole)',
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch('C', '♮', 4),
    tonicCharacteristic: 'Melancholic, elegant, harmonic clarity'
  };

  public static readonly SIKAH: JinsDefinition = {
    id: 'sikah',
    arabicName: 'سيكاه',
    name: 'Sikah',
    type: 'Trichord',
    intervals: [3, 4],
    description: 'Contemplative neutral 3rd trichord (E𝄳 - F - G)',
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch('E', '𝄳', 4),
    tonicCharacteristic: 'Rooted directly on quarter-tone neutral 3rd'
  };

  public static readonly AJAM: JinsDefinition = {
    id: 'ajam',
    arabicName: 'عجم',
    name: 'Ajam',
    type: 'Pentachord',
    intervals: [4, 4, 2, 4],
    description: 'Major pentachord spanning 500+200=700 cents',
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch('B', '♭', 3),
    tonicCharacteristic: 'Triumphant, bright, open Western major affinity'
  };

  public static readonly NAWA_ATHAR_NIKRIZ: JinsDefinition = {
    id: 'nikriz',
    arabicName: 'نكريز',
    name: 'Nikriz / Nawa Athar',
    type: 'Pentachord',
    intervals: [4, 2, 6, 2],
    description: 'Augmented-2nd pentachord spanning a perfect 5th (700 cents)',
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch('C', '♮', 4),
    tonicCharacteristic: 'Virtuosic, dramatic tension on 4th scale degree'
  };

  public static readonly KURD: JinsDefinition = {
    id: 'kurd',
    arabicName: 'كرد',
    name: 'Kurd',
    type: 'Tetrachord',
    intervals: [2, 4, 4],
    description: 'Phrygian tetrachord starting with semitone step',
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch('D', '♮', 4),
    tonicCharacteristic: 'Somber, gentle Phrygian intimacy'
  };

  public static readonly SABA: JinsDefinition = {
    id: 'saba',
    arabicName: 'صبا',
    name: 'Saba',
    type: 'Tetrachord',
    intervals: [3, 3, 2], // D to G♭ = 8 quarter tones = 400 cents (narrower than a 4th)
    description: 'Narrow tetrachord spanning 400 cents with profound grief/yearning character',
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch('D', '♮', 4),
    tonicCharacteristic: 'Heart-wrenching grief, ultra-compressed span'
  };

  public static getAllDefinitions(): JinsDefinition[] {
    return [
      this.RAST,
      this.BAYATI,
      this.HIJAZ,
      this.NAHAWAND,
      this.SIKAH,
      this.AJAM,
      this.NAWA_ATHAR_NIKRIZ,
      this.KURD,
      this.SABA
    ];
  }

  public static findById(id: string): JinsDefinition | undefined {
    return this.getAllDefinitions().find(d => d.id === id);
  }
}
