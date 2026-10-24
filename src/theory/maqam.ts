// src/theory/maqam.ts
import { ArabicPitch, type DiatonicBase } from "../core/pitch"
import { Jins, AjnasLibrary, type JinsDefinition } from "./jins"

export type MaqamConnection = "Ittisal" | "Infisal" | "Tadakhul"

export type JinsDirection = "asc" | "desc"

export interface JinsDefWithDirection {
  definition: JinsDefinition
  direction: JinsDirection
  connection: MaqamConnection
}

export type MaqamFamilyMnemonic =
  | "Nikriz"
  | "Nahawand"
  | "‘Ajam"
  | "Bayati"
  | "Sikah"
  | "Hijaz"
  | "Rast"
  | "Kurd"

export interface MaqamIndexEntry {
  readonly id: string
  readonly name: string
  readonly family: MaqamFamilyMnemonic | "None"
  readonly templateId: string
  readonly sourceSlug: string
  readonly ajnas?: JinsDefWithDirection[]
  readonly verified?: boolean
}

const AJNAS_AJAM: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.AJAM, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.UPPER_AJAM,
    connection: "Ittisal",
    direction: "asc",
  },
  {
    definition: AjnasLibrary.NAHAWAND,
    connection: "Ittisal",
    direction: "desc",
  },
]

const AJNAS_SHAWQ_AFZA: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.AJAM, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.HIJAZ, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.SABA_DALANSHIN,
    connection: "Tadakhul",
    direction: "asc",
  },
]

const AJNAS_BAYATI: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.BAYATI, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.UPPER_AJAM,
    connection: "Ittisal",
    direction: "asc",
  },
  {
    definition: AjnasLibrary.NAHAWAND,
    connection: "Ittisal",
    direction: "desc",
  },
]

// const AJNAS_MUHAYYAR: JinsDefWithDirection[] = [
//   { definition: AjnasLibrary.BAYATI, connection: "Ittisal", direction: "asc" },
//   { definition: AjnasLibrary.RAST, connection: "Ittisal", direction: "asc" },
//   {
//     definition: AjnasLibrary.NAHAWAND,
//     connection: "Ittisal",
//     direction: "desc",
//   },
//   { definition: AjnasLibrary.BAYATI, connection: "Infisal", direction: "desc" },
// ]

const AJNAS_HIJAZ: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.HIJAZ, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.NAHAWAND,
    connection: "Ittisal",
    direction: "desc",
  },
  { definition: AjnasLibrary.RAST, connection: "Infisal", direction: "asc" },
]

const AJNAS_ZANJARAN: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.HIJAZ, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.AJAM, connection: "Ittisal", direction: "asc" },
]

const AJNAS_KURD: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.KURD, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.NAHAWAND,
    connection: "Ittisal",
    direction: "desc",
  },
  { definition: AjnasLibrary.AJAM, connection: "Ittisal", direction: "asc" },
]

const AJNAS_NAHAWAND: JinsDefWithDirection[] = [
  {
    definition: AjnasLibrary.NAHAWAND,
    connection: "Ittisal",
    direction: "asc",
  },
  { definition: AjnasLibrary.KURD, connection: "Infisal", direction: "asc" },
  { definition: AjnasLibrary.HIJAZ, connection: "Infisal", direction: "desc" },
]

const AJNAS_USHAQ_MASRI: JinsDefWithDirection[] = [
  {
    definition: AjnasLibrary.NAHAWAND,
    connection: "Ittisal",
    direction: "asc",
  },
  { definition: AjnasLibrary.BAYATI, connection: "Ittisal", direction: "asc" },
]

const AJNAS_NAHAWAND_MURASSAA: JinsDefWithDirection[] = [
  {
    definition: AjnasLibrary.NAHAWAND_MURASSAA,
    connection: "Tadakhul",
    direction: "asc",
  },
  { definition: AjnasLibrary.HIJAZ, connection: "Tadakhul", direction: "asc" },
]

const AJNAS_NIKRIZ: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.NIKRIZ, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.NAHAWAND,
    connection: "Ittisal",
    direction: "desc",
  },
  { definition: AjnasLibrary.RAST, connection: "Infisal", direction: "asc" },
]

const AJNAS_NAWA_ATHAR: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.NIKRIZ, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.HIJAZKAR,
    connection: "Ittisal",
    direction: "asc",
  },
]

const AJNAS_RAST: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.RAST, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.UPPER_RAST,
    connection: "Ittisal",
    direction: "asc",
  },
  { definition: AjnasLibrary.SIKAH, connection: "Ittisal", direction: "desc" },
]

const AJNAS_NAIRUZ: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.RAST, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.BAYATI, connection: "Ittisal", direction: "asc" },
]

const AJNAS_SUZNAK: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.RAST, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.HIJAZ, connection: "Ittisal", direction: "asc" },
]

const AJNAS_MAHUR: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.RAST, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.UPPER_AJAM,
    connection: "Ittisal",
    direction: "asc",
  },
]

const AJNAS_SABA: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.SABA, connection: "Tadakhul", direction: "asc" },
  { definition: AjnasLibrary.HIJAZ, connection: "Tadakhul", direction: "asc" },
  { definition: AjnasLibrary.AJAM, connection: "Infisal", direction: "desc" },
  { definition: AjnasLibrary.NIKRIZ, connection: "Infisal", direction: "asc" },
]

const AJNAS_SIKAH: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.SIKAH, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.UPPER_RAST,
    connection: "Ittisal",
    direction: "asc",
  },
  { definition: AjnasLibrary.RAST, connection: "Ittisal", direction: "desc" },
]

const AJNAS_BASTANIKAR: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.SIKAH, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.SABA, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.HIJAZ, connection: "Tadakhul", direction: "asc" },
  { definition: AjnasLibrary.NIKRIZ, connection: "Ittisal", direction: "asc" },
]

const AJNAS_HUZAM: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.SIKAH, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.HIJAZ, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.RAST, connection: "Ittisal", direction: "asc" },
]

const AJNAS_HIJAZKAR: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.HIJAZ, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.NIKRIZ, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.HIJAZKAR,
    connection: "Tadakhul",
    direction: "desc",
  },
]

const AJNAS_JIHARKAH: JinsDefWithDirection[] = [
  {
    definition: AjnasLibrary.JIHARKAH,
    connection: "Ittisal",
    direction: "asc",
  },
  { definition: AjnasLibrary.AJAM, connection: "Ittisal", direction: "desc" },
  {
    definition: AjnasLibrary.NAHAWAND,
    connection: "Infisal",
    direction: "asc",
  },
]

const AJNAS_LAMI: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.LAMI, connection: "Ittisal", direction: "asc" },
  {
    definition: AjnasLibrary.UPPER_RAST,
    connection: "Ittisal",
    direction: "asc",
  },
  { definition: AjnasLibrary.KURD, connection: "Infisal", direction: "desc" },
]

const AJNAS_MUSTAAR: JinsDefWithDirection[] = [
  { definition: AjnasLibrary.MUSTAAR, connection: "Ittisal", direction: "asc" },
  { definition: AjnasLibrary.SIKAH, connection: "Ittisal", direction: "desc" },
  {
    definition: AjnasLibrary.UPPER_RAST,
    connection: "Ittisal",
    direction: "asc",
  },
]

const AJNAS_SIKAH_BALADI: JinsDefWithDirection[] = [
  {
    definition: AjnasLibrary.SIKAH_BALADI,
    connection: "Ittisal",
    direction: "asc",
  },
  { definition: AjnasLibrary.SIKAH, connection: "Ittisal", direction: "desc" },
  {
    definition: AjnasLibrary.UPPER_RAST,
    connection: "Ittisal",
    direction: "asc",
  },
]

// const AJNAS_SAZKAR: JinsDefWithDirection[] = [
//   { definition: AjnasLibrary.SAZKAR, connection: "Ittisal", direction: "asc" },
//   { definition: AjnasLibrary.RAST, connection: "Ittisal", direction: "desc" },
//   {
//     definition: AjnasLibrary.UPPER_RAST,
//     connection: "Ittisal",
//     direction: "asc",
//   },
// ]

