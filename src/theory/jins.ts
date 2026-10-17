// src/theory/jins.ts
import { ArabicPitch } from "../core/pitch"

export type JinsType =
  "Trichord" | "Tetrachord" | "Pentachord" | "UndefinedSize"
export type JinsSizeLabel = "3-note" | "4-note" | "5-note" | "(undefined size)"

export interface JinsDefinition {
  readonly id: string
  readonly name: string
  readonly arabicName: string
  readonly type: JinsType
  /**
   * Official size category from Maqam World (https://www.maqamworld.com/en/jins.php):
   * '3-note' (Trichords), '4-note' (Tetrachords), '5-note' (Pentachords), '(undefined size)'
   */
  readonly sizeLabel: JinsSizeLabel
  /**
   * Internal step increments in quarter-tones.
   * e.g., Rast [4, 3, 3, 4] = 14 quarter-tones (perfect 5th), Upper Rast [4, 3, 3] = 10 quarter-tones (4th).
   */
  readonly intervals: readonly number[]
  readonly description: string
  readonly hasQuarterTones: boolean
  readonly defaultRoot: ArabicPitch
  readonly tonicCharacteristic: string
  /**
   * Signed quarter-tone offsets for notes outside the core jins.
   * Negative values are measured below the root/tonic; positive values are measured above the top pitch.
   * From Sami Abu Shumays' "Maqam Analysis: A Primer"
   */
  readonly baggageIntervals?: readonly number[]
  /**
   * Detailed explanation of the baggage notes and their melodic function.
   */
  readonly baggageDescription?: string
  readonly verified?: boolean
}

export class Jins {
  constructor(
    public readonly definition: JinsDefinition,
    public readonly root: ArabicPitch
  ) {
    this.validateFormula()
  }

  private validateFormula(): void {
    if (this.definition.type === "UndefinedSize") {
      // Undefined size ajnas have no single fixed note count requirement
      return
    }

    const expectedNotes =
      this.definition.type === "Trichord"
        ? 2
        : this.definition.type === "Tetrachord"
          ? 3
          : 4
    if (this.definition.intervals.length !== expectedNotes) {
      throw new Error(
        `Invalid interval length for ${this.definition.type} ${this.definition.name}. Expected ${expectedNotes}.`
      )
    }

    const totalQuarterTones = this.definition.intervals.reduce(
      (a, b) => a + b,
      0
    )
    if (this.definition.type === "Trichord") {
      // Sikah and Musta'ar trichords span 7 quarter tones (350 cents)
      if (this.definition.id === "sikah" || this.definition.id === "mustaar") {
        if (totalQuarterTones !== 7)
          throw new Error(
            `${this.definition.name} trichord must span 7 quarter tones (350 cents).`
          )
      }
    } else if (this.definition.type === "Tetrachord") {
      // Tetrachords span 10 quarter-tones (500 cents = Perfect 4th)
      if (
        this.definition.id !== "saba" &&
        this.definition.id !== "lami" &&
        this.definition.id !== "secondary-saba"
      ) {
        if (totalQuarterTones !== 10)
          throw new Error(
            `Standard tetrachord must span 10 quarter-tones (500 cents). Found: ${totalQuarterTones}`
          )
      }
    } else if (this.definition.type === "Pentachord") {
      // Pentachords span 14 quarter-tones (700 cents = Perfect 5th)
      if (totalQuarterTones !== 14)
        throw new Error(
          `Pentachord must span 14 quarter-tones (700 cents). Found: ${totalQuarterTones}`
        )
    }
  }

  /**
   * Get the standard pitches of the Jins starting from the root/tonic upwards.
   */
  public getPitches(): ArabicPitch[] {
    const pitches: ArabicPitch[] = [this.root]
    let currentQt = this.root.toQuarterToneIndex()
    for (const step of this.definition.intervals) {
      currentQt += step
      pitches.push(ArabicPitch.fromQuarterToneIndex(currentQt))
    }
    return pitches
  }

