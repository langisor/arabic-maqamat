// src/theory/maqam.ts
import { ArabicPitch } from '../core/pitch';
import { Jins, AjnasLibrary, type JinsDefinition } from './jins';

export type MaqamConnection = 'Ittisal' | 'Infisal' | 'Tadakhul';

export type MaqamFamilyMnemonic = 
  | 'صنع' 
  | 'Nahawand' 
  | '‘Ajam' 
  | 'Bayati' 
  | 'Sikah' 
  | 'Hijaz' 
  | 'Rast' 
  | 'Kurd';

export interface AlternateJinsBranch {
  readonly jins: Jins;
  readonly role: 'upper_alternate' | 'upper_secondary' | 'modulation' | 'descent_only';
  readonly description: string;
}

export type SayrTrajectory = 'ascending' | 'descending_octave_first' | 'undulating';

/**
 * Network representation of maqam as graph of ajnas with acceptable pathways.
 * From Abu Shumays' "Maqam Analysis: A Primer" - Example 17, 23.
 */
export interface ModulationNode {
  readonly jinsId: string;
  readonly jinsName: string;
  readonly arabicName: string;
  readonly scaleDegree: number; // 1-8 relative to maqam tonic
  readonly root: ArabicPitch;
  readonly connections: readonly number[]; // scale degrees this node connects to
  readonly frequency: 'common' | 'uncommon' | 'rare';
  readonly roleDescription?: string;
}

export interface NetworkPathway {
  readonly fromDegree: number;
  readonly toDegree: number;
  readonly fromJinsId?: string;
  readonly toJinsId?: string;
  readonly technique: 'Ittisal' | 'Infisal' | 'Tadakhul';
  readonly frequency: 'common' | 'uncommon' | 'rare';
  readonly description?: string;
}

export interface MaqamNetwork {
  readonly nodes: readonly ModulationNode[];
  readonly pathways: readonly NetworkPathway[];
  readonly clusteringNotes?: string;
}

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
  /** Secondary or alternative upper ajnas active during melodic movement (sayr) */
  readonly alternateUpperAjnas?: AlternateJinsBranch[];
  readonly sayrDirection?: SayrTrajectory;
  /** Upper register extensions or octave alterations */
  readonly extraPitches?: ArabicPitch[];
  /**
   * Network graph of ajnas and acceptable pathways within the maqam.
   * From Sami Abu Shumays' "Maqam Analysis: A Primer".
   */
  readonly network?: MaqamNetwork;
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
  public readonly alternateUpperAjnas: readonly AlternateJinsBranch[];
  public readonly sayrDirection: SayrTrajectory;
  public readonly extraPitches: readonly ArabicPitch[];
  public readonly network: MaqamNetwork | undefined;
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
    this.alternateUpperAjnas = structure.alternateUpperAjnas ?? [];
    this.sayrDirection = structure.sayrDirection ?? 'ascending';
    this.extraPitches = structure.extraPitches ?? [];
    this.network = structure.network;
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
   * connection type (Ittisal/Infisal/Tadakhul), network nodes, and upper extension pitches.
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
    const newAlternates = this.alternateUpperAjnas.map(b => ({
      ...b,
      jins: b.jins.transpose(b.jins.root.transpose(deltaQt))
    }));

    // Transpose network if present
    const transposedNetwork: MaqamNetwork | undefined = this.network ? {
      nodes: this.network.nodes.map(node => ({
        ...node,
        root: node.root.transpose(deltaQt)
      })),
      pathways: [...this.network.pathways],
      clusteringNotes: this.network.clusteringNotes
    } : undefined;

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
      alternateUpperAjnas: newAlternates,
      sayrDirection: this.sayrDirection,
      extraPitches: newExtras,
      network: transposedNetwork,
      description: transInfo?.description ?? `Transposed variant of ${this.name} starting on ${newTonic.toScientificString()}${newTonic.octave} (${centsText} shift)`
    });
  }
}

/**
 * Registry of The 8 Families (صنع بسحرك) and core Maqamat
 */
export class MaqamatCatalogue {
  public static readonly FAMILIES: Record<MaqamFamilyMnemonic, MaqamFamily> = {
    'صنع': {
      mnemonic: 'صنع',
      arabicLetter: 'ص',
      arabicName: 'عائلة الصبا',
      rootJinsDef: AjnasLibrary.SABA,
      description: 'Defined by narrow 400-cent lower Jins Saba with yearning path'
    },
    'Nahawand': {
      mnemonic: 'Nahawand',
      arabicLetter: 'ن',
      arabicName: 'عائلة النهاوند',
      rootJinsDef: AjnasLibrary.NAHAWAND,
      description: 'Minor-third based family with natural minor qualities'
    },
    '‘Ajam': {
      mnemonic: '‘Ajam',
      arabicLetter: 'ع',
      arabicName: 'عائلة العجم',
      rootJinsDef: AjnasLibrary.AJAM,
      description: 'Western major scale equivalent family spanning bright intervals'
    },
    'Bayati': {
      mnemonic: 'Bayati',
      arabicLetter: 'ب',
      arabicName: 'عائلة البياتي',
      rootJinsDef: AjnasLibrary.BAYATI,
      description: 'Beloved folk and classical family with neutral 2nd'
    },
    'Sikah': {
      mnemonic: 'Sikah',
      arabicLetter: 'س',
      arabicName: 'عائلة السيكاه',
      rootJinsDef: AjnasLibrary.SIKAH,
      description: 'Rooted directly on neutral third (E𝄳)'
    },
    'Hijaz': {
      mnemonic: 'Hijaz',
      arabicLetter: 'ح',
      arabicName: 'عائلة الحجاز',
      rootJinsDef: AjnasLibrary.HIJAZ,
      description: 'Harmonic and dramatic colors with augmented 2nd'
    },
    'Rast': {
      mnemonic: 'Rast',
      arabicLetter: 'ر',
      arabicName: 'عائلة الراست',
      rootJinsDef: AjnasLibrary.RAST,
      description: 'The foundational "mother scale" of Arabic music'
    },
    'Kurd': {
      mnemonic: 'Kurd',
      arabicLetter: 'ك',
      arabicName: 'عائلة الكرد',
      rootJinsDef: AjnasLibrary.KURD,
      description: 'Grounded Phrygian flavored modal family'
    }
  };

