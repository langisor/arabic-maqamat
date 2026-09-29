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

      case 'muhayyar':
        return {
          maqamId: 'muhayyar',
          name: 'Traditional Sayr of Maqam Muhayyar',
          description: 'A descending octave-first sayr (مسار هابط / المحيّر). Starts directly at the upper octave (Muhayyar D5), utilizes Jins Rast on G4 in the upper ascent, then cascades down through lower Bayati ajnas to the Qarar on D4.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Octave Register', pitch: new ArabicPitch('D', '♮', 5), noteName: 'Muhayyar', durationBeats: 3, annotation: 'Opening firmly on high octave apex (Muhayyar D5)' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Octave Register', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 1.5, annotation: 'Stepwise lower neighbor' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Octave Register', pitch: new ArabicPitch('D', '♮', 5), noteName: 'Muhayyar', durationBeats: 2, annotation: 'Reasserting Muhayyar octave prominence' },

            { phase: '2_AscendToGhammaz', phaseLabel: '2. Upper Jins Rast Branch', pitch: new ArabicPitch('B', '𝄳', 4), noteName: 'Awj', durationBeats: 2, annotation: 'Entering Jins Rast on G4 with neutral 7th (Awj B𝄳4)' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Upper Jins Rast Branch', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Stepwise glide through Husayni' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Upper Jins Rast Branch', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 3, annotation: 'Arrival at Ghammaz pivot (Nawa G4)' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Register Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Ascending turn' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Register Exploration', pitch: new ArabicPitch('B', '𝄳', 4), noteName: 'Awj', durationBeats: 1.5, annotation: 'Awj neutral coloration' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Register Exploration', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 2, annotation: 'Approaching octave peak' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Register Exploration', pitch: new ArabicPitch('D', '♮', 5), noteName: 'Muhayyar', durationBeats: 2.5, annotation: 'Climactic high point' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Register Exploration', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 1, annotation: 'Turning toward main descent' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Register Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1.5, annotation: 'Transitioning to Bayati descent with B♭4' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Register Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Downward scalar movement' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Register Exploration', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 2, annotation: 'Resting on Ghammaz G4' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 2, annotation: 'Entering lower Jins Bayati' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 2, annotation: 'Characteristic neutral 2nd emotional weight' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1, annotation: 'Cadential breath' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 1.5, annotation: 'Leading downward step' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 4, annotation: 'Final resolute resolution on Qarar Dukah (D4)' }
          ]
        };

      case 'kurd':
        return {
          maqamId: 'kurd',
          name: 'Traditional Sayr of Maqam Kurd',
          description: 'Grounded Phrygian mood on Dukah (D4) with characteristic minor 2nd (E♭4), ascending to Ghammaz Nawa (G4), exploring upper Nahawand, and descending through an intimate half-step cadence.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 2, annotation: 'Grounding on tonic Dukah D4' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Kurd', durationBeats: 1.5, annotation: 'Immediate intimate half-step minor 2nd' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 2, annotation: 'Reaffirming Dukah root' },

            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Kurd', durationBeats: 1, annotation: 'Scalar climb' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Passing through 3rd degree' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 3, annotation: 'Arrival on Ghammaz pivot (Nawa G4)' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Entering upper Jins Nahawand' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1.5, annotation: 'Minor 3rd of upper Nahawand' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 2, annotation: 'Apex of upper tetrachord' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1, annotation: 'Beginning descent' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1, annotation: 'Smooth step back' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 2, annotation: 'Pivot rest on Ghammaz' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Descent down lower Jins Kurd' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Kurd', durationBeats: 2, annotation: 'Lingering on expressive minor 2nd' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1, annotation: 'Pre-cadence breath' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Kurd', durationBeats: 1.5, annotation: 'Gentle leading semitone' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 4, annotation: 'Intimate resolution on Qarar Dukah (D4)' }
          ]
        };

      case 'nahawand':
        return {
          maqamId: 'nahawand',
          name: 'Traditional Sayr of Maqam Nahawand',
          description: 'Noble natural minor character on Rast (C4), rising through Nahawand to Ghammaz Nawa (G4), exploring upper Kurd and Hijaz branches, then resolving with classical clarity.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('C', '♮', 4), noteName: 'Rast', durationBeats: 2, annotation: 'Grounded start on C4' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1.5, annotation: 'Major 2nd step' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Busalik', durationBeats: 2, annotation: 'Characteristic minor 3rd (E♭4)' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('C', '♮', 4), noteName: 'Rast', durationBeats: 2, annotation: 'Return to tonic foundation' },

            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1, annotation: 'Ascending motion' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Busalik', durationBeats: 1, annotation: 'Through minor third' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Through perfect 4th' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 3, annotation: 'Arrival at Ghammaz pivot (Nawa G4)' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♭', 4), noteName: 'Hisar', durationBeats: 1.5, annotation: 'Entering upper Kurd on G4' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1.5, annotation: 'Minor 7th inflection' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 2, annotation: 'Octave peak Kirdan' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1, annotation: 'Beginning descent' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♭', 4), noteName: 'Hisar', durationBeats: 1, annotation: 'Smooth step back' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 2, annotation: 'Half-cadence on Ghammaz' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Entering lower Nahawand' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Busalik', durationBeats: 1.5, annotation: 'Minor third inflection' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1.5, annotation: 'Penultimate step' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Busalik', durationBeats: 1, annotation: 'Graceful ornament' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1, annotation: 'Leading downward step' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('C', '♮', 4), noteName: 'Rast', durationBeats: 4, annotation: 'Clear Nahawand resolution on Qarar C4' }
          ]
        };

      case 'farahfaza':
        return {
          maqamId: 'farahfaza',
          name: 'Traditional Sayr of Maqam Farahfaza',
          description: 'Transposition of Maqam Nahawand to tonic G (G4), climbing to Ghammaz D5, exploring upper Kurd/Hijaz on D5, and resolving with regal Nahawand cadence on G4.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 2, annotation: 'Grounded start on tonic Nawa G4' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Stepwise touch' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 2, annotation: 'Characteristic minor 3rd (B♭4)' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 2, annotation: 'Return to G4 home' },

            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1, annotation: 'Ascending motion' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 1.5, annotation: 'Through 4th degree' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('D', '♮', 5), noteName: 'Muhayyar', durationBeats: 3, annotation: 'Arrival at Ghammaz pivot (D5)' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('E', '♭', 5), noteName: 'Busalik', durationBeats: 1.5, annotation: 'Upper Kurd minor 2nd' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('F', '♮', 5), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Climb to upper 7th' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('G', '♮', 5), noteName: 'Ramal Tutu', durationBeats: 2, annotation: 'Octave peak G5' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('F', '♮', 5), noteName: 'Jiharkah', durationBeats: 1, annotation: 'Beginning descent' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('E', '♭', 5), noteName: 'Busalik', durationBeats: 1, annotation: 'Smooth step' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('D', '♮', 5), noteName: 'Muhayyar', durationBeats: 2, annotation: 'Rest on Ghammaz D5' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 1.5, annotation: 'Entering lower Nahawand' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1.5, annotation: 'Minor third inflection' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Penultimate approach' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1, annotation: 'Graceful ornament' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1, annotation: 'Leading downward step' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 4, annotation: 'Farahfaza resolution on Qarar G4' }
          ]
        };

      case 'saba':
        return {
          maqamId: 'saba',
          name: 'Traditional Sayr of Maqam Saba',
          description: 'Profoundly expressive mourning on Dukah (D4), sliding into overlapping Hijaz on F4 (F4 - G♭4 - A4 - B♭4), reaching high flat-octave D♭5, and resolving with classic Saba heartache.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 2, annotation: 'Solemn start on Dukah D4' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 2, annotation: 'Narrow quarter-tone 2nd (yearning)' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Minor 3rd ceiling of lower Saba' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 2, annotation: 'Returning inward to D4' },

            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend & Overlap to Hijaz', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 1, annotation: 'Climbing up' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend & Overlap to Hijaz', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 2, annotation: 'Ghammaz pivot & start of overlapping Jins Hijaz' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend & Overlap to Hijaz', pitch: new ArabicPitch('G', '♭', 4), noteName: 'Saba Diminished', durationBeats: 2, annotation: 'Striking G♭4 of Hijaz cell' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend & Overlap to Hijaz', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 2.5, annotation: 'Augmented 2nd leap to A4' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Area & Flat Octave', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1.5, annotation: 'Entering upper Jins Ajam on B♭4' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Area & Flat Octave', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 1.5, annotation: 'Climb toward apex' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Area & Flat Octave', pitch: new ArabicPitch('D', '♭', 5), noteName: 'Saba Flat Octave', durationBeats: 3, annotation: 'Heart-wrenching flat octave apex (D♭5)' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Area & Flat Octave', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 1.5, annotation: 'Beginning descent' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Area & Flat Octave', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam', durationBeats: 1.5, annotation: 'Upper Ajam retreat' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Area & Flat Octave', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 2, annotation: 'Re-entering Hijaz on F4' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('G', '♭', 4), noteName: 'Saba Diminished', durationBeats: 1.5, annotation: 'Descending through augmented 2nd' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'At Ghammaz overlap' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 2, annotation: 'Saba neutral 2nd heartache' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1, annotation: 'Final cadential breath' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 1.5, annotation: 'Leading downward step' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 4, annotation: 'Definitive Saba resolution on Qarar Dukah (D4)' }
          ]
        };

      case 'sikah':
        return {
          maqamId: 'sikah',
          name: 'Traditional Sayr of Maqam Sikah',
          description: 'Contemplative mood rooted on quarter-tone Sikah (E𝄳4), pivoting around Ghammaz Nawa (G4), climbing through upper Rast, and cascading with traditional Sikah cadence.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 3, annotation: 'Centering on quarter-tone tonic Sikah E𝄳4' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Gentle step upward' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 2, annotation: 'Reasserting Sikah base' },

            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1, annotation: 'Ascending motion' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 3, annotation: 'Arrival at Ghammaz pivot (Nawa G4)' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Entering upper Jins Rast on G4' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '𝄳', 4), noteName: 'Awj', durationBeats: 2, annotation: 'Neutral 7th degree (Awj B𝄳4)' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('C', '♮', 5), noteName: 'Kirdan', durationBeats: 2, annotation: 'Upper Rast peak' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '𝄳', 4), noteName: 'Awj', durationBeats: 1, annotation: 'Descending turn' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1, annotation: 'Stepwise retreat' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 2, annotation: 'Half-cadence on Ghammaz' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Lower trichord re-entry' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 2, annotation: 'Contemplative Sikah color' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah', durationBeats: 1, annotation: 'Stepwise ornamentation' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1.5, annotation: 'Sub-tonic approach (D4)' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('E', '𝄳', 4), noteName: 'Sikah', durationBeats: 4, annotation: 'Traditional Sikah resolution on E𝄳4' }
          ]
        };

      case 'ajam':
        return {
          maqamId: 'ajam',
          name: 'Traditional Sayr of Maqam ‘Ajam',
          description: 'Bright and triumphant major character on B♭3/C4, ascending to Ghammaz (F4), exploring upper ‘Ajam and Nahawand branches, and resolving with majestic clarity.',
          steps: [
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('B', '♭', 3), noteName: 'Ajam Ushayran', durationBeats: 2, annotation: 'Foundational major root on B♭3' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1.5, annotation: 'Major 3rd triad step' },
            { phase: '1_EstablishTonic', phaseLabel: '1. Establish Tonic', pitch: new ArabicPitch('B', '♭', 3), noteName: 'Ajam Ushayran', durationBeats: 2, annotation: 'Reasserting tonic ground' },

            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('C', '♮', 4), noteName: 'Rast', durationBeats: 1, annotation: 'Climb through 2nd degree' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1, annotation: 'Through 3rd degree' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Through 4th degree' },
            { phase: '2_AscendToGhammaz', phaseLabel: '2. Ascend to Ghammaz', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah Upper', durationBeats: 3, annotation: 'Arrival at Ghammaz pivot (F4)' },

            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 1.5, annotation: 'Upper Jins Ajam on F4' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1.5, annotation: 'Major 6th' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('B', '♭', 4), noteName: 'Ajam Octave', durationBeats: 2, annotation: 'Triumphant octave B♭4' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('A', '♮', 4), noteName: 'Husayni', durationBeats: 1, annotation: 'Beginning descent' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('G', '♮', 4), noteName: 'Nawa', durationBeats: 1, annotation: 'Smooth step back' },
            { phase: '3_UpperExploration_Or_Modulation', phaseLabel: '3. Upper Exploration', pitch: new ArabicPitch('F', '♮', 4), noteName: 'Jiharkah Upper', durationBeats: 2, annotation: 'Rest on Ghammaz F4' },

            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('E', '♭', 4), noteName: 'Jiharkah', durationBeats: 1.5, annotation: 'Descent down lower pentachord' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1.5, annotation: 'Major 3rd' },
            { phase: '4_DescentReturn', phaseLabel: '4. Descent Return', pitch: new ArabicPitch('C', '♮', 4), noteName: 'Rast', durationBeats: 1.5, annotation: 'Penultimate 2nd' },

            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('D', '♮', 4), noteName: 'Dukah', durationBeats: 1, annotation: 'Pre-cadence flourish' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('C', '♮', 4), noteName: 'Rast', durationBeats: 1, annotation: 'Leading downward step' },
            { phase: '5_Qafla', phaseLabel: '5. Cadential Qafla', pitch: new ArabicPitch('B', '♭', 3), noteName: 'Ajam Ushayran', durationBeats: 4, annotation: 'Majestic major resolution on B♭3' }
          ]
        };

      default:
        // Default to Rast if not specific
        return this.getSayrForMaqam('rast');
    }
  }
}
