// src/theory/jins-detector.ts
import { ArabicPitch } from '../core/pitch';
import { Jins, type JinsDefinition, AjnasLibrary } from './jins';

export interface JinsCandidateScore {
  readonly jins: Jins;
  readonly definition: JinsDefinition;
  readonly root: ArabicPitch;
  readonly score: number;
  readonly confidence: number; // 0 to 100%
  readonly matchedPitches: ArabicPitch[];
  readonly unmatchedPitches: ArabicPitch[];
  readonly reasons: string[];
}

export interface JinsDetectionResult {
  readonly jins: Jins;
  readonly definition: JinsDefinition;
  readonly root: ArabicPitch;
  readonly confidence: number;
  readonly score: number;
  readonly matchedPitches: ArabicPitch[];
  readonly unmatchedPitches: ArabicPitch[];
  readonly tonicCandidateReasons: string[];
  readonly rankedAlternatives: JinsCandidateScore[];
}

export interface JinsDetectionOptions {
  readonly allowedAjnas?: JinsDefinition[];
  readonly candidateRoots?: ArabicPitch[];
  readonly cadenceWeight?: number;
}

export class JinsDetector {
  public static identify(
    phrase: ArabicPitch[],
    options?: JinsDetectionOptions
  ): JinsDetectionResult | null {
    if (!phrase || phrase.length === 0) {
      return null;
    }

    const ranked = this.rankCandidates(phrase, options);
    if (ranked.length === 0) {
      return null;
    }

    const top = ranked[0];
    return {
      jins: top.jins,
      definition: top.definition,
      root: top.root,
      confidence: top.confidence,
      score: top.score,
      matchedPitches: top.matchedPitches,
      unmatchedPitches: top.unmatchedPitches,
      tonicCandidateReasons: top.reasons,
      rankedAlternatives: ranked.slice(1, 5)
    };
  }

