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
  /**
   * "Jins Baggage" - consistent notes BELOW the tonic that are part of the jins character.
   * Negative values represent intervals descending from the tonic.
   * e.g., Bayati on D: [-4, -7] = C-natural, B-half-flat below D
   * From Abu Shumays' "Maqam Analysis: A Primer"
   */
  readonly baggageIntervals?: readonly number[];
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

  /**
   * Get full jins scale including baggage notes below the tonic.
   * Returns pitches in ascending order from lowest baggage note to highest interval note.
   */
  public getPitchesWithBaggage(): ArabicPitch[] {
    const pitches: ArabicPitch[] = [];
    let currentQt = this.root.toQuarterToneIndex();

    // Add baggage notes below tonic (in reverse order, then reverse for ascending)
    if (this.definition.baggageIntervals && this.definition.baggageIntervals.length > 0) {
      const baggagePitches: ArabicPitch[] = [];
      for (const interval of this.definition.baggageIntervals) {
        currentQt += interval; // interval is negative
        baggagePitches.push(ArabicPitch.fromQuarterToneIndex(currentQt));
      }
      // Reverse to get ascending order
      pitches.push(...baggagePitches.reverse());
    }

    // Reset to tonic and add main intervals
    currentQt = this.root.toQuarterToneIndex();
    pitches.push(this.root);
    for (const step of this.definition.intervals) {
      currentQt += step;
      pitches.push(ArabicPitch.fromQuarterToneIndex(currentQt));
    }

    return pitches;
  }

  /**
   * Get just the baggage notes below the tonic (in ascending order).
   */
  public getBaggageNotes(): ArabicPitch[] {
    if (!this.definition.baggageIntervals || this.definition.baggageIntervals.length === 0) {
      return [];
    }

    const pitches: ArabicPitch[] = [];
    let currentQt = this.root.toQuarterToneIndex();

    for (const interval of this.definition.baggageIntervals) {
      currentQt += interval; // interval is negative
      pitches.push(ArabicPitch.fromQuarterToneIndex(currentQt));
    }

    // Reverse to get ascending order
    return pitches.reverse();
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
    tonicCharacteristic: 'Grounding, noble, majestic foundation',
    baggageIntervals: [-7, -10] // A-natural, B-half-flat below tonic
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
    tonicCharacteristic: 'Deeply expressive, reflective, bittersweet',
    baggageIntervals: [-4, -7] // C-natural, B-half-flat below tonic
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
    tonicCharacteristic: 'Mystical, theatrical, yearning with augmented 2nd stretch',
    baggageIntervals: [-2, -5] // C♭ (B-natural), D♭ below tonic
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
    tonicCharacteristic: 'Melancholic, elegant, harmonic clarity',
    baggageIntervals: [-5, -9] // F-natural, E♭ below tonic
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

  /**
   * Previously unnamed ajnas from Abu Shumays' "Maqam Analysis: A Primer"
   */

  /**
   * Jins Secondary Rast G/C - Tonicizes the 4th above (C) while using Rast intervals.
   * Common in Maqam Rast (on the 5th scale degree) and Maqam Sikah.
   * Unlike true Rast on G, it lacks the characteristic baggage (F-half-sharp, E-natural) underneath.
   */
  public static readonly SECONDARY_RAST_GC: JinsDefinition = {
    id: 'secondary-rast-gc',
    name: 'Secondary Rast G/C',
    arabicName: 'راست ثانوي ج/دو',
    type: 'Tetrachord',
    intervals: [4, 3, 3],
    description: 'Rast intervals but tonicizes the 4th degree above (e.g., G tonicizing C). Common in Rast and Sikah. Lacks typical Rast baggage underneath.',
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch('G', '♮', 4),
    tonicCharacteristic: 'Secondary tonic at 4th degree, typically leads back to root'
  };

  /**
   * Jins Hijazkar C - Distinct Hijaz variant with diminished 3rd around tonic.
   * Characteristic of Maqam Hijazkar and Maqam Nawa Athar.
   * Features diminished 3rd (D♭ to B-natural) around the tonic, distinguishing it from regular Hijaz.
   */
  public static readonly HIJAZKAR: JinsDefinition = {
    id: 'hijazkar',
    name: 'Hijazkar',
    arabicName: 'حجازكار',
    type: 'Tetrachord',
    intervals: [2, 6, 2],
    description: 'Hijaz variant with distinctive diminished 3rd (D♭ to B-natural) around tonic. Central to Hijazkar and Nawa Athar.',
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch('C', '♮', 4),
    tonicCharacteristic: 'Intense, dramatic with characteristic diminished 3rd inflection'
  };

  /**
   * Jins Pseudo-Sikah - Resembles Sikah melodic motion but on natural pitch.
   * Typically tonicizes the 3rd scale degree of Hijaz or Ajam.
   * Brief and unstable, sometimes considered subsidiary tonicization within those ajnas.
   */
  public static readonly PSEUDO_SIKAH: JinsDefinition = {
    id: 'pseudo-sikah',
    name: 'Pseudo-Sikah',
    arabicName: 'سيكاه مزيف',
    type: 'Trichord',
    intervals: [3, 4],
    description: 'Melodic motion resembling Sikah but on natural pitch (not quarter-tone). Tonicizes 3rd degree of Hijaz or Ajam. Brief and unstable.',
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch('F', '♯', 4),
    tonicCharacteristic: 'Passing inflection, typically brief and unstable'
  };

  /**
   * Jins Secondary Saba - Intervallically Saba but tonicizes its 3rd note.
   * Named with two tonics: conventional (A) and actual (C).
   * Used in Maqam Rast, Maqam Ajam Ushayran, and Maqam Zanjaran.
   */
  public static readonly SECONDARY_SABA: JinsDefinition = {
    id: 'secondary-saba',
    name: 'Secondary Saba',
    arabicName: 'صبا ثانوي',
    type: 'Tetrachord',
    intervals: [3, 3, 2],
    description: 'Intervallically Saba but tonicizes its 3rd note (C instead of A). Creates intense dissonance. Used in Rast, Ajam, and Zanjaran.',
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch('A', '♮', 4),
    tonicCharacteristic: 'Intense secondary tonic at 3rd degree, dramatic tension'
  };

  /**
   * Jins Secondary Ajam - Tonicizes the 4th above conventional tonic.
   * e.g., C/F in Maqam Ajam (conventionally Ajam C, actually tonicizes F).
   * Common in Maqam Zanjaran and expanded Ajam passages.
   */
  public static readonly SECONDARY_AJAM: JinsDefinition = {
    id: 'secondary-ajam',
    name: 'Secondary Ajam',
    arabicName: 'عجم ثانوي',
    type: 'Pentachord',
    intervals: [4, 4, 2, 4],
    description: 'Ajam intervals but tonicizes the 4th above conventional root. Common in Zanjaran and expanded Ajam passages.',
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch('C', '♮', 4),
    tonicCharacteristic: 'Secondary tonic at 4th degree, bright major character'
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
      this.SABA,
      // Previously unnamed ajnas from Abu Shumays
      this.SECONDARY_RAST_GC,
      this.HIJAZKAR,
      this.PSEUDO_SIKAH,
      this.SECONDARY_SABA,
      this.SECONDARY_AJAM
    ];
  }

  public static findById(id: string): JinsDefinition | undefined {
    return this.getAllDefinitions().find(d => d.id === id);
  }
}
