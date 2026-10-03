// src/theory/practice-drills.ts
import { ArabicPitch } from '../core/pitch';
import { Maqam } from './maqam';
import {
  ViolinErgonomicsEngine,
} from '../violin/ergonomics';
import {
  GeneratedMelody,
  GeneratedNote,
  MelodyDifficulty,
  MelodyGenerator,
} from './melody-generator';

export type PracticeDrillType =
  | 'scale-run'        // Scale / Maqam Drills (Ascending & Descending Run)
  | 'sequence-3'       // Sequences of 3 (ثلاثيات)
  | 'sequence-4'       // Sequences of 4 (رباعيات)
  | 'position-shift'   // Position Shift (التحويل بين المراكز للكمان)
  | 'sightreading';    // Free Algorithmic Melody Sight-Reading

export type DrillDirection = 'both' | 'ascending' | 'descending';

export type PositionShiftVariation =
  | 'ghammaz-pivot'      // Shift at Ghammaz pivot from 1st to 3rd position
  | 'octave-leap'        // Octave leap & shift between Qarar and Jawab
  | 'expressive-slide';  // Classical Arabic slide (Zahlaka) into upper register

export interface PracticeDrillConfig {
  type: PracticeDrillType;
  direction?: DrillDirection;
  tempoBpm?: number;
  timeSignature?: '4/4' | '3/4' | '2/4';
  // Scale run options
  runNoteValue?: 'quarter' | 'eighth';
  // Sequences options
  sequencePattern?: 'step' | 'turn';
  // Position shift options
  positionShiftVariation?: PositionShiftVariation;
  // Free sight-reading options
  sightReadingDifficulty?: MelodyDifficulty;
  sightReadingLength?: number;
}

export interface DrillTypeMetadata {
  id: PracticeDrillType;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  badge: string;
  pedagogicalFocus: string;
}

export const DRILL_TYPES_CATALOGUE: DrillTypeMetadata[] = [
  {
    id: 'scale-run',
    titleEn: 'Scale & Maqam Drills',
    titleAr: 'تمارين السلم والمقام (صعود وهبوط)',
    descriptionEn: 'Ascending and descending scalar runs traversing the full maqam with authentic microtones and fingerings.',
    descriptionAr: 'مسارات صعود وهبوط كاملة عبر درجات المقام مع ربع التون والأصابع الدقيقة للكمان.',
    icon: 'Activity',
    badge: 'Core Foundation',
    pedagogicalFocus: 'Intonation, microtonal finger placement, and scalar fluidity.',
  },
  {
    id: 'sequence-3',
    titleEn: 'Sequences of 3',
    titleAr: 'تعاقب الثلاثيات (ثلاثيات النغم)',
    descriptionEn: 'Three-note pedagogical step patterns (1-2-3, 2-3-4, 3-4-5...) developing agility and microtonal accuracy.',
    descriptionAr: 'أنماط تعاقب ثلاثية الدرجات لصقل سرعة الأصابع وتثبيت المسافات الميكروتونالية.',
    icon: 'Layers',
    badge: 'Scalar Agility',
    pedagogicalFocus: 'Finger independence, neighbor-tone clarity, and steady tempo.',
  },
  {
    id: 'sequence-4',
    titleEn: 'Sequences of 4',
    titleAr: 'تعاقب الرباعيات (أجناس النغم)',
    descriptionEn: 'Four-note melodic patterns traversing ajnas (tetrachords) and cementing jins transition pivots.',
    descriptionAr: 'أنماط رباعية تحاكي بنية الأجناس الموسيقية وتعزز الانتقال المحكم عند الغماز.',
    icon: 'Grid',
    badge: 'Ajnas Mastery',
    pedagogicalFocus: 'Jins awareness, pivot stabilization, and four-finger dexterity.',
  },
  {
    id: 'position-shift',
    titleEn: 'Position Shift Drills',
    titleAr: 'تمارين تحويل المراكز (Violin Position Shifts)',
    descriptionEn: 'Violin shifts between 1st and 3rd positions on Ghammaz pivots and octave leaps with guide finger technique.',
    descriptionAr: 'تمارين الانتقال بين الوضعيات الأولى والثالثة على الغماز وقفزات الديوان مع إرشادات الأصبع الدليل.',
    icon: 'ArrowUpRight',
    badge: 'Violin Technique',
    pedagogicalFocus: 'Position shifts, guide fingers, vocal portamento (Zahlaka), and upper register resonance.',
  },
  {
    id: 'sightreading',
    titleEn: 'Algorithmic Sight-Reading',
    titleAr: 'قراءة النوتة الموسيقية المرتجلة',
    descriptionEn: 'Randomized authentic phrases generated algorithmically with authentic Sayr motion and Qafla cadences.',
    descriptionAr: 'جمل لحنية توليدية تحاكي السير النغمي الحقيقي للمقام وتنتهي بقفلة كلاسيكية.',
    icon: 'Music',
    badge: 'Prima Vista',
    pedagogicalFocus: 'Real-time notation reading, phrase interpretation, and cadential resolution.',
  },
];