export const MAQAM_INDEX: readonly MaqamIndexEntry[] = [
  {
    id: "ajam",
    name: "‘Ajam",
    family: "‘Ajam",
    templateId: "ajam",
    sourceSlug: "ajam",
    ajnas: AJNAS_AJAM,
  },
  {
    id: "ajam-ushayran",
    name: "‘Ajam ‘Ushayran",
    family: "‘Ajam",
    templateId: "ajam-ushayran",
    sourceSlug: "ajam_ushayran",
    ajnas: AJNAS_AJAM,
    verified: true,
  },

  {
    id: "awj-iraq",
    name: "Awj ‘Iraq",
    family: "Sikah",
    templateId: "awj-iraq",
    sourceSlug: "awj_iraq",
    ajnas: AJNAS_SIKAH,
  },
  {
    id: "bastanikar",
    name: "Bastanikar",
    family: "Sikah",
    templateId: "bastanikar",
    sourceSlug: "bastanikar",
    ajnas: AJNAS_BASTANIKAR,
    verified: true,
  },
  {
    id: "bayati",
    name: "Bayati",
    family: "Bayati",
    templateId: "bayati",
    sourceSlug: "bayati",
    ajnas: AJNAS_BAYATI,
    verified: true,
  },
  {
    id: "bayati-shuri",
    name: "Bayati Shuri",
    family: "Bayati",
    templateId: "bayati-shuri",
    sourceSlug: "bayati_shuri",
    ajnas: AJNAS_BAYATI,
  },
  {
    id: "dalanshin",
    name: "Dalanshin",
    family: "Bayati",
    templateId: "dalanshin",
    sourceSlug: "dalanshin",
    ajnas: AJNAS_BAYATI,
  },
  {
    id: "farahfaza",
    name: "Farahfaza",
    family: "Nahawand",
    templateId: "farahfaza",
    sourceSlug: "nahawand",
    ajnas: AJNAS_NAHAWAND,
  },
  {
    id: "hijaz",
    name: "Hijaz",
    family: "Hijaz",
    templateId: "hijaz",
    sourceSlug: "hijaz",
    ajnas: AJNAS_HIJAZ,
  },
  {
    id: "hijazkar",
    name: "Hijazkar",
    family: "Hijaz",
    templateId: "hijazkar",
    sourceSlug: "hijazkar",
    ajnas: AJNAS_HIJAZKAR,
  },
  {
    id: "hijazkar-kurd",
    name: "Hijazkar Kurd",
    family: "Hijaz",
    templateId: "hijaz",
    sourceSlug: "hijazkar_kurd",
    ajnas: AJNAS_HIJAZKAR,
  },

  {
    id: "huzam",
    name: "Huzam",
    family: "Sikah",
    templateId: "huzam",
    sourceSlug: "huzam",
    ajnas: AJNAS_HUZAM,
    verified: true,
  },
  {
    id: "iraq",
    name: "‘Iraq",
    family: "Sikah",
    templateId: "sikah",
    sourceSlug: "iraq",
    ajnas: AJNAS_SIKAH,
  },
  {
    id: "jiharkah",
    name: "Jiharkah",
    family: "None",
    templateId: "jiharkah",
    sourceSlug: "jiharkah",
    ajnas: AJNAS_JIHARKAH,
  },
  {
    id: "kirdan",
    name: "Kirdan",
    family: "Rast",
    templateId: "kirdan",
    sourceSlug: "kirdan",
    ajnas: AJNAS_RAST,
  },
  {
    id: "kurd",
    name: "Kurd",
    family: "Kurd",
    templateId: "kurd",
    sourceSlug: "kurd",
    ajnas: AJNAS_KURD,
    verified: true,
  },
  {
    id: "lami",
    name: "Lami",
    family: "None",
    templateId: "rast",
    sourceSlug: "lami",
    ajnas: AJNAS_LAMI,
  },
  {
    id: "mahur",
    name: "Mahur",
    family: "Rast",
    templateId: "mahur",
    sourceSlug: "mahur",
    ajnas: AJNAS_MAHUR,
    verified: true,
  },

  {
    id: "mustaar",
    name: "Musta‘ar",
    family: "Sikah",
    templateId: "mustaar",
    sourceSlug: "mustaar",
    ajnas: AJNAS_MUSTAAR,
  },
  {
    id: "nahawand",
    name: "Nahawand",
    family: "Nahawand",
    templateId: "nahawand",
    sourceSlug: "nahawand",
    ajnas: AJNAS_NAHAWAND,
  },
  {
    id: "nahawand-murassaa",
    name: "Nahawand Murassa‘",
    family: "Nahawand",
    templateId: "nahawand-murassaa",
    sourceSlug: "nahawand_murassaa",
    ajnas: AJNAS_NAHAWAND_MURASSAA,
    verified: true,
  },
  {
    id: "nairuz",
    name: "Nairuz",
    family: "Rast",
    templateId: "nairuz",
    sourceSlug: "nairuz",
    ajnas: AJNAS_NAIRUZ,
    verified: true,
  },
  {
    id: "nawa-athar",
    name: "Nawa Athar",
    family: "Nikriz",
    templateId: "nawa-athar",
    sourceSlug: "nawa_athar",
    ajnas: AJNAS_NAWA_ATHAR,
    verified: true,
  },
  {
    id: "nikriz",
    name: "Nikriz",
    family: "Nikriz",
    templateId: "nikriz",
    sourceSlug: "nikriz",
    ajnas: AJNAS_NIKRIZ,
    verified: true,
  },
  {
    id: "rahat-al-arwah",
    name: "Rahat al-Arwah",
    family: "Sikah",
    templateId: "rahat-al-arwah",
    sourceSlug: "huzam",
    ajnas: AJNAS_HUZAM,
    verified: true,
  },
  {
    id: "rast",
    name: "Rast",
    family: "Rast",
    templateId: "rast",
    sourceSlug: "rast",
    ajnas: AJNAS_RAST,
    verified: true,
  },
  {
    id: "saba",
    name: "Saba",
    family: "None",
    templateId: "saba",
    sourceSlug: "saba",
    ajnas: AJNAS_SABA,
    verified: true,
  },
  {
    id: "saba-zamzam",
    name: "Saba Zamzam",
    family: "None",
    templateId: "saba",
    sourceSlug: "saba_zamzam",
    ajnas: AJNAS_SABA,
  },

  {
    id: "shadd-araban",
    name: "Shadd ‘Araban",
    family: "Hijaz",
    templateId: "hijazkar",
    sourceSlug: "hijazkar",
    ajnas: AJNAS_HIJAZKAR,
  },
  {
    id: "shahnaz",
    name: "Shahnaz",
    family: "Hijaz",
    templateId: "hijazkar",
    sourceSlug: "hijazkar",
    ajnas: AJNAS_HIJAZKAR,
  },
  {
    id: "shawq-afza",
    name: "Shawq Afza",
    family: "‘Ajam",
    templateId: "shawq-afza",
    sourceSlug: "shawq_afza",
    ajnas: AJNAS_SHAWQ_AFZA,
    verified: true,
  },
  {
    id: "sikah",
    name: "Sikah",
    family: "Sikah",
    templateId: "sikah",
    sourceSlug: "sikah",
    ajnas: AJNAS_SIKAH,
    verified: true,
  },
  {
    id: "sikah-baladi",
    name: "Sikah Baladi",
    family: "None",
    templateId: "sikah",
    sourceSlug: "sikah_baladi",
    ajnas: AJNAS_SIKAH_BALADI,
  },

  {
    id: "suzidil",
    name: "Suzidil",
    family: "Hijaz",
    templateId: "hijazkar",
    sourceSlug: "hijazkar",
    ajnas: AJNAS_HIJAZ,
  },
  {
    id: "suznak",
    name: "Suznak",
    family: "Rast",
    templateId: "suznak",
    sourceSlug: "suznak",
    ajnas: AJNAS_SUZNAK,
    verified: true,
  },
  {
    id: "ushaq-masri",
    name: "‘Ushaq Masri",
    family: "Nahawand",
    templateId: "ushaq-masri",
    sourceSlug: "ushaq_masri",
    ajnas: AJNAS_USHAQ_MASRI,
    verified: true,
  },
  {
    id: "yakah",
    name: "Yakah",
    family: "Rast",
    templateId: "yakah",
    sourceSlug: "nairuz",
    ajnas: AJNAS_NAIRUZ,
  },
  {
    id: "zanjaran",
    name: "Zanjaran",
    family: "Hijaz",
    templateId: "zanjaran",
    sourceSlug: "zanjaran",
    ajnas: AJNAS_ZANJARAN,
  },
]

export interface AlternateJinsBranch {
  readonly jins: Jins
  readonly role:
    "upper_alternate" | "upper_secondary" | "modulation" | "descent_only"
  readonly description: string
}

export type SayrTrajectory =
  "ascending" | "descending_octave_first" | "undulating"

/**
 * Network representation of maqam as graph of ajnas with acceptable pathways.
 * From Abu Shumays' "Maqam Analysis: A Primer" - Example 17, 23.
 */
export interface ModulationNode {
  readonly jinsId: string
  readonly jinsName: string
  readonly arabicName: string
  readonly scaleDegree: number // 1-8 relative to maqam tonic
  readonly root: ArabicPitch
  readonly connections: readonly number[] // scale degrees this node connects to
  readonly frequency: "common" | "uncommon" | "rare"
  readonly roleDescription?: string
}

export interface NetworkPathway {
  readonly fromDegree: number
  readonly toDegree: number
  readonly fromJinsId?: string
  readonly toJinsId?: string
  readonly technique: "Ittisal" | "Infisal" | "Tadakhul"
  readonly frequency: "common" | "uncommon" | "rare"
  readonly description?: string
}

export interface MaqamNetwork {
  readonly nodes: readonly ModulationNode[]
  readonly pathways: readonly NetworkPathway[]
  readonly clusteringNotes?: string
}

export interface MaqamFamily {
  readonly mnemonic: MaqamFamilyMnemonic
  readonly arabicLetter: string
  readonly arabicName: string
  readonly rootJinsDef: JinsDefinition
  readonly description: string
}

export interface MaqamScaleStructure {
  readonly id: string
  readonly name: string
  readonly arabicName?: string
  readonly family: MaqamFamilyMnemonic | "None"
  readonly lowerJins: Jins
  readonly connection: MaqamConnection
  readonly upperJins: Jins
  readonly ghammaz: ArabicPitch
  /** Secondary or alternative upper ajnas active during melodic movement (sayr) */
  readonly alternateUpperAjnas?: AlternateJinsBranch[]
  readonly sayrDirection?: SayrTrajectory
  /** Upper register extensions or octave alterations */
  readonly extraPitches?: ArabicPitch[]
  /**
   * Network graph of ajnas and acceptable pathways within the maqam.
   * From Sami Abu Shumays' "Maqam Analysis: A Primer".
   */
  readonly network?: MaqamNetwork
  readonly sourceSlug?: string
  readonly verified?: boolean
  readonly description: string
}

export class Maqam {
  public readonly id: string
  public readonly name: string
  public readonly arabicName?: string
  public readonly family: MaqamFamilyMnemonic | "None"
  public readonly lowerJins: Jins
  public readonly connection: MaqamConnection
  public readonly upperJins: Jins
  public readonly ghammaz: ArabicPitch
  public readonly alternateUpperAjnas: readonly AlternateJinsBranch[]
  public readonly sayrDirection: SayrTrajectory
  public readonly extraPitches: readonly ArabicPitch[]
  public readonly network: MaqamNetwork | undefined
  public readonly sourceSlug?: string
  public readonly verified: boolean
  public readonly description: string

  constructor(structure: MaqamScaleStructure) {
    this.id = structure.id
    this.name = structure.name
    this.arabicName = structure.arabicName
    this.family = structure.family
    this.lowerJins = structure.lowerJins
    this.connection = structure.connection
    this.upperJins = structure.upperJins
    this.ghammaz = structure.ghammaz
    this.alternateUpperAjnas = structure.alternateUpperAjnas ?? []
    this.sayrDirection = structure.sayrDirection ?? "ascending"
    this.extraPitches = structure.extraPitches ?? []
    this.network = structure.network
    this.sourceSlug = structure.sourceSlug
    this.verified = structure.verified ?? false
    this.description = structure.description
    this.validateConnection()
  }

  private validateConnection(): void {
    const lowerTop = this.lowerJins.getTopPitch()
    const upperRoot = this.upperJins.root

    if (this.connection === "Ittisal") {
      if (!lowerTop.equals(upperRoot)) {
        throw new Error(
          `Ittisal requires lower jins top (${lowerTop}) to equal upper jins root (${upperRoot}).`
        )
      }
    } else if (this.connection === "Infisal") {
      const gap = lowerTop.diffQuarterTones(upperRoot)
      if (gap !== 4) {
        throw new Error(
          `Infisal requires a whole-tone gap (4 quarter-tones / 200 cents). Found: ${gap} qt.`
        )
      }
    }
  }

  /**
   * Constructs the full ascending scale.
   */
  public getScale(): ArabicPitch[] {
    const lowerPitches = this.lowerJins.getPitches()
    const upperPitches = this.upperJins.getPitches()

    let combined: ArabicPitch[]
    if (this.connection === "Ittisal") {
      // Shared pivot note (Ghammaz)
      combined = [...lowerPitches, ...upperPitches.slice(1)]
    } else if (this.connection === "Infisal") {
      // Whole-tone gap (Infisal)
      combined = [...lowerPitches, ...upperPitches]
    } else {
      // Tadakhul (interlocking or customized)
      combined = [...lowerPitches, ...upperPitches]
    }

    if (this.extraPitches.length > 0) {
      combined = [...combined, ...this.extraPitches]
    }

    const uniqueCombined: ArabicPitch[] = []
    for (const p of combined) {
      if (!uniqueCombined.some((existing) => existing.equals(p))) {
        uniqueCombined.push(p)
      }
    }

    // Spell each ascending scale degree on the next diatonic letter. This
    // keeps enharmonic spellings (for example G♯) readable as the next letter
    // (A♭) instead of repeating a letter already used by the scale.
    const diatonicLetters: DiatonicBase[] = ["C", "D", "E", "F", "G", "A", "B"]
    const tonicLetterIndex = diatonicLetters.indexOf(this.getTonic().diatonic)

    return uniqueCombined.map((pitch, index) => {
      const preferredBase =
        diatonicLetters[(tonicLetterIndex + index) % diatonicLetters.length]
      return ArabicPitch.fromQuarterToneIndex(
        pitch.toQuarterToneIndex(),
        preferredBase
      )
    })
  }

  public getTonic(): ArabicPitch {
    return this.lowerJins.root
  }

  public getGhammaz(): ArabicPitch {
    return this.ghammaz
  }

  public isMemberOfFamily(mnemonic: MaqamFamilyMnemonic): boolean {
    return this.family === mnemonic
  }

  public getIntervals(): number[] {
    const scale = this.getScale()
    const normalizedScale = scale
      .slice(1)
      .map((pitch, index) => scale[index].diffQuarterTones(pitch))

    // console.log("NormalizedScale: ", normalizedScale)
    return normalizedScale
  }