  /**
   * Get all baggage notes, with negative offsets anchored at the root and positive offsets at the top pitch.
   * From Abu Shumays' "Maqam Analysis: A Primer".
   */
  public getBaggageNotes(): ArabicPitch[] {
    if (
      !this.definition.baggageIntervals ||
      this.definition.baggageIntervals.length === 0
    ) {
      return []
    }
    const rootQt = this.root.toQuarterToneIndex()
    const topQt = this.getTopPitch().toQuarterToneIndex()
    return this.definition.baggageIntervals
      .map((offset) => {
        const anchorQt = offset < 0 ? rootQt : offset > 0 ? topQt : rootQt
        return ArabicPitch.fromQuarterToneIndex(anchorQt + offset)
      })
      .sort((a, b) => a.toQuarterToneIndex() - b.toQuarterToneIndex())
  }

  /**
   * Get the extended jins scale, with baggage pitches and core pitches in ascending order.
   */
  public getPitchesWithBaggage(): ArabicPitch[] {
    return [...this.getBaggageNotes(), ...this.getPitches()].sort(
      (a, b) => a.toQuarterToneIndex() - b.toQuarterToneIndex()
    )
  }

  public getTopPitch(): ArabicPitch {
    const pitches = this.getPitches()
    return pitches[pitches.length - 1]
  }

  public getTotalSpanCents(): number {
    return this.definition.intervals.reduce((a, b) => a + b, 0) * 50
  }

  public getSizeLabel(): JinsSizeLabel {
    return this.definition.sizeLabel
  }

  public transpose(newRoot: ArabicPitch): Jins {
    return new Jins(this.definition, newRoot)
  }
}

/**
 * Standard Ajnas Catalogue with upgraded sizes from Maqam World (https://www.maqamworld.com/en/jins.php):
 * Grouped into:
 *  - 3-note (Trichords)
 *  - 4-note (Tetrachords)
 *  - 5-note (Pentachords)
 *  - (undefined size)
 * Along with baggage intervals and previously unnamed ajnas from Sami Abu Shumays' "Maqam Analysis: A Primer".
 */