export class PracticeDrillEngine {
  /**
   * Primary entry point for generating any drill or practice exercise.
   */
  public static generateDrill(
    maqam: Maqam,
    config: PracticeDrillConfig
  ): GeneratedMelody {
    switch (config.type) {
      case 'scale-run':
        return this.generateScaleRunDrill(maqam, config);
      case 'sequence-3':
        return this.generateSequence3Drill(maqam, config);
      case 'sequence-4':
        return this.generateSequence4Drill(maqam, config);
      case 'position-shift':
        return this.generatePositionShiftDrill(maqam, config);
      case 'sightreading':
      default:
        return MelodyGenerator.generateMelody(
          maqam,
          config.sightReadingDifficulty || 'level1',
          config.sightReadingLength || 8,
          config.timeSignature || '4/4',
          config.tempoBpm || 80
        );
    }
  }

  /**
   * 1. Scale / Maqam Drill (Ascending & Descending Run)
   */
  public static generateScaleRunDrill(
    maqam: Maqam,
    config: PracticeDrillConfig
  ): GeneratedMelody {
    const scale = maqam.getScale();
    if (scale.length === 0) {
      throw new Error('Maqam scale cannot be empty');
    }

    const direction = config.direction || 'both';
    const noteValue = config.runNoteValue || 'quarter';
    const duration = noteValue === 'eighth' ? 0.5 : 1.0;
    const tempo = config.tempoBpm || (noteValue === 'eighth' ? 75 : 85);
    const timeSig = config.timeSignature || '4/4';

    const notes: GeneratedNote[] = [];

    // Ascending run
    const ascendingPitches = [...scale];

    // Descending run (reverse from octave - 1 down to tonic)
    const descendingPitches = [...scale].slice(0, scale.length - 1).reverse();

    let targetPitches: { pitch: ArabicPitch; role: 'asc' | 'desc' | 'turn' | 'res' }[] = [];

    if (direction === 'both') {
      ascendingPitches.forEach((p, idx) => {
        targetPitches.push({
          pitch: p,
          role: idx === ascendingPitches.length - 1 ? 'turn' : 'asc',
        });
      });
      descendingPitches.forEach((p, idx) => {
        targetPitches.push({
          pitch: p,
          role: idx === descendingPitches.length - 1 ? 'res' : 'desc',
        });
      });
    } else if (direction === 'ascending') {
      targetPitches = ascendingPitches.map((p, idx) => ({
        pitch: p,
        role: idx === ascendingPitches.length - 1 ? 'res' : 'asc',
      }));
    } else {
      // descending
      targetPitches = [...scale].reverse().map((p, idx) => ({
        pitch: p,
        role: idx === scale.length - 1 ? 'res' : 'desc',
      }));
    }

    targetPitches.forEach((item, index) => {
      const isLast = index === targetPitches.length - 1;
      const pitchDuration = isLast ? (timeSig === '4/4' ? 2.0 : 1.0) : duration;
      const placement = ViolinErgonomicsEngine.mapPitchToPosition(item.pitch, 1);

      let roleLabel = '';
      if (item.role === 'asc') roleLabel = 'صعود';
      else if (item.role === 'desc') roleLabel = 'هبوط';
      else if (item.role === 'turn') roleLabel = 'قمة السلم';
      else if (item.role === 'res') roleLabel = 'استقرار';

      notes.push({
        pitch: item.pitch,
        durationQuarter: pitchDuration,
        arabicName: `${item.pitch.toDisplayString()} (${roleLabel})`,
        violinPlacement: placement,
        positionNumber: 1,
        pedagogicalNote: `درجة ${item.pitch.toScientificString()} - ${placement.noteAnnotation}`,
      });
    });

    const totalBeats = notes.reduce((sum, n) => sum + n.durationQuarter, 0);
    const pitches = notes.map((n) => n.pitch);

    const dirTitle =
      direction === 'both'
        ? 'Ascending & Descending Run (صعود وهبوط)'
        : direction === 'ascending'
        ? 'Ascending Run (صعود)'
        : 'Descending Run (هبوط)';

    return {
      id: `drill-scale-${Date.now()}`,
      title: `${maqam.name} - ${dirTitle}`,
      maqam,
      difficulty: 'level1',
      timeSignature: timeSig,
      tempoBpm: tempo,
      notes,
      pitches,
      totalBeats,
      description: `Complete scalar run for ${maqam.name}. Focus on microtonal intonation, consistent bow distribution, and relaxed finger pressure.`,
      drillType: 'scale-run',
      drillConfig: config,
    };
  }

