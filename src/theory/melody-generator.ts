// src/theory/melody-generator.ts
import { ArabicPitch } from '../core/pitch';
import { Maqam } from './maqam';

export type MelodyDifficulty = 'level1' | 'level2' | 'level3';

export interface GeneratedNote {
  pitch: ArabicPitch;
  durationQuarter: number; // 1 = quarter note, 0.5 = eighth, 2 = half
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
  description: string;
}

export class MelodyGenerator {
  /**
   * Generates an authentic melodic phrase for sight-reading based on the target Maqam.
   */
  public static generateMelody(
    maqam: Maqam,
    difficulty: MelodyDifficulty = 'level1',
    noteCount: number = 8,
    timeSignature: '4/4' | '3/4' | '2/4' = '4/4',
    tempoBpm: number = 96
  ): GeneratedMelody {
    const scale = maqam.getScale();
    if (scale.length === 0) {
      throw new Error('Maqam scale cannot be empty');
    }

    const tonic = scale[0];
    const notes: GeneratedNote[] = [];

    // Scale degree subsets based on difficulty
    const eligibleIndices: number[] =
      difficulty === 'level1'
        ? [0, 1, 2, 3, 4].filter(idx => idx < scale.length)
        : scale.map((_, i) => i);

    // Melodic generation with authentic contours:
    // 1. Start on Tonic or Dominant (degree 0 or degree 4)
    let currentIdx = Math.random() > 0.4 ? 0 : Math.min(4, scale.length - 1);
    notes.push({
      pitch: scale[currentIdx],
      durationQuarter: 1,
      arabicName: this.getArabicDegreeName(currentIdx)
    });

    for (let i = 1; i < noteCount - 1; i++) {
      let nextIdx: number;

      if (difficulty === 'level1') {
        // Stepwise motion (+1, -1, or repeat)
        const step = Math.random() < 0.4 ? 1 : Math.random() < 0.75 ? -1 : 0;
        nextIdx = Math.max(0, Math.min(eligibleIndices.length - 1, currentIdx + step));
      } else if (difficulty === 'level2') {
        // Steps and thirds (+1, -1, +2, -2)
        const moves = [-2, -1, -1, 0, 1, 1, 2];
        const move = moves[Math.floor(Math.random() * moves.length)];
        nextIdx = Math.max(0, Math.min(eligibleIndices.length - 1, currentIdx + move));
      } else {
        // Leaps, octave returns, ornamental turns
        const moves = [-3, -2, -1, -1, 1, 1, 2, 3];
        const move = moves[Math.floor(Math.random() * moves.length)];
        nextIdx = Math.max(0, Math.min(eligibleIndices.length - 1, currentIdx + move));
      }

      currentIdx = nextIdx;
      notes.push({
        pitch: scale[currentIdx],
        durationQuarter: 1,
        arabicName: this.getArabicDegreeName(currentIdx)
      });
    }

    // Last note: Cadence (Qafla) resolving to Tonic
    notes.push({
      pitch: tonic,
      durationQuarter: 2, // Longer note on cadence
      arabicName: `${this.getArabicDegreeName(0)} (قَفلة / Qarar)`
    });

    const pitches = notes.map(n => n.pitch);

    const descMap: Record<MelodyDifficulty, string> = {
      level1: 'Level 1: Stepwise motion within primary Jins. Ideal for learning microtonal intonation.',
      level2: 'Level 2: Stepwise and 3rd intervals across primary and secondary Jins.',
      level3: 'Level 3: Expressive leaps and ornamental turns with classical Qafla resolution.'
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
      description: descMap[difficulty]
    };
  }

  private static getArabicDegreeName(index: number): string {
    const names = [
      'Qarar (القرار)',
      'Thani (الثاني)',
      'Thalith / Sikah (الثالث)',
      'Rabi (الرابع)',
      'Ghammaz (الغمّاز / Dominant)',
      'Sadis (السادس)',
      'Sabi (السابع)',
      'Jawab (الجواب / Octave)'
    ];
    return names[index] || `Degree ${index + 1}`;
  }
}