export class AjnasLibrary {
  // ==========================================
  // Group 1: 3-note (Trichords)
  // ==========================================
  public static readonly SECONDARY_AJAM: JinsDefinition = {
    id: "secondary-ajam",
    name: "3-notes Secondary Ajam",
    arabicName: "عجم ثانوي",
    type: "Trichord",
    sizeLabel: "3-note",
    intervals: [4, 4],
    description:
      "The 3-note version of Jins ‘Ajam occurs mostly when it is used as a secondary jins, for example on the 6th scale degree of Maqam Bayati, Maqam Saba or Maqam Kurd. This version is a carry over from Maqam ‘Ajam ‘Ushayran. It is notated here with its tonic on B♭.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("B", "♭", 4),
    tonicCharacteristic:
      "Secondary tonic at 4th degree, bright major character",
    baggageIntervals: [-6, -2, 2, 4],
    baggageDescription: "4 baggage notes: A4, G4,Eb5, F5",
    verified: true,
  }
  public static readonly MUSTAAR: JinsDefinition = {
    id: "mustaar",
    name: "Musta‘ar",
    arabicName: "مستعار",
    type: "Trichord",
    sizeLabel: "3-note",
    intervals: [5, 2], // E𝄳 to F♯ (5 qt / 250c), F♯ to G (2 qt / 100c) = 7 qt (350 cents)
    description:
      "3-note jins. Variation of Jins Sikah with a raised 2nd degree (F♯); tonic on E𝄳, ghammaz on G.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("E", "𝄳", 4),
    tonicCharacteristic:
      "Neutral 3rd root with distinctive augmented 2nd step to F♯",
    baggageIntervals: [-1, 4, 6],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly SIKAH: JinsDefinition = {
    id: "sikah",
    name: "Sikah",
    arabicName: "سيكاه",
    type: "Trichord",
    sizeLabel: "3-note",
    intervals: [3, 4], // E𝄳 to F (3 qt), F to G (4 qt) = 7 qt (350 cents)
    description:
      "3-note jins. Contemplative neutral 3rd trichord (E𝄳 - F - G); tonic on E𝄳, ghammaz on G.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("E", "𝄳", 4),
    tonicCharacteristic: "Rooted directly on quarter-tone neutral 3rd",
    baggageIntervals: [-7, -3, -1, 2],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  // ==========================================
  // Group 2: 4-note (Tetrachords)
  // ==========================================

  public static readonly BAYATI: JinsDefinition = {
    id: "bayati",
    name: "Bayati",
    arabicName: "بياتي",
    type: "Tetrachord",
    sizeLabel: "4-note",
    intervals: [3, 3, 4], // D to E𝄳 (3), E𝄳 to F (3), F to G (4) = 10 qt (500 cents)
    description:
      "4-note jins. Gentle opening with neutral 2nd; tonic on D, ghammaz on G.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("D", "♮", 4),
    tonicCharacteristic:
      "Deeply expressive, reflective, bittersweet foundation",
    baggageIntervals: [-7, -4, 4, 6],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly HIJAZ: JinsDefinition = {
    id: "hijaz",
    name: "Hijaz",
    arabicName: "حجاز",
    type: "Tetrachord",
    sizeLabel: "4-note",
    intervals: [2, 6, 2], // D to E♭ (2), E♭ to F♯ (6), F♯ to G (2) = 10 qt (500 cents)
    description:
      "4-note jins with augmented 2nd step (6 qt); tonic on D, ghammaz on G.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("D", "♮", 4),
    tonicCharacteristic:
      "Mystical, theatrical, yearning with augmented 2nd stretch",
    baggageIntervals: [-7, -4, 4, 6],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly HIJAZ_MURASSAA: JinsDefinition = {
    id: "hijaz-murassaa",
    name: "Hijaz Murassa‘",
    arabicName: "حجاز مرصع",
    type: "Tetrachord",
    sizeLabel: "4-note",
    intervals: [2, 6, 2], // D to E♭ (2), E♭ to F♯ (6), F♯ to G (2) = 10 qt
    description:
      "4-note jins. Variation of Jins Hijaz with lowered 5th (A♭) in melodic movement; tonic on D, ghammaz on G.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("D", "♮", 4),
    tonicCharacteristic:
      "Dramatic Hijaz inflection with lowered 5th degree in modulation",
    baggageIntervals: [-4, -2],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly KURD: JinsDefinition = {
    id: "kurd",
    name: "Kurd",
    arabicName: "كرد",
    type: "Tetrachord",
    sizeLabel: "4-note",
    intervals: [2, 4, 4], // D to E♭ (2), E♭ to F (4), F to G (4) = 10 qt
    description:
      "4-note Phrygian tetrachord starting with semitone step; tonic on D, ghammaz on G.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("D", "♮", 4),
    tonicCharacteristic: "Somber, gentle Phrygian intimacy",
    baggageIntervals: [-4, 4, 6],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly LAMI: JinsDefinition = {
    id: "lami",
    name: "Lami",
    arabicName: "لامي",
    type: "Tetrachord",
    sizeLabel: "4-note",
    intervals: [2, 4, 4], // D to E♭ (2), E♭ to F (4), F to G (4) = 10 qt
    description:
      "4-note jins. Tonic on D, ghammaz on G; distinctive Iraqi character featuring a diminished 5th (A♭) in progression.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("D", "♮", 4),
    tonicCharacteristic: "Melancholic Iraqi modal flavor with semitone opening",
    baggageIntervals: [4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly UPPER_AJAM: JinsDefinition = {
    id: "upper-ajam",
    name: "Upper ‘Ajam",
    arabicName: "عجم علوي",
    type: "Tetrachord",
    sizeLabel: "4-note",
    intervals: [4, 4, 2], // G to A (4), A to B (4), B to C (2) = 10 qt
    description:
      "4-note version of Jins ‘Ajam with ghammaz on G and tonic on C (the last degree of the jins scale).",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("G", "♮", 4),
    tonicCharacteristic: "Ghammaz on G4, tonic at upper octave C5",
    baggageIntervals: [-4, 4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly UPPER_RAST: JinsDefinition = {
    id: "upper-rast",
    name: "Upper Rast",
    arabicName: "راست علوي",
    type: "Tetrachord",
    sizeLabel: "4-note",
    intervals: [4, 3, 3], // G to A (4), A to B𝄳 (3), B𝄳 to C (3) = 10 qt
    description:
      "4-note version of Jins Rast with ghammaz on G and tonic on C (the last degree of the jins scale).",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("G", "♮", 4),
    tonicCharacteristic: "Ghammaz on G4, tonic at upper octave C5",
    baggageIntervals: [-4, 4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  // ==========================================
  // Group 3: 5-note (Pentachords)
  // ==========================================

  public static readonly AJAM: JinsDefinition = {
    id: "ajam",
    name: "‘Ajam",
    arabicName: "عجم",
    type: "Pentachord",
    sizeLabel: "5-note",
    intervals: [4, 4, 2, 4], // C to D (4), D to E (4), E to F (2), F to G (4) = 14 qt (700 cents)
    description: `Jins ‘Ajam has two versions:
    The 5-note version of Jins ‘Ajam is the most common version, and is the first jins in Maqam ‘Ajam and Maqam Shawq Afza. It is notated here with its tonic on C and its ghammaz on G. See the 3-note version in Tetrachords (3-note) tab above.`,
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("C", "♮", 4),
    tonicCharacteristic: "Triumphant, bright, open Western major affinity",
    baggageIntervals: [-10, -2, 4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
    verified:true
  }

  public static readonly AJAM_MURASSAA: JinsDefinition = {
    id: "ajam-murassaa",
    name: "‘Ajam Murassa‘",
    arabicName: "عجم مرصع",
    type: "Pentachord",
    sizeLabel: "5-note",
    intervals: [4, 4, 4, 2], // F to G (4), G to A (4), A to B♮ (4), B♮ to C (2) = 14 qt (700 cents)
    description: `5-note pentachord. Variation of Jins ‘Ajam with raised 4th (B♮ / Lydian 4th); tonic on F, ghammaz on C. Jins ‘Ajam Murassa‘ is a 5-note jins. It is notated here with its tonic on F and its ghammaz on C. Jins ‘Ajam Murassa‘ is not part of any maqam scale and usually occurs as a modulation from Jins ‘Ajam.`,
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("F", "♮", 4),
    tonicCharacteristic: "Lydian bright pentachord with raised 4th degree",
    baggageIntervals: [-2, 4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly ATHAR_KURD: JinsDefinition = {
    id: "athar-kurd",
    name: "Athar Kurd",
    arabicName: "أثر كرد",
    type: "Pentachord",
    sizeLabel: "5-note",
    intervals: [2, 4, 6, 2], // C to D♭ (2), D♭ to E♭ (4), E♭ to F♯ (6), F♯ to G (2) = 14 qt
    description:
      "5-note pentachord combining Kurd lower step with augmented 2nd; tonic on C, ghammaz on G. Jins Athar Kurd is the first jins in Maqam Athar Kurd.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("C", "♮", 4),
    tonicCharacteristic:
      "Intense tension combining Phrygian and augmented second colors",
    baggageIntervals: [-8, -2, 2],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
      verified:true
  }

  public static readonly JIHARKAH: JinsDefinition = {
    id: "jiharkah",
    name: "Jiharkah",
    arabicName: "جهاركاه",
    type: "Pentachord",
    sizeLabel: "5-note",
    intervals: [4, 3, 3, 4], // F to G (4), G to A♮↓ (3), A♮↓ to B♭↓ (3), B♭↓ to C (4) = 14 qt
    description:
      "Jins Jiharkah is a 5-note jins. It is notated here with its tonic on F and its ghammaz on C. The 3rd and 4th degrees are usually played lower than notated. Jins Jiharkah is the first jins in Maqam Jiharkah.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("F", "♮", 4),
    tonicCharacteristic:
      "Gentle, open modal quality with subtle neutral inflections",
    baggageIntervals: [-6, -3],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly NAHAWAND: JinsDefinition = {
    id: "nahawand",
    name: "Nahawand",
    arabicName: "نهاوند",
    type: "Pentachord",
    sizeLabel: "5-note",
    intervals: [4, 2, 4, 4], // C to D (4), D to E♭ (2), E♭ to F (4), F to G (4) = 14 qt (700 cents)
    description:
      "5-note pentachord spanning a perfect 5th (700 cents); tonic on C, ghammaz on G.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("C", "♮", 4),
    tonicCharacteristic:
      "Melancholic, elegant, harmonic clarity spanning C to G",
    baggageIntervals: [-8, -6, -2, 2],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly NIKRIZ: JinsDefinition = {
    id: "nikriz",
    name: "Nikriz",
    arabicName: "نكريز",
    type: "Pentachord",
    sizeLabel: "5-note",
    intervals: [4, 2, 6, 2], // C to D (4), D to E♭ (2), E♭ to F♯ (6), F♯ to G (2) = 14 qt (700 cents)
    description:
      "5-note pentachord with augmented 2nd between 3rd and 4th degrees; tonic on C, ghammaz on G.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("C", "♮", 4),
    tonicCharacteristic: "Virtuosic, dramatic tension on 4th scale degree (F♯)",
    baggageIntervals: [-8, -2, 2, 4, 6],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }
  public static readonly NAWA_ATHAR_NIKRIZ = AjnasLibrary.NIKRIZ

  public static readonly RAST: JinsDefinition = {
    id: "rast",
    name: "Rast",
    arabicName: "راست",
    type: "Pentachord",
    sizeLabel: "5-note",
    intervals: [4, 3, 3, 4], // C to D (4), D to E𝄳 (3), E𝄳 to F (3), F to G (4) = 14 qt (700 cents)
    description:
      "5-note pentachord with neutral 3rd (E𝄳); foundational root cell spanning a perfect 5th from tonic C to ghammaz G.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("C", "♮", 4),
    tonicCharacteristic:
      "Grounding, noble, majestic foundation spanning C to G",
    baggageIntervals: [-6, -3, 2, 4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly SAZKAR: JinsDefinition = {
    id: "sazkar",
    name: "Sazkar",
    arabicName: "سازكار",
    type: "Pentachord",
    sizeLabel: "5-note",
    intervals: [6, 1, 3, 4], // C to D♯ (6), D♯ to E𝄳 (1), E𝄳 to F (3), F to G (4) = 14 qt
    description:
      "5-note pentachord. Variation of Jins Rast with raised 2nd degree (D♯); tonic on C, ghammaz on G.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("C", "♮", 4),
    tonicCharacteristic:
      "Intriguing augmented step from C to D♯ resolving to neutral 3rd E𝄳",
    baggageIntervals: [-3, 4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  // ==========================================
  // Group 4: (undefined size)
  // ==========================================

  public static readonly HIJAZKAR: JinsDefinition = {
    id: "hijazkar",
    name: "Hijazkar",
    arabicName: "حجازكار",
    type: "UndefinedSize",
    sizeLabel: "(undefined size)",
    intervals: [6, 2, 2, 6], // C to D♭ (2), D♭ to E (6), E to F (2)
    description:
      "Undefined size jins with no ghammaz. Centered around tonic with distinctive diminished 3rd framing (D♭ to B♮).",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("A", "♭", 4),
    tonicCharacteristic:
      "Jins Hijazkar has no ghammaz, and therefore no defined size. Its melody is centered around its tonic, notated here on C. Jins Hijazkar occurs on the octave of Maqam Hijazkar.",
    baggageIntervals: [2],
    baggageDescription: "One baggage note above the top pitch (F5)",
  }

  public static readonly MUKHALIF_SHARQI: JinsDefinition = {
    id: "mukhalif-sharqi",
    name: "Mukhalif Sharqi",
    arabicName: "مخالف شرقي",
    type: "UndefinedSize",
    sizeLabel: "(undefined size)",
    intervals: [3, 2], // E𝄳 to F (3), F to G♭ (2)
    description:
      "Undefined size jins with no ghammaz. Variation of Jins Sikah with lowered 3rd degree (G♭); tonic on E𝄳.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("E", "𝄳", 4),
    tonicCharacteristic: "Somber, intimate Iraqi and Gulf modal inflection",
  }

  public static readonly NAHAWAND_MURASSAA: JinsDefinition = {
    id: "nahawand-murassaa",
    name: "Nahawand Murassa‘",
    arabicName: "نهاوند مرصع",
    type: "UndefinedSize",
    sizeLabel: "(undefined size)",
    intervals: [4, 2, 4, 2], // C to D (4), D to E♭ (2), E♭ to F (4), F to G♭ (2)
    description:
      "Undefined size jins with no ghammaz. Variation of Jins Nahawand with lowered 5th degree (G♭); tonic on C.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("C", "♮", 4),
    tonicCharacteristic:
      "Dark, chromatic Nahawand color with tritone / diminished 5th",
    baggageIntervals: [-2, 6],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly SABA: JinsDefinition = {
    id: "saba",
    name: "Saba",
    arabicName: "صبا",
    type: "UndefinedSize",
    sizeLabel: "(undefined size)",
    intervals: [3, 3, 2], // D to E𝄳 (3), E𝄳 to F (3), F to G♭ (2) = 8 qt (400 cents)
    description:
      "Undefined / ambiguous size jins (ghammaz on 3rd degree F4 or 6th degree B♭4). Deeply emotional and narrow 400-cent span.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("D", "♮", 4),
    tonicCharacteristic: "Heart-wrenching grief, ultra-compressed span",
    baggageIntervals: [-7, -4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly SABA_DALANSHIN: JinsDefinition = {
    id: "saba-dalanshin",
    name: "Saba Dalanshin",
    arabicName: "صبا دلنشين",
    type: "UndefinedSize",
    sizeLabel: "(undefined size)",
    intervals: [2, 6, 2], // C to D♭ (2), D♭ to E (6), E to F (2)
    description:
      "Undefined size jins with no ghammaz. Special version of Jins Saba with its tonic on the 3rd degree (C); occurs at octave of Maqam Rast.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("C", "♮", 5),
    tonicCharacteristic: "Upper octave Saba inflection resolving to C",
    baggageIntervals: [-2, 4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly SABA_ZAMZAM: JinsDefinition = {
    id: "saba-zamzam",
    name: "Saba Zamzam",
    arabicName: "صبا زمزم",
    type: "UndefinedSize",
    sizeLabel: "(undefined size)",
    intervals: [2, 4, 2], // D to E♭ (2), E♭ to F (4), F to G♭ (2)
    description:
      "Undefined / ambiguous size jins (tonic on D, ghammaz on F or B♭). Similar to Jins Saba but with minor 2nd (E♭) instead of neutral 2nd.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("D", "♮", 4),
    tonicCharacteristic:
      "Somber, introspective without quarter-tone microtones",
    baggageIntervals: [-4],
    baggageDescription:
      "Baggage intervals use negative offsets below the root and positive offsets above the top pitch.",
  }

  public static readonly SIKAH_BALADI: JinsDefinition = {
    id: "sikah-baladi",
    name: "Sikah Baladi",
    arabicName: "سيكاه بلدي",
    type: "UndefinedSize",
    sizeLabel: "(undefined size)",
    intervals: [4, 3, 3, 3, 2], // E𝄳↓, F𝄲↑, G, A𝄳↓, B𝄳↑, C↓
    description:
      "Undefined size jins with no ghammaz. Deeply microtonal traditional Egyptian folk and classical mode rooted on E𝄳.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("E", "𝄳", 4),
    tonicCharacteristic:
      "Fluid neutral intonation unique to Egyptian Baladi tradition",
    baggageIntervals: [-3],
    baggageDescription: "Baggage below E𝄳 includes Dukah (D4).",
  }

  // ==========================================
  // Sami Abu Shumays Unnamed / Theoretical Ajnas
  // ==========================================

  public static readonly SECONDARY_RAST_GC: JinsDefinition = {
    id: "secondary-rast-gc",
    name: "Secondary Rast G/C",
    arabicName: "راست ثانوي صول/دو",
    type: "Tetrachord",
    sizeLabel: "4-note",
    intervals: [4, 3, 3],
    description:
      "Rast intervals but tonicizes the 4th degree above (e.g., G tonicizing C). Common in Rast and Sikah. Lacks typical Rast baggage underneath.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("G", "♮", 4),
    tonicCharacteristic:
      "Secondary tonic at 4th degree, typically leads back to root",
    baggageIntervals: [-4],
    baggageDescription:
      "Minimal baggage (F♮) because it functions as secondary dominant leading to C.",
  }

  public static readonly PSEUDO_SIKAH: JinsDefinition = {
    id: "pseudo-sikah",
    name: "Pseudo-Sikah",
    arabicName: "شبه سيكاه",
    type: "Trichord",
    sizeLabel: "3-note",
    intervals: [3, 4],
    description:
      "Melodic motion resembling Sikah but on natural pitch (not quarter-tone). Tonicizes 3rd degree of Hijaz or Ajam. Brief and unstable.",
    hasQuarterTones: false,
    defaultRoot: new ArabicPitch("F", "♯", 4),
    tonicCharacteristic: "Passing inflection, typically brief and unstable",
    baggageIntervals: [-8, -4],
    baggageDescription:
      "Baggage notes below F♯4 (D4 and E4) support modal approach without microtonal inflections.",
  }

  public static readonly SECONDARY_SABA: JinsDefinition = {
    id: "secondary-saba",
    name: "Secondary Saba",
    arabicName: "صبا ثانوي",
    type: "UndefinedSize",
    sizeLabel: "(undefined size)",
    intervals: [3, 3, 2],
    description:
      "Intervallically Saba but tonicizes its 3rd note (C instead of A). Creates intense dissonance. Used in Rast, Ajam, and Zanjaran.",
    hasQuarterTones: true,
    defaultRoot: new ArabicPitch("A", "♮", 4),
    tonicCharacteristic:
      "Intense secondary tonic at 3rd degree, dramatic tension",
    baggageIntervals: [-10, -8, -4],
    baggageDescription:
      "Baggage notes below A4 (E4, F4, G4) mirror the compressed lower secondary approach.",
  }

  public static getAllDefinitions(): JinsDefinition[] {
    return [
      // 3-note (Trichords)
      this.MUSTAAR,
      this.SIKAH,
      // 4-note (Tetrachords)
      this.BAYATI,
      this.HIJAZ,
      this.HIJAZ_MURASSAA,
      this.KURD,
      this.LAMI,
      this.UPPER_AJAM,
      this.UPPER_RAST,
      // 5-note (Pentachords)
      this.AJAM,
      this.AJAM_MURASSAA,
      this.ATHAR_KURD,
      this.JIHARKAH,
      this.NAHAWAND,
      this.NIKRIZ,
      this.RAST,
      this.SAZKAR,
      // (undefined size)
      this.HIJAZKAR,
      this.MUKHALIF_SHARQI,
      this.NAHAWAND_MURASSAA,
      this.SABA,
      this.SABA_DALANSHIN,
      this.SABA_ZAMZAM,
      this.SIKAH_BALADI,
      // Previously unnamed ajnas from Abu Shumays
      this.SECONDARY_RAST_GC,
      this.PSEUDO_SIKAH,
      this.SECONDARY_SABA,
      this.SECONDARY_AJAM,
    ]
  }

  public static findById(id: string): JinsDefinition | undefined {
    if (id === "nikriz" || id === "nawa-athar-nikriz") return this.NIKRIZ
    if (id === "hijaz-murassaa" || id === "hijaz_murassaa")
      return this.HIJAZ_MURASSAA
    if (id === "ajam-murassaa" || id === "ajam_murassaa")
      return this.AJAM_MURASSAA
    if (id === "nahawand-murassaa" || id === "nahawand_murassaa")
      return this.NAHAWAND_MURASSAA
    if (id === "saba-dalanshin" || id === "saba_dalanshin")
      return this.SABA_DALANSHIN
    if (id === "saba-zamzam" || id === "saba_zamzam") return this.SABA_ZAMZAM
    if (id === "sikah-baladi" || id === "sikah_baladi") return this.SIKAH_BALADI
    if (id === "mukhalif-sharqi" || id === "mukhalif_sharqi")
      return this.MUKHALIF_SHARQI
    if (id === "upper-ajam" || id === "upper_ajam") return this.UPPER_AJAM
    if (id === "upper-rast" || id === "upper_rast") return this.UPPER_RAST
    if (id === "athar-kurd" || id === "athar_kurd") return this.ATHAR_KURD
    return this.getAllDefinitions().find((d) => d.id === id)
  }
}