  /**
   * 2. Sequences of 3 (ثلاثيات النغم)
   * Patterns: 1-2-3, 2-3-4, 3-4-5, 4-5-6, 5-6-7, 6-7-8
   */
  public static generateSequence3Drill(
    maqam: Maqam,
    config: PracticeDrillConfig
  ): GeneratedMelody {
    const scale = maqam.getScale();
    if (scale.length < 3) {
      throw new Error('Maqam scale must have at least 3 degrees for Sequences of 3');
    }

    const direction = config.direction || 'both';
    const tempo = config.tempoBpm || 80;
    const timeSig = config.timeSignature || '3/4'; // 3/4 meter is natural for 3-note groups!
    const noteDuration = 0.5; // Eighth note: 3 notes = 1.5 beats (half of 3/4 bar)

    const notes: GeneratedNote[] = [];
    const N = scale.length;

    // Ascending patterns
    if (direction === 'both' || direction === 'ascending') {
      for (let i = 0; i <= N - 3; i++) {
        const trio = [scale[i], scale[i + 1], scale[i + 2]];
        trio.forEach((pitch, subIdx) => {
          const placement = ViolinErgonomicsEngine.mapPitchToPosition(pitch, 1);
          notes.push({
            pitch,
            durationQuarter: noteDuration,
            arabicName: `${pitch.toDisplayString()} [${i + 1}-${i + 2}-${i + 3}]`,
            violinPlacement: placement,
            positionNumber: 1,
            pedagogicalNote: `مجموعة ${i + 1}: الدرجة ${subIdx + 1} (${pitch.toScientificString()})`,
          });
        });
      }
    }

    // Descending patterns
    if (direction === 'both' || direction === 'descending') {
      for (let i = N - 1; i >= 2; i--) {
        const trio = [scale[i], scale[i - 1], scale[i - 2]];
        trio.forEach((pitch, subIdx) => {
          const placement = ViolinErgonomicsEngine.mapPitchToPosition(pitch, 1);
          notes.push({
            pitch,
            durationQuarter: noteDuration,
            arabicName: `${pitch.toDisplayString()} [${i + 1}-${i}-${i - 1}]`,
            violinPlacement: placement,
            positionNumber: 1,
            pedagogicalNote: `هبوط ${N - i}: الدرجة ${subIdx + 1} (${pitch.toScientificString()})`,
          });
        });
      }
    }

    // Final resolution on Tonic
    const resolutionDuration = timeSig === '3/4' ? 1.5 : 2.0;
    const tonic = scale[0];
    const tonicPlacement = ViolinErgonomicsEngine.mapPitchToPosition(tonic, 1);
    notes.push({
      pitch: tonic,
      durationQuarter: resolutionDuration,
      arabicName: `${tonic.toDisplayString()} (استقرار)`,
      violinPlacement: tonicPlacement,
      positionNumber: 1,
      pedagogicalNote: `قرار المقام - استقرار كامل`,
    });

    const totalBeats = notes.reduce((sum, n) => sum + n.durationQuarter, 0);
    const pitches = notes.map((n) => n.pitch);

    const dirTitle =
      direction === 'both'
        ? 'Sequences of 3: Ascending & Descending'
        : direction === 'ascending'
        ? 'Sequences of 3: Ascending'
        : 'Sequences of 3: Descending';

    return {
      id: `drill-seq3-${Date.now()}`,
      title: `${maqam.name} - ${dirTitle} (ثلاثيات)`,
      maqam,
      difficulty: 'level2',
      timeSignature: timeSig,
      tempoBpm: tempo,
      notes,
      pitches,
      totalBeats,
      description: `Three-note scalar sequence drill. Strengthens the auditory perception of neighbor tones, enhances finger speed, and improves intonation consistency across ajnas.`,
      drillType: 'sequence-3',
      drillConfig: config,
    };
  }

  /**
   * 3. Sequences of 4 (رباعيات النغم)
   * Patterns: 1-2-3-4 (Root Jins!), 2-3-4-5 (reaches Ghammaz!), 3-4-5-6, 4-5-6-7, 5-6-7-8 (Upper Jins!)
   */
  public static generateSequence4Drill(
    maqam: Maqam,
    config: PracticeDrillConfig
  ): GeneratedMelody {
    const scale = maqam.getScale();
    if (scale.length < 4) {
      throw new Error('Maqam scale must have at least 4 degrees for Sequences of 4');
    }

    const direction = config.direction || 'both';
    const tempo = config.tempoBpm || 85;
    const timeSig = config.timeSignature || '4/4'; // 4/4 meter fits four-note groups perfectly!
    const noteDuration = 0.5; // Eighth note: 4 notes = 2 beats (half of a 4/4 measure)

    const notes: GeneratedNote[] = [];
    const N = scale.length;

    // Ascending patterns
    if (direction === 'both' || direction === 'ascending') {
      for (let i = 0; i <= N - 4; i++) {
        const quartet = [scale[i], scale[i + 1], scale[i + 2], scale[i + 3]];
        quartet.forEach((pitch, subIdx) => {
          const placement = ViolinErgonomicsEngine.mapPitchToPosition(pitch, 1);
          let label = `${pitch.toDisplayString()} [${i + 1}-${i + 4}]`;
          if (i === 0 && subIdx === 3) label += ' (نهاية جنس الجذع)';
          if (i === 1 && subIdx === 3) label += ' (غمّاز المقام)';

          notes.push({
            pitch,
            durationQuarter: noteDuration,
            arabicName: label,
            violinPlacement: placement,
            positionNumber: 1,
            pedagogicalNote: `رباعية ${i + 1}: الخطوة ${subIdx + 1} (${pitch.toScientificString()})`,
          });
        });
      }
    }

    // Descending patterns
    if (direction === 'both' || direction === 'descending') {
      for (let i = N - 1; i >= 3; i--) {
        const quartet = [scale[i], scale[i - 1], scale[i - 2], scale[i - 3]];
        quartet.forEach((pitch, subIdx) => {
          const placement = ViolinErgonomicsEngine.mapPitchToPosition(pitch, 1);
          notes.push({
            pitch,
            durationQuarter: noteDuration,
            arabicName: `${pitch.toDisplayString()} [${i + 1}-${i - 2}]`,
            violinPlacement: placement,
            positionNumber: 1,
            pedagogicalNote: `هبوط رباعي ${N - i}: الخطوة ${subIdx + 1}`,
          });
        });
      }
    }

    // Final resolution on Tonic
    const tonic = scale[0];
    const tonicPlacement = ViolinErgonomicsEngine.mapPitchToPosition(tonic, 1);
    notes.push({
      pitch: tonic,
      durationQuarter: 2.0, // 2 beats resolution to finish the 4/4 bar
      arabicName: `${tonic.toDisplayString()} (قرار وقَفلة)`,
      violinPlacement: tonicPlacement,
      positionNumber: 1,
      pedagogicalNote: `استقرار تام على درجة القرار`,
    });

    const totalBeats = notes.reduce((sum, n) => sum + n.durationQuarter, 0);
    const pitches = notes.map((n) => n.pitch);

    const dirTitle =
      direction === 'both'
        ? 'Sequences of 4: Ascending & Descending'
        : direction === 'ascending'
        ? 'Sequences of 4: Ascending'
        : 'Sequences of 4: Descending';

    return {
      id: `drill-seq4-${Date.now()}`,
      title: `${maqam.name} - ${dirTitle} (رباعيات الأجناس)`,
      maqam,
      difficulty: 'level2',
      timeSignature: timeSig,
      tempoBpm: tempo,
      notes,
      pitches,
      totalBeats,
      description: `Four-note sequence drill mirroring Arabic ajnas (tetrachords). Trains smooth transitions across jins boundaries and reinforces the ghammaz pivot point.`,
      drillType: 'sequence-4',
      drillConfig: config,
    };
  }

