// src/violin/ergonomics.ts
import { ArabicPitch, DiatonicBase, MicrotonalAccidental } from '../core/pitch';

export type ViolinStringName = 'G' | 'D' | 'A' | 'E';
export type ViolinFinger = 0 | 1 | 2 | 3 | 4;
export type ViolinPositionNumber = 1 | 2 | 3 | 4;
export type ViolinPositionMode = ViolinPositionNumber | 'auto';

export type FingerMicroOffset = 
  | 'open'
  | 'quarter_low'    // -50 cents backward from standard spot
  | 'half_low'       // low finger (semitone above lower pitch / flat)
  | 'standard'       // standard position
  | 'quarter_high'   // +50 cents forward (neutral microtone / half-sharp / Sikah)
  | 'stretched_high';// augmented 2nd stretch (+100 cents forward)

export interface ViolinFingerPlacement {
  readonly string: ViolinStringName;
  readonly position: ViolinPositionNumber;
  readonly finger: ViolinFinger;
  readonly microOffset: FingerMicroOffset;
  readonly pitch: ArabicPitch;
  readonly noteAnnotation: string;
  readonly distanceRatioFromNut: number; // 0.0 (nut) to ~0.5 (octave)
  readonly centsAboveOpenString: number;
  readonly isAlternative?: boolean;
  readonly pedagogicalTip?: string;
}

export interface PositionRangeInfo {
  readonly position: ViolinPositionNumber;
  readonly name: string;
  readonly description: string;
  readonly firstFingerPitches: Record<ViolinStringName, string>;
  readonly arabicTraditionRole: string;
}

export class ViolinErgonomicsEngine {
  public static readonly STRING_BASE_PITCHES: Record<ViolinStringName, ArabicPitch> = {
    G: new ArabicPitch('G', '♮', 3), // open G (196 Hz) - Qt index 86
    D: new ArabicPitch('D', '♮', 4), // open D (293.66 Hz) - Qt index 100
    A: new ArabicPitch('A', '♮', 4), // open A (440.0 Hz) - Qt index 114
    E: new ArabicPitch('E', '♮', 5)  // open E (659.25 Hz) - Qt index 128
  };

  public static readonly POSITION_INFO: Record<ViolinPositionNumber, PositionRangeInfo> = {
    1: {
      position: 1,
      name: '1st Position (الوضعية الأولى)',
      description: 'Hand rests at the nut. The bedrock foundation of violin playing.',
      firstFingerPitches: { G: 'A3', D: 'E4', A: 'B4', E: 'F♯5' },
      arabicTraditionRole: 'Standard position for Maqam Rast, Bayati, and Hijaz on Dukah/Rast roots. Ideal for open resonance and quick ornamentations.'
    },
    2: {
      position: 2,
      name: '2nd Position (الوضعية الثانية)',
      description: 'Hand shifted up by one diatonic whole-tone.',
      firstFingerPitches: { G: 'B3', D: 'F4', A: 'C5', E: 'G5' },
      arabicTraditionRole: 'Used for fluid shifts between Dukah and Jaharkah without crossing strings, allowing expressive glissando.'
    },
    3: {
      position: 3,
      name: '3rd Position (الوضعية الثالثة)',
      description: 'Hand rests against the violin body ribs/shoulder. 1st finger plays 4th degree above open string.',
      firstFingerPitches: { G: 'C4', D: 'G4', A: 'D5', E: 'A5' },
      arabicTraditionRole: 'Fundamental in classical Arabic violin: allows playing Kardan (C5) and Muhayyar (D5) with warm finger vibrato rather than open string sound.'
    },
    4: {
      position: 4,
      name: '4th Position (الوضعية الرابعة)',
      description: 'High expressive register for soaring taqasim.',
      firstFingerPitches: { G: 'D4', D: 'A4', A: 'E5', E: 'B5' },
      arabicTraditionRole: 'High vocal mimicry, soaring climax phrases in Dawr, Muwashah, and instrumental Bashraf.'
    }
  };

  /**
   * Calculates finger physical stop distance from nut using 24-EDO acoustic equation:
   * Stop position ratio L = 1 - 2^(-qt / 24)
   * On a violin of ~328mm vibrating string length:
   *  - 1 octave (24 qt) = 50% length
   *  - 1st pos 4th finger (~700¢ = 14 qt) ≈ 33% length
   */
  public static calculateFingerStopRatio(qtFromOpen: number): number {
    if (qtFromOpen <= 0) return 0;
    return 1 - Math.pow(2, -qtFromOpen / 24);
  }

  /**
   * Map pitch to a specific position (1st, 2nd, 3rd, 4th) or find optimal in that position.
   */
  public static mapPitchToPosition(
    pitch: ArabicPitch,
    targetPosition: ViolinPositionNumber = 1
  ): ViolinFingerPlacement {
    const targetQt = pitch.toQuarterToneIndex();
    const stringOrder: ViolinStringName[] = ['E', 'A', 'D', 'G'];

    // In position N, the 1st finger is shifted up by approximately:
    // Pos 1: +4 qt (200¢, major 2nd)
    // Pos 2: +7-8 qt (350-400¢, 3rd)
    // Pos 3: +10 qt (500¢, perfect 4th)
    // Pos 4: +14 qt (700¢, perfect 5th)
    const positionShiftQt: Record<ViolinPositionNumber, number> = {
      1: 0,
      2: 4,
      3: 10,
      4: 14
    };

    const shift = positionShiftQt[targetPosition];

    // Find the string where this pitch can be played comfortably in the target position
    let chosenString: ViolinStringName = 'G';
    let minDiff = Infinity;

    for (const str of stringOrder) {
      const openQt = this.STRING_BASE_PITCHES[str].toQuarterToneIndex();
      const intervalQt = targetQt - openQt;

      // An open string can only be played with finger 0 in 1st position (or as open string)
      if (intervalQt === 0 && targetPosition === 1) {
        return {
          string: str,
          position: 1,
          finger: 0,
          microOffset: 'open',
          pitch,
          noteAnnotation: `Open ${str} string (0)`,
          distanceRatioFromNut: 0,
          centsAboveOpenString: 0,
          pedagogicalTip: `Open string resonance. In Arabic music, alternate with 4th finger on ${str === 'D' ? 'G' : str === 'A' ? 'D' : 'A'} for microtonal vibrato.`
        };
      }

      // Check if note is playable on this string in target position
      // A position typically covers fingers 1 to 4 (about 10 to 14 quarter-tones above position base)
      const basePosQt = openQt + shift;
      const fingerDeltaQt = targetQt - basePosQt;

      if (fingerDeltaQt >= 0 && fingerDeltaQt <= 14) {
        chosenString = str;
        minDiff = fingerDeltaQt;
        break;
      }
    }

    // Fallback if not cleanly in range: pick highest string that is <= targetQt
    if (minDiff === Infinity) {
      for (const str of stringOrder) {
        const openQt = this.STRING_BASE_PITCHES[str].toQuarterToneIndex();
        if (targetQt >= openQt) {
          chosenString = str;
          break;
        }
      }
    }

    const openQt = this.STRING_BASE_PITCHES[chosenString].toQuarterToneIndex();
    const intervalQt = targetQt - openQt;

    if (intervalQt === 0) {
      return {
        string: chosenString,
        position: 1,
        finger: 0,
        microOffset: 'open',
        pitch,
        noteAnnotation: `Open ${chosenString} string (0)`,
        distanceRatioFromNut: 0,
        centsAboveOpenString: 0
      };
    }

    // Calculate finger number relative to position
    let finger: ViolinFinger = 1;
    let offset: FingerMicroOffset = 'standard';

    if (targetPosition === 1) {
      // 1st position finger mapping
      if (intervalQt <= 3) {
        finger = 1;
        offset = intervalQt === 1 ? 'half_low' : intervalQt === 2 ? 'standard' : 'quarter_high';
      } else if (intervalQt <= 6) {
        finger = 2;
        offset = intervalQt === 4 ? 'half_low' : intervalQt === 5 ? 'quarter_low' : 'standard';
      } else if (intervalQt <= 9) {
        finger = 3;
        offset = intervalQt === 7 ? 'half_low' : intervalQt === 8 ? 'standard' : 'quarter_high';
      } else {
        finger = 4;
        offset = intervalQt >= 11 ? 'stretched_high' : 'standard';
      }

      // Specific pedagogical overrides for Arabic repertoire
      if (pitch.diatonic === 'E' && pitch.accidental === '𝄳' && chosenString === 'D') {
        finger = 1;
        offset = 'quarter_high'; // Forward 1st finger for Sikah
      }
      if (pitch.diatonic === 'F' && pitch.accidental === '♯' && chosenString === 'D') {
        finger = 3;
        offset = 'stretched_high'; // Augmented 2nd stretch from E♭
      }
      if (pitch.diatonic === 'B' && pitch.accidental === '𝄳' && chosenString === 'A') {
        finger = 1;
        offset = 'quarter_high'; // Awj / neutral B on A string
      }
    } else {
      // Higher positions (2nd, 3rd, 4th)
      const posShift = positionShiftQt[targetPosition];
      const relQt = intervalQt - posShift;

      if (relQt <= 2) {
        finger = 1;
        offset = relQt <= 0 ? 'half_low' : relQt === 1 ? 'quarter_high' : 'standard';
      } else if (relQt <= 5) {
        finger = 2;
        offset = relQt === 3 ? 'quarter_low' : relQt === 4 ? 'standard' : 'quarter_high';
      } else if (relQt <= 8) {
        finger = 3;
        offset = relQt === 6 ? 'half_low' : relQt === 7 ? 'standard' : 'quarter_high';
      } else {
        finger = 4;
        offset = relQt >= 10 ? 'stretched_high' : 'standard';
      }
    }

    const stopRatio = this.calculateFingerStopRatio(intervalQt);
    const pedagogicalTip = this.generatePedagogicalTip(pitch, chosenString, finger, targetPosition);

    return {
      string: chosenString,
      position: targetPosition,
      finger,
      microOffset: offset,
      pitch,
      noteAnnotation: `${chosenString} string, Finger ${finger} (${offset.replace('_', ' ')}) in ${targetPosition}${targetPosition === 1 ? 'st' : targetPosition === 2 ? 'nd' : targetPosition === 3 ? 'rd' : 'th'} Pos`,
      distanceRatioFromNut: stopRatio,
      centsAboveOpenString: intervalQt * 50,
      pedagogicalTip
    };
  }

  /**
   * Find alternative fingerings across strings and positions for a note.
   */
  public static findAlternativePlacements(pitch: ArabicPitch): ViolinFingerPlacement[] {
    const alternatives: ViolinFingerPlacement[] = [];
    const targetQt = pitch.toQuarterToneIndex();
    const stringOrder: ViolinStringName[] = ['G', 'D', 'A', 'E'];

    for (const str of stringOrder) {
      const openQt = this.STRING_BASE_PITCHES[str].toQuarterToneIndex();
      const intervalQt = targetQt - openQt;

      if (intervalQt < 0) continue; // cannot play below open string

      // Try positions 1, 2, 3, 4
      ([1, 2, 3, 4] as ViolinPositionNumber[]).forEach(pos => {
        const placement = this.mapPitchToPosition(pitch, pos);
        if (placement.string === str) {
          // Avoid exact duplicates
          const exists = alternatives.some(
            a => a.string === placement.string && a.position === placement.position && a.finger === placement.finger
          );
          if (!exists) {
            alternatives.push(placement);
          }
        }
      });

      // Special check: can this note be played as 4th finger on lower string?
      if (str !== 'E' && intervalQt === 14) {
        // e.g. D4 on G string (14 qt = 700 cents) = 4th finger!
        const fourthFingerPlacement: ViolinFingerPlacement = {
          string: str,
          position: 1,
          finger: 4,
          microOffset: 'standard',
          pitch,
          noteAnnotation: `${str} string, 4th Finger in 1st Pos (Arabic vibrato option)`,
          distanceRatioFromNut: this.calculateFingerStopRatio(14),
          centsAboveOpenString: 700,
          isAlternative: true,
          pedagogicalTip: `Preferred in Arabic violin tradition over open string for sustained notes, allowing delicate vibrato and microtonal inflection.`
        };
        if (!alternatives.some(a => a.string === str && a.finger === 4)) {
          alternatives.push(fourthFingerPlacement);
        }
      }
    }

    return alternatives;
  }

  private static generatePedagogicalTip(
    pitch: ArabicPitch,
    str: ViolinStringName,
    finger: ViolinFinger,
    pos: ViolinPositionNumber
  ): string {
    if (pitch.accidental === '𝄳') {
      return `Neutral quarter-tone (سيكاه / أوج): Place finger ${finger} halfway between the flat and natural positions (+50 cents) with relaxed left-hand knuckle.`;
    }
    if (pitch.accidental === '♯' && pitch.diatonic === 'F' && str === 'D') {
      return `Hijaz augmented 2nd stretch (300¢): Extend 3rd finger forward toward G, creating the signature theatrical Hijaz tension.`;
    }
    if (finger === 4 && pos === 1) {
      return `Arabic left-hand tradition: 4th finger on ${str} string allows expressive microtonal ornamentation without changing string timbre.`;
    }
    const suffix = pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th';
    if (pos === 3) {
      return `3rd position gives a sweeter, warmer timbre for soaring melodies, keeping the palm close to the violin shoulder.`;
    }
    return `Standard left-hand stop in ${pos}${suffix} position on ${str} string.`;
  }

  /**
   * Generates fingering chart for an entire array of pitches given a position mode.
   */
  public static generateFingeringChart(
    pitches: ArabicPitch[],
    positionMode: ViolinPositionMode = 1
  ): ViolinFingerPlacement[] {
    return pitches.map(pitch => {
      if (positionMode === 'auto') {
        // Smart auto: if note is high (> E5), shift to 3rd pos; otherwise 1st pos
        const targetQt = pitch.toQuarterToneIndex();
        const e5Qt = this.STRING_BASE_PITCHES['E'].toQuarterToneIndex();
        const pos: ViolinPositionNumber = targetQt >= e5Qt + 6 ? 3 : 1;
        return this.mapPitchToPosition(pitch, pos);
      }
      return this.mapPitchToPosition(pitch, positionMode);
    });
  }

  /**
   * 2-Octave Range validation:
   * Violin pedagogical range: G3 (Open G = 86) to G5 / A5 (134 / 138).
   * Exact 2-octave span = 48 quarter-tones (2400 cents).
   */
  public static validateSequenceRange(pitches: ArabicPitch[]): {
    valid: boolean;
    spanQuarterTones: number;
    spanOctaves: number;
    lowestPitch: ArabicPitch | null;
    highestPitch: ArabicPitch | null;
    message: string;
  } {
    if (pitches.length === 0) {
      return {
        valid: true,
        spanQuarterTones: 0,
        spanOctaves: 0,
        lowestPitch: null,
        highestPitch: null,
        message: 'Sequence is empty.'
      };
    }

    let minQt = Infinity;
    let maxQt = -Infinity;
    let lowest: ArabicPitch = pitches[0];
    let highest: ArabicPitch = pitches[0];

    pitches.forEach(p => {
      const qt = p.toQuarterToneIndex();
      if (qt < minQt) {
        minQt = qt;
        lowest = p;
      }
      if (qt > maxQt) {
        maxQt = qt;
        highest = p;
      }
    });

    const spanQt = maxQt - minQt;
    const spanOctaves = parseFloat((spanQt / 24).toFixed(2));
    const maxAllowedQt = 48; // exactly 2 octaves

    const valid = spanQt <= maxAllowedQt;

    return {
      valid,
      spanQuarterTones: spanQt,
      spanOctaves,
      lowestPitch: lowest,
      highestPitch: highest,
      message: valid
        ? `Span: ${spanOctaves} octaves (${spanQt * 50}¢). Within 2-octave limit.`
        : `Span exceeds 2 octaves! Current span is ${spanOctaves} octaves (${spanQt * 50}¢). Maximum is 2.0 octaves.`
    };
  }

  /**
   * Generates a 2-octave palette of canonical violin pitches from G3 to G5.
   */
  public static getTwoOctavePalette(): ArabicPitch[] {
    const palette: ArabicPitch[] = [];
    // G3 = 3 * 24 + 14 = 86
    // G5 = 5 * 24 + 14 = 134 (48 quarter-tones = 2 full octaves)
    const startQt = 86; // G3
    const endQt = 134;   // G5

    for (let qt = startQt; qt <= endQt; qt++) {
      palette.push(ArabicPitch.fromQuarterToneIndex(qt));
    }
    return palette;
  }
}
