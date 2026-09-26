// src/theory/melody-generator.ts
import { ArabicPitch } from '../core/pitch';
import { Maqam } from './maqam';

export type MelodyDifficulty = 'level1' | 'level2' | 'level3';

export interface GeneratedNote {
  pitch: ArabicPitch;
  durationQuarter: number; // e.g. 0.25 (sixteenth), 0.5 (eighth), 0.75 (dotted eighth), 1.0 (quarter), 2.0 (half)
  arabicName: string;
}

export interface GeneratedMelody {
  id: string;
  title: string;
  maqam: Maqam;
  difficulty: MelodyDifficulty;
  timeSignature: '4/4' | '3/4' | '2/4';
  tempoBpm: number;
  notes: GeneratedNote[];
  pitches: ArabicPitch[];
  totalBeats: number;
  description: string;
}

export class MelodyGenerator {
  /**
   * Traditional Arabic pitch degree names mapped by scale index
   */
  private static readonly ARABIC_DEGREE_NAMES: Record<number, string> = {
    0: 'القرار / Rast (Degree 1)',
    1: 'الدكاه / Dukah (Degree 2)',
    2: 'السيكاه / Sikah (Degree 3)',
    3: 'الجهاركاه / Jaharkah (Degree 4)',
    4: 'الغمّاز / Nawa (Degree 5)',
    5: 'الحسيني / Husayni (Degree 6)',
    6: 'الأوج / Awj (Degree 7)',
    7: 'الجواب / Kirdan (Octave)'
  };