  /**
   * 4. Position Shift Drills (التحويل بين المراكز للكمان)
   * Focused on shifting between 1st Position and 3rd Position in Arabic violin practice.
   */
  public static generatePositionShiftDrill(
    maqam: Maqam,
    config: PracticeDrillConfig
  ): GeneratedMelody {
    const scale = maqam.getScale();
    if (scale.length < 5) {
      throw new Error('Maqam scale must have at least 5 degrees for Position Shift Drills');
    }

    const variation = config.positionShiftVariation || 'ghammaz-pivot';
    const tempo = config.tempoBpm || 70;
    const timeSig = '4/4';
    const notes: GeneratedNote[] = [];

    const ghammaz = maqam.getGhammaz();
    const ghammazIdx = scale.findIndex((p) => p.equals(ghammaz));
    const pivotIdx = ghammazIdx >= 3 ? ghammazIdx : Math.min(4, scale.length - 1);
    const pivotPitch = scale[pivotIdx];
    const octavePitch = scale[scale.length - 1];

    if (variation === 'ghammaz-pivot') {
      // 1. Play up to Ghammaz in 1st Position
      for (let i = 0; i < pivotIdx; i++) {
        const p = scale[i];
        const placement = ViolinErgonomicsEngine.mapPitchToPosition(p, 1);
        notes.push({
          pitch: p,
          durationQuarter: 1.0,
          arabicName: `${p.toDisplayString()} (Pos I)`,
          violinPlacement: placement,
          positionNumber: 1,
          pedagogicalNote: `الوضعية الأولى (Pos I) - الإصبع ${placement.finger}`,
        });
      }

      // 2. Shift point on Ghammaz: Shift into 3rd Position with 1st finger!
      const shiftPos3Ghammaz = ViolinErgonomicsEngine.mapPitchToPosition(pivotPitch, 3);
      notes.push({
        pitch: pivotPitch,
        durationQuarter: 1.0,
        arabicName: `${pivotPitch.toDisplayString()} ↗ [SHIFT to Pos III]`,
        violinPlacement: shiftPos3Ghammaz,
        positionNumber: 3,
        isShiftPoint: true,
        shiftInstruction: `سحب الإصبع الأول إلى المركز الثالث (Pos III on ${shiftPos3Ghammaz.string}-string)`,
        pedagogicalNote: `تحويل للمركز الثالث: حرك اليد بسلاسة حتى يستقر الإصبع الأول على الغماز (${pivotPitch.toScientificString()})`,
      });

      // 3. Play upper register in 3rd Position
      for (let i = pivotIdx + 1; i < scale.length; i++) {
        const p = scale[i];
        const placement = ViolinErgonomicsEngine.mapPitchToPosition(p, 3);
        notes.push({
          pitch: p,
          durationQuarter: 1.0,
          arabicName: `${p.toDisplayString()} (Pos III)`,
          violinPlacement: placement,
          positionNumber: 3,
          pedagogicalNote: `المركز الثالث (Pos III) - الإصبع ${placement.finger} بنغمة دافئة مع فيبراتو`,
        });
      }

      // 4. Descend in 3rd Position back to Ghammaz
      for (let i = scale.length - 2; i > pivotIdx; i--) {
        const p = scale[i];
        const placement = ViolinErgonomicsEngine.mapPitchToPosition(p, 3);
        notes.push({
          pitch: p,
          durationQuarter: 1.0,
          arabicName: `${p.toDisplayString()} (Pos III)`,
          violinPlacement: placement,
          positionNumber: 3,
          pedagogicalNote: `هبوط في المركز الثالث (Pos III)`,
        });
      }

      // 5. Shift back down from Ghammaz to 1st Position!
      const shiftDownPos1 = ViolinErgonomicsEngine.mapPitchToPosition(pivotPitch, 1);
      notes.push({
        pitch: pivotPitch,
        durationQuarter: 1.0,
        arabicName: `${pivotPitch.toDisplayString()} ↘ [SHIFT to Pos I]`,
        violinPlacement: shiftDownPos1,
        positionNumber: 1,
        isShiftPoint: true,
        shiftInstruction: `عودة سلسة إلى المركز الأول (Pos I)`,
        pedagogicalNote: `تحويل هابط: خفف ضغط الإصبع وانزلق برفق إلى المركز الأول`,
      });

      // 6. Resolve to Tonic in 1st Position
      for (let i = pivotIdx - 1; i >= 0; i--) {
        const p = scale[i];
        const placement = ViolinErgonomicsEngine.mapPitchToPosition(p, 1);
        notes.push({
          pitch: p,
          durationQuarter: i === 0 ? 2.0 : 1.0,
          arabicName: `${p.toDisplayString()} (Pos I)`,
          violinPlacement: placement,
          positionNumber: 1,
          pedagogicalNote: i === 0 ? `استقرار تام على القرار في المركز الأول` : `هبوط نحو القرار`,
        });
      }
    } else if (variation === 'octave-leap') {
      // Octave Leap Shift: Qarar (Pos I) -> Leap to Jawab (Pos III) -> Return
      const tonic = scale[0];
      const tonicPos1 = ViolinErgonomicsEngine.mapPitchToPosition(tonic, 1);
      const octavePos3 = ViolinErgonomicsEngine.mapPitchToPosition(octavePitch, 3);

      // Measure 1: Establish Tonic in Pos 1
      notes.push({
        pitch: tonic,
        durationQuarter: 2.0,
        arabicName: `${tonic.toDisplayString()} (القرار - Pos I)`,
        violinPlacement: tonicPos1,
        positionNumber: 1,
        pedagogicalNote: `نغمة القرار في المركز الأول`,
      });

      // Leap and Shift to Octave in Pos 3
      notes.push({
        pitch: octavePitch,
        durationQuarter: 2.0,
        arabicName: `${octavePitch.toDisplayString()} ↗ [Leap to Pos III]`,
        violinPlacement: octavePos3,
        positionNumber: 3,
        isShiftPoint: true,
        shiftInstruction: `قفزة ديوان: تحويل مباشر من المركز الأول إلى المركز الثالث`,
        pedagogicalNote: `ثبّت نغمة الجواب في المركز الثالث بدقة ربع التون`,
      });

      // Upper neighbor in Pos 3
      if (scale.length > 2) {
        const subTonic = scale[scale.length - 2];
        const subPos3 = ViolinErgonomicsEngine.mapPitchToPosition(subTonic, 3);
        notes.push({
          pitch: subTonic,
          durationQuarter: 1.0,
          arabicName: `${subTonic.toDisplayString()} (Pos III)`,
          violinPlacement: subPos3,
          positionNumber: 3,
          pedagogicalNote: `درجة ما قبل الجواب في المركز الثالث`,
        });
        notes.push({
          pitch: octavePitch,
          durationQuarter: 1.0,
          arabicName: `${octavePitch.toDisplayString()} (Pos III)`,
          violinPlacement: octavePos3,
          positionNumber: 3,
          pedagogicalNote: `تأكيد الجواب`,
        });
      }

      // Shift back down to Pos 1
      notes.push({
        pitch: pivotPitch,
        durationQuarter: 1.0,
        arabicName: `${pivotPitch.toDisplayString()} ↘ [Shift Pos I]`,
        violinPlacement: ViolinErgonomicsEngine.mapPitchToPosition(pivotPitch, 1),
        positionNumber: 1,
        isShiftPoint: true,
        shiftInstruction: `انتقال عودة للمركز الأول`,
        pedagogicalNote: `هبوط للمركز الأول عند الغماز`,
      });

      // Cadential resolution to Tonic
      notes.push({
        pitch: tonic,
        durationQuarter: 2.0,
        arabicName: `${tonic.toDisplayString()} (قَفلة القرار)`,
        violinPlacement: tonicPos1,
        positionNumber: 1,
        pedagogicalNote: `قفلة القرار في المركز الأول`,
      });
    } else {
      // Expressive Slide (Zahlaka) into upper register
      // Stepwise glide from 3rd degree into Ghammaz and 3rd position
      for (let i = 0; i <= Math.min(2, scale.length - 1); i++) {
        const p = scale[i];
        notes.push({
          pitch: p,
          durationQuarter: 1.0,
          arabicName: `${p.toDisplayString()} (Pos I)`,
          violinPlacement: ViolinErgonomicsEngine.mapPitchToPosition(p, 1),
          positionNumber: 1,
          pedagogicalNote: `تمهيد في المركز الأول`,
        });
      }

      // Slide into Ghammaz
      const ghammazPos3 = ViolinErgonomicsEngine.mapPitchToPosition(pivotPitch, 3);
      notes.push({
        pitch: pivotPitch,
        durationQuarter: 2.0,
        arabicName: `${pivotPitch.toDisplayString()} ~ [زحلقة للمركز الثالث]`,
        violinPlacement: ghammazPos3,
        positionNumber: 3,
        isShiftPoint: true,
        shiftInstruction: `زحلقة لحنية (Glissando / Zahlaka) إلى المركز الثالث`,
        pedagogicalNote: `انزلاق شرقي تعبيري دافئ يحاكي الصوت البشري`,
      });

      // Continue to Octave
      notes.push({
        pitch: octavePitch,
        durationQuarter: 2.0,
        arabicName: `${octavePitch.toDisplayString()} (جواب - Pos III)`,
        violinPlacement: ViolinErgonomicsEngine.mapPitchToPosition(octavePitch, 3),
        positionNumber: 3,
        pedagogicalNote: `الجواب في المركز الثالث مع فيبراتو عربي غني`,
      });

      // Return and resolve
      notes.push({
        pitch: scale[0],
        durationQuarter: 2.0,
        arabicName: `${scale[0].toDisplayString()} (القرار)`,
        violinPlacement: ViolinErgonomicsEngine.mapPitchToPosition(scale[0], 1),
        positionNumber: 1,
        isShiftPoint: true,
        shiftInstruction: `انتقال نحو المركز الأول للاستقرار`,
        pedagogicalNote: `استقرار ختامي`,
      });
    }

    const totalBeats = notes.reduce((sum, n) => sum + n.durationQuarter, 0);
    const pitches = notes.map((n) => n.pitch);

    const varTitle =
      variation === 'ghammaz-pivot'
        ? '1st to 3rd Position Shift on Ghammaz'
        : variation === 'octave-leap'
        ? 'Octave Leap & Position Shift'
        : 'Expressive Slide (Zahlaka) & Position Shift';

    return {
      id: `drill-shift-${Date.now()}`,
      title: `${maqam.name} - ${varTitle} (تحويل المراكز)`,
      maqam,
      difficulty: 'level3',
      timeSignature: timeSig,
      tempoBpm: tempo,
      notes,
      pitches,
      totalBeats,
      description: `Violin position shifting exercise for ${maqam.name}. Focuses on smooth shifting motion without hand tension, accurate guide finger tracking, and authentic microtonal placement in both 1st and 3rd positions.`,
      drillType: 'position-shift',
      drillConfig: config,
    };
  }
}