  /**
   * Transpose entire Maqam to a new target tonic pitch.
   * Preserves exact microtonal interval structure, Ghammaz pivot relationship,
   * connection type (Ittisal/Infisal/Tadakhul), network nodes, and upper extension pitches.
   */
  public transpose(newTonic: ArabicPitch): Maqam {
    if (this.lowerJins.root.equals(newTonic)) {
      return this
    }

    const deltaQt = this.lowerJins.root.diffQuarterTones(newTonic)
    const transposedLower = this.lowerJins.transpose(newTonic)
    const newUpperRoot = this.upperJins.root.transpose(deltaQt)
    const transposedUpper = this.upperJins.transpose(newUpperRoot)
    const newGhammaz = this.ghammaz.transpose(deltaQt)
    const newExtras = this.extraPitches.map((p) => p.transpose(deltaQt))
    const newAlternates = this.alternateUpperAjnas.map((b) => ({
      ...b,
      jins: b.jins.transpose(b.jins.root.transpose(deltaQt)),
    }))

    // Transpose network if present
    const transposedNetwork: MaqamNetwork | undefined = this.network
      ? {
          nodes: this.network.nodes.map((node) => ({
            ...node,
            root: node.root.transpose(deltaQt),
          })),
          pathways: [...this.network.pathways],
          clusteringNotes: this.network.clusteringNotes,
        }
      : undefined

    const transInfo = MaqamatCatalogue.getTranspositionInfo(this, newTonic)
    const sign = deltaQt > 0 ? "+" : ""
    const centsText = `${sign}${deltaQt * 50}¢`

    return new Maqam({
      id: `${this.id}-transposed-${newTonic.toScientificString()}${newTonic.octave}`,
      name:
        transInfo?.name ??
        `${this.name} on ${newTonic.toScientificString()}${newTonic.octave}`,
      arabicName:
        transInfo?.arabicName ??
        (this.arabicName ? `${this.arabicName} مصوّر` : undefined),
      family: this.family,
      lowerJins: transposedLower,
      connection: this.connection,
      upperJins: transposedUpper,
      ghammaz: newGhammaz,
      alternateUpperAjnas: newAlternates,
      sayrDirection: this.sayrDirection,
      extraPitches: newExtras,
      network: transposedNetwork,
      sourceSlug: this.sourceSlug,
      verified: this.verified || false,
      description:
        transInfo?.description ??
        `Transposed variant of ${this.name} starting on ${newTonic.toScientificString()}${newTonic.octave} (${centsText} shift)`,
    })
  }
}

/**
 * Registry of the eight root-jins families and core Maqamat.
 */
export class MaqamatCatalogue {
  public static readonly FAMILIES: Record<MaqamFamilyMnemonic, MaqamFamily> = {
    "‘Ajam": {
      mnemonic: "‘Ajam",
      arabicLetter: "ع",
      arabicName: "عائلة العجم",
      rootJinsDef: AjnasLibrary.AJAM,
      description:
        "Western major scale equivalent family spanning bright intervals",
    },
    Bayati: {
      mnemonic: "Bayati",
      arabicLetter: "ب",
      arabicName: "عائلة البياتي",
      rootJinsDef: AjnasLibrary.BAYATI,
      description: "Beloved folk and classical family with neutral 2nd",
    },
    Hijaz: {
      mnemonic: "Hijaz",
      arabicLetter: "ح",
      arabicName: "عائلة الحجاز",
      rootJinsDef: AjnasLibrary.HIJAZ,
      description: "Harmonic and dramatic colors with augmented 2nd",
    },
    Kurd: {
      mnemonic: "Kurd",
      arabicLetter: "ك",
      arabicName: "عائلة الكرد",
      rootJinsDef: AjnasLibrary.KURD,
      description: "Grounded Phrygian flavored modal family",
    },
    Nahawand: {
      mnemonic: "Nahawand",
      arabicLetter: "ن",
      arabicName: "عائلة النهاوند",
      rootJinsDef: AjnasLibrary.NAHAWAND,
      description: "Minor-third based family with natural minor qualities",
    },
    Nikriz: {
      mnemonic: "Nikriz",
      arabicLetter: "ن",
      arabicName: "عائلة النكريز",
      rootJinsDef: AjnasLibrary.NIKRIZ,
      description: "Rooted in the augmented-second Jins Nikriz",
    },
    Rast: {
      mnemonic: "Rast",
      arabicLetter: "ر",
      arabicName: "عائلة الراست",
      rootJinsDef: AjnasLibrary.RAST,
      description: 'The foundational "mother scale" of Arabic music',
    },
    Sikah: {
      mnemonic: "Sikah",
      arabicLetter: "س",
      arabicName: "عائلة السيكاه",
      rootJinsDef: AjnasLibrary.SIKAH,
      description: "Rooted directly on neutral third (E𝄳)",
    },
  }

  /**
   * Constructs Maqam Nairuz: Jins Rast on C4 followed by Jins Bayati on G4.
   * The shared G4 pivot produces C4 D4 E𝄳4 F4 G4 A𝄳4 B♭4 C5.
   */
  public static buildNairuz(): Maqam {
    const lower = new Jins(AjnasLibrary.RAST, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(AjnasLibrary.BAYATI, new ArabicPitch("G", "♮", 4))

    return new Maqam({
      id: "nairuz",
      name: "Nairuz",
      arabicName: "مقام نيروز",
      family: "Rast",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      sourceSlug: "nairuz",
      verified: true,
      description:
        "A Rast-family maqam that starts with Jins Rast on the C4 tonic, followed by Jins Bayati on the fifth degree G4.",
    })
  }

  /**
   * Constructs Yakah: Its just Nairuz transformed to lower tonic (G3)
   *
   */
  public static buildYakah(): Maqam {
    const niruz = MaqamatCatalogue.buildNairuz()
    const newTonic = new ArabicPitch("G", "♮", 3)
    const yakah = niruz.transpose(newTonic)
    return new Maqam({
      id: "yakah",
      name: "Yakah",
      arabicName: "مقام يكاه",
      family: "Rast",
      lowerJins: yakah.lowerJins,
      connection: yakah.connection,
      upperJins: yakah.upperJins,
      ghammaz: new ArabicPitch("D", "♮", 4),
      sourceSlug: "nairuz",
      verified: true,
      description:
        "The Nairuz interval structure transposed to G3 as the tonic: Jins Rast on G3 followed by Jins Bayati on D4. ",
    })
  }

  /**
   * Constructs Maqam Rast
   * Network: Based on Abu Shumays' Example 17 - nodes at degrees 1, 3, 5, 8
   */
  public static buildRast(): Maqam {
    const lower = new Jins(AjnasLibrary.RAST, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(
      AjnasLibrary.UPPER_RAST,
      new ArabicPitch("G", "♮", 4)
    )

    const rastNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "rast",
          jinsName: "Jins Rast",
          arabicName: "راست",
          scaleDegree: 1,
          root: new ArabicPitch("C", "♮", 4),
          connections: [3, 5],
          frequency: "common",
          roleDescription: "Root Jins on Qarar",
        },
        {
          jinsId: "sikah",
          jinsName: "Jins Sikah",
          arabicName: "سيكاه",
          scaleDegree: 3,
          root: new ArabicPitch("E", "𝄳", 4),
          connections: [1, 5],
          frequency: "common",
          roleDescription: "Neutral 3rd degree pivot",
        },
        {
          jinsId: "secondary-rast-gc",
          jinsName: "Secondary Rast G/C",
          arabicName: "راست ثانوي",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Upper Rast on Ghammaz",
        },
        {
          jinsId: "nahawand",
          jinsName: "Jins Nahawand",
          arabicName: "نهاوند",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Frequent upper modulation branch",
        },
        {
          jinsId: "hijaz",
          jinsName: "Jins Hijaz (Suznak)",
          arabicName: "حجاز (سوزناك)",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Forms Maqam Suznak",
        },
        {
          jinsId: "bayati",
          jinsName: "Jins Bayati (Nairuz)",
          arabicName: "بياتي (نيروز)",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "uncommon",
          roleDescription: "Forms Maqam Nairuz",
        },
        {
          jinsId: "saba",
          jinsName: "Jins Saba",
          arabicName: "صبا",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "rare",
          roleDescription: "Expressive rare modulation on 5th",
        },
        {
          jinsId: "rast",
          jinsName: "Jins Rast (Jawab)",
          arabicName: "راست الجواب",
          scaleDegree: 8,
          root: new ArabicPitch("C", "♮", 5),
          connections: [5],
          frequency: "common",
          roleDescription: "Octave resolution",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 3,
          technique: "Ittisal",
          frequency: "common",
          description: "Stepwise motion from Rast to Sikah on 3rd degree",
        },
        {
          fromDegree: 1,
          toDegree: 5,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent from tonic to Ghammaz on 5th degree (Nawa)",
        },
        {
          fromDegree: 3,
          toDegree: 1,
          technique: "Ittisal",
          frequency: "common",
          description: "Cadential resolution back to tonic",
        },
        {
          fromDegree: 3,
          toDegree: 5,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent from Sikah 3rd to Ghammaz",
        },
        {
          fromDegree: 5,
          toDegree: 1,
          technique: "Infisal",
          frequency: "common",
          description: "Descent from Ghammaz back to Qarar",
        },
        {
          fromDegree: 5,
          toDegree: 8,
          technique: "Ittisal",
          frequency: "common",
          description: "Upper exploration to Kirdan octave",
        },
        {
          fromDegree: 8,
          toDegree: 5,
          technique: "Ittisal",
          frequency: "common",
          description: "Descent from octave apex back to Ghammaz",
        },
      ],
      clusteringNotes:
        "Small-world network properties: high clustering around degrees 1, 3, and 5 with short characteristic path length.",
    }

