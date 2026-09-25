// src/theory/maqam.ts
import { ArabicPitch } from '../core/pitch';
import { Jins, AjnasLibrary, type JinsDefinition } from './jins';

export type MaqamConnection = 'Ittisal' | 'Infisal' | 'Tadakhul';

export type MaqamFamilyMnemonic = 
  | 'Ṣabā' 
  | 'Nahāwand' 
  | 'ʿAjam' 
  | 'Bayātī' 
  | 'Sīkāh' 
  | 'Ḥijāz' 
  | 'Rāst' 
  | 'Kurd';

export interface MaqamFamily {
  readonly mnemonic: MaqamFamilyMnemonic;
  readonly arabicLetter: string;
  readonly arabicName: string;
  readonly rootJinsDef: JinsDefinition;
  readonly description: string;
}

export interface MaqamScaleStructure {
  readonly id: string;
  readonly name: string;
  readonly arabicName?: string;
  readonly family: MaqamFamilyMnemonic | 'None';
  readonly lowerJins: Jins;
  readonly connection: MaqamConnection;
  readonly upperJins: Jins;
  readonly ghammaz: ArabicPitch;
  /**
   * Upper register extensions or octave alterations (e.g. Saba's flat octave D♭).
   */
  readonly extraPitches?: ArabicPitch[];
  readonly description: string;
}

export class Maqam {
  public readonly id: string;
  public readonly name: string;
  public readonly arabicName?: string;
  public readonly family: MaqamFamilyMnemonic | 'None';
  public readonly lowerJins: Jins;
  public readonly connection: MaqamConnection;
  public readonly upperJins: Jins;
  public readonly ghammaz: ArabicPitch;
  public readonly extraPitches: readonly ArabicPitch[];
  public readonly description: string;

  constructor(structure: MaqamScaleStructure) {
    this.id = structure.id;
    this.name = structure.name;
    this.arabicName = structure.arabicName;
    this.family = structure.family;
    this.lowerJins = structure.lowerJins;
    this.connection = structure.connection;
    this.upperJins = structure.upperJins;
    this.ghammaz = structure.ghammaz;
    this.extraPitches = structure.extraPitches ?? [];
    this.description = structure.description;
    this.validateConnection();
  }

  private validateConnection(): void {
    const lowerTop = this.lowerJins.getTopPitch();
    const upperRoot = this.upperJins.root;

    if (this.connection === 'Ittisal') {
      if (!lowerTop.equals(upperRoot)) {
        throw new Error(`Ittisal requires lower jins top (${lowerTop}) to equal upper jins root (${upperRoot}).`);
      }
    } else if (this.connection === 'Infisal') {
      const gap = lowerTop.diffQuarterTones(upperRoot);
      if (gap !== 4) {
        throw new Error(`Infisal requires a whole-tone gap (4 quarter-tones / 200 cents). Found: ${gap} qt.`);
      }
    }
  }

  /**
   * Constructs the full ascending scale.
   */
  public getScale(): ArabicPitch[] {
    const lowerPitches = this.lowerJins.getPitches();
    const upperPitches = this.upperJins.getPitches();

    let combined: ArabicPitch[];
    if (this.connection === 'Ittisal') {
      // Shared pivot note (Ghammaz)
      combined = [...lowerPitches, ...upperPitches.slice(1)];
    } else if (this.connection === 'Infisal') {
      // Whole-tone gap (Infisal)
      combined = [...lowerPitches, ...upperPitches];
    } else {
      // Tadakhul (interlocking or customized)
      combined = [...lowerPitches, ...upperPitches];
    }

    if (this.extraPitches.length > 0) {
      combined = [...combined, ...this.extraPitches];
    }

    const uniqueCombined: ArabicPitch[] = [];
    for (const p of combined) {
      if (uniqueCombined.length === 0 || !uniqueCombined[uniqueCombined.length - 1].equals(p)) {
        uniqueCombined.push(p);
      }
    }

    return uniqueCombined;
  }

  public getTonic(): ArabicPitch {
    return this.lowerJins.root;
  }

  public getGhammaz(): ArabicPitch {
    return this.ghammaz;
  }

  public isMemberOfFamily(mnemonic: MaqamFamilyMnemonic): boolean {
    return this.family === mnemonic;
  }

