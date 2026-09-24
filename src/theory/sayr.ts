// src/theory/sayr.ts
import { ArabicPitch } from '../core/pitch';
import { Maqam } from './maqam';

export type SayrPhase = 
  | '1_EstablishTonic'
  | '2_AscendToGhammaz'
  | '3_UpperExploration_Or_Modulation'
  | '4_DescentReturn'
  | '5_Qafla';

export type ModulationType = 
  | 'None'
  | 'Tanjees' // Local, passing color shift
  | 'Intiqal'; // Structural change of tonal center

export interface ModulationAnalysis {
  readonly type: ModulationType;
  readonly isSameFamily: boolean;
  readonly description: string;
}

export interface SayrStep {
  readonly phase: SayrPhase;
  readonly phaseLabel: string;
  readonly pitch: ArabicPitch;
  readonly noteName: string;
  readonly durationBeats: number;
  readonly annotation: string;
  readonly isRestOrPause?: boolean;
}

export interface SayrTemplate {
  readonly maqamId: string;
  readonly name: string;
  readonly description: string;
  readonly steps: SayrStep[];
}

export class SayrEngine {
  /**
   * Evaluates modulation between current active Maqam and target Maqam.
   */
  public static analyzeModulation(current: Maqam, target: Maqam, durationMeasures: number): ModulationAnalysis {
    if (current.id === target.id) {
      return { type: 'None', isSameFamily: true, description: 'No modulation detected — melody remains anchored in home maqam.' };
    }

    const isSameFamily = current.family !== 'None' && current.family === target.family;
    // Transient borrowing (< 2 measures) is treated as Tanjees
    const isTransient = durationMeasures <= 2;

    if (isTransient) {
      return {
        type: 'Tanjees',
        isSameFamily,
        description: `Tanjees (تنجيس): Temporary color borrowing of ${target.name} without altering foundational lower jins.`
      };
    }

    return {
      type: 'Intiqal',
      isSameFamily,
      description: isSameFamily
        ? `Intiqal (انتقال ضمن الفصيلة): Smooth modulation within ${current.family} family, swapping upper jins while lower jins anchors home.`
        : `Intiqal (انتقال بين الفصائل): Major structural shift changing foundational lower jins from ${current.family} to ${target.family}.`
    };
  }

  /**
   * Validates whether a melodic fragment qualifies as an idiomatic Qafla (cadence).
   */
  public static isIdiomaticQafla(phrase: ArabicPitch[], maqam: Maqam): { isQafla: boolean; reason: string; cadenceType: 'full' | 'half' | 'none' } {
    if (phrase.length < 2) {
      return { isQafla: false, reason: 'Phrase too short for cadential formula (requires at least 2 notes)', cadenceType: 'none' };
    }

    const finalPitch = phrase[phrase.length - 1];
    const penultimatePitch = phrase[phrase.length - 2];
    const tonic = maqam.getTonic();
    const ghammaz = maqam.getGhammaz();

    // Must resolve on tonic (full cadence) or Ghammaz (half cadence)
    const resolvesToTonic = finalPitch.equals(tonic);
    const resolvesToGhammaz = finalPitch.equals(ghammaz);

    if (!resolvesToTonic && !resolvesToGhammaz) {
      return { 
        isQafla: false, 
        reason: `Final pitch (${finalPitch.toString()}) does not resolve to tonic (${tonic.toString()}) or Ghammaz (${ghammaz.toString()})`, 
        cadenceType: 'none' 
      };
    }

    // Stepwise descent test (Module 4.4)
    const diffQt = penultimatePitch.diffQuarterTones(finalPitch);
    const isStepwiseDescent = diffQt <= -2 && diffQt >= -4; // Step downward by 1/2 tone to whole tone
    const isStepwiseApproach = Math.abs(diffQt) >= 2 && Math.abs(diffQt) <= 4;

    if (isStepwiseDescent) {
      return {
        isQafla: true,
        reason: resolvesToTonic 
          ? `Authentic full Qafla: Idiomatic stepwise descent directly resolving into tonic ${tonic.toScientificString()} (قرار)`
          : `Authentic half-Qafla: Idiomatic stepwise arrival resting firmly on Ghammaz ${ghammaz.toScientificString()} (غمّاز)`,
        cadenceType: resolvesToTonic ? 'full' : 'half'
      };
    } else if (isStepwiseApproach) {
      return {
        isQafla: true,
        reason: resolvesToTonic
          ? `Ascending approach to tonic ${tonic.toScientificString()}; acceptable Qafla variant.`
          : `Ascending approach resting on Ghammaz ${ghammaz.toScientificString()}.`,
        cadenceType: resolvesToTonic ? 'full' : 'half'
      };
    }

    return { 
      isQafla: false, 
      reason: `Arrival had a leap of ${Math.abs(diffQt * 50)} cents instead of a stepwise scalar descent.`, 
      cadenceType: 'none' 
    };
  }