  /**
   * Constructs Maqam Rast
   * Network: Based on Abu Shumays' Example 17 - nodes at degrees 1, 3, 5, 8
   */
  public static buildRast(): Maqam {
    const lower = new Jins(AjnasLibrary.RAST, new ArabicPitch('C', '♮', 4));
    const upper = new Jins(AjnasLibrary.RAST, new ArabicPitch('G', '♮', 4));

    const rastNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'rast', jinsName: 'Jins Rast', arabicName: 'راست', scaleDegree: 1, root: new ArabicPitch('C', '♮', 4), connections: [3, 5], frequency: 'common', roleDescription: 'Root Jins on Qarar' },
        { jinsId: 'sikah', jinsName: 'Jins Sikah', arabicName: 'سيكاه', scaleDegree: 3, root: new ArabicPitch('E', '𝄳', 4), connections: [1, 5], frequency: 'common', roleDescription: 'Neutral 3rd degree pivot' },
        { jinsId: 'secondary-rast-gc', jinsName: 'Secondary Rast G/C', arabicName: 'راست ثانوي', scaleDegree: 5, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Upper Rast on Ghammaz' },
        { jinsId: 'nahawand', jinsName: 'Jins Nahawand', arabicName: 'نهاوند', scaleDegree: 5, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Frequent upper modulation branch' },
        { jinsId: 'hijaz', jinsName: 'Jins Hijaz (Suznak)', arabicName: 'حجاز (سوزناك)', scaleDegree: 5, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Forms Maqam Suznak' },
        { jinsId: 'bayati', jinsName: 'Jins Bayati (Nairuz)', arabicName: 'بياتي (نيروز)', scaleDegree: 5, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'uncommon', roleDescription: 'Forms Maqam Nairuz' },
        { jinsId: 'saba', jinsName: 'Jins Saba', arabicName: 'صبا', scaleDegree: 5, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'rare', roleDescription: 'Expressive rare modulation on 5th' },
        { jinsId: 'rast', jinsName: 'Jins Rast (Jawab)', arabicName: 'راست الجواب', scaleDegree: 8, root: new ArabicPitch('C', '♮', 5), connections: [5], frequency: 'common', roleDescription: 'Octave resolution' }
      ],
      pathways: [
        { fromDegree: 1, toDegree: 3, technique: 'Ittisal', frequency: 'common', description: 'Stepwise motion from Rast to Sikah on 3rd degree' },
        { fromDegree: 1, toDegree: 5, technique: 'Infisal', frequency: 'common', description: 'Ascent from tonic to Ghammaz on 5th degree (Nawa)' },
        { fromDegree: 3, toDegree: 1, technique: 'Ittisal', frequency: 'common', description: 'Cadential resolution back to tonic' },
        { fromDegree: 3, toDegree: 5, technique: 'Infisal', frequency: 'common', description: 'Ascent from Sikah 3rd to Ghammaz' },
        { fromDegree: 5, toDegree: 1, technique: 'Infisal', frequency: 'common', description: 'Descent from Ghammaz back to Qarar' },
        { fromDegree: 5, toDegree: 8, technique: 'Ittisal', frequency: 'common', description: 'Upper exploration to Kirdan octave' },
        { fromDegree: 8, toDegree: 5, technique: 'Ittisal', frequency: 'common', description: 'Descent from octave apex back to Ghammaz' }
      ],
      clusteringNotes: 'Small-world network properties: high clustering around degrees 1, 3, and 5 with short characteristic path length.'
    };

    return new Maqam({
      id: 'rast',
      name: 'Maqam Rast',
      arabicName: 'مقام راست',
      family: 'Rast',
      lowerJins: lower,
      connection: 'Infisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4)),
          role: 'upper_alternate',
          description: 'Upper Nahawand on G4 (frequent modulation and melodic branch in Rast sayr)'
        },
        {
          jins: new Jins(AjnasLibrary.HIJAZ, new ArabicPitch('G', '♮', 4)),
          role: 'upper_alternate',
          description: 'Upper Hijaz on G4 (Suznak color)'
        }
      ],
      sayrDirection: 'ascending',
      extraPitches: [new ArabicPitch('C', '♮', 5)],
      network: rastNetwork,
      description: "The principal maqam in the Rast family and one of the most common and central maqamat in the Arabic repertory. Its scale begins with the root jins Rast on the tonic, with the upper section often continuing through either upper Rast or Nahawand at the ghammaz."
    });
  }

  /**
   * Constructs Maqam Bayati
   * Network: Based on Abu Shumays' Example 23 - nodes at degrees 1, 4, 5, 6, 8
   */
  public static buildBayati(): Maqam {
    const lower = new Jins(AjnasLibrary.BAYATI, new ArabicPitch('D', '♮', 4));
    const upper = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4));

    const bayatiNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'bayati', jinsName: 'Jins Bayati', arabicName: 'بياتي', scaleDegree: 1, root: new ArabicPitch('D', '♮', 4), connections: [4, 5, 6, 8], frequency: 'common', roleDescription: 'Root Jins on Dukah' },
        { jinsId: 'hijaz', jinsName: 'Jins Hijaz (Shuri)', arabicName: 'حجاز (شورى)', scaleDegree: 4, root: new ArabicPitch('G', '♮', 4), connections: [1, 5, 8], frequency: 'common', roleDescription: 'Forms Maqam Bayati Shuri' },
        { jinsId: 'rast', jinsName: 'Jins Rast', arabicName: 'راست', scaleDegree: 4, root: new ArabicPitch('G', '♮', 4), connections: [1, 5, 8], frequency: 'common', roleDescription: 'Forms Maqam Husayni' },
        { jinsId: 'nahawand', jinsName: 'Jins Nahawand', arabicName: 'نهاوند', scaleDegree: 4, root: new ArabicPitch('G', '♮', 4), connections: [1, 5, 6, 8], frequency: 'common', roleDescription: 'Standard upper branch' },
        { jinsId: 'bayati', jinsName: 'Jins Bayati (Husayni)', arabicName: 'بياتي (حسيني)', scaleDegree: 5, root: new ArabicPitch('A', '♮', 4), connections: [1, 4, 6, 8], frequency: 'common', roleDescription: 'Secondary Bayati on 5th' },
        { jinsId: 'ajam', jinsName: 'Jins Ajam', arabicName: 'عجم', scaleDegree: 6, root: new ArabicPitch('B', '♭', 4), connections: [1, 4, 5, 8], frequency: 'common', roleDescription: 'Upper Ajam on 6th' },
        { jinsId: 'bayati', jinsName: 'Jins Bayati (Muhayyar)', arabicName: 'بياتي (محير)', scaleDegree: 8, root: new ArabicPitch('D', '♮', 5), connections: [1, 4, 5, 6], frequency: 'common', roleDescription: 'Octave Muhayyar' }
      ],
      pathways: [
        { fromDegree: 1, toDegree: 4, technique: 'Ittisal', frequency: 'common', description: 'Primary conjunct ascent to Ghammaz on 4th' },
        { fromDegree: 1, toDegree: 5, technique: 'Infisal', frequency: 'common', description: 'Ascent to 5th degree Husayni' },
        { fromDegree: 1, toDegree: 6, technique: 'Infisal', frequency: 'common', description: 'Ascent to Ajam on 6th degree' },
        { fromDegree: 1, toDegree: 8, technique: 'Infisal', frequency: 'common', description: 'Leap to octave Muhayyar' },
        { fromDegree: 4, toDegree: 1, technique: 'Ittisal', frequency: 'common', description: 'Descent from Ghammaz to Dukah' },
        { fromDegree: 4, toDegree: 5, technique: 'Ittisal', frequency: 'common', description: 'Progression from 4th to 5th degree' },
        { fromDegree: 4, toDegree: 8, technique: 'Infisal', frequency: 'common', description: 'Ascent to octave' },
        { fromDegree: 5, toDegree: 1, technique: 'Infisal', frequency: 'common', description: 'Cadential descent from Husayni' },
        { fromDegree: 5, toDegree: 4, technique: 'Ittisal', frequency: 'common', description: 'Step back to Ghammaz' },
        { fromDegree: 5, toDegree: 6, technique: 'Ittisal', frequency: 'common', description: 'Step up to Ajam' },
        { fromDegree: 5, toDegree: 8, technique: 'Infisal', frequency: 'common', description: 'Ascent to octave' },
        { fromDegree: 6, toDegree: 1, technique: 'Infisal', frequency: 'common', description: 'Descent to tonic' },
        { fromDegree: 6, toDegree: 4, technique: 'Infisal', frequency: 'common', description: 'Descent to Ghammaz' },
        { fromDegree: 6, toDegree: 5, technique: 'Ittisal', frequency: 'common', description: 'Step down to Husayni' },
        { fromDegree: 6, toDegree: 8, technique: 'Infisal', frequency: 'common', description: 'Ascent to octave' },
        { fromDegree: 8, toDegree: 1, technique: 'Infisal', frequency: 'common', description: 'Full octave descent' },
        { fromDegree: 8, toDegree: 4, technique: 'Infisal', frequency: 'common', description: 'Descent to Ghammaz' },
        { fromDegree: 8, toDegree: 5, technique: 'Infisal', frequency: 'common', description: 'Descent to Husayni' },
        { fromDegree: 8, toDegree: 6, technique: 'Infisal', frequency: 'common', description: 'Step down to Ajam' }
      ],
      clusteringNotes: 'Small-world network properties: highly connected hub at degree 4 (Ghammaz) linking to multiple distinct upper ajnas.'
    };

    return new Maqam({
      id: 'bayati',
      name: 'Maqam Bayati',
      arabicName: 'مقام بياتي',
      family: 'Bayati',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.RAST, new ArabicPitch('G', '♮', 4)),
          role: 'upper_alternate',
          description: 'Upper Rast on G4 (melodic ascent featuring Awj B𝄳4)'
        },
        {
          jins: new Jins(AjnasLibrary.HIJAZ, new ArabicPitch('G', '♮', 4)),
          role: 'upper_alternate',
          description: 'Upper Hijaz on G4 (Bayati Shuri variant)'
        }
      ],
      sayrDirection: 'ascending',
      extraPitches: [new ArabicPitch('D', '♮', 5)],
      network: bayatiNetwork,
      description: "The principal maqam in the Bayati family and a cornerstone of Arabic modal practice. It starts with jins Bayati on the tonic and commonly continues with Nahawand or Rast at the upper pivot."
    });
  }

  /**
   * Constructs Maqam Muhayyar (Bayati family, octave-emphasized)
   */
  public static buildMuhayyar(): Maqam {
    const lower = new Jins(AjnasLibrary.BAYATI, new ArabicPitch('D', '♮', 4));
    const upper = new Jins(AjnasLibrary.RAST, new ArabicPitch('G', '♮', 4));

    const muhayyarNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'bayati', jinsName: 'Jins Bayati (Muhayyar)', arabicName: 'بياتي محير', scaleDegree: 8, root: new ArabicPitch('D', '♮', 5), connections: [4, 5, 1], frequency: 'common', roleDescription: 'Opening apex on octave' },
        { jinsId: 'rast', jinsName: 'Jins Rast (Awj)', arabicName: 'راست', scaleDegree: 4, root: new ArabicPitch('G', '♮', 4), connections: [8, 1], frequency: 'common', roleDescription: 'Upper Rast in ascent' },
        { jinsId: 'nahawand', jinsName: 'Jins Nahawand', arabicName: 'نهاوند', scaleDegree: 4, root: new ArabicPitch('G', '♮', 4), connections: [8, 1], frequency: 'common', roleDescription: 'Descent pathway' },
        { jinsId: 'bayati', jinsName: 'Jins Bayati', arabicName: 'بياتي', scaleDegree: 1, root: new ArabicPitch('D', '♮', 4), connections: [4, 8], frequency: 'common', roleDescription: 'Resolution tonic' }
      ],
      pathways: [
        { fromDegree: 8, toDegree: 4, technique: 'Infisal', frequency: 'common', description: 'Descent from octave to Ghammaz' },
        { fromDegree: 4, toDegree: 8, technique: 'Infisal', frequency: 'common', description: 'Ascent to octave' },
        { fromDegree: 4, toDegree: 1, technique: 'Ittisal', frequency: 'common', description: 'Descent to Dukah' },
        { fromDegree: 1, toDegree: 4, technique: 'Ittisal', frequency: 'common', description: 'Ascent to Ghammaz' }
      ]
    };

    return new Maqam({
      id: 'muhayyar',
      name: 'Maqam Muhayyar',
      arabicName: 'مقام محيّر',
      family: 'Bayati',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4)),
          role: 'upper_alternate',
          description: 'Upper Nahawand on G4 (secondary pathway in descent)'
        },
        {
          jins: new Jins(AjnasLibrary.BAYATI, new ArabicPitch('D', '♮', 5)),
          role: 'upper_secondary',
          description: 'Upper Bayati octave register (Muhayyar D5)'
        }
      ],
      sayrDirection: 'descending_octave_first',
      extraPitches: [new ArabicPitch('D', '♮', 5)],
      network: muhayyarNetwork,
      description: "A Bayati-derived maqam whose sayr emphasizes the octave or upper register; it often uses Rast in the ascent before returning through the Bayati-family ajnas that shape the descent."
    });
  }

  /**
   * Constructs Maqam Hijaz
   */
  public static buildHijaz(): Maqam {
    const lower = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch('D', '♮', 4));
    const upper = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4));

    const hijazNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'hijaz', jinsName: 'Jins Hijaz', arabicName: 'حجاز', scaleDegree: 1, root: new ArabicPitch('D', '♮', 4), connections: [4, 8], frequency: 'common', roleDescription: 'Root Jins on Dukah' },
        { jinsId: 'nahawand', jinsName: 'Jins Nahawand', arabicName: 'نهاوند', scaleDegree: 4, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Primary upper branch' },
        { jinsId: 'rast', jinsName: 'Jins Rast (Suznak)', arabicName: 'راست (سوزناك)', scaleDegree: 4, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Upper Rast alternative' },
        { jinsId: 'hijaz', jinsName: 'Jins Hijaz (Octave)', arabicName: 'حجاز الجواب', scaleDegree: 8, root: new ArabicPitch('D', '♮', 5), connections: [4], frequency: 'common', roleDescription: 'Octave peak' }
      ],
      pathways: [
        { fromDegree: 1, toDegree: 4, technique: 'Ittisal', frequency: 'common', description: 'Conjunct ascent to Ghammaz on 4th' },
        { fromDegree: 4, toDegree: 1, technique: 'Ittisal', frequency: 'common', description: 'Descent to Dukah' },
        { fromDegree: 4, toDegree: 8, technique: 'Infisal', frequency: 'common', description: 'Ascent to octave' },
        { fromDegree: 8, toDegree: 4, technique: 'Infisal', frequency: 'common', description: 'Descent from octave' }
      ]
    };

    return new Maqam({
      id: 'hijaz',
      name: 'Maqam Hijaz',
      arabicName: 'مقام حجاز',
      family: 'Hijaz',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.RAST, new ArabicPitch('G', '♮', 4)),
          role: 'upper_alternate',
          description: 'Upper Rast on G4 (Hijaz with upper Rast / Suznak color)'
        }
      ],
      sayrDirection: 'ascending',
      extraPitches: [new ArabicPitch('D', '♮', 5)],
      network: hijazNetwork,
      description: "The principal maqam in the Hijaz family. Its scale begins with root jins Hijaz on the tonic and commonly continues with Nahawand or Rast at the upper ghammaz."
    });
  }

  /**
   * Constructs Maqam Nahawand
   */
  public static buildNahawand(): Maqam {
    const lower = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('C', '♮', 4));
    const upper = new Jins(AjnasLibrary.KURD, new ArabicPitch('G', '♮', 4));

    const nahawandNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'nahawand', jinsName: 'Jins Nahawand', arabicName: 'نهاوند', scaleDegree: 1, root: new ArabicPitch('C', '♮', 4), connections: [5, 8], frequency: 'common', roleDescription: 'Root Jins on Rast C4' },
        { jinsId: 'kurd', jinsName: 'Jins Kurd', arabicName: 'كرد', scaleDegree: 5, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Upper Kurd on 5th' },
        { jinsId: 'hijaz', jinsName: 'Jins Hijaz (Murassah)', arabicName: 'حجاز (مرصع)', scaleDegree: 5, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Harmonic minor inflection' },
        { jinsId: 'nahawand', jinsName: 'Jins Nahawand (Octave)', arabicName: 'نهاوند الجواب', scaleDegree: 8, root: new ArabicPitch('C', '♮', 5), connections: [5], frequency: 'common', roleDescription: 'Octave peak' }
      ],
      pathways: [
        { fromDegree: 1, toDegree: 5, technique: 'Infisal', frequency: 'common', description: 'Disjunct ascent to Ghammaz on 5th' },
        { fromDegree: 5, toDegree: 1, technique: 'Infisal', frequency: 'common', description: 'Descent to tonic' },
        { fromDegree: 5, toDegree: 8, technique: 'Ittisal', frequency: 'common', description: 'Ascent to octave' },
        { fromDegree: 8, toDegree: 5, technique: 'Ittisal', frequency: 'common', description: 'Descent from octave' }
      ]
    };

    return new Maqam({
      id: 'nahawand',
      name: 'Maqam Nahawand',
      arabicName: 'مقام نهاوند',
      family: 'Nahawand',
      lowerJins: lower,
      connection: 'Infisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.HIJAZ, new ArabicPitch('G', '♮', 4)),
          role: 'upper_alternate',
          description: 'Upper Hijaz on G4 (Nahawand Murassah / harmonic minor inflection)'
        }
      ],
      sayrDirection: 'ascending',
      extraPitches: [new ArabicPitch('C', '♮', 5)],
      network: nahawandNetwork,
      description: "The principal maqam in the Nahawand family. It starts with the root jins Nahawand on the tonic and often continues with Hijaz or Kurd as the upper branch."
    });
  }

  /**
   * Constructs Maqam Farahfaza (Nahawand family on G)
   */
  public static buildFarahfaza(): Maqam {
    const lower = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4));
    const upper = new Jins(AjnasLibrary.KURD, new ArabicPitch('D', '♮', 5));

    return new Maqam({
      id: 'farahfaza',
      name: 'Maqam Farahfaza',
      arabicName: 'مقام فَرَحْفَزا',
      family: 'Nahawand',
      lowerJins: lower,
      connection: 'Infisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('D', '♮', 5),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.HIJAZ, new ArabicPitch('D', '♮', 5)),
          role: 'upper_alternate',
          description: 'Upper Hijaz on D5 (Farahfaza Murassah / harmonic minor color)'
        }
      ],
      sayrDirection: 'ascending',
      extraPitches: [new ArabicPitch('G', '♮', 5)],
      description: "Effectively a transposition of Nahawand to a tonic of G, preserving the same internal ajnas and family identity but with a different tonal center."
    });
  }

  /**
   * Constructs Maqam Kurd
   */
  public static buildKurd(): Maqam {
    const lower = new Jins(AjnasLibrary.KURD, new ArabicPitch('D', '♮', 4));
    const upper = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4));

    const kurdNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'kurd', jinsName: 'Jins Kurd', arabicName: 'كرد', scaleDegree: 1, root: new ArabicPitch('D', '♮', 4), connections: [4, 8], frequency: 'common', roleDescription: 'Root Jins on Dukah' },
        { jinsId: 'nahawand', jinsName: 'Jins Nahawand', arabicName: 'نهاوند', scaleDegree: 4, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Primary upper branch' },
        { jinsId: 'kurd', jinsName: 'Jins Kurd (Upper)', arabicName: 'كرد على النوى', scaleDegree: 4, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Double Kurd variant' },
        { jinsId: 'kurd', jinsName: 'Jins Kurd (Octave)', arabicName: 'كرد الجواب', scaleDegree: 8, root: new ArabicPitch('D', '♮', 5), connections: [4], frequency: 'common', roleDescription: 'Octave peak' }
      ],
      pathways: [
        { fromDegree: 1, toDegree: 4, technique: 'Ittisal', frequency: 'common', description: 'Conjunct ascent to Ghammaz on 4th' },
        { fromDegree: 4, toDegree: 1, technique: 'Ittisal', frequency: 'common', description: 'Descent to Dukah' },
        { fromDegree: 4, toDegree: 8, technique: 'Infisal', frequency: 'common', description: 'Ascent to octave' },
        { fromDegree: 8, toDegree: 4, technique: 'Infisal', frequency: 'common', description: 'Descent from octave' }
      ]
    };

    return new Maqam({
      id: 'kurd',
      name: 'Maqam Kurd',
      arabicName: 'مقام كُرد',
      family: 'Kurd',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.KURD, new ArabicPitch('G', '♮', 4)),
          role: 'upper_alternate',
          description: 'Upper Kurd on G4 (double-Kurd variant)'
        }
      ],
      sayrDirection: 'ascending',
      extraPitches: [new ArabicPitch('D', '♮', 5)],
      network: kurdNetwork,
      description: "The principal maqam in the Kurd family. It begins with root jins Kurd on the tonic and continues with Nahawand on the upper pivot."
    });
  }

  /**
   * Constructs Maqam Ajam
   */
  public static buildAjam(): Maqam {
    const lower = new Jins(AjnasLibrary.AJAM, new ArabicPitch('B', '♭', 3));
    const upper = new Jins(AjnasLibrary.AJAM, new ArabicPitch('F', '♮', 4));

    const ajamNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'ajam', jinsName: 'Jins Ajam', arabicName: 'عجم', scaleDegree: 1, root: new ArabicPitch('B', '♭', 3), connections: [5, 8], frequency: 'common', roleDescription: 'Root Jins on B♭3' },
        { jinsId: 'ajam', jinsName: 'Jins Ajam (Upper)', arabicName: 'عجم علوي', scaleDegree: 5, root: new ArabicPitch('F', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Upper Ajam on 5th' },
        { jinsId: 'nahawand', jinsName: 'Jins Nahawand', arabicName: 'نهاوند', scaleDegree: 5, root: new ArabicPitch('C', '♮', 5), connections: [1, 8], frequency: 'common', roleDescription: 'Upper Nahawand on C5' },
        { jinsId: 'ajam', jinsName: 'Jins Ajam (Octave)', arabicName: 'عجم الجواب', scaleDegree: 8, root: new ArabicPitch('B', '♭', 4), connections: [5], frequency: 'common', roleDescription: 'Octave peak' }
      ],
      pathways: [
        { fromDegree: 1, toDegree: 5, technique: 'Ittisal', frequency: 'common', description: 'Ascent to Ghammaz on 5th' },
        { fromDegree: 5, toDegree: 1, technique: 'Ittisal', frequency: 'common', description: 'Descent to tonic' },
        { fromDegree: 5, toDegree: 8, technique: 'Infisal', frequency: 'common', description: 'Ascent to octave' },
        { fromDegree: 8, toDegree: 5, technique: 'Infisal', frequency: 'common', description: 'Descent from octave' }
      ]
    };

    return new Maqam({
      id: 'ajam',
      name: 'Maqam Ajam',
      arabicName: 'مقام عجم',
      family: '‘Ajam',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('F', '♮', 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('C', '♮', 5)),
          role: 'upper_alternate',
          description: 'Upper Nahawand on C5 (frequently visited in Egyptian Ajam sayr)'
        }
      ],
      sayrDirection: 'ascending',
      extraPitches: [new ArabicPitch('B', '♭', 4)],
      network: ajamNetwork,
      description: "The principal maqam in the 'Ajam family (also called Egyptian 'Ajam). It begins with root jins 'Ajam on the tonic and often continues with upper 'Ajam or Nahawand."
    });
  }

  /**
   * Constructs Maqam Sikah
   */
  public static buildSikah(): Maqam {
    const lower = new Jins(AjnasLibrary.SIKAH, new ArabicPitch('E', '𝄳', 4));
    const upper = new Jins(AjnasLibrary.RAST, new ArabicPitch('G', '♮', 4));

    const sikahNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'sikah', jinsName: 'Jins Sikah', arabicName: 'سيكاه', scaleDegree: 1, root: new ArabicPitch('E', '𝄳', 4), connections: [3, 6], frequency: 'common', roleDescription: 'Root Jins on E𝄳4' },
        { jinsId: 'secondary-rast-gc', jinsName: 'Secondary Rast G/C', arabicName: 'راست ثانوي', scaleDegree: 3, root: new ArabicPitch('G', '♮', 4), connections: [1, 6], frequency: 'common', roleDescription: 'Upper Rast on G4' },
        { jinsId: 'rast', jinsName: 'Jins Rast (Octave)', arabicName: 'راست علوي', scaleDegree: 6, root: new ArabicPitch('C', '♮', 5), connections: [3], frequency: 'common', roleDescription: 'Secondary Rast around octave' }
      ],
      pathways: [
        { fromDegree: 1, toDegree: 3, technique: 'Ittisal', frequency: 'common', description: 'Stepwise ascent to Ghammaz G4' },
        { fromDegree: 3, toDegree: 1, technique: 'Ittisal', frequency: 'common', description: 'Descent back to Sikah root' },
        { fromDegree: 3, toDegree: 6, technique: 'Ittisal', frequency: 'common', description: 'Ascent to upper Rast C5' },
        { fromDegree: 6, toDegree: 3, technique: 'Ittisal', frequency: 'common', description: 'Descent from upper octave' }
      ]
    };

    return new Maqam({
      id: 'sikah',
      name: 'Maqam Sikah',
      arabicName: 'مقام سيكاه',
      family: 'Sikah',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.RAST, new ArabicPitch('C', '♮', 5)),
          role: 'upper_secondary',
          description: 'Secondary Jins Rast material around the upper octave'
        }
      ],
      sayrDirection: 'ascending',
      extraPitches: [new ArabicPitch('C', '♮', 5), new ArabicPitch('D', '♮', 5), new ArabicPitch('E', '𝄳', 5)],
      network: sikahNetwork,
      description: "A distinctive member of the Sikah family. Its scale begins with root jins Sikah on the tonic and is shaped by upper Rast and secondary Rast material around the ghammaz."
    });
  }

  /**
   * Constructs Maqam Nikriz / Nawa Athar
   */
  public static buildNikriz(): Maqam {
    const lower = new Jins(AjnasLibrary.NAWA_ATHAR_NIKRIZ, new ArabicPitch('C', '♮', 4));
    const upper = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch('G', '♮', 4));

    const nikrizNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'nikriz', jinsName: 'Jins Nikriz', arabicName: 'نكريز', scaleDegree: 1, root: new ArabicPitch('C', '♮', 4), connections: [5, 8], frequency: 'common', roleDescription: 'Root pentachord with aug 2nd' },
        { jinsId: 'nahawand', jinsName: 'Jins Nahawand', arabicName: 'نهاوند', scaleDegree: 5, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Upper Nahawand on 5th' },
        { jinsId: 'hijaz', jinsName: 'Jins Hijaz', arabicName: 'حجاز', scaleDegree: 5, root: new ArabicPitch('G', '♮', 4), connections: [1, 8], frequency: 'common', roleDescription: 'Nawa Athar variant' },
        { jinsId: 'nikriz', jinsName: 'Jins Nikriz (Octave)', arabicName: 'نكريز الجواب', scaleDegree: 8, root: new ArabicPitch('C', '♮', 5), connections: [5], frequency: 'common', roleDescription: 'Octave peak' }
      ],
      pathways: [
        { fromDegree: 1, toDegree: 5, technique: 'Ittisal', frequency: 'common', description: 'Ascent to Ghammaz on 5th' },
        { fromDegree: 5, toDegree: 1, technique: 'Ittisal', frequency: 'common', description: 'Descent to tonic' },
        { fromDegree: 5, toDegree: 8, technique: 'Infisal', frequency: 'common', description: 'Ascent to octave' },
        { fromDegree: 8, toDegree: 5, technique: 'Infisal', frequency: 'common', description: 'Descent from octave' }
      ]
    };

    return new Maqam({
      id: 'nikriz',
      name: 'Maqam Nikriz',
      arabicName: 'مقام نكريز',
      family: 'Nahawand',
      lowerJins: lower,
      connection: 'Ittisal',
      upperJins: upper,
      ghammaz: new ArabicPitch('G', '♮', 4),
      sayrDirection: 'ascending',
      extraPitches: [new ArabicPitch('C', '♮', 5)],
      network: nikrizNetwork,
      description: 'Ornate pentachord with augmented 2nd: C - D - E♭ - F♯ - G - A♭ - B - C'
    });
  }

  /**
   * Constructs Maqam Saba
   */
  public static buildSaba(): Maqam {
    const lower = new Jins(AjnasLibrary.SABA, new ArabicPitch('D', '♮', 4));
    const upper = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch('F', '♮', 4));

    const sabaNetwork: MaqamNetwork = {
      nodes: [
        { jinsId: 'saba', jinsName: 'Jins Saba', arabicName: 'صبا', scaleDegree: 1, root: new ArabicPitch('D', '♮', 4), connections: [3, 6], frequency: 'common', roleDescription: 'Narrow root tetrachord on Dukah' },
        { jinsId: 'hijaz', jinsName: 'Jins Hijaz', arabicName: 'حجاز', scaleDegree: 3, root: new ArabicPitch('F', '♮', 4), connections: [1, 6], frequency: 'common', roleDescription: 'Overlapping Hijaz on F4' },
        { jinsId: 'ajam', jinsName: 'Jins Ajam', arabicName: 'عجم', scaleDegree: 6, root: new ArabicPitch('B', '♭', 4), connections: [1, 3], frequency: 'common', roleDescription: 'Upper Ajam on B♭4' },
        { jinsId: 'nikriz', jinsName: 'Jins Nikriz', arabicName: 'نكريز', scaleDegree: 7, root: new ArabicPitch('C', '♮', 5), connections: [1, 3], frequency: 'uncommon', roleDescription: 'Upper Nikriz flourish on C5' }
      ],
      pathways: [
        { fromDegree: 1, toDegree: 3, technique: 'Tadakhul', frequency: 'common', description: 'Overlapping transition into Hijaz on F4' },
        { fromDegree: 3, toDegree: 1, technique: 'Tadakhul', frequency: 'common', description: 'Descent through narrow Saba to Dukah' },
        { fromDegree: 3, toDegree: 6, technique: 'Infisal', frequency: 'common', description: 'Ascent to upper Ajam on B♭4' },
        { fromDegree: 6, toDegree: 3, technique: 'Infisal', frequency: 'common', description: 'Descent from upper Ajam to Hijaz' },
        { fromDegree: 6, toDegree: 1, technique: 'Infisal', frequency: 'common', description: 'Direct cadential descent to Dukah' }
      ]
    };

    return new Maqam({
      id: 'saba',
      name: 'Maqam Saba',
      arabicName: 'مقام صبا',
      family: 'صنع',
      lowerJins: lower,
      connection: 'Tadakhul',
      upperJins: upper,
      ghammaz: new ArabicPitch('F', '♮', 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.AJAM, new ArabicPitch('B', '♭', 4)),
          role: 'upper_secondary',
          description: 'Upper Jins ‘Ajam on B♭4 (frequent melodic destination in Saba sayr)'
        },
        {
          jins: new Jins(AjnasLibrary.NAWA_ATHAR_NIKRIZ, new ArabicPitch('C', '♮', 5)),
          role: 'upper_secondary',
          description: 'Upper Jins Nikriz on C5 (expressive ornamentation at upper register)'
        }
      ],
      sayrDirection: 'ascending',
      extraPitches: [
        new ArabicPitch('B', '♭', 4),
        new ArabicPitch('C', '♮', 5),
        new ArabicPitch('D', '♭', 5) // Characteristic flat octave
      ],
      network: sabaNetwork,
      description: "A popular and highly expressive maqam in the Arabic repertory. It begins with jins Saba on the tonic, then overlaps with Hijaz and often introduces 'Ajam or Nikriz material at the upper area."
    });
  }

  public static getAllMaqamat(): Maqam[] {
    return [
      this.buildRast(),
      this.buildBayati(),
      this.buildMuhayyar(),
      this.buildHijaz(),
      this.buildNahawand(),
      this.buildFarahfaza(),
      this.buildKurd(),
      this.buildAjam(),
      this.buildSikah(),
      this.buildNikriz(),
      this.buildSaba()
    ];
  }

  public static getAll(): Maqam[] {
    return this.getAllMaqamat();
  }

  public static findById(id: string): Maqam | undefined {
    return this.getAllMaqamat().find(m => m.id === id);
  }

  public static getById(id: string): Maqam | undefined {
    return this.findById(id);
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
        'G♮4': { name: 'Maqam Mahur (Rast on G4)', arabicName: 'مقام ماهور (راست على النوى)', title: 'Mahur / Nawa', desc: 'Famous classical transposition of Rast up a 5th to G4 (Nawa)' },
        'C♮5': { name: 'Maqam Kirdan (Rast on C5)', arabicName: 'مقام كردان', title: 'Kirdan', desc: 'Rast transposed an octave up to C5 (Kirdan)' }
      },
      bayati: {
        'C♮4': { name: 'Bayati ‘ala al-Rast (Bayati on C4)', arabicName: 'بياتي على الراست', title: 'Bayati Rast', desc: 'Bayati transposed down a whole tone to C4' },
        'D♮4': { name: 'Maqam Bayati (Original D4)', arabicName: 'مقام بياتي', title: 'Bayati', desc: 'Beloved classical modal center on D4 (Dukah)' },
        'G♮4': { name: 'Maqam Shuri / Bayati Nawa (on G4)', arabicName: 'بياتي شورى (على النوى)', title: 'Shuri', desc: 'Bayati transposed up a 4th to G4 (Nawa), often incorporating Hijaz' },
        'A♮4': { name: 'Maqam Husayni (Bayati on A4)', arabicName: 'مقام حسيني', title: 'Husayni', desc: 'Bayati transposed up a 5th to A4 (Husayni)' }
      },
      hijaz: {
        'C♮4': { name: 'Maqam Hijaz Kar (Hijaz on C4)', arabicName: 'مقام حجازكار', title: 'Hijaz Kar', desc: 'Hijaz transposed down a whole step to C4 (Rast)' },
        'D♮4': { name: 'Maqam Hijaz (Original D4)', arabicName: 'مقام حجاز', title: 'Hijaz', desc: 'The dramatic classical core on D4 (Dukah)' },
        'G♮4': { name: 'Maqam Shahnaz (Hijaz on G4)', arabicName: 'مقام شاهناز', title: 'Shahnaz', desc: 'Hijaz transposed up a 4th to G4 (Nawa)' },
        'A♮4': { name: 'Maqam Suzidil (Hijaz on A4)', arabicName: 'مقام سوزدل', title: 'Suzidil', desc: 'Hijaz transposed up a 5th to A4 (Husayni)' }
      },
      nahawand: {
        'C♮4': { name: 'Maqam Nahawand (Original C4)', arabicName: 'مقام نهاوند', title: 'Nahawand', desc: 'Classical minor-mode foundation on C4' },
        'D♮4': { name: 'Nahawand Murassah (on D4)', arabicName: 'نهاوند مرصع', title: 'Nahawand Murassah', desc: 'Nahawand transposed up a whole tone to D4' },
        'G♮4': { name: 'Maqam Farahfaza (Nahawand on G4)', arabicName: 'مقام فَرَحْفَزا', title: 'Farahfaza', desc: 'Nahawand transposed up a 5th to G4 (Nawa), celebrated for poignant lyricism' }
      },
      sikah: {
        'B𝄳3': { name: 'Maqam ‘Iraq (Sikah on B𝄳3)', arabicName: 'مقام عراق', title: '‘Iraq', desc: 'Sikah transposed down a 4th to neutral B𝄳3 (Iraq)' },
        'E𝄳4': { name: 'Maqam Sikah (Original E𝄳4)', arabicName: 'مقام سيكاه', title: 'Sikah', desc: 'Traditional modal home on neutral third E𝄳4' },
        'B𝄳4': { name: 'Maqam Awj (Sikah on B𝄳4)', arabicName: 'مقام أوج', title: 'Awj', desc: 'Sikah transposed up a 5th to high neutral degree B𝄳4 (Awj)' }
      },
      kurd: {
        'C♮4': { name: 'Kurd ‘ala al-Rast (Kurd on C4)', arabicName: 'كرد على الراست', title: 'Kurd Rast', desc: 'Phrygian Kurd transposed down to C4' },
        'D♮4': { name: 'Maqam Kurd (Original D4)', arabicName: 'مقام كرد', title: 'Kurd', desc: 'Primary Phrygian modal home on D4 (Dukah)' },
        'G♮4': { name: 'Maqam Kurd Nawa (Kurd on G4)', arabicName: 'كرد على النوى', title: 'Kurd Nawa', desc: 'Kurd transposed up a 4th to G4 (Nawa)' },
        'A♮4': { name: 'Maqam Hijazkar Kurd (Kurd on A4)', arabicName: 'حجازكار كرد', title: 'Hijazkar Kurd', desc: 'Kurd transposed to A4' }
      },
      ajam: {
        'B♭3': { name: 'Maqam ‘Ajam ‘Ushayran (Original B♭3)', arabicName: 'مقام عجم عشيران', title: '‘Ajam ‘Ushayran', desc: 'Foundational major mode on B♭3' },
        'C♮4': { name: 'Maqam Jaharkah / ‘Ajam (on C4)', arabicName: 'مقام جهاركاه', title: 'Jaharkah', desc: '‘Ajam transposed up a whole step to C4' },
        'F♮4': { name: 'Maqam ‘Ajam Nawa (on F4)', arabicName: 'عجم على النوى', title: '‘Ajam Nawa', desc: '‘Ajam transposed up to F4' }
      },
      saba: {
        'C♮4': { name: 'Saba ‘ala al-Rast (Saba on C4)', arabicName: 'صبا على الراست', title: 'Saba Rast', desc: 'Saba transposed down to C4' },
        'D♮4': { name: 'Maqam Saba (Original D4)', arabicName: 'مقام صبا', title: 'Saba', desc: 'Archetypal expression of mourning on D4 (Dukah)' },
        'G♮4': { name: 'Maqam Saba Zamzam / Nawa (on G4)', arabicName: 'صبا زمزم', title: 'Saba Nawa', desc: 'Saba transposed up a 4th to G4 (Nawa)' }
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
      arabicName: baseMaqam.arabicName ? `${baseMaqam.arabicName} مصوّر` : 'مصوّر',
      description: `Transposed variant of ${baseMaqam.name} starting on ${newTonic.toScientificString()}${newTonic.octave} (${sign}${centsOffset}¢ shift)`,
      intervalName,
      centsOffset
    };
  }
}