  public static rankCandidates(
    phrase: ArabicPitch[],
    options?: JinsDetectionOptions
  ): JinsCandidateScore[] {
    if (!phrase || phrase.length === 0) {
      return [];
    }

    const ajnasDefs = options?.allowedAjnas ?? AjnasLibrary.getAllDefinitions();
    const candidateRoots = options?.candidateRoots ?? this.deduceCandidateRoots(phrase);
    const cadenceWeight = options?.cadenceWeight ?? 3.0;

    const firstPitch = phrase[0];
    const lastPitch = phrase[phrase.length - 1];

    const results: JinsCandidateScore[] = [];

    for (const root of candidateRoots) {
      for (const def of ajnasDefs) {
        let jins: Jins;
        try {
          jins = new Jins(def, root);
        } catch {
          continue;
        }

        const jinsPitches = jins.getPitches();
        const jinsQtIndices = jinsPitches.map(p => p.toQuarterToneIndex());
        const jinsPitchClasses = jinsPitches.map(p => ((p.toQuarterToneIndex() % 24) + 24) % 24);
        const jinsRootQt = root.toQuarterToneIndex();
        const jinsTopQt = jins.getTopPitch().toQuarterToneIndex();

        let rawScore = 0;
        const reasons: string[] = [];
        const matchedPitches: ArabicPitch[] = [];
        const unmatchedPitches: ArabicPitch[] = [];

        let matchedWeight = 0;
        let totalWeight = 0;

        for (let i = 0; i < phrase.length; i++) {
          const p = phrase[i];
          const pQt = p.toQuarterToneIndex();
          const pClass = ((pQt % 24) + 24) % 24;

          let w = 1.0;
          if (i === phrase.length - 1) {
            w = cadenceWeight;
          } else if (i === 0) {
            w = 1.8;
          } else if (i === phrase.length - 2) {
            w = 1.4;
          }
          totalWeight += w;

          const exactMatch = jinsQtIndices.includes(pQt);
          const classMatch = jinsPitchClasses.includes(pClass);

          if (exactMatch) {
            matchedWeight += w;
            matchedPitches.push(p);
            rawScore += 10 * w;
          } else if (classMatch) {
            matchedWeight += w * 0.8;
            matchedPitches.push(p);
            rawScore += 7 * w;
          } else {
            const diffBelowRoot = jinsRootQt - pQt;
            if (diffBelowRoot === 2 || diffBelowRoot === 3 || diffBelowRoot === 4) {
              matchedWeight += w * 0.5;
              rawScore += 2 * w;
              matchedPitches.push(p);
            } else {
              unmatchedPitches.push(p);
              rawScore -= 8 * w;
            }
          }
        }

        const coverageRatio = totalWeight > 0 ? matchedWeight / totalWeight : 0;
        if (coverageRatio >= 0.95) {
          rawScore += 20;
          reasons.push(`100% pitch compliance with ${def.name} scale degrees`);
        } else if (coverageRatio >= 0.75) {
          rawScore += 10;
          reasons.push(`High pitch compliance (${Math.round(coverageRatio * 100)}%) with ${def.name}`);
        } else if (coverageRatio < 0.5) {
          rawScore -= 25;
        }

        if (lastPitch.equals(root)) {
          rawScore += 35;
          reasons.push(`Cadential resolution directly on tonic ${root.toScientificString()}`);
        } else if (((lastPitch.toQuarterToneIndex() % 24) + 24) % 24 === ((jinsRootQt % 24) + 24) % 24) {
          rawScore += 25;
          reasons.push(`Cadence resolves to octave-equivalent tonic ${root.toScientificString()}`);
        } else if (lastPitch.equals(jins.getTopPitch())) {
          rawScore += 14;
          reasons.push(`Cadence rests on Ghammaz pivot ${jins.getTopPitch().toScientificString()} (Half-Cadence)`);
        }

        if (firstPitch.equals(root)) {
          rawScore += 12;
          reasons.push(`Phrase opens directly on tonic root ${root.toScientificString()}`);
        }

        const phraseIntervals: number[] = [];
        for (let i = 0; i < phrase.length - 1; i++) {
          phraseIntervals.push(phrase[i + 1].toQuarterToneIndex() - phrase[i].toQuarterToneIndex());
        }

        const hasAugmented2nd = phraseIntervals.some(step => Math.abs(step) === 6);
        const hasDegree2And3 = 
          jinsPitches.length > 2 &&
          phrase.some(p => p.equals(jinsPitches[1])) && 
          phrase.some(p => p.equals(jinsPitches[2]));

        if (def.id === 'hijaz') {
          if (hasAugmented2nd) {
            rawScore += 35;
            reasons.push(`Signature augmented 2nd (300¢ step) detected`);
          }
          if (hasDegree2And3) {
            rawScore += 20;
            reasons.push(`Features Hijaz characteristic minor 2nd + augmented 2nd degrees`);
          }
        } else if (def.id === 'nikriz') {
          if (hasAugmented2nd) {
            rawScore += 25;
            reasons.push(`Features Nikriz augmented 2nd interval between 3rd and 4th degrees`);
          }
        } else if (hasAugmented2nd) {
          rawScore -= 30;
        }

        const hasNeutral2ndFromRoot = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 3);
        if (def.id === 'bayati') {
          if (hasNeutral2ndFromRoot) {
            rawScore += 28;
            reasons.push(`Signature neutral 2nd (+150¢ above root) matches Bayati`);
          }
        } else if (def.id === 'saba') {
          if (hasNeutral2ndFromRoot) {
            rawScore += 20;
          }
          const hasNarrow4th = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 8);
          if (hasNarrow4th) {
            rawScore += 35;
            reasons.push(`Narrow 400¢ diminished 4th unique to Jins Saba`);
          }
        }

        const hasNeutral3rdFromRoot = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 7);
        const hasMajor2ndFromRoot = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 4);
        if (def.id === 'rast') {
          if (hasNeutral3rdFromRoot && hasMajor2ndFromRoot) {
            rawScore += 32;
            reasons.push(`Authentic Rast signature: major 2nd (200¢) + neutral 3rd (350¢)`);
          } else if (hasNeutral3rdFromRoot) {
            rawScore += 18;
            reasons.push(`Neutral 3rd (350¢) characteristic degree present`);
          }
        }

        if (def.id === 'sikah') {
          const isQuarterToneRoot = root.accidental === '𝄳' || root.accidental === '𝄲';
          if (isQuarterToneRoot) {
            rawScore += 25;
            reasons.push(`Root grounded on authentic microtonal neutral degree (${root.toScientificString()})`);
          }
          const hasNeutralSteps = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 3) &&
                                  phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 7);
          if (hasNeutralSteps) {
            rawScore += 25;
            reasons.push(`Sikah trichord steps [3, 4] confirmed`);
          }
        }

        if (def.id === 'kurd') {
          const hasMinor2nd = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 2);
          const hasMinor3rd = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 6);
          if (hasMinor2nd && hasMinor3rd && !hasAugmented2nd) {
            rawScore += 26;
            reasons.push(`Kurd Phrygian minor 2nd (100¢) + minor 3rd (300¢) profile`);
          }
        }

        if (def.id === 'nahawand') {
          const hasMajor2nd = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 4);
          const hasMinor3rd = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 6);
          if (hasMajor2nd && hasMinor3rd && !hasAugmented2nd) {
            rawScore += 24;
            reasons.push(`Nahawand natural minor tetrachord [4, 2, 4] profile`);
          }
        }

        if (def.id === 'ajam') {
          const hasMajor3rd = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 8);
          const hasMajor2nd = phrase.some(p => p.toQuarterToneIndex() - jinsRootQt === 4);
          if (hasMajor3rd && hasMajor2nd) {
            rawScore += 26;
            reasons.push(`Major third (400¢) diatonic profile matches Jins Ajam`);
          }
        }

        const distinctMatches = jinsPitches.filter(jp => 
          phrase.some(p => p.equals(jp) || ((p.toQuarterToneIndex() % 24) + 24) % 24 === ((jp.toQuarterToneIndex() % 24) + 24) % 24)
        ).length;
        const completeness = distinctMatches / jinsPitches.length;
        rawScore += completeness * 20;

        if (def.defaultRoot.equals(root)) {
          rawScore += 5;
        }

        const phraseMin = Math.min(...phrase.map(p => p.toQuarterToneIndex()));
        const phraseMax = Math.max(...phrase.map(p => p.toQuarterToneIndex()));
        if (phraseMin < jinsRootQt - 4) {
          rawScore -= 12;
        }
        if (phraseMax > jinsTopQt + 6) {
          rawScore -= 6;
        }

        results.push({
          jins,
          definition: def,
          root,
          score: Math.max(0, Math.round(rawScore)),
          confidence: 0,
          matchedPitches,
          unmatchedPitches,
          reasons: reasons.length > 0 ? reasons : [`Pitches conform partially to ${def.name}`]
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const viable = results.filter(r => r.score > 20);
    const listToProcess = viable.length > 0 ? viable : results.slice(0, 5);

    const topScore = listToProcess[0]?.score ?? 1;
    const secondScore = listToProcess[1]?.score ?? 0;

    return listToProcess.map((item, idx) => {
      let confidence: number;
      if (idx === 0) {
        const scoreRatio = item.score / (item.score + secondScore + 20);
        confidence = Math.min(99, Math.max(45, Math.round(scoreRatio * 130)));
      } else {
        const ratio = item.score / (topScore || 1);
        confidence = Math.min(88, Math.max(10, Math.round(ratio * 75)));
      }
      return {
        ...item,
        confidence
      };
    });
  }

  private static deduceCandidateRoots(phrase: ArabicPitch[]): ArabicPitch[] {
    const candidateMap = new Map<number, ArabicPitch>();

    for (const p of phrase) {
      candidateMap.set(p.toQuarterToneIndex(), p);
    }

    const minQt = Math.min(...phrase.map(p => p.toQuarterToneIndex()));
    const maxQt = Math.max(...phrase.map(p => p.toQuarterToneIndex()));
    for (let delta = -4; delta <= 0; delta++) {
      const candidateIndex = minQt + delta;
      if (!candidateMap.has(candidateIndex)) {
        candidateMap.set(candidateIndex, ArabicPitch.fromQuarterToneIndex(candidateIndex));
      }
    }

    const activeOctave = phrase[0]?.octave ?? 4;
    const canonicalRoots: ArabicPitch[] = [
      new ArabicPitch('C', '♮', activeOctave),
      new ArabicPitch('D', '♮', activeOctave),
      new ArabicPitch('E', '𝄳', activeOctave),
      new ArabicPitch('F', '♮', activeOctave),
      new ArabicPitch('G', '♮', activeOctave),
      new ArabicPitch('B', '𝄳', activeOctave - 1),
      new ArabicPitch('B', '♭', activeOctave)
    ];

    for (const cr of canonicalRoots) {
      const qt = cr.toQuarterToneIndex();
      if (qt >= minQt - 6 && qt <= maxQt + 2) {
        if (!candidateMap.has(qt)) {
          candidateMap.set(qt, cr);
        }
      }
    }

    return Array.from(candidateMap.values());
  }
}

export function identifyJins(
  phrase: ArabicPitch[],
  options?: JinsDetectionOptions
): JinsDetectionResult | null {
  return JinsDetector.identify(phrase, options);
}