  /**
   * Transpose entire Maqam to a new target tonic pitch.
   * Preserves exact microtonal interval structure, Ghammaz pivot relationship,
   * connection type (Ittisal/Infisal/Tadakhul), and upper extension pitches.
   */
  public transpose(newTonic: ArabicPitch): Maqam {
    if (this.lowerJins.root.equals(newTonic)) {
      return this;
    }

    const deltaQt = this.lowerJins.root.diffQuarterTones(newTonic);
    const transposedLower = this.lowerJins.transpose(newTonic);

    const newUpperRoot = this.upperJins.root.transpose(deltaQt);
    const transposedUpper = this.upperJins.transpose(newUpperRoot);

    const newGhammaz = this.ghammaz.transpose(deltaQt);
    const newExtras = this.extraPitches.map(p => p.transpose(deltaQt));

    const transInfo = MaqamatCatalogue.getTranspositionInfo(this, newTonic);
    const sign = deltaQt > 0 ? '+' : '';
    const centsText = `${sign}${deltaQt * 50}¢`;

    return new Maqam({
      id: `${this.id}-transposed-${newTonic.toScientificString()}${newTonic.octave}`,
      name: transInfo?.name ?? `${this.name} on ${newTonic.toScientificString()}${newTonic.octave}`,
      arabicName: transInfo?.arabicName ?? (this.arabicName ? `${this.arabicName} مصوّر` : undefined),
      family: this.family,
      lowerJins: transposedLower,
      connection: this.connection,
      upperJins: transposedUpper,
      ghammaz: newGhammaz,
      extraPitches: newExtras,
      description: transInfo?.description ?? `Transposed variant of ${this.name} starting on ${newTonic.toScientificString()}${newTonic.octave} (${centsText} shift)`
    });
  }
}

/**
 * Registry of The 8 Families (صنع بسحرك) and core Maqamat
 */
export class MaqamatCatalogue {
  public static readonly FAMILIES: Record<MaqamFamilyMnemonic, MaqamFamily> = {
    'Ṣabā': {
      mnemonic: 'Ṣabā',
      arabicLetter: 'ص',
      arabicName: 'صبا',
      rootJinsDef: AjnasLibrary.SABA,
      description: 'Defined by narrow 400-cent lower Jins Saba with yearning path'
    },
    'Nahāwand': {
      mnemonic: 'Nahāwand',
      arabicLetter: 'ن',
      arabicName: 'نهاوند',
      rootJinsDef: AjnasLibrary.NAHAWAND,
      description: 'Minor-third based family with natural minor qualities'
    },
    'ʿAjam': {
      mnemonic: 'ʿAjam',
      arabicLetter: 'ع',
      arabicName: 'عجم',
      rootJinsDef: AjnasLibrary.AJAM,
      description: 'Western major scale equivalent family spanning bright intervals'
    },
    'Bayātī': {
      mnemonic: 'Bayātī',
      arabicLetter: 'ب',
      arabicName: 'بياتي',
      rootJinsDef: AjnasLibrary.BAYATI,
      description: 'Beloved folk and classical family with neutral 2nd'
    },
    'Sīkāh': {
      mnemonic: 'Sīkāh',
      arabicLetter: 'س',
      arabicName: 'سيكاه',
      rootJinsDef: AjnasLibrary.SIKAH,
      description: 'Rooted directly on neutral third (E𝄳)'
    },
    'Ḥijāz': {
      mnemonic: 'Ḥijāz',
      arabicLetter: 'ح',
      arabicName: 'حجاز',
      rootJinsDef: AjnasLibrary.HIJAZ,
      description: 'Harmonic and dramatic colors with augmented 2nd'
    },
    'Rāst': {
      mnemonic: 'Rāst',
      arabicLetter: 'ر',
      arabicName: 'راست',
      rootJinsDef: AjnasLibrary.RAST,
      description: 'The foundational "mother scale" of Arabic music'
    },
    'Kurd': {
      mnemonic: 'Kurd',
      arabicLetter: 'ك',
      arabicName: 'كرد',
      rootJinsDef: AjnasLibrary.KURD,
      description: 'Grounded Phrygian flavored modal family'
    }
  };

  /**
   * Constructs Maqam Rast (Module 3.4)
   * Lower: Jins Rast on C4 | Infisal | Upper: Jins Rast on G4 | Ghammaz = G4
   */
  public static buildRast(): Maqam {
    const lower = new Jins(AjnasLibrary.RAST, new ArabicPitch('C', '♮', 4));
    const upper = new Jins(AjnasLibrary.RAST, new ArabicPitch('G', '♮', 4));
    return new Maqam({
      id: 'rast',
      name: 'Maqam Rast',
      arabicName: 'مقام راست',
      family: 'Rāst',
      lowerJins: lower,
      connection: 'Infisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      extraPitches: [new ArabicPitch('C', '♮', 5)],
      description: 'Symmetrical mother scale with neutral 3rd (E𝄳) and neutral 7th (B𝄳/Awj)'
    });
  }

  /**
   * Constructs Maqam Bayati (Module 8.1)
   * Lower: Jins Bayati on D4 | Ittisal | Upper: Jins Nahawand on G4 | Ghammaz = G4
   */
  public static buildBayati(): Maqam {
    const lower = new Jins(AjnasLibrary.BAYATI, new ArabicPitch('D', '♮', 4));
    const upper = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4));
    return new Maqam({
      id: 'bayati',
      name: 'Maqam Bayati',
      arabicName: 'مقام بياتي',
      family: 'Bayātī',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      extraPitches: [new ArabicPitch('D', '♮', 5)],
      description: 'Emotional centerpiece of Arabic music: D - E𝄳 - F - G - A - B♭ - C - D'
    });
  }

  /**
   * Constructs Maqam Hijaz (Module 3.5)
   * Lower: Jins Hijaz on D4 | Ittisal | Upper: Jins Nahawand-type on G4 | Ghammaz = G4
   */
  public static buildHijaz(): Maqam {
    const lower = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch('D', '♮', 4));
    const upper = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4));
    return new Maqam({
      id: 'hijaz',
      name: 'Maqam Hijaz',
      arabicName: 'مقام حجاز',
      family: 'Ḥijāz',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      extraPitches: [new ArabicPitch('D', '♮', 5)],
      description: 'Dramatic augmented-2nd lower tetrachord combined conjunctly with Nahawand'
    });
  }

  /**
   * Constructs Maqam Nahawand (Module 8.2)
   * Lower: Jins Nahawand on C4 | Infisal | Upper: Jins Kurd on G4 | Ghammaz = G4
   */
  public static buildNahawand(): Maqam {
    const lower = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('C', '♮', 4));
    const upper = new Jins(AjnasLibrary.KURD, new ArabicPitch('G', '♮', 4));
    return new Maqam({
      id: 'nahawand',
      name: 'Maqam Nahawand',
      arabicName: 'مقام نهاوند',
      family: 'Nahāwand',
      lowerJins: lower,
      connection: 'Infisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      extraPitches: [new ArabicPitch('C', '♮', 5)],
      description: 'The Arabic Natural Minor: C - D - E♭ - F - G - A♭ - B♭ - C'
    });
  }

  /**
   * Constructs Maqam Kurd (Module 8.3)
   * Lower: Jins Kurd on D4 | Ittisal | Upper: Jins Kurd on G4 | Ghammaz = G4
   */
  public static buildKurd(): Maqam {
    const lower = new Jins(AjnasLibrary.KURD, new ArabicPitch('D', '♮', 4));
    const upper = new Jins(AjnasLibrary.KURD, new ArabicPitch('G', '♮', 4));
    return new Maqam({
      id: 'kurd',
      name: 'Maqam Kurd',
      arabicName: 'مقام كرد',
      family: 'Kurd',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      extraPitches: [new ArabicPitch('D', '♮', 5)],
      description: 'Symmetrical double-Kurd construction: D - E♭ - F - G - A♭ - B♭ - C - D'
    });
  }

  /**
   * Constructs Maqam Ajam (Module 8.4)
   * Lower: Jins Ajam pentachord on B♭3 | Upper continuation to octave B♭4 | Ghammaz = F4
   */
  public static buildAjam(): Maqam {
    const lower = new Jins(AjnasLibrary.AJAM, new ArabicPitch('B', '♭', 3));
    // Upper tetrachord starting on F4 (Ajam on F or upper register)
    const upper = new Jins(AjnasLibrary.AJAM, new ArabicPitch('F', '♮', 4));
    return new Maqam({
      id: 'ajam',
      name: 'Maqam Ajam',
      arabicName: 'مقام عجم',
      family: 'ʿAjam',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('F', '♮', 4),
      extraPitches: [new ArabicPitch('B', '♭', 4)],
      description: 'Identical to Western B♭ Major: B♭ - C - D - E♭ - F - G - A - B♭'
    });
  }

  /**
   * Constructs Maqam Sikah (Module 5.2)
   * Lower: Jins Sikah on E𝄳4 | Ittisal | Upper: Jins Upper Rast on G4 | Ghammaz = G4
   */
  public static buildSikah(): Maqam {
    const lower = new Jins(AjnasLibrary.SIKAH, new ArabicPitch('E', '𝄳', 4));
    const upper = new Jins(AjnasLibrary.RAST, new ArabicPitch('G', '♮', 4));
    return new Maqam({
      id: 'sikah',
      name: 'Maqam Sikah',
      arabicName: 'مقام سيكاه',
      family: 'Sīkāh',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      extraPitches: [new ArabicPitch('C', '♮', 5), new ArabicPitch('D', '♮', 5), new ArabicPitch('E', '𝄳', 5)],
      description: 'Tonic on quarter-tone E𝄳: E𝄳 - F - G - A - B𝄳 - C - D - E𝄳'
    });
  }

  /**
   * Constructs Maqam Nikriz / Nawa Athar (Module 5.4)
   * Lower: Pentachord Nikriz on C4 | Ghammaz = G4
   */
  public static buildNikriz(): Maqam {
    const lower = new Jins(AjnasLibrary.NAWA_ATHAR_NIKRIZ, new ArabicPitch('C', '♮', 4));
    const upper = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4));
    return new Maqam({
      id: 'nikriz',
      name: 'Maqam Nikriz',
      arabicName: 'مقام نكريز',
      family: 'Nahāwand',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      extraPitches: [new ArabicPitch('C', '♮', 5)],
      description: 'Ornate pentachord with augmented 2nd: C - D - E♭ - F♯ - G - A♭ - B - C'
    });
  }

  /**
   * Constructs Maqam Saba (Module 8.5)
   * Lower: Jins Saba on D4 | Narrow tetrachord | Upper flat-octave D♭5
   */
  public static buildSaba(): Maqam {
    const lower = new Jins(AjnasLibrary.SABA, new ArabicPitch('D', '♮', 4));
    // Upper continuing jins starting on F or G♭
    const upper = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch('F', '♮', 4));
    return new Maqam({
      id: 'saba',
      name: 'Maqam Saba',
      arabicName: 'مقام صبا',
      family: 'Ṣabā',
      lowerJins: lower,
      connection: 'Tadakhul',
      upperJins: upper,
      ghammaz: new ArabicPitch('F', '♮', 4),
      extraPitches: [
        new ArabicPitch('B', '♭', 4),
        new ArabicPitch('C', '♮', 5),
        new ArabicPitch('D', '♭', 5) // Characteristic flat octave
      ],
      description: 'Intense grief: D - E𝄳 - F - G♭ - A♭ - B♭ - C - D♭ (flat octave)'
    });
  }

  public static getAllMaqamat(): Maqam[] {
    return [
      this.buildRast(),
      this.buildBayati(),
      this.buildHijaz(),
      this.buildNahawand(),
      this.buildKurd(),
      this.buildAjam(),
      this.buildSikah(),
      this.buildNikriz(),
      this.buildSaba()
    ];
  }

  public static findById(id: string): Maqam | undefined {
    return this.getAllMaqamat().find(m => m.id === id);
  }

  /**
   * Provides classical Arabic transposition names and context for any (Maqam, newTonic) combination.
   */
  public static getTranspositionInfo(
    baseMaqam: Maqam,
    newTonic: ArabicPitch
  ): { name: string; arabicName: string; traditionalTitle?: string; description: string; intervalName: string; centsOffset: number } | null {
    const originalTonic = baseMaqam.getTonic();
    const deltaQt = originalTonic.diffQuarterTones(newTonic);
    const centsOffset = deltaQt * 50;

    const intervalNames: Record<number, string> = {
      '-24': 'Octave Down (-1200¢)',
      '-14': 'Perfect 5th Down (-700¢)',
      '-10': 'Perfect 4th Down (-500¢)',
      '-8': 'Major 3rd Down (-400¢)',
      '-7': 'Neutral 3rd Down (-350¢)',
      '-6': 'Minor 3rd Down (-300¢)',
      '-4': 'Major 2nd Down (-200¢)',
      '-3': 'Neutral 2nd Down (-150¢)',
      '-2': 'Minor 2nd Down (-100¢)',
      '0': 'Original Root / Unison (0¢)',
      '2': 'Minor 2nd Up (+100¢)',
      '3': 'Neutral 2nd Up (+150¢)',
      '4': 'Major 2nd Up (+200¢)',
      '6': 'Minor 3rd Up (+300¢)',
      '7': 'Neutral 3rd Up (+350¢)',
      '8': 'Major 3rd Up (+400¢)',
      '10': 'Perfect 4th Up (+500¢)',
      '14': 'Perfect 5th Up (+700¢)',
      '18': 'Major 6th Up (+900¢)',
      '24': 'Octave Up (+1200¢)'
    };
    const intervalName = intervalNames[deltaQt] || `${deltaQt > 0 ? '+' : ''}${centsOffset}¢`;

    // Map of classical historical names (Taswir)
    const baseKey = baseMaqam.id.toLowerCase();
    const tonicKey = `${newTonic.diatonic}${newTonic.accidental}${newTonic.octave}`;

    const registry: Record<string, Record<string, { name: string; arabicName: string; title: string; desc: string }>> = {
      rast: {
        'G♮3': { name: 'Maqam Yakah (Rast on G3)', arabicName: 'مقام يكاه', title: 'Yakah', desc: 'Rast transposed down a 4th to fundamental G3 (Yakah)' },
        'C♮4': { name: 'Maqam Rast (Original C4)', arabicName: 'مقام راست', title: 'Rast', desc: 'Foundational mother scale on C4 (Rast)' },
        'D♮4': { name: 'Maqam Nirz / Mahur (Rast on D4)', arabicName: 'مقام نيرز', title: 'Nirz', desc: 'Rast transposed up a whole step to D4 (Dukah)' },
        'G♮4': { name: 'Maqam Mahur (Rast on G4)', arabicName: 'مقام ماهور (راست نوى)', title: 'Mahur / Nawa', desc: 'Famous classical transposition of Rast up a 5th to G4 (Nawa)' },
        'C♮5': { name: 'Maqam Kirdan (Rast on C5)', arabicName: 'مقام كردان', title: 'Kirdan', desc: 'Rast transposed an octave up to C5 (Kirdan)' }
      },
      bayati: {
        'C♮4': { name: 'Bayati ‘ala al-Rast (Bayati on C4)', arabicName: 'بياتي على الراست', title: 'Bayati Rast', desc: 'Bayati transposed down a whole tone to C4' },
        'D♮4': { name: 'Maqam Bayati (Original D4)', arabicName: 'مقام بياتي', title: 'Bayati', desc: 'Beloved classical modal center on D4 (Dukah)' },
        'G♮4': { name: 'Maqam Shuri / Bayati Nawa (on G4)', arabicName: 'مقام شوري (بياتي نوى)', title: 'Shuri', desc: 'Bayati transposed up a 4th to G4 (Nawa), often incorporating Hijaz' },
        'A♮4': { name: 'Maqam Husayni (Bayati on A4)', arabicName: 'مقام حسيني', title: 'Husayni', desc: 'Bayati transposed up a 5th to A4 (Husayni)' }
      },
      hijaz: {
        'C♮4': { name: 'Maqam Hijaz Kar (Hijaz on C4)', arabicName: 'مقام حجاز كار', title: 'Hijaz Kar', desc: 'Hijaz transposed down a whole step to C4 (Rast)' },
        'D♮4': { name: 'Maqam Hijaz (Original D4)', arabicName: 'مقام حجاز', title: 'Hijaz', desc: 'The dramatic classical core on D4 (Dukah)' },
        'G♮4': { name: 'Maqam Shahnaz (Hijaz on G4)', arabicName: 'مقام شهناز', title: 'Shahnaz', desc: 'Hijaz transposed up a 4th to G4 (Nawa)' },
        'A♮4': { name: 'Maqam Suzidil (Hijaz on A4)', arabicName: 'مقام سوزدل', title: 'Suzidil', desc: 'Hijaz transposed up a 5th to A4 (Husayni)' }
      },
      nahawand: {
        'C♮4': { name: 'Maqam Nahawand (Original C4)', arabicName: 'مقام نهاوند', title: 'Nahawand', desc: 'Classical minor-mode foundation on C4' },
        'D♮4': { name: 'Nahawand Murassah (on D4)', arabicName: 'نهاوند مرصع', title: 'Nahawand Murassah', desc: 'Nahawand transposed up a whole tone to D4' },
        'G♮4': { name: 'Maqam Farahfaza (Nahawand on G4)', arabicName: 'مقام فرحفزا', title: 'Farahfaza', desc: 'Nahawand transposed up a 5th to G4 (Nawa), celebrated for poignant lyricism' }
      },
      sikah: {
        'B𝄳3': { name: 'Maqam ‘Iraq (Sikah on B𝄳3)', arabicName: 'مقام عراق', title: '‘Iraq', desc: 'Sikah transposed down a 4th to neutral B𝄳3 (Iraq)' },
        'E𝄳4': { name: 'Maqam Sikah (Original E𝄳4)', arabicName: 'مقام سيكاه', title: 'Sikah', desc: 'Traditional modal home on neutral third E𝄳4' },
        'B𝄳4': { name: 'Maqam Awj (Sikah on B𝄳4)', arabicName: 'مقام أوج', title: 'Awj', desc: 'Sikah transposed up a 5th to high neutral degree B𝄳4 (Awj)' }
      },
      kurd: {
        'C♮4': { name: 'Kurd ‘ala al-Rast (Kurd on C4)', arabicName: 'كرد على الراست', title: 'Kurd Rast', desc: 'Phrygian Kurd transposed down to C4' },
        'D♮4': { name: 'Maqam Kurd (Original D4)', arabicName: 'مقام كرد', title: 'Kurd', desc: 'Primary Phrygian modal home on D4 (Dukah)' },
        'G♮4': { name: 'Maqam Kurd Nawa (Kurd on G4)', arabicName: 'مقام كرد نوى', title: 'Kurd Nawa', desc: 'Kurd transposed up a 4th to G4 (Nawa)' },
        'A♮4': { name: 'Maqam Hijazkar Kurd (Kurd on A4)', arabicName: 'حجاز كار كرد', title: 'Hijazkar Kurd', desc: 'Kurd transposed to A4' }
      },
      ajam: {
        'B♭3': { name: 'Maqam ‘Ajam ‘Ushayran (Original B♭3)', arabicName: 'مقام عجم عشيران', title: '‘Ajam ‘Ushayran', desc: 'Foundational major mode on B♭3' },
        'C♮4': { name: 'Maqam Jaharkah / ‘Ajam (on C4)', arabicName: 'مقام جهاركاه / عجم', title: 'Jaharkah', desc: '‘Ajam transposed up a whole step to C4' },
        'F♮4': { name: 'Maqam ‘Ajam Nawa (on F4)', arabicName: 'مقام عجم نوى', title: '‘Ajam Nawa', desc: '‘Ajam transposed up to F4' }
      },
      saba: {
        'C♮4': { name: 'Saba ‘ala al-Rast (Saba on C4)', arabicName: 'صبا على الراست', title: 'Saba Rast', desc: 'Saba transposed down to C4' },
        'D♮4': { name: 'Maqam Saba (Original D4)', arabicName: 'مقام صبا', title: 'Saba', desc: 'Archetypal expression of mourning on D4 (Dukah)' },
        'G♮4': { name: 'Maqam Saba Zamzam / Nawa (on G4)', arabicName: 'صبا زمزم / نوى', title: 'Saba Nawa', desc: 'Saba transposed up a 4th to G4 (Nawa)' }
      },
      nikriz: {
        'C♮4': { name: 'Maqam Nikriz (Original C4)', arabicName: 'مقام نكريز', title: 'Nikriz', desc: 'Original augmented 2nd pentachord on C4' },
        'G♮4': { name: 'Maqam Nawa Athar (Nikriz on G4)', arabicName: 'مقام نوى أثر', title: 'Nawa Athar', desc: 'Transposition of Nikriz up to G4 (Nawa)' }
      }
    };

    const entry = registry[baseKey]?.[tonicKey];
    if (entry) {
      return {
        name: entry.name,
        arabicName: entry.arabicName,
        traditionalTitle: entry.title,
        description: entry.desc,
        intervalName,
        centsOffset
      };
    }

    const sign = deltaQt > 0 ? '+' : '';
    return {
      name: `${baseMaqam.name} on ${newTonic.toScientificString()}${newTonic.octave}`,
      arabicName: baseMaqam.arabicName ? `${baseMaqam.arabicName} مصوّر` : 'مقام مصوّر',
      description: `Transposed variant of ${baseMaqam.name} starting on ${newTonic.toScientificString()}${newTonic.octave} (${sign}${centsOffset}¢ shift)`,
      intervalName,
      centsOffset
    };
  }
}