  /**
   * Pre-composed authentic 5-phase Sayr curves for core Maqamat
   */
  public static getSayrForMaqam(maqamId: string): SayrTemplate | undefined {
    switch (maqamId) {
      case 'rast':
        return {
          maqamId: 'rast',
          name: 'Traditional Sayr of Maqam Rast',
          description: 'Noble ascent starting on Rast (C4), circling around Sikah (E𝄳4), crowning at Nawa (G4), exploring upper Rast on Nawa, and descending to a grounded C4 Qafla.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('C', '♮', 4), noteName: 'Rast', durationBeats: 2, annotation: 'Grounded start on Qarar (Tonic C4)' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1, annotation: 'Stepwise touch to D4' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 2, annotation: 'Lingering on neutral 3rd (350¢)' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('C', '♮', 4), noteName: 'Rast', durationBeats: 2, annotation: 'Reaffirmation of Rast base' },
            
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1, annotation: 'Ascending motion begins' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 1, annotation: 'Neutral third springboard' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1, annotation: 'Passing 4th degree' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 3, annotation: 'Arrival at Ghammaz (Nawa G4)' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1, annotation: 'Entering upper Jins Rast' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '𝄳', 4), noteName: 'Awj', durationBeats: 2, annotation: 'Neutral 7th degree (Awj)' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 2, annotation: 'Peak octave apex (Kirdan C5)' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '𝄳', 4), noteName: 'Awj', durationBeats: 1, annotation: 'Gentle downward turn' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1, annotation: 'Stepwise retreat' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 2, annotation: 'Half-cadence pause on Ghammaz' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1, annotation: 'Cascading descent down lower Jins' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 1.5, annotation: 'Expressive ornament on Sikah' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1.5, annotation: 'Penultimate approach degree' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 1, annotation: 'Stepwise lead-in' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1, annotation: 'Leading downward step' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('C', '♮', 4), noteName: 'Rast', durationBeats: 4, annotation: 'Definitive tonic resolution (Qarar Rast)' }
          ]
        };

      case 'bayati':
        return {
          maqamId: 'bayati',
          name: 'Traditional Sayr of Maqam Bayati',
          description: 'Yearning contemplation starting on Dukah (D4) with characteristic neutral 2nd (E𝄳4), ascending to Nawa (G4), exploring upper Nahawand, and descending through a classic Bayati Qafla.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 2, annotation: 'Opening on Dukah D4' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 2, annotation: 'Immediate neutral 2nd emotional touch' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 2, annotation: 'Return to tonic root' },

            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 1, annotation: 'Upward push' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Subdominant pivot' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 3, annotation: 'Ghammaz arrival (G4)' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1, annotation: 'Nahawand on Nawa' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1.5, annotation: 'Flat 6th inflection' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 2, annotation: 'Upper minor 7th' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('D', '♮', 5), noteName: 'Muhayyar', durationBeats: 2, annotation: 'Apex Muhayyar octave' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 1, annotation: 'Descent initiates' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1, annotation: 'Smooth step back' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Stepwise descent' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 2, annotation: 'Midpoint pause on Ghammaz' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Lower tetrachord re-entry' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 1.5, annotation: 'Expressive neutral 2nd shake' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1, annotation: 'Pre-cadential breath' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 1, annotation: 'Stepwise downward cadence' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 4, annotation: 'Resolute Bayati resolution (قرار دوكاه)' }
          ]
        };

      case 'hijaz':
        return {
          maqamId: 'hijaz',
          name: 'Traditional Sayr of Maqam Hijaz',
          description: 'Dramatic character marked by the augmented 2nd (E♭4 to F♯4) in lower Jins Hijaz, reaching Nawa (G4), exploring upper register and cascading with fiery resolution.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 2, annotation: 'Dukah root foundation' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Kurd', durationBeats: 1.5, annotation: 'Half-step minor 2nd' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('F', '♯', 4), noteName: 'Hijaz', durationBeats: 2, annotation: 'Striking augmented 2nd stretch (300¢)' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Kurd', durationBeats: 1, annotation: 'Returning inward' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 2, annotation: 'Firm Dukah anchor' },

            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('F', '♯', 4), noteName: 'Hijaz', durationBeats: 1.5, annotation: 'Leaping to F♯4' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 3, annotation: 'Ghammaz landing on Nawa G4' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Upper Nahawand motion' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1.5, annotation: 'Upper flat 6th' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 2, annotation: 'High tension point' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1, annotation: 'Upper descent' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1, annotation: 'Smooth step' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 2, annotation: 'Pause at Ghammaz' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('F', '♯', 4), noteName: 'Hijaz', durationBeats: 1.5, annotation: 'Entering the augmented 2nd gap' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Kurd', durationBeats: 1.5, annotation: 'Contraction to half-step' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('F', '♯', 4), noteName: 'Hijaz', durationBeats: 1, annotation: 'Dramatic cadential ornament' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Kurd', durationBeats: 1, annotation: 'Final leading step' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 4, annotation: 'Hijaz final resolution (قرار دوكاه)' }
          ]
        };

      default:
        // Default to Rast if not specific
        return this.getSayrForMaqam('rast');
    }
  }
}