    return new Maqam({
      id: "rast",
      name: "Rast",
      arabicName: "مقام راست",
      family: "Rast",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("G", "♮", 4)),
          role: "upper_alternate",
          description:
            "Upper Nahawand on G4 (frequent modulation and melodic branch in Rast sayr)",
        },
        {
          jins: new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("G", "♮", 4)),
          role: "upper_alternate",
          description: "Upper Hijaz on G4 (Suznak color)",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("C", "♮", 5)],
      network: rastNetwork,
      description:
        "The main maqam in the Rast family and by far one of the most popular and common maqamat in the Arabic repertory. It begins with Jins Rast on the C4 tonic, followed on the fifth degree G4 by either Jins Upper Rast, whose tonic is on the eighth degree C5, or Jins Nahawand.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Kirdan.
   * Kirdan uses the Rast scale structure, but its characteristic sayr starts
   * in the octave and descends through Upper Rast before resolving to C4.
   */
  public static buildKirdan(): Maqam {
    const lower = new Jins(AjnasLibrary.RAST, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(
      AjnasLibrary.UPPER_RAST,
      new ArabicPitch("G", "♮", 4)
    )

    return new Maqam({
      id: "kirdan",
      name: "Kirdan",
      arabicName: "مقام كردان",
      family: "Rast",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      sayrDirection: "descending_octave_first",
      extraPitches: [new ArabicPitch("C", "♮", 5)],
      description:
        "A Rast-derived maqam whose sayr begins on the octave C5, descends through Upper Rast from the fifth degree G4, and eventually resolves through the lower Jins Rast to tonic C4.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Mahur.
   * Jins Rast on C4 is followed by Upper ‘Ajam on G4, whose tonic is C5.
   */
  public static buildMahur(): Maqam {
    const lower = new Jins(AjnasLibrary.RAST, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(
      AjnasLibrary.UPPER_AJAM,
      new ArabicPitch("G", "♮", 4)
    )

    return new Maqam({
      id: "mahur",
      name: "Mahur",
      arabicName: "مقام ماهور",
      family: "Rast",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("C", "♮", 5)],
      description:
        "A Rast-family maqam beginning with Jins Rast on the C4 tonic, followed by Jins Upper ‘Ajam on the fifth degree G4, with its tonic at the octave C5.",
    })
  }

  /**
   * Constructs Maqam Bayati
   * Network: Based on Abu Shumays' Example 23 - nodes at degrees 1, 4, 5, 6, 8
   */
  public static buildBayati(): Maqam {
    const lower = new Jins(AjnasLibrary.BAYATI, new ArabicPitch("D", "♮", 4))
    const upper = new Jins(AjnasLibrary.RAST, new ArabicPitch("G", "♮", 4))
    const bayatiNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "bayati",
          jinsName: "Jins Bayati",
          arabicName: "بياتي",
          scaleDegree: 1,
          root: new ArabicPitch("D", "♮", 4),
          connections: [4, 5, 6, 8],
          frequency: "common",
          roleDescription: "Root Jins on Dukah",
        },
        {
          jinsId: "hijaz",
          jinsName: "Jins Hijaz (Shuri)",
          arabicName: "حجاز (شورى)",
          scaleDegree: 4,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 5, 8],
          frequency: "common",
          roleDescription: "Forms Maqam Bayati Shuri",
        },
        {
          jinsId: "rast",
          jinsName: "Jins Rast",
          arabicName: "راست",
          scaleDegree: 4,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 5, 8],
          frequency: "common",
          roleDescription: "Forms Maqam Husayni",
        },
        {
          jinsId: "nahawand",
          jinsName: "Jins Nahawand",
          arabicName: "نهاوند",
          scaleDegree: 4,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 5, 6, 8],
          frequency: "common",
          roleDescription: "Standard upper branch",
        },
        {
          jinsId: "bayati",
          jinsName: "Jins Bayati (Husayni)",
          arabicName: "بياتي (حسيني)",
          scaleDegree: 5,
          root: new ArabicPitch("A", "♮", 4),
          connections: [1, 4, 6, 8],
          frequency: "common",
          roleDescription: "Secondary Bayati on 5th",
        },
        {
          jinsId: "ajam",
          jinsName: "Jins Ajam",
          arabicName: "عجم",
          scaleDegree: 6,
          root: new ArabicPitch("B", "♭", 4),
          connections: [1, 4, 5, 8],
          frequency: "common",
          roleDescription: "Upper Ajam on 6th",
        },
        {
          jinsId: "bayati",
          jinsName: "Jins Bayati (Muhayyar)",
          arabicName: "بياتي (محير)",
          scaleDegree: 8,
          root: new ArabicPitch("D", "♮", 5),
          connections: [1, 4, 5, 6],
          frequency: "common",
          roleDescription: "Octave Muhayyar",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 4,
          technique: "Ittisal",
          frequency: "common",
          description: "Primary conjunct ascent to Ghammaz on 4th",
        },
        {
          fromDegree: 1,
          toDegree: 5,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to 5th degree Husayni",
        },
        {
          fromDegree: 1,
          toDegree: 6,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to Ajam on 6th degree",
        },
        {
          fromDegree: 1,
          toDegree: 8,
          technique: "Infisal",
          frequency: "common",
          description: "Leap to octave Muhayyar",
        },
        {
          fromDegree: 4,
          toDegree: 1,
          technique: "Ittisal",
          frequency: "common",
          description: "Descent from Ghammaz to Dukah",
        },
        {
          fromDegree: 4,
          toDegree: 5,
          technique: "Ittisal",
          frequency: "common",
          description: "Progression from 4th to 5th degree",
        },
        {
          fromDegree: 4,
          toDegree: 8,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to octave",
        },
        {
          fromDegree: 5,
          toDegree: 1,
          technique: "Infisal",
          frequency: "common",
          description: "Cadential descent from Husayni",
        },
        {
          fromDegree: 5,
          toDegree: 4,
          technique: "Ittisal",
          frequency: "common",
          description: "Step back to Ghammaz",
        },
        {
          fromDegree: 5,
          toDegree: 6,
          technique: "Ittisal",
          frequency: "common",
          description: "Step up to Ajam",
        },
        {
          fromDegree: 5,
          toDegree: 8,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to octave",
        },
        {
          fromDegree: 6,
          toDegree: 1,
          technique: "Infisal",
          frequency: "common",
          description: "Descent to tonic",
        },
        {
          fromDegree: 6,
          toDegree: 4,
          technique: "Infisal",
          frequency: "common",
          description: "Descent to Ghammaz",
        },
        {
          fromDegree: 6,
          toDegree: 5,
          technique: "Ittisal",
          frequency: "common",
          description: "Step down to Husayni",
        },
        {
          fromDegree: 6,
          toDegree: 8,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to octave",
        },
        {
          fromDegree: 8,
          toDegree: 1,
          technique: "Infisal",
          frequency: "common",
          description: "Full octave descent",
        },
        {
          fromDegree: 8,
          toDegree: 4,
          technique: "Infisal",
          frequency: "common",
          description: "Descent to Ghammaz",
        },
        {
          fromDegree: 8,
          toDegree: 5,
          technique: "Infisal",
          frequency: "common",
          description: "Descent to Husayni",
        },
        {
          fromDegree: 8,
          toDegree: 6,
          technique: "Infisal",
          frequency: "common",
          description: "Step down to Ajam",
        },
      ],
      clusteringNotes:
        "Small-world network properties: highly connected hub at degree 4 (Ghammaz) linking to multiple distinct upper ajnas.",
    }

    return new Maqam({
      id: "bayati",
      name: "Bayati",
      arabicName: "مقام بياتي",
      family: "Bayati",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("G", "♮", 4)),
          role: "upper_alternate",
          description: "Bayati Shuri: Upper Hijaz on G4",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("D", "♮", 5)],
      network: bayatiNetwork,
      description:
        "Bayati on D4 has two principal upper-jins versions: Bayati Nahawand (D4–E𝄳4–F4–G4–A4–B♭4–C5–D5) and Bayati Rast (D4–E𝄳4–F4–G4–A4–B𝄳4–C5–D5).",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Bayati Shuri
   */
  public static buildBayatiShuri(): Maqam {
    const lower = new Jins(AjnasLibrary.BAYATI, new ArabicPitch("D", "♮", 4))
    const upper = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("G", "♮", 4))

    return new Maqam({
      id: "bayati-shuri",
      name: "Bayati Shuri",
      arabicName: "مقام بياتي شوري",
      family: "Bayati",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      // alternateUpperAjnas: [
      //   {
      //     jins: new Jins(AjnasLibrary.RAST, new ArabicPitch("G", "♮", 4)),
      //     role: "upper_alternate",
      //     description: "Upper Rast on G4 as an alternative to the Shuri Hijaz branch",
      //   },
      // ],
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("D", "♮", 5)],
      description:
        "A Bayati Shuri scale: D4, E♭4, F4, G4, A♭4, B4, C5, D5, formed by Nahawand on C4 followed by Hijaz on G4.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Dalanshin
   */
  public static buildDalanshin(): Maqam {
    const lower = new Jins(AjnasLibrary.RAST, new ArabicPitch("C", "♮", 4))
    // include Middle Rast
    const upper = new Jins(
      AjnasLibrary.SABA_DALANSHIN,
      new ArabicPitch("A", "♮", 4)
    )

    return new Maqam({
      id: "dalanshin",
      name: "Dalanshin",
      arabicName: "مقام دلنشين",
      family: "Rast",
      lowerJins: lower,
      connection: "Infisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),

      sayrDirection: "descending_octave_first",
      extraPitches: [
        new ArabicPitch("D", "♭", 5),
        new ArabicPitch("E", "♮", 5),
      ],
      description:
        "Its characteristic descending Dalanshin passage is E5, D♭5, C5, B♭4, A4, G4, F4, E♭4, D4, C4.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Muhayyar (Bayati family, octave-emphasized)
   */

  /**
   * Constructs Maqam Hijaz
   */
  public static buildHijaz(): Maqam {
    const lower = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("D", "♮", 4))
    const upper = new Jins(AjnasLibrary.RAST, new ArabicPitch("G", "♮", 4))

    const hijazNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "hijaz",
          jinsName: "Jins Hijaz",
          arabicName: "حجاز",
          scaleDegree: 1,
          root: new ArabicPitch("D", "♮", 4),
          connections: [4, 8],
          frequency: "common",
          roleDescription: "Root Jins on Dukah",
        },
        {
          jinsId: "nahawand",
          jinsName: "Jins Nahawand",
          arabicName: "نهاوند",
          scaleDegree: 4,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Primary upper branch",
        },
        {
          jinsId: "rast",
          jinsName: "Jins Rast (Suznak)",
          arabicName: "راست (سوزناك)",
          scaleDegree: 4,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Upper Rast alternative",
        },
        {
          jinsId: "hijaz",
          jinsName: "Jins Hijaz (Octave)",
          arabicName: "حجاز الجواب",
          scaleDegree: 8,
          root: new ArabicPitch("D", "♮", 5),
          connections: [4],
          frequency: "common",
          roleDescription: "Octave peak",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 4,
          technique: "Ittisal",
          frequency: "common",
          description: "Conjunct ascent to Ghammaz on 4th",
        },
        {
          fromDegree: 4,
          toDegree: 1,
          technique: "Ittisal",
          frequency: "common",
          description: "Descent to Dukah",
        },
        {
          fromDegree: 4,
          toDegree: 8,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to octave",
        },
        {
          fromDegree: 8,
          toDegree: 4,
          technique: "Infisal",
          frequency: "common",
          description: "Descent from octave",
        },
      ],
    }

    return new Maqam({
      id: "hijaz",
      name: "Hijaz",
      arabicName: "مقام حجاز",
      family: "Hijaz",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("G", "♮", 4)),
          role: "upper_alternate",
          description:
            "Upper Nahawand on G4 (Hijaz with upper Rast / Suznak color)",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("D", "♮", 5)],
      network: hijazNetwork,
      description:
        "The principal maqam in the Hijaz family. Its scale begins with root jins Hijaz on the tonic and commonly continues with Rast or Nahawand at the upper ghammaz.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Zanjaran.
   * A Hijaz variation with Jins ‘Ajam on the fourth degree.
   */
  public static buildZanjaran(): Maqam {
    const lower = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(AjnasLibrary.AJAM, new ArabicPitch("F", "♮", 4))

    return new Maqam({
      id: "zanjaran",
      name: "Zanjaran",
      arabicName: "مقام زنجران",
      family: "Hijaz",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("F", "♮", 4),
      sayrDirection: "ascending",
      description:
        "A variation of Maqam Hijaz with Jins ‘Ajam as the second jins on the fourth degree, above root Jins Hijaz on the tonic.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Hijazkar.
   * The upper Nikriz branch begins on F4 and the descending Hijazkar branch
   * overlaps from A♭4 (the sixth scale degree).
   */
  public static buildHijazkar(): Maqam {
    const lower = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("C", "♮", 4))
    // first: link with nikriz
    const upper = new Jins(AjnasLibrary.NIKRIZ, new ArabicPitch("F", "♮", 4))

    return new Maqam({
      id: "hijazkar",
      name: "Hijazkar",
      arabicName: "مقام حجازكار",
      family: "Hijaz",
      lowerJins: lower,
      connection: "Tadakhul",
      upperJins: upper,
      ghammaz: new ArabicPitch("F", "♮", 4),

      sayrDirection: "descending_octave_first",
      extraPitches: [
        new ArabicPitch("C", "♮", 5),
        new ArabicPitch("D", "♭", 5),
        new ArabicPitch("E", "♮", 5),
      ],
      description:
        "Hijaz on C4 followed by Nikriz on F4, with a descending Hijazkar branch overlapping from A♭4. The characteristic descent is E5-D♭5-C5-B4-A♭4-G4-F4-E4-D♭4-C4.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Nahawand
   */
  public static buildNahawand(): Maqam {
    const lower = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(AjnasLibrary.KURD, new ArabicPitch("G", "♮", 4))

    const nahawandNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "nahawand",
          jinsName: "Jins Nahawand",
          arabicName: "نهاوند",
          scaleDegree: 1,
          root: new ArabicPitch("C", "♮", 4),
          connections: [5, 8],
          frequency: "common",
          roleDescription: "Root Jins on Rast C4",
        },
        {
          jinsId: "kurd",
          jinsName: "Jins Kurd",
          arabicName: "كرد",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Upper Kurd on 5th",
        },
        {
          jinsId: "hijaz",
          jinsName: "Jins Hijaz (Murassah)",
          arabicName: "حجاز (مرصع)",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Harmonic minor inflection",
        },
        {
          jinsId: "nahawand",
          jinsName: "Jins Nahawand (Octave)",
          arabicName: "نهاوند الجواب",
          scaleDegree: 8,
          root: new ArabicPitch("C", "♮", 5),
          connections: [5],
          frequency: "common",
          roleDescription: "Octave peak",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 5,
          technique: "Infisal",
          frequency: "common",
          description: "Disjunct ascent to Ghammaz on 5th",
        },
        {
          fromDegree: 5,
          toDegree: 1,
          technique: "Infisal",
          frequency: "common",
          description: "Descent to tonic",
        },
        {
          fromDegree: 5,
          toDegree: 8,
          technique: "Ittisal",
          frequency: "common",
          description: "Ascent to octave",
        },
        {
          fromDegree: 8,
          toDegree: 5,
          technique: "Ittisal",
          frequency: "common",
          description: "Descent from octave",
        },
      ],
    }

    return new Maqam({
      id: "nahawand",
      name: "Nahawand",
      arabicName: "مقام نهاوند",
      family: "Nahawand",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("G", "♮", 4)),
          role: "upper_alternate",
          description:
            "Upper Hijaz on G4 (Nahawand Murassah / harmonic minor inflection)",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("C", "♮", 5)],
      network: nahawandNetwork,
      description:
        "The principal maqam in the Nahawand family. Its root jins Nahawand on C4 is followed either by Hijaz on G4 (C4-D-E♭-F-G-A♭-B-C5) or by Kurd on G4 (C4-D-E♭-F-G-A♭-B♭-C5).",
      verified: true,
    })
  }

  /**
   * Constructs Maqam ‘Ushaq Masri.
   * A Nahawand variation with Jins Bayati on the fifth degree.
   */
  public static buildUshaqMasri(): Maqam {
    const lower = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("D", "♮", 4))
    const upper = new Jins(AjnasLibrary.BAYATI, new ArabicPitch("A", "♮", 4))

    return new Maqam({
      id: "ushaq-masri",
      name: "‘Ushaq Masri",
      arabicName: "مقام عُشّاق مصري",
      family: "Nahawand",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("A", "♮", 4),
      sayrDirection: "ascending",
      description:
        "A variation of Maqam Nahawand with Jins Bayati on the fifth degree above the root Jins Nahawand on the tonic.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Nahawand Murassa‘.
   * Its lowered fifth is represented by Jins Nahawand Murassa‘, overlapped
   * by Jins Hijaz beginning on the fourth degree F4.
   */
  public static buildNahawandMurassaa(): Maqam {
    const lower = new Jins(
      AjnasLibrary.NAHAWAND_MURASSAA,
      new ArabicPitch("C", "♮", 4)
    )
    const upper = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("F", "♮", 4))

    return new Maqam({
      id: "nahawand-murassaa",
      name: "Nahawand Murassa‘",
      arabicName: "مقام نهاوند مرصع",
      family: "Nahawand",
      lowerJins: lower,
      connection: "Tadakhul",
      upperJins: upper,
      ghammaz: new ArabicPitch("F", "♮", 4),
      extraPitches: [new ArabicPitch("C", "♮", 5)],
      sayrDirection: "ascending",
      description:
        "A variation of Maqam Nahawand with a lowered fifth scale degree. It begins with Jins Nahawand Murassa‘ on the C4 tonic and overlaps with Jins Hijaz beginning on the fourth degree F4.",
    })
  }

  /**
   * Constructs Maqam Farahfaza (Nahawand family on G)
   */
  public static buildFarahfaza(): Maqam {
    const lower = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("G", "♮", 3))
    const upper = new Jins(AjnasLibrary.KURD, new ArabicPitch("D", "♮", 4))

    return new Maqam({
      id: "farahfaza",
      name: "Farahfaza",
      arabicName: "مقام فَرَحْفَزا",
      family: "Nahawand",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("D", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("D", "♮", 4)),
          role: "upper_alternate",
          description:
            "Upper Hijaz on D4 (Farahfaza Murassah / harmonic minor color)",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("G", "♮", 4)],
      description:
        "A direct transposition of Nahawand to tonic G3: G3-A3-B♭3-C4-D4-E♭4-F4-G4, with the same Hijaz and Kurd upper branches.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Kurd
   */
  public static buildKurd(): Maqam {
    const lower = new Jins(AjnasLibrary.KURD, new ArabicPitch("D", "♮", 4))
    const upper = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("G", "♮", 4))

    const kurdNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "kurd",
          jinsName: "Jins Kurd",
          arabicName: "كرد",
          scaleDegree: 1,
          root: new ArabicPitch("D", "♮", 4),
          connections: [4, 8],
          frequency: "common",
          roleDescription: "Root Jins on Dukah",
        },
        {
          jinsId: "nahawand",
          jinsName: "Jins Nahawand",
          arabicName: "نهاوند",
          scaleDegree: 4,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Primary upper branch",
        },
        {
          jinsId: "kurd",
          jinsName: "Jins Kurd (Upper)",
          arabicName: "كرد على النوى",
          scaleDegree: 4,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Double Kurd variant",
        },
        {
          jinsId: "kurd",
          jinsName: "Jins Kurd (Octave)",
          arabicName: "كرد الجواب",
          scaleDegree: 8,
          root: new ArabicPitch("D", "♮", 5),
          connections: [4],
          frequency: "common",
          roleDescription: "Octave peak",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 4,
          technique: "Ittisal",
          frequency: "common",
          description: "Conjunct ascent to Ghammaz on 4th",
        },
        {
          fromDegree: 4,
          toDegree: 1,
          technique: "Ittisal",
          frequency: "common",
          description: "Descent to Dukah",
        },
        {
          fromDegree: 4,
          toDegree: 8,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to octave",
        },
        {
          fromDegree: 8,
          toDegree: 4,
          technique: "Infisal",
          frequency: "common",
          description: "Descent from octave",
        },
      ],
    }

    return new Maqam({
      id: "kurd",
      name: "Kurd",
      arabicName: "مقام كُرد",
      family: "Kurd",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),

      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("D", "♮", 5)],
      network: kurdNetwork,
      description:
        "The principal maqam in the Kurd family. It begins with Jins Kurd on the D4 tonic, followed conjunctly by Jins Nahawand beginning on the fourth degree G4, and resolves at the D5 octave.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Ajam
   */
  public static buildAjam(): Maqam {
    const lower = new Jins(AjnasLibrary.AJAM, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(
      AjnasLibrary.UPPER_AJAM,
      new ArabicPitch("G", "♮", 4)
    )

    const ajamNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "ajam",
          jinsName: "Jins Ajam",
          arabicName: "عجم",
          scaleDegree: 1,
          root: new ArabicPitch("C", "♮", 4),
          connections: [5, 8],
          frequency: "common",
          roleDescription: "Root Jins on C4",
        },
        {
          jinsId: "ajam",
          jinsName: "Jins Ajam (Upper)",
          arabicName: "عجم علوي",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Upper Ajam on 5th",
        },
        {
          jinsId: "nahawand",
          jinsName: "Jins Nahawand",
          arabicName: "نهاوند",
          scaleDegree: 5,
          root: new ArabicPitch("C", "♮", 5),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Upper Nahawand on C5",
        },
        {
          jinsId: "ajam",
          jinsName: "Jins Ajam (Octave)",
          arabicName: "عجم الجواب",
          scaleDegree: 8,
          root: new ArabicPitch("C", "♮", 5),
          connections: [5],
          frequency: "common",
          roleDescription: "Octave peak",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 5,
          technique: "Ittisal",
          frequency: "common",
          description: "Ascent to Ghammaz on 5th",
        },
        {
          fromDegree: 5,
          toDegree: 1,
          technique: "Ittisal",
          frequency: "common",
          description: "Descent to tonic",
        },
        {
          fromDegree: 5,
          toDegree: 8,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to octave",
        },
        {
          fromDegree: 8,
          toDegree: 5,
          technique: "Infisal",
          frequency: "common",
          description: "Descent from octave",
        },
      ],
    }

    return new Maqam({
      id: "ajam",
      name: "Ajam",
      arabicName: "مقام عجم",
      family: "‘Ajam",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("G", "♮", 4)),
          role: "upper_alternate",
          description:
            "Ajam Rast: Ajam on C4 followed by Nahawand on G4, producing G4–A4–B♭4–C5",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("C", "♮", 5)],
      network: ajamNetwork,
      description:
        "Ajam on C4 has two principal upper-jins versions: Ajam Upper Ajam (C4–D4–E4–F4–G4–A4–B4–C5) and Ajam Nahawand (C4–D4–E4–F4–G4–A4–B♭4–C5).",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Shawq Afza.
   * Its defining upper branch is Hijaz on the fifth degree, with frequent
   * Saba Dalanshin modulation on the third and fifth degrees.
   */
  public static buildShawqAfza(): Maqam {
    const lower = new Jins(AjnasLibrary.AJAM, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("G", "♮", 4))

    return new Maqam({
      id: "shawq-afza",
      name: "Shawq Afza",
      arabicName: "مقام شوق أفزا",
      family: "‘Ajam",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(
            AjnasLibrary.SABA_DALANSHIN,
            new ArabicPitch("F", "♮", 4)
          ),
          role: "modulation",
          description:
            "Frequent Saba Dalanshin modulation on the third degree F4",
        },
        {
          jins: new Jins(
            AjnasLibrary.SABA_DALANSHIN,
            new ArabicPitch("G", "♮", 4)
          ),
          role: "modulation",
          description:
            "Frequent Saba Dalanshin modulation on the fifth degree G4",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("C", "♮", 5)],
      description:
        "The most common variant of Maqam ‘Ajam. Its scale is C4, D4, E4, F4, G4, A♭4, B4, C5: Jins ‘Ajam on C4 followed by Jins Hijaz on G4. It frequently modulates to Jins Saba Dalanshin on the third and fifth degrees.",
    })
  }

  /**
   * Constructs Maqam Jiharkah.
   * The image's structure is Jins Jiharkah on F4 followed by Upper Rast on C5.
   */
  public static buildJiharkah(): Maqam {
    const lower = new Jins(AjnasLibrary.JIHARKAH, new ArabicPitch("F", "♮", 4))
    const upper = new Jins(
      AjnasLibrary.UPPER_RAST,
      new ArabicPitch("C", "♮", 5)
    )

    return new Maqam({
      id: "jiharkah",
      name: "Jiharkah",
      arabicName: "مقام جهاركاه",
      family: "None",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("C", "♮", 5),
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("F", "♮", 5)],
      description:
        "Jins Jiharkah on F4 followed by Upper Rast on C5. The two ajnas join at degree 5 and produce the ascending octave F4-G4-A𝄳4-B♭4-C5-D5-E𝄳5-F5.",
    })
  }

  /**
   * Constructs Maqam Ajam Ushayran
   */
  public static buildAjamUshayran(): Maqam {
    const lower = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("B", "♭", 3))
    const upper = new Jins(
      AjnasLibrary.UPPER_AJAM,
      new ArabicPitch("F", "♮", 4)
    )

    return new Maqam({
      id: "ajam-ushayran",
      name: "‘Ajam ‘Ushayran",
      arabicName: "مقام عجم عشيران",
      family: "‘Ajam",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("F", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("B", "♭", 4)),
          role: "descent_only",
          description: "Nahawand descent from the upper register",
        },
        {
          jins: new Jins(AjnasLibrary.KURD, new ArabicPitch("F", "♮", 4)),
          role: "descent_only",
          description: "Kurd descent through the middle register",
        },
      ],
      sayrDirection: "descending_octave_first",
      extraPitches: [new ArabicPitch("B", "♭", 4)],
      description:
        "An archaic ‘Ajam variant whose sayr descends through Nahawand, Kurd, and ‘Ajam rather than centering the fifth degree. The characteristic descent is B♭4, A4, G4, F4, E♭4, D4, C4, B♭3.",
      verified: false,
    })
  }
  /**
   * Constructs Maqam Bastanikar
   */
  public static buildBastanikar(): Maqam {
    const lower = new Jins(AjnasLibrary.SIKAH, new ArabicPitch("B", "𝄳", 3))
    const upper = new Jins(AjnasLibrary.SABA, new ArabicPitch("D", "♮", 4))

    return new Maqam({
      id: "bastanikar",
      name: "Bastanikar",
      arabicName: "مقام بستانكار",
      family: "Sikah",
      lowerJins: lower,
      connection: "Tadakhul",
      upperJins: upper,
      ghammaz: new ArabicPitch("D", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("F", "♮", 4)),
          role: "upper_secondary",
          description: "Overlapping Hijaz on F4",
        },
        {
          jins: new Jins(AjnasLibrary.NIKRIZ, new ArabicPitch("B", "♭", 4)),
          role: "upper_secondary",
          description: "Upper Nikriz on the octave area",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [
        new ArabicPitch("B", "♭", 4),
        new ArabicPitch("C", "♮", 5),
        new ArabicPitch("D", "♭", 5),
        new ArabicPitch("E", "♮", 5),
        new ArabicPitch("F", "♮", 5),
      ],
      description:
        "Effectively Jins Sikah followed by Maqam Saba: Jins Sikah on the tonic, Jins Saba on the third degree, overlapping Jins Hijaz on the fifth degree, and Jins Nikriz in the octave register.",
    })
  }

  /**
   * Constructs Maqam Sikah
   */
  public static buildSikah(): Maqam {
    const lower = new Jins(AjnasLibrary.SIKAH, new ArabicPitch("E", "𝄳", 4))
    const upper = new Jins(
      AjnasLibrary.UPPER_RAST,
      new ArabicPitch("G", "♮", 4)
    )

    const sikahNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "sikah",
          jinsName: "Jins Sikah",
          arabicName: "سيكاه",
          scaleDegree: 1,
          root: new ArabicPitch("E", "𝄳", 4),
          connections: [3, 6],
          frequency: "common",
          roleDescription: "Root Jins on E𝄳4",
        },
        {
          jinsId: "secondary-rast-gc",
          jinsName: "Secondary Rast G/C",
          arabicName: "راست ثانوي",
          scaleDegree: 3,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 6],
          frequency: "common",
          roleDescription: "Upper Rast on G4",
        },
        {
          jinsId: "rast",
          jinsName: "Jins Rast (Octave)",
          arabicName: "راست علوي",
          scaleDegree: 6,
          root: new ArabicPitch("C", "♮", 5),
          connections: [3],
          frequency: "common",
          roleDescription: "Secondary Rast around octave",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 3,
          technique: "Ittisal",
          frequency: "common",
          description: "Stepwise ascent to Ghammaz G4",
        },
        {
          fromDegree: 3,
          toDegree: 1,
          technique: "Ittisal",
          frequency: "common",
          description: "Descent back to Sikah root",
        },
        {
          fromDegree: 3,
          toDegree: 6,
          technique: "Ittisal",
          frequency: "common",
          description: "Ascent to upper Rast C5",
        },
        {
          fromDegree: 6,
          toDegree: 3,
          technique: "Ittisal",
          frequency: "common",
          description: "Descent from upper octave",
        },
      ],
    }

    return new Maqam({
      id: "sikah",
      name: "Sikah",
      arabicName: "مقام سيكاه",
      family: "Sikah",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.RAST, new ArabicPitch("C", "♮", 5)),
          role: "upper_secondary",
          description: "Secondary Jins Rast material around the upper octave",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [
        new ArabicPitch("C", "♮", 5),
        new ArabicPitch("D", "♮", 5),
        new ArabicPitch("E", "𝄳", 5),
      ],
      network: sikahNetwork,
      description:
        "A rare member of the Sikah family. It begins with Jins Sikah on the E𝄳4 tonic, followed by Jins Upper Rast on the third degree G4 with its tonic on the sixth degree C5, then Jins Rast on C5 as a secondary ghammaz.",
      verified: true,
    })
  }

  /**
   * Constructs Awj ‘Iraq using its supplied scale rather than transposing the
   * standard Sikah template. The lower tetrachord meets the upper jins at E𝄳4.
   */
  public static buildAwjIraq(): Maqam {
    const lowerDefinition: JinsDefinition = {
      id: "awj-iraq-lower",
      name: "Awj ‘Iraq Lower Tetrachord",
      arabicName: "جنس عراق",
      type: "Tetrachord",
      sizeLabel: "4-note",
      intervals: [3, 4, 3],
      description: "Lower tetrachord from B𝄳3 to E𝄳4.",
      hasQuarterTones: true,
      defaultRoot: new ArabicPitch("B", "𝄳", 3),
      tonicCharacteristic: "Neutral tonic on B𝄳3",
    }
    const upperDefinition: JinsDefinition = {
      id: "awj-iraq-upper",
      name: "Awj ‘Iraq Upper Scale",
      arabicName: "عراق",
      type: "UndefinedSize",
      sizeLabel: "(undefined size)",
      intervals: [5, 2, 6, 1, 3, 4],
      description: "Upper scale from E𝄳4 to D5.",
      hasQuarterTones: true,
      defaultRoot: new ArabicPitch("E", "𝄳", 4),
      tonicCharacteristic: "Upper continuation from E𝄳4",
    }
    const lower = new Jins(
      lowerDefinition,
      new ArabicPitch("B", "𝄳", 3)
    )
    const upper = new Jins(
      upperDefinition,
      new ArabicPitch("E", "𝄳", 4)
    )

    return new Maqam({
      id: "awj-iraq",
      name: "Awj ‘Iraq",
      family: "Sikah",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("F", "♯", 4),
      sayrDirection: "ascending",
      description:
        "Awj ‘Iraq on B𝄳3, with its lower tetrachord joined at E𝄳4 to the upper scale through D5.",
        verified:true
    })
  }

  /**
   * Constructs Maqam Musta‘ar with its characteristic E𝄳–F♯–G opening
   * and the supplied upper scale from G4 through E𝄳5.
   */
  public static buildMustaar(): Maqam {
    const upperDefinition: JinsDefinition = {
      id: "mustaar-upper",
      name: "Musta‘ar Upper Scale",
      arabicName: "جنس مستعار",
      type: "UndefinedSize",
      sizeLabel: "(undefined size)",
      intervals: [4, 2, 4, 4, 3],
      description: "Upper scale from G4 through E𝄳5.",
      hasQuarterTones: true,
      defaultRoot: new ArabicPitch("G", "♮", 4),
      tonicCharacteristic: "Upper continuation from the third degree G4",
    }
    const lower = new Jins(
      AjnasLibrary.MUSTAAR,
      new ArabicPitch("E", "𝄳", 4)
    )
    const upper = new Jins(
      upperDefinition,
      new ArabicPitch("G", "♮", 4)
    )

    return new Maqam({
      id: "mustaar",
      name: "Musta‘ar",
      arabicName: "مقام مستعار",
      family: "Sikah",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      sayrDirection: "ascending",
      description:
        "Musta‘ar on E𝄳4, with its characteristic F♯ and an upper scale continuing from G4 to E𝄳5.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Huzam.
   * Its three-part structure is Sikah on the tonic, Hijaz on degree 3,
   * and Rast beginning on degree 6.
   */
  public static buildHuzam(): Maqam {
    const lower = new Jins(AjnasLibrary.SIKAH, new ArabicPitch("E", "𝄳", 4))
    const upper = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("G", "♮", 4))

    const huzamNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "sikah",
          jinsName: "Jins Sikah",
          arabicName: "سيكاه",
          scaleDegree: 1,
          root: new ArabicPitch("E", "𝄳", 4),
          connections: [3, 6],
          frequency: "common",
          roleDescription: "Root Jins Sikah on the tonic E𝄳4",
        },
        {
          jinsId: "hijaz",
          jinsName: "Jins Hijaz",
          arabicName: "حجاز",
          scaleDegree: 3,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 6],
          frequency: "common",
          roleDescription: "Jins Hijaz beginning on the third degree G4",
        },
        {
          jinsId: "rast",
          jinsName: "Jins Rast",
          arabicName: "راست",
          scaleDegree: 6,
          root: new ArabicPitch("C", "♮", 5),
          connections: [3, 1],
          frequency: "common",
          roleDescription: "Jins Rast beginning on the sixth degree C5",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 3,
          technique: "Ittisal",
          frequency: "common",
          description: "Conjunct ascent from Sikah to Hijaz on G4",
        },
        {
          fromDegree: 3,
          toDegree: 6,
          technique: "Ittisal",
          frequency: "common",
          description: "Conjunct ascent from Hijaz to Rast on C5",
        },
        {
          fromDegree: 6,
          toDegree: 1,
          technique: "Ittisal",
          frequency: "common",
          description: "Return from upper Rast to the Sikah tonic",
        },
      ],
    }

    return new Maqam({
      id: "huzam",
      name: "Huzam",
      arabicName: "مقام حزام",
      family: "Sikah",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.RAST, new ArabicPitch("C", "♮", 5)),
          role: "upper_secondary",
          description: "Jins Rast beginning on the sixth degree C5",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [
        new ArabicPitch("D", "♮", 5),
        new ArabicPitch("E", "𝄳", 5),
      ],
      network: huzamNetwork,
      description:
        "The principal and most common maqam of the Sikah family. It begins with Jins Sikah on the E𝄳4 tonic, continues with Jins Hijaz on the third degree G4, and reaches Jins Rast on the sixth degree C5.",
    })
  }

  /**
   * Constructs Maqam Rahat al-Arwah as the exact transposition of Huzam
   * from E𝄳4 to B𝄳3, preserving Huzam's sayr and ajnas relationships.
   */
  public static buildRahatAlArwah(): Maqam {
    const huzam = this.buildHuzam()
    const transposed = huzam.transpose(new ArabicPitch("B", "𝄳", 3))

    return new Maqam({
      id: "rahat-al-arwah",
      name: "Rahat al-Arwah",
      arabicName: "مقام راحة الأرواح",
      family: "Sikah",
      lowerJins: transposed.lowerJins,
      connection: transposed.connection,
      upperJins: transposed.upperJins,
      ghammaz: transposed.ghammaz,
      alternateUpperAjnas: [...transposed.alternateUpperAjnas],
      sayrDirection: huzam.sayrDirection,
      extraPitches: [...transposed.extraPitches],
      network: transposed.network,
      description:
        "The transposition of Maqam Huzam to B𝄳3. Rahat al-Arwah preserves exactly the same sayr and ajnas relationships as Huzam at the transposed pitch level.",
      
    })
  }

  /**
   * Constructs Maqam Nikriz / Nawa Athar
   */
  public static buildNikriz(): Maqam {
    const lower = new Jins(
      AjnasLibrary.NAWA_ATHAR_NIKRIZ,
      new ArabicPitch("C", "♮", 4)
    )
    const upper = new Jins(AjnasLibrary.NAHAWAND, new ArabicPitch("G", "♮", 4))

    const nikrizNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "nikriz",
          jinsName: "Jins Nikriz",
          arabicName: "نكريز",
          scaleDegree: 1,
          root: new ArabicPitch("C", "♮", 4),
          connections: [5, 8],
          frequency: "common",
          roleDescription: "Root pentachord with aug 2nd",
        },
        {
          jinsId: "nahawand",
          jinsName: "Jins Nahawand",
          arabicName: "نهاوند",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 5],
          frequency: "common",
          roleDescription: "Upper Nahawand on 5th",
        },
        {
          jinsId: "hijaz",
          jinsName: "Jins Hijaz",
          arabicName: "حجاز",
          scaleDegree: 5,
          root: new ArabicPitch("G", "♮", 4),
          connections: [1, 8],
          frequency: "common",
          roleDescription: "Nawa Athar variant",
        },
        {
          jinsId: "nikriz",
          jinsName: "Jins Nikriz (Octave)",
          arabicName: "نكريز الجواب",
          scaleDegree: 8,
          root: new ArabicPitch("C", "♮", 5),
          connections: [5],
          frequency: "common",
          roleDescription: "Octave peak",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 5,
          technique: "Ittisal",
          frequency: "common",
          description: "Ascent to Ghammaz on 5th",
        },
        {
          fromDegree: 5,
          toDegree: 1,
          technique: "Ittisal",
          frequency: "common",
          description: "Descent to tonic",
        },
        {
          fromDegree: 5,
          toDegree: 8,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to octave",
        },
        {
          fromDegree: 8,
          toDegree: 5,
          technique: "Infisal",
          frequency: "common",
          description: "Descent from octave",
        },
      ],
    }

    return new Maqam({
      id: "nikriz",
      name: "Nikriz",
      arabicName: "مقام نكريز",
      family: "Nikriz",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      sayrDirection: "ascending",
      extraPitches: [new ArabicPitch("C", "♮", 5)],
      network: nikrizNetwork,
      description:
        "The principal and main maqam in the Nikriz family. It begins with Jins Nikriz on the C4 tonic and continues with Jins Nahawand on the fifth degree G4.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Nawa Athar.
   * Jins Nikriz on C4 is followed by Jins Hijazkar centered on G4,
   * the fifth degree of the maqam.
   */
  public static buildNawaAthar(): Maqam {
    const lower = new Jins(AjnasLibrary.NIKRIZ, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(AjnasLibrary.HIJAZKAR, new ArabicPitch("E", "♭", 4))

    return new Maqam({
      id: "nawa-athar",
      name: "Nawa Athar",
      arabicName: "مقام نوى أثر",
      family: "Nikriz",
      lowerJins: lower,
      connection: "Tadakhul",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      extraPitches: [new ArabicPitch("C", "♮", 5)],
      sayrDirection: "ascending",
      description:
        "A popular maqam in the Nikriz family. It begins with Jins Nikriz on the C4 tonic, followed by Jins Hijazkar centered on the fifth degree G4.",
      verified: true,
    })
  }

  /**
   * Constructs Maqam Saba
   */
  public static buildSaba(): Maqam {
    const lower = new Jins(AjnasLibrary.SABA, new ArabicPitch("D", "♮", 4))
    const upper = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("F", "♮", 4))

    const sabaNetwork: MaqamNetwork = {
      nodes: [
        {
          jinsId: "saba",
          jinsName: "Jins Saba",
          arabicName: "صبا",
          scaleDegree: 1,
          root: new ArabicPitch("D", "♮", 4),
          connections: [3, 6],
          frequency: "common",
          roleDescription: "Narrow root tetrachord on Dukah",
        },
        {
          jinsId: "hijaz",
          jinsName: "Jins Hijaz",
          arabicName: "حجاز",
          scaleDegree: 3,
          root: new ArabicPitch("F", "♮", 4),
          connections: [1, 6],
          frequency: "common",
          roleDescription: "Overlapping Hijaz on F4",
        },
        {
          jinsId: "ajam",
          jinsName: "Jins Ajam",
          arabicName: "عجم",
          scaleDegree: 6,
          root: new ArabicPitch("B", "♭", 4),
          connections: [1, 3],
          frequency: "common",
          roleDescription: "Upper Ajam on B♭4",
        },
        {
          jinsId: "nikriz",
          jinsName: "Jins Nikriz",
          arabicName: "نكريز",
          scaleDegree: 6,
          root: new ArabicPitch("B", "♭", 4),
          connections: [1, 3],
          frequency: "uncommon",
          roleDescription: "Alternative upper Nikriz on the sixth degree B♭4",
        },
      ],
      pathways: [
        {
          fromDegree: 1,
          toDegree: 3,
          technique: "Tadakhul",
          frequency: "common",
          description: "Overlapping transition into Hijaz on F4",
        },
        {
          fromDegree: 3,
          toDegree: 1,
          technique: "Tadakhul",
          frequency: "common",
          description: "Descent through narrow Saba to Dukah",
        },
        {
          fromDegree: 3,
          toDegree: 6,
          technique: "Infisal",
          frequency: "common",
          description: "Ascent to upper Ajam on B♭4",
        },
        {
          fromDegree: 6,
          toDegree: 3,
          technique: "Infisal",
          frequency: "common",
          description: "Descent from upper Ajam to Hijaz",
        },
        {
          fromDegree: 6,
          toDegree: 1,
          technique: "Infisal",
          frequency: "common",
          description: "Direct cadential descent to Dukah",
        },
      ],
    }

    return new Maqam({
      id: "saba",
      name: "Saba",
      arabicName: "مقام صبا",
      family: "None",
      lowerJins: lower,
      connection: "Tadakhul",
      upperJins: upper,
      ghammaz: new ArabicPitch("F", "♮", 4),
      alternateUpperAjnas: [
        {
          jins: new Jins(AjnasLibrary.AJAM, new ArabicPitch("B", "♭", 4)),
          role: "upper_secondary",
          description:
            "Upper Jins ‘Ajam on B♭4 (frequent melodic destination in Saba sayr)",
        },
        {
          jins: new Jins(
            AjnasLibrary.NAWA_ATHAR_NIKRIZ,
            new ArabicPitch("B", "♭", 4)
          ),
          role: "upper_secondary",
          description:
            "Upper Jins Nikriz on B♭4, beginning on the sixth degree",
        },
      ],
      sayrDirection: "ascending",
      extraPitches: [
        new ArabicPitch("B", "♭", 4),
        new ArabicPitch("C", "♮", 5),
        new ArabicPitch("D", "♭", 5), // Characteristic flat octave
      ],
      network: sabaNetwork,
      description:
        "A very popular and common maqam in the Arabic repertory. It begins with Jins Saba on the tonic, overlaps with Jins Hijaz on the third degree, and continues with either Jins ‘Ajam or Jins Nikriz on the sixth degree.",
    })
  }

  /**
   * Constructs Maqam Suznak.
   * Suznak is the characteristic Rast modulation to Jins Hijaz on the fifth degree.
   */
  public static buildSuznak(): Maqam {
    const lower = new Jins(AjnasLibrary.RAST, new ArabicPitch("C", "♮", 4))
    const upper = new Jins(AjnasLibrary.HIJAZ, new ArabicPitch("G", "♮", 4))

    return new Maqam({
      id: "suznak",
      name: "Suznak",
      arabicName: "مقام سوزناك",
      family: "Rast",
      lowerJins: lower,
      connection: "Ittisal",
      upperJins: upper,
      ghammaz: new ArabicPitch("G", "♮", 4),
      sayrDirection: "ascending",
      description:
        "The most popular modulation of Maqam Rast. It centers Jins Hijaz on the fifth degree, a practically obligatory modulation in taqsim or mawwal beginning with Jins Rast on the tonic.",
      verified: true,
    })
  }

  public static getAllMaqamat(): Maqam[] {
    const templates = new Map(
      [
        this.buildRast(),
        this.buildSuznak(),
        this.buildKirdan(),
        this.buildMahur(),
        this.buildBayati(),
        this.buildBayatiShuri(),
        this.buildDalanshin(),
        this.buildNairuz(),
        this.buildYakah(),
        // this.buildMuhayyar(),
        this.buildHijaz(),
        this.buildHijazkar(),
        this.buildNahawand(),
        this.buildNahawandMurassaa(),
        this.buildFarahfaza(),
        this.buildKurd(),
        this.buildAjam(),
        this.buildAjamUshayran(),
        this.buildShawqAfza(),
        this.buildJiharkah(),
        this.buildSikah(),
        this.buildMustaar(),
        this.buildAwjIraq(),
        this.buildBastanikar(),
        this.buildHuzam(),
        this.buildRahatAlArwah(),
        this.buildNikriz(),
        this.buildNawaAthar(),
        this.buildSaba(),
        this.buildUshaqMasri(),
        this.buildZanjaran(),
      ].map((maqam) => [maqam.id, maqam])
    )

    return MAQAM_INDEX.map((entry) => {
      const baseTemplate = templates.get(entry.templateId)
      if (!baseTemplate) {
        throw new Error(
          `Missing maqam template "${entry.templateId}" for index entry "${entry.id}".`
        )
      }
      const tonicByVariant: Record<string, ArabicPitch> = {
        "shadd-araban": new ArabicPitch("G", "♮", 3),
        suzidil: new ArabicPitch("A", "♮", 3),
        shahnaz: new ArabicPitch("D", "♮", 4),
      }
      // Maqam.transpose also shifts the template's extraPitches (the added
      // octave notes), along with its jins, ghammaz, and network pitches.
      const template = tonicByVariant[entry.id]
        ? baseTemplate.transpose(tonicByVariant[entry.id])
        : baseTemplate
      return new Maqam({
        id: entry.id,
        name: entry.id === template.id ? template.name : `Maqam ${entry.name}`,
        arabicName: template.arabicName,
        family: entry.family,
        lowerJins: template.lowerJins,
        connection: template.connection,
        upperJins: template.upperJins,
        ghammaz: template.ghammaz,
        alternateUpperAjnas: [...template.alternateUpperAjnas],
        sayrDirection: template.sayrDirection,
        extraPitches: [...template.extraPitches],
        network: template.network,
        sourceSlug: entry.sourceSlug,
        verified: entry.verified ?? template.verified,
        description: template.description,
      })
    })
  }

  public static getAll(): Maqam[] {
    return this.getAllMaqamat()
  }

  public static findById(id: string): Maqam | undefined {
    return this.getAllMaqamat().find((m) => m.id === id)
  }

  public static getById(id: string): Maqam | undefined {
    return this.findById(id)
  }

  public static getFamiliesList(): {
    key: MaqamFamilyMnemonic
    englishName: string
    arabicName: string
    defaultMaqamId: string
  }[] {
    return [
      {
        key: "‘Ajam",
        englishName: "‘Ajam",
        arabicName: "عائلة العجم",
        defaultMaqamId: "ajam",
      },
      {
        key: "Bayati",
        englishName: "Bayati",
        arabicName: "عائلة البياتي",
        defaultMaqamId: "bayati",
      },
      {
        key: "Hijaz",
        englishName: "Hijaz",
        arabicName: "عائلة الحجاز",
        defaultMaqamId: "hijaz",
      },
      {
        key: "Kurd",
        englishName: "Kurd",
        arabicName: "عائلة الكرد",
        defaultMaqamId: "kurd",
      },
      {
        key: "Nahawand",
        englishName: "Nahawand",
        arabicName: "عائلة النهاوند",
        defaultMaqamId: "nahawand",
      },
      {
        key: "Nikriz",
        englishName: "Nikriz",
        arabicName: "عائلة النكريز",
        defaultMaqamId: "nikriz",
      },
      {
        key: "Rast",
        englishName: "Rast",
        arabicName: "عائلة الراست",
        defaultMaqamId: "rast",
      },
      {
        key: "Sikah",
        englishName: "Sikah",
        arabicName: "عائلة السيكاه",
        defaultMaqamId: "sikah",
      },
    ]
  }

  public static getMaqamatByFamily(
    family: MaqamFamilyMnemonic | string
  ): Maqam[] {
    return this.getAllMaqamat().filter((maqam) => maqam.family === family)
  }

  public static getRepresentativeMaqamForFamily(
    family: MaqamFamilyMnemonic | string
  ): Maqam {
    switch (family) {
      case "Rast":
        return this.buildRast()
      case "Bayati":
        return this.buildBayati()
      case "Sikah":
        return this.buildSikah()
      case "Hijaz":
        return this.buildHijaz()
      case "Nahawand":
        return this.buildNahawand()
      case "Kurd":
        return this.buildKurd()
      case "Nikriz":
        return this.buildNikriz()
      case "‘Ajam":
      case "Ajam":
        return this.buildAjam()
      case "Saba":
      case "None":
        return this.buildSaba()
      default:
        return this.buildRast()
    }
  }

  /**
   * Provides classical Arabic transposition names and context for any (Maqam, newTonic) combination.
   */
  public static getTranspositionInfo(
    baseMaqam: Maqam,
    newTonic: ArabicPitch
  ): {
    name: string
    arabicName: string
    traditionalTitle?: string
    description: string
    intervalName: string
    centsOffset: number
  } | null {
    const originalTonic = baseMaqam.getTonic()
    const deltaQt = originalTonic.diffQuarterTones(newTonic)
    const centsOffset = deltaQt * 50

    const intervalNames: Record<number, string> = {
      "-24": "Octave Down (-1200¢)",
      "-14": "Perfect 5th Down (-700¢)",
      "-10": "Perfect 4th Down (-500¢)",
      "-8": "Major 3rd Down (-400¢)",
      "-7": "Neutral 3rd Down (-350¢)",
      "-6": "Minor 3rd Down (-300¢)",
      "-4": "Major 2nd Down (-200¢)",
      "-3": "Neutral 2nd Down (-150¢)",
      "-2": "Minor 2nd Down (-100¢)",
      "0": "Original Root / Unison (0¢)",
      "2": "Minor 2nd Up (+100¢)",
      "3": "Neutral 2nd Up (+150¢)",
      "4": "Major 2nd Up (+200¢)",
      "6": "Minor 3rd Up (+300¢)",
      "7": "Neutral 3rd Up (+350¢)",
      "8": "Major 3rd Up (+400¢)",
      "10": "Perfect 4th Up (+500¢)",
      "14": "Perfect 5th Up (+700¢)",
      "18": "Major 6th Up (+900¢)",
      "24": "Octave Up (+1200¢)",
    }

    const intervalName =
      intervalNames[deltaQt] || `${deltaQt > 0 ? "+" : ""}${centsOffset}¢`

    // Map of classical historical names (Taswir)
    const baseKey = baseMaqam.id.toLowerCase()
    const tonicKey = `${newTonic.diatonic}${newTonic.accidental}${newTonic.octave}`

    const registry: Record<
      string,
      Record<
        string,
        { name: string; arabicName: string; title: string; desc: string }
      >
    > = {
      rast: {
        "G♮3": {
          name: "Maqam Yakah (Rast on G3)",
          arabicName: "مقام يكاه",
          title: "Yakah",
          desc: "Rast transposed down a 4th to fundamental G3 (Yakah)",
        },
        "C♮4": {
          name: "Maqam Rast (Original C4)",
          arabicName: "مقام راست",
          title: "Rast",
          desc: "Foundational mother scale on C4 (Rast)",
        },
        "D♮4": {
          name: "Maqam Nirz / Mahur (Rast on D4)",
          arabicName: "مقام نيرز",
          title: "Nirz",
          desc: "Rast transposed up a whole step to D4 (Dukah)",
        },
        "G♮4": {
          name: "Maqam Mahur (Rast on G4)",
          arabicName: "مقام ماهور (راست على النوى)",
          title: "Mahur / Nawa",
          desc: "Famous classical transposition of Rast up a 5th to G4 (Nawa)",
        },
        "C♮5": {
          name: "Maqam Kirdan (Rast on C5)",
          arabicName: "مقام كردان",
          title: "Kirdan",
          desc: "Rast transposed an octave up to C5 (Kirdan)",
        },
      },
      bayati: {
        "C♮4": {
          name: "Bayati ‘ala al-Rast (Bayati on C4)",
          arabicName: "بياتي على الراست",
          title: "Bayati Rast",
          desc: "Bayati transposed down a whole tone to C4",
        },
        "D♮4": {
          name: "Maqam Bayati (Original D4)",
          arabicName: "مقام بياتي",
          title: "Bayati",
          desc: "Beloved classical modal center on D4 (Dukah)",
        },
        "G♮4": {
          name: "Maqam Shuri / Bayati Nawa (on G4)",
          arabicName: "بياتي شورى (على النوى)",
          title: "Shuri",
          desc: "Bayati transposed up a 4th to G4 (Nawa), often incorporating Hijaz",
        },
      },
      hijaz: {
        "C♮4": {
          name: "Maqam Hijaz Kar (Hijaz on C4)",
          arabicName: "مقام حجازكار",
          title: "Hijaz Kar",
          desc: "Hijaz transposed down a whole step to C4 (Rast)",
        },
        "D♮4": {
          name: "Maqam Hijaz (Original D4)",
          arabicName: "مقام حجاز",
          title: "Hijaz",
          desc: "The dramatic classical core on D4 (Dukah)",
        },
        "G♮4": {
          name: "Maqam Shahnaz (Hijaz on G4)",
          arabicName: "مقام شاهناز",
          title: "Shahnaz",
          desc: "Hijaz transposed up a 4th to G4 (Nawa)",
        },
        "A♮4": {
          name: "Maqam Suzidil (Hijaz on A4)",
          arabicName: "مقام سوزدل",
          title: "Suzidil",
          desc: "Hijaz transposed up a 5th to A4 (Husayni)",
        },
      },
      hijazkar: {
        "G♮3": {
          name: "Maqam Shadd ‘Araban (Hijazkar on G3)",
          arabicName: "مقام شد عربان",
          title: "Shadd ‘Araban",
          desc: "Hijazkar interval pattern transposed to low G3",
        },
        "A♮3": {
          name: "Maqam Suzidil (Hijazkar on A3)",
          arabicName: "مقام سوزدل",
          title: "Suzidil",
          desc: "Hijazkar interval pattern transposed to low A3",
        },
        "C♮4": {
          name: "Maqam Hijazkar (Original C4)",
          arabicName: "مقام حجازكار",
          title: "Hijazkar",
          desc: "Hijazkar on its original C4 tonic",
        },
        "D♮4": {
          name: "Maqam Shahnaz (Hijazkar on D4)",
          arabicName: "مقام شاهناز",
          title: "Shahnaz",
          desc: "Hijazkar interval pattern transposed to D4",
        },
      },
      nahawand: {
        "C♮4": {
          name: "Maqam Nahawand (Original C4)",
          arabicName: "مقام نهاوند",
          title: "Nahawand",
          desc: "Classical minor-mode foundation on C4",
        },
        "D♮4": {
          name: "Nahawand Murassah (on D4)",
          arabicName: "نهاوند مرصع",
          title: "Nahawand Murassah",
          desc: "Nahawand transposed up a whole tone to D4",
        },
        "G♮4": {
          name: "Maqam Farahfaza (Nahawand on G4)",
          arabicName: "مقام فَرَحْفَزا",
          title: "Farahfaza",
          desc: "Nahawand transposed up a 5th to G4 (Nawa), celebrated for poignant lyricism",
        },
      },
      sikah: {
        "B𝄳3": {
          name: "Maqam ‘Iraq (Sikah on B𝄳3)",
          arabicName: "مقام عراق",
          title: "‘Iraq",
          desc: "Sikah transposed down a 4th to neutral B𝄳3 (Iraq)",
        },
        "E𝄳4": {
          name: "Maqam Sikah (Original E𝄳4)",
          arabicName: "مقام سيكاه",
          title: "Sikah",
          desc: "Traditional modal home on neutral third E𝄳4",
        },
        "B𝄳4": {
          name: "Maqam Awj (Sikah on B𝄳4)",
          arabicName: "مقام أوج",
          title: "Awj",
          desc: "Sikah transposed up a 5th to high neutral degree B𝄳4 (Awj)",
        },
      },
      kurd: {
        "C♮4": {
          name: "Kurd ‘ala al-Rast (Kurd on C4)",
          arabicName: "كرد على الراست",
          title: "Kurd Rast",
          desc: "Phrygian Kurd transposed down to C4",
        },
        "D♮4": {
          name: "Maqam Kurd (Original D4)",
          arabicName: "مقام كرد",
          title: "Kurd",
          desc: "Primary Phrygian modal home on D4 (Dukah)",
        },
        "G♮4": {
          name: "Maqam Kurd Nawa (Kurd on G4)",
          arabicName: "كرد على النوى",
          title: "Kurd Nawa",
          desc: "Kurd transposed up a 4th to G4 (Nawa)",
        },
        "A♮4": {
          name: "Maqam Hijazkar Kurd (Kurd on A4)",
          arabicName: "حجازكار كرد",
          title: "Hijazkar Kurd",
          desc: "Kurd transposed to A4",
        },
      },
      ajam: {
        "B♭3": {
          name: "Maqam ‘Ajam ‘Ushayran (Original B♭3)",
          arabicName: "مقام عجم عشيران",
          title: "‘Ajam ‘Ushayran",
          desc: "Foundational major mode on B♭3",
        },
        "C♮4": {
          name: "Maqam Jaharkah / ‘Ajam (on C4)",
          arabicName: "مقام جهاركاه",
          title: "Jaharkah",
          desc: "‘Ajam transposed up a whole step to C4",
        },
        "F♮4": {
          name: "Maqam ‘Ajam Nawa (on F4)",
          arabicName: "عجم على النوى",
          title: "‘Ajam Nawa",
          desc: "‘Ajam transposed up to F4",
        },
      },
      saba: {
        "C♮4": {
          name: "Saba ‘ala al-Rast (Saba on C4)",
          arabicName: "صبا على الراست",
          title: "Saba Rast",
          desc: "Saba transposed down to C4",
        },
        "D♮4": {
          name: "Maqam Saba (Original D4)",
          arabicName: "مقام صبا",
          title: "Saba",
          desc: "Archetypal expression of mourning on D4 (Dukah)",
        },
        "G♮4": {
          name: "Maqam Saba Zamzam / Nawa (on G4)",
          arabicName: "صبا زمزم",
          title: "Saba Nawa",
          desc: "Saba transposed up a 4th to G4 (Nawa)",
        },
      },
      nikriz: {
        "C♮4": {
          name: "Maqam Nikriz (Original C4)",
          arabicName: "مقام نكريز",
          title: "Nikriz",
          desc: "Original augmented 2nd pentachord on C4",
        },
        "G♮4": {
          name: "Maqam Nawa Athar (Nikriz on G4)",
          arabicName: "مقام نوى أثر",
          title: "Nawa Athar",
          desc: "Transposition of Nikriz up to G4 (Nawa)",
        },
      },
    }

    const entry = registry[baseKey]?.[tonicKey]
    if (entry) {
      return {
        name: entry.name,
        arabicName: entry.arabicName,
        traditionalTitle: entry.title,
        description: entry.desc,
        intervalName,
        centsOffset,
      }
    }

    const sign = deltaQt > 0 ? "+" : ""
    return {
      name: `${baseMaqam.name} on ${newTonic.toScientificString()}${newTonic.octave}`,
      arabicName: baseMaqam.arabicName
        ? `${baseMaqam.arabicName} مصوّر`
        : "مصوّر",
      description: `Transposed variant of ${baseMaqam.name} starting on ${newTonic.toScientificString()}${newTonic.octave} (${sign}${centsOffset}¢ shift)`,
      intervalName,
      centsOffset,
    }
  }
}