  /**
   * Generates an authentic melodic phrase for sight-reading based on the target Maqam.
   */
  public static generateMelody(
    maqam: Maqam,
    difficulty: MelodyDifficulty = 'level1',
    targetMeasures: number = 2,
    timeSignature: '4/4' | '3/4' | '2/4' = '4/4',
    tempoBpm: number = 80
  ): GeneratedMelody {
    const scale = maqam.getScale();
    if (scale.length === 0) {
      throw new Error('Maqam scale cannot be empty');
    }

    const beatsPerMeasure = timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 2;
    const totalTargetBeats = targetMeasures * beatsPerMeasure;
    
    // Cadence (Qafla) consumes the last 1.5 - 2 beats
    const cadentialBeats = 2.0;
    const targetMelodicBeats = Math.max(beatsPerMeasure, totalTargetBeats - cadentialBeats);

    const notes: GeneratedNote[] = [];
    let currentBeats = 0;

    // Scale indices setup
    const lowerJinsPitches = maqam.lowerJins.getPitches();
    const lowerJinsCount = lowerJinsPitches.length;
    const maxIndex = scale.length - 1;

    // Starting pitch selection: Tonic (0) or Ghammaz (degree 4/5 depending on jins)
    const ghammazIdx = scale.findIndex(p => p.equals(maqam.getGhammaz()));
    const validStartIndices = difficulty === 'level1' 
      ? [0] 
      : [0, ghammazIdx > 0 ? ghammazIdx : Math.min(4, maxIndex)];

    let currentIdx = validStartIndices[Math.floor(Math.random() * validStartIndices.length)];

    // 1. Initial Note
    const initialDuration = difficulty === 'level1' ? 1.0 : 0.5;
    notes.push({
      pitch: scale[currentIdx],
      durationQuarter: initialDuration,
      arabicName: this.getArabicDegreeName(currentIdx)
    });
    currentBeats += initialDuration;

    // 2. Middle Phrase Generation
    while (currentBeats < targetMelodicBeats) {
      const remaining = targetMelodicBeats - currentBeats;
      const duration = this.getRandomDuration(difficulty, remaining);

      let nextIdx: number;
      if (difficulty === 'level1') {
        // Strict stepwise within lower Jins
        const step = Math.random() < 0.45 ? 1 : Math.random() < 0.9 ? -1 : 0;
        nextIdx = Math.max(0, Math.min(lowerJinsCount - 1, currentIdx + step));
      } else if (difficulty === 'level2') {
        // Steps, thirds, and mild pivots to Ghammaz
        const moves = [-2, -1, -1, 0, 1, 1, 2];
        const move = moves[Math.floor(Math.random() * moves.length)];
        nextIdx = Math.max(0, Math.min(maxIndex, currentIdx + move));
      } else {
        // Level 3: Leaps, ornamentations, octave returns
        const moves = [-3, -2, -1, -1, 1, 1, 2, 3];
        const move = moves[Math.floor(Math.random() * moves.length)];
        
        // Occasional ornamental turn (mordent motion)
        if (Math.random() < 0.25 && currentIdx > 0 && currentIdx < maxIndex && remaining >= 1.0) {
          notes.push({
            pitch: scale[currentIdx + 1],
            durationQuarter: 0.25,
            arabicName: `${this.getArabicDegreeName(currentIdx + 1)} (زخرفة)`
          });
          notes.push({
            pitch: scale[currentIdx],
            durationQuarter: 0.25,
            arabicName: this.getArabicDegreeName(currentIdx)
          });
          currentBeats += 0.5;
        }

        nextIdx = Math.max(0, Math.min(maxIndex, currentIdx + move));
      }

      currentIdx = nextIdx;
      notes.push({
        pitch: scale[currentIdx],
        durationQuarter: duration,
        arabicName: this.getArabicDegreeName(currentIdx)
      });
      currentBeats += duration;
    }

    // 3. Cadence Phrase (قَفلة - Qafla)
    // Stepwise descent from 2nd degree (Dukah/Thani) to 1st degree (Qarar/Tonic)
    const cadenceSubtonicIdx = 1 < scale.length ? 1 : 0;
    
    // Penultimate Note (Leading / Step degree)
    notes.push({
      pitch: scale[cadenceSubtonicIdx],
      durationQuarter: 0.5,
      arabicName: `${this.getArabicDegreeName(cadenceSubtonicIdx)} (مسار القَفلة)`
    });

    // Final Cadential Resolution Note (Tonic)
    notes.push({
      pitch: scale[0],
      durationQuarter: 1.5,
      arabicName: `${this.getArabicDegreeName(0)} (قَفلة / Qarar)`
    });

    const totalBeats = notes.reduce((acc, n) => acc + n.durationQuarter, 0);
    const pitches = notes.map(n => n.pitch);

    const descMap: Record<MelodyDifficulty, string> = {
      level1: 'Level 1: Stepwise motion within lower Jins. Ideal for learning microtonal intonation and steady rhythm.',
      level2: 'Level 2: Stepwise and 3rd intervals across primary/secondary Ajnas with varied rhythmic values.',
      level3: 'Level 3: Expressive leaps, ornamental turns, microtonal inflections, and classical Qafla resolution.'
    };

    return {
      id: `melody-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `${maqam.name} Sight-Reading Exercise (${difficulty.toUpperCase()})`,
      maqam,
      difficulty,
      timeSignature,
      tempoBpm,
      notes,
      pitches,
      totalBeats,
      description: descMap[difficulty]
    };
  }

  /**
   * Helper to select varied durations based on difficulty tier and remaining beat budget.
   */
  private static getRandomDuration(difficulty: MelodyDifficulty, remainingBeats: number): number {
    let pool: number[];

    if (difficulty === 'level1') {
      pool = [1.0, 1.0, 0.5, 0.5];
    } else if (difficulty === 'level2') {
      pool = [0.5, 0.5, 0.5, 1.0, 0.75, 0.25];
    } else {
      pool = [0.25, 0.5, 0.5, 0.75, 1.0];
    }

    const filtered = pool.filter(d => d <= remainingBeats);
    if (filtered.length === 0) {
      return remainingBeats;
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  private static getArabicDegreeName(index: number): string {
    return this.ARABIC_DEGREE_NAMES[index] || `Degree ${index + 1}`;
  }
}