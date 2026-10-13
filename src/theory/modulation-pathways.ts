// src/theory/modulation-pathways.ts
import { ArabicPitch } from '../core/pitch';
import { JinsDefinition } from './jins';
import {
  Maqam,
  MaqamatCatalogue,
} from './maqam';
import { ModulationCategory } from './sayr';

export type ModulationRelation =
  | 'same-family'      // Same family (shares lower root jins, e.g. Rast -> Suznak / Nairuz / Mahur)
  | 'ghammaz-pivot'    // Modulation launched at the Ghammaz dominant (e.g. at G4: Bayati -> Hijaz / Nahawand)
  | 'shared-jins'      // Common upper or lower jins at identical or shifted root
  | 'relative-family'  // Adjacent or historically coupled family (e.g. Rast & Bayati, Bayati & Saba, Nahawand & Kurd)
  | 'tonic-shift';     // Shift to parallel tonic with different root jins (e.g. Rast on C -> Nahawand on C / Nikriz on C)

export type ModulationTechnique =
  | 'Tanjees'  // Passing / color borrowing (تنجيس)
  | 'Intiqal'  // Structural modulation (انتقال)
  | 'Ittisal'  // Conjunct pivot transition (اتصال)
  | 'Infisal'; // Disjunct whole-step leap transition (انفصال)

export interface PivotPoint {
  readonly pitch: ArabicPitch;
  readonly pitchName: string;
  readonly scaleDegree: number; // 1-based scale degree in source maqam
  readonly role: 'tonic' | 'ghammaz' | 'apex' | 'inner-step';
  readonly sourceJinsName: string;
  readonly targetJinsName: string;
  readonly description: string;
  readonly arabicDescription: string;
}

export interface ModulationPathway {
  readonly id: string;
  readonly sourceMaqam: Maqam;
  readonly targetMaqam: Maqam;
  readonly relation: ModulationRelation;
  readonly technique: ModulationTechnique;
  readonly category: ModulationCategory; // Three-tier classification from PDF
  readonly pivotPoint: PivotPoint;
  readonly bridgeJins: {
    readonly definition: JinsDefinition;
    readonly root: ArabicPitch;
    readonly pitches: ArabicPitch[];
  };
  readonly transitionNotes: ArabicPitch[]; // Smooth melodic bridge sequence
  readonly rationale: string;
  readonly arabicRationale: string;
  readonly historicalContext: string;
  readonly commonInRepertoire: boolean;
  readonly affinityScore: number; // 1 - 100 affinity/smoothness score
  readonly frequency: 'common' | 'uncommon' | 'rare'; // Frequency in repertoire
}

export class ModulationPathwayEngine {
  /**
   * Discovers all candidate modulation pathways departing from the active Maqam.
   * Compares ajnas, ghammaz pivots, shared pitches, and classical Arab modal traditions.
   */
  public static findPathwaysForMaqam(source: Maqam): ModulationPathway[] {
    const allMaqamat = MaqamatCatalogue.getAllMaqamat();
    const pathways: ModulationPathway[] = [];

    for (const target of allMaqamat) {
      if (target.id === source.id) continue;

      const discovered = this.evaluatePair(source, target);
      if (discovered) {
        pathways.push(...discovered);
      }
    }

    // Sort by affinity score descending (most natural & idiomatic first)
    return pathways.sort((a, b) => b.affinityScore - a.affinityScore);
  }

  /**
   * Evaluates pairwise modulation possibilities between source and target maqam.
   */
  private static evaluatePair(source: Maqam, target: Maqam): ModulationPathway[] | null {
    const pathways: ModulationPathway[] = [];
    const sourceTonic = source.getTonic();
    const targetTonic = target.getTonic();
    const sourceGhammaz = source.getGhammaz();
    const targetGhammaz = target.getGhammaz();
    const isSameFamily = source.family !== 'None' && source.family === target.family;

    // 1. Same-family modulations (Intra-family substitution / alteration)
    if (isSameFamily) {
      // E.g. Rast (upper Rast) -> Suznak (upper Hijaz) at the Ghammaz G4
      // Or Bayati (upper Nahawand) -> Bayati Shuri (upper Hijaz)
      const sameTonic = sourceTonic.equals(targetTonic);
      const pivot = sourceGhammaz;
      const scalePitches = source.getScale();
      const degIndex = scalePitches.findIndex(p => p.equals(pivot));
      const scaleDegree = degIndex !== -1 ? degIndex + 1 : 5;

      const pathwayId = `${source.id}-to-${target.id}-family`;
      const bridgeJins = target.upperJins;

      // Transition bridge: 3-5 notes anchoring the pivot note and stepping into target jins
      const bridgePitches = bridgeJins.getPitches();
      const transition = [
        sourceTonic,
        sourceGhammaz,
        ...bridgePitches.slice(0, 3),
        targetTonic
      ];

      pathways.push({
        id: pathwayId,
        sourceMaqam: source,
        targetMaqam: target,
        relation: 'same-family',
        technique: sameTonic ? 'Tanjees' : 'Intiqal',
        category: sameTonic ? '2_Internal' : '2_Internal',
        pivotPoint: {
          pitch: pivot,
          pitchName: pivot.toScientificString(),
          scaleDegree,
          role: 'ghammaz',
          sourceJinsName: source.upperJins.definition.name,
          targetJinsName: target.upperJins.definition.name,
          description: `Shared Ghammaz pivot on ${pivot.toScientificString()} while maintaining root ${source.lowerJins.definition.name} foundation.`,
          arabicDescription: `غمّاز مشترك على نغمة ${pivot.toScientificString()} مع ثبات الجنس الأساسي (${source.lowerJins.definition.arabicName}).`
        },
        bridgeJins: {
          definition: bridgeJins.definition,
          root: bridgeJins.root,
          pitches: bridgePitches
        },
        transitionNotes: transition,
        rationale: `Intra-family modulation within ${source.family}. Melodic phrases ascend to the Ghammaz (${pivot.toScientificString()}) and substitute ${source.upperJins.definition.name} with ${target.upperJins.definition.name}.`,
        arabicRationale: `تحويل ضمن فصيلة ${source.family}: تصعد الجملة إلى الغماز (${pivot.toScientificString()}) وتستبدل جنس ${source.upperJins.definition.arabicName} بجنس ${target.upperJins.definition.arabicName}.`,
        historicalContext: `Classic Wasla technique extensively documented by D'Erlanger and contemporary masters for introducing ornamentation while retaining family identity.`,
        commonInRepertoire: true,
        affinityScore: 95,
        frequency: 'common'
      });
    }

    // 2. Ghammaz-driven modulation (Pivot note at the Ghammaz leading to another Maqam rooted on that note or having that Ghammaz)
    if (!isSameFamily && sourceGhammaz.equals(targetTonic)) {
      // E.g., Source has Ghammaz on G4, and Target is rooted on G4 (like Nahawand on C -> Farahfaza on G / Rast on G / Hijaz on G)
      const scalePitches = source.getScale();
      const degIndex = scalePitches.findIndex(p => p.equals(sourceGhammaz));
      const scaleDegree = degIndex !== -1 ? degIndex + 1 : 5;

      const bridgeJins = target.lowerJins;
      const bridgePitches = bridgeJins.getPitches();

      pathways.push({
        id: `${source.id}-to-${target.id}-ghammaz-tonic`,
        sourceMaqam: source,
        targetMaqam: target,
        relation: 'ghammaz-pivot',
        technique: 'Intiqal',
        category: '3_FullMaqam',
        pivotPoint: {
          pitch: sourceGhammaz,
          pitchName: sourceGhammaz.toScientificString(),
          scaleDegree,
          role: 'ghammaz',
          sourceJinsName: source.upperJins.definition.name,
          targetJinsName: target.lowerJins.definition.name,
          description: `Ghammaz of ${source.name} serves directly as the Tonic Qarar for ${target.name}.`,
          arabicDescription: `يتحول غمّاز ${source.name} مباشرة إلى قرار واستقرار لـ ${target.name}.`
        },
        bridgeJins: {
          definition: bridgeJins.definition,
          root: bridgeJins.root,
          pitches: bridgePitches
        },
        transitionNotes: [
          sourceTonic,
          sourceGhammaz,
          ...bridgePitches.slice(0, 4)
        ],
        rationale: `Direct structural shift (Intiqal). The melody lingers on the dominant Ghammaz (${sourceGhammaz.toScientificString()}) and elevates it into a new home tonic.`,
        arabicRationale: `انتقال مقامي كامل: تتكئ الجملة على الغماز (${sourceGhammaz.toScientificString()}) وتحوله إلى قرار ومستقر مقامي جديد.`,
        historicalContext: `A hallmark of Muwashahat and Taqasim improvisation, moving from lower registers to upper tonal plateaus.`,
        commonInRepertoire: true,
        affinityScore: 90,
        frequency: 'common'
      });
    }

    // 2b. Shared Ghammaz Dominant across different families
    if (!isSameFamily && sourceGhammaz.equals(targetGhammaz)) {
      const scalePitches = source.getScale();
      const degIndex = scalePitches.findIndex(p => p.equals(sourceGhammaz));
      const scaleDegree = degIndex !== -1 ? degIndex + 1 : 5;
      const bridgeJins = target.upperJins;
      const bridgePitches = bridgeJins.getPitches();

      pathways.push({
        id: `${source.id}-to-${target.id}-shared-ghammaz`,
        sourceMaqam: source,
        targetMaqam: target,
        relation: 'ghammaz-pivot',
        technique: 'Tanjees',
        pivotPoint: {
          pitch: sourceGhammaz,
          pitchName: sourceGhammaz.toScientificString(),
          scaleDegree,
          role: 'ghammaz',
          sourceJinsName: source.upperJins.definition.name,
          targetJinsName: target.upperJins.definition.name,
          description: `Shared Ghammaz dominant on ${sourceGhammaz.toScientificString()} across ${source.family} and ${target.family}.`,
          arabicDescription: `غمّاز مشترك على نغمة ${sourceGhammaz.toScientificString()} بين فصيلة ${source.family} وفصيلة ${target.family}.`
        },
        bridgeJins: {
          definition: bridgeJins.definition,
          root: bridgeJins.root,
          pitches: bridgePitches
        },
        transitionNotes: [
          sourceTonic,
          sourceGhammaz,
          ...bridgePitches.slice(0, 3),
          targetTonic
        ],
        rationale: `Both modes meet on the shared dominant Ghammaz (${sourceGhammaz.toScientificString()}). The improviser can suspend on this pivot before settling into ${target.name}.`,
        arabicRationale: `يلتقي المقامان عند نفس الغماز (${sourceGhammaz.toScientificString()}). يمكن للعازف الوقوف عليه ثم الهبوط إلى قرار ${target.name}.`,
        historicalContext: `Classic modulation technique in Wasla suites when pivoting across related families.`,
        commonInRepertoire: true,
        affinityScore: 84
      });
    }

    // 3. Shared Upper Jins across different families
    // E.g., Bayati on D has Upper Nahawand on G. Maqam Nahawand on C has Upper Kurd or Hijaz.
    // If target has lower or upper jins sharing definition and root:
    const sharesUpperJinsWithTargetLower =
      source.upperJins.definition.id === target.lowerJins.definition.id &&
      source.upperJins.root.equals(target.lowerJins.root);

    if (sharesUpperJinsWithTargetLower) {
      const bridgeJins = source.upperJins;
      const bridgePitches = bridgeJins.getPitches();

      pathways.push({
        id: `${source.id}-to-${target.id}-shared-upper-lower`,
        sourceMaqam: source,
        targetMaqam: target,
        relation: 'shared-jins',
        technique: 'Intiqal',
        pivotPoint: {
          pitch: bridgeJins.root,
          pitchName: bridgeJins.root.toScientificString(),
          scaleDegree: 4,
          role: 'ghammaz',
          sourceJinsName: source.upperJins.definition.name,
          targetJinsName: target.lowerJins.definition.name,
          description: `Upper Jins (${source.upperJins.definition.name}) on ${bridgeJins.root.toScientificString()} is identical to the root foundation of ${target.name}.`,
          arabicDescription: `الجنس الأعلى لـ ${source.name} مطابق تماماً للجنس الأساسي لـ ${target.name}.`
        },
        bridgeJins: {
          definition: bridgeJins.definition,
          root: bridgeJins.root,
          pitches: bridgePitches
        },
        transitionNotes: [
          sourceTonic,
          bridgeJins.root,
          ...bridgePitches
        ],
        rationale: `Seamless pivot through a shared Jins cell (${source.upperJins.definition.name}). The ear accepts the transition naturally because the pitches are already established in the upper branch.`,
        arabicRationale: `جسر انسيابي عبر جنس مشترك (${source.upperJins.definition.arabicName}): تستسيغ الأذن التحويل لأن نغماته مسموعة وممهدة بالفعل.`,
        historicalContext: `Fundamental principle of melodic modulation described by Al-Farabi and Safi al-Din al-Urmawi.`,
        commonInRepertoire: true,
        affinityScore: 88
      });
    }

    // 4. Parallel Tonic Modulations (Taswir / parallel shift on same tonic pitch)
    // E.g. Rast on C4 -> Nahawand on C4 or Nikriz on C4 or Hijaz Kar on C4
    if (!isSameFamily && sourceTonic.equals(targetTonic)) {
      const bridgeJins = target.lowerJins;
      const bridgePitches = bridgeJins.getPitches();

      pathways.push({
        id: `${source.id}-to-${target.id}-parallel-tonic`,
        sourceMaqam: source,
        targetMaqam: target,
        relation: 'tonic-shift',
        technique: 'Tanjees',
        pivotPoint: {
          pitch: sourceTonic,
          pitchName: sourceTonic.toScientificString(),
          scaleDegree: 1,
          role: 'tonic',
          sourceJinsName: source.lowerJins.definition.name,
          targetJinsName: target.lowerJins.definition.name,
          description: `Parallel modulation on tonic Qarar (${sourceTonic.toScientificString()}), swapping interval character while resting on the same home pitch.`,
          arabicDescription: `تحويل متوازي على نفس درجة القرار (${sourceTonic.toScientificString()}) مع استبدال طبيعة الأبعاد اللحنية.`
        },
        bridgeJins: {
          definition: bridgeJins.definition,
          root: bridgeJins.root,
          pitches: bridgePitches
        },
        transitionNotes: [
          sourceTonic,
          source.getScale()[1] || sourceTonic.transpose(4),
          target.getScale()[1] || targetTonic.transpose(4),
          ...bridgePitches.slice(1, 4)
        ],
        rationale: `Color shift on identical tonic base. The music preserves the ground note (${sourceTonic.toScientificString()}) but introduces fresh emotive warmth or tension via altered scale degrees.`,
        arabicRationale: `تغيير نكهة المقام على نفس القرار: يحافظ العازف على نغمة الارتكاز مع إدخال أبعاد تعبيرية جديدة.`,
        historicalContext: `Widely used in 20th century Egyptian art songs (Umm Kulthum, Abdel Wahab) for dramatic contrast between couplets.`,
        commonInRepertoire: true,
        affinityScore: 82
      });
    }

    // 5. Alternate Upper Ajnas branches registered in Maqam definition
    for (const alt of source.alternateUpperAjnas) {
      if (alt.jins.definition.id === target.lowerJins.definition.id) {
        pathways.push({
          id: `${source.id}-to-${target.id}-alternate-branch-${alt.jins.definition.id}`,
          sourceMaqam: source,
          targetMaqam: target,
          relation: 'relative-family',
          technique: 'Tanjees',
          pivotPoint: {
            pitch: alt.jins.root,
            pitchName: alt.jins.root.toScientificString(),
            scaleDegree: 5,
            role: 'ghammaz',
            sourceJinsName: `Alternate: ${alt.jins.definition.name}`,
            targetJinsName: target.lowerJins.definition.name,
            description: `Documented Sayr alternate branch (${alt.description}) linking directly into ${target.name}.`,
            arabicDescription: `فرع تحويل موثق في مسار السير (${alt.jins.definition.arabicName}) يفتح الباب لـ ${target.name}.`
          },
          bridgeJins: {
            definition: alt.jins.definition,
            root: alt.jins.root,
            pitches: alt.jins.getPitches()
          },
          transitionNotes: [
            sourceTonic,
            alt.jins.root,
            ...alt.jins.getPitches()
          ],
          rationale: `Canonized melodic branching: ${alt.description}. The sayr explicitly prepares this pathway for idiomatic excursions.`,
          arabicRationale: `مسار تحويلي معتمد: ${alt.description}. يمهد سير المقام لهذا الانتقال بشكل طبيعي.`,
          historicalContext: `Documented in classical sayr tables from maqamworld.com and conservatory treatises.`,
          commonInRepertoire: true,
          affinityScore: 86
        });
      }
    }

    // 6. Closely coupled historical relatives
    // E.g., Bayati on D4 & Saba on D4: Saba starts on D4 with neutral second E𝄳4, identical to Bayati!
    if (
      (source.id === 'bayati' && target.id === 'saba') ||
      (source.id === 'saba' && target.id === 'bayati')
    ) {
      const bridgeJins = target.lowerJins;
      pathways.push({
        id: `${source.id}-to-${target.id}-historical-relative`,
        sourceMaqam: source,
        targetMaqam: target,
        relation: 'relative-family',
        technique: 'Tanjees',
        pivotPoint: {
          pitch: sourceTonic,
          pitchName: sourceTonic.toScientificString(),
          scaleDegree: 1,
          role: 'tonic',
          sourceJinsName: source.lowerJins.definition.name,
          targetJinsName: target.lowerJins.definition.name,
          description: `Shared Dukah (D4) and neutral second Sikah (E𝄳4). The two modes overlap on their first three degrees.`,
          arabicDescription: `اشتراك في درجة الدوكاه (D4) والدرجة الثانية (E𝄳4). يتطابق المقامان في الدرجات الثلاث الأولى.`
        },
        bridgeJins: {
          definition: bridgeJins.definition,
          root: bridgeJins.root,
          pitches: bridgeJins.getPitches()
        },
        transitionNotes: [
          new ArabicPitch('D', '♮', 4),
          new ArabicPitch('E', '𝄳', 4),
          new ArabicPitch('F', '♮', 4),
          target.getScale()[3] || new ArabicPitch('G', '♭', 4)
        ],
        rationale: `Intimate kin relationship between Bayati and Saba. Both rely on the soul of Dukah and Sikah before diverging at the 4th degree (G vs G♭).`,
        arabicRationale: `قرابة وثيقة بين البياتي والصبا: يشتركان في روح الدوكاه والسيكاه قبل أن ينفصلا عند الدرجة الرابعة.`,
        historicalContext: `A frequent poetic device in classical Mawwal and Wasla compositions for deepening emotional poignancy.`,
        commonInRepertoire: true,
        affinityScore: 92
      });
    }

    // E.g., Kurd on D4 & Hijaz on D4: Shared tonic D4 and semitone step to E♭4!
    if (
      (source.id === 'kurd' && target.id === 'hijaz') ||
      (source.id === 'hijaz' && target.id === 'kurd')
    ) {
      const bridgeJins = target.lowerJins;
      pathways.push({
        id: `${source.id}-to-${target.id}-semitone-kin`,
        sourceMaqam: source,
        targetMaqam: target,
        relation: 'relative-family',
        technique: 'Tanjees',
        pivotPoint: {
          pitch: sourceTonic,
          pitchName: sourceTonic.toScientificString(),
          scaleDegree: 1,
          role: 'tonic',
          sourceJinsName: source.lowerJins.definition.name,
          targetJinsName: target.lowerJins.definition.name,
          description: `Shared semitone opening D4 -> E♭4. Modulation occurs by stretching the 3rd degree (F♮ in Kurd vs F♯ in Hijaz).`,
          arabicDescription: `اشتراك في الخطوة النصفية الأولى (D4 -> E♭4) والتحويل يتم بتوسيع الدرجة الثالثة (فا طبيعية بالكرد وفاديز بالحجاز).`
        },
        bridgeJins: {
          definition: bridgeJins.definition,
          root: bridgeJins.root,
          pitches: bridgeJins.getPitches()
        },
        transitionNotes: [
          new ArabicPitch('D', '♮', 4),
          new ArabicPitch('E', '♭', 4),
          target.lowerJins.getPitches()[2] || new ArabicPitch('F', '♯', 4),
          new ArabicPitch('G', '♮', 4)
        ],
        rationale: `Kinship based on shared minor second opening. The transition pivots on E♭4 and dramatically introduces or resolves the augmented second interval.`,
        arabicRationale: `قرابة قائمة على النصف تون الأول: التحويل يتكئ على مي بيمول للدخول إلى الحجاز أو الاستقرار في الكرد.`,
        historicalContext: `Standard modulation pattern in Andalusian Muwashahat and Levantine Bashraf.`,
        commonInRepertoire: true,
        affinityScore: 85
      });
    }

    // E.g., Rast on C4 & Nahawand on C4: Shared tonic and fifth G4
    if (
      (source.id === 'rast' && target.id === 'nahawand') ||
      (source.id === 'nahawand' && target.id === 'rast')
    ) {
      const bridgeJins = target.lowerJins;
      pathways.push({
        id: `${source.id}-to-${target.id}-tonic-fifth-frame`,
        sourceMaqam: source,
        targetMaqam: target,
        relation: 'relative-family',
        technique: 'Tanjees',
        pivotPoint: {
          pitch: sourceGhammaz,
          pitchName: sourceGhammaz.toScientificString(),
          scaleDegree: 5,
          role: 'ghammaz',
          sourceJinsName: source.upperJins.definition.name,
          targetJinsName: target.upperJins.definition.name,
          description: `Shared outer framework of C4 (Tonic) and G4 (Ghammaz). Modulation pivots between neutral 3rd (E𝄳4) and minor 3rd (E♭4).`,
          arabicDescription: `إطار مشترك لدرجتي الراست (C4) والنوى (G4). التحويل يتم بتبديل الدرجة الثالثة بين السيكاه والمي بيمول.`
        },
        bridgeJins: {
          definition: bridgeJins.definition,
          root: bridgeJins.root,
          pitches: bridgeJins.getPitches()
        },
        transitionNotes: [
          new ArabicPitch('C', '♮', 4),
          new ArabicPitch('D', '♮', 4),
          target.lowerJins.getPitches()[2],
          new ArabicPitch('G', '♮', 4)
        ],
        rationale: `The fundamental modal dialogue of Arabic art music: shifting between the majestic serenity of Rast and the poignant lyricism of Nahawand within the C-G frame.`,
        arabicRationale: `الحوار المقامي الأبرز في الموسيقى الشرقية: التنقل بين جلال الراست وعاطفية النهاوند ضمن إطار دو - صول.`,
        historicalContext: `Pivotal technique in Wasla suites, Longas, and orchestral compositions across Egypt, Syria, and Iraq.`,
        commonInRepertoire: true,
        affinityScore: 94
      });
    }

    return pathways;
  }
}
