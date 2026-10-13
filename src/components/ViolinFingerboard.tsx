// src/components/ViolinFingerboard.tsx
import React, { useState, useMemo } from 'react';
import { ArabicPitch, DiatonicBase, MicrotonalAccidental } from '../core/pitch';
import { Maqam, MaqamatCatalogue } from '../theory/maqam';
import { ArabicNoteSpine } from '../core/note-spine';
import { MicrotonalAudioEngine, TimbreType } from '../audio/microtonal-audio';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Volume2,
  Sparkles,
  RotateCcw,
  Info,
  CheckCircle2,
  MoveHorizontal,
  Music,
} from 'lucide-react';

export type AccidentalNaming = 'sharps' | 'flats' | 'arabic';
export type PlayMode = 'bow' | 'pizzicato';
export type HandPosition = '1st' | '2nd' | '3rd' | '4th' | 'all';
export type ScaleFilterMode = 'all-notes' | 'maqam-only';
export type ViolinTuningPreset = 'arabic' | 'western';

export interface BoardNote {
  id: string;
  stringIndex: number; // 0 to 3 (IV to I)
  stringName: string;  // 'IV', 'III', 'II', 'I'
  letter: string;      // 'G', 'D', 'A', 'E'
  openNote: string;
  noteKey: string;     // e.g. "D4", "E𝄳4"
  pitch: ArabicPitch;
  sharpName: string;
  flatName: string;
  halfFlatName: string;
  arabicName: string;
  arabicShort: string;
  semitoneIndex: number; // 0 to 12
  isQuarterTone: boolean;
  baseMidi: number;
  qtIndex: number;
  x: number;
  y: number;
  fingerTape?: 'open' | '1st' | '2nd-neutral' | '2nd' | '3rd' | '4th' | 'other';
  inPositionRange: boolean;
  isDuplicateInPosition: boolean;
  fingerNumber: number; // 0 (open), 1, 2, 3, 4
}

interface Props {
  scalePitches?: ArabicPitch[];
  activePitchIndex?: number | null;
  timbre?: TimbreType;
  currentMaqam?: Maqam;
  violinTuning?: ViolinTuningPreset;
  onViolinTuningChange?: (tuning: ViolinTuningPreset) => void;
}

// Enharmonic lookup dictionary for spelling equivalences
const ENHARMONIC_MAP: Record<string, string> = {
  'c#': 'db',
  'db': 'c#',
  'd#': 'eb',
  'eb': 'd#',
  'f#': 'gb',
  'gb': 'f#',
  'g#': 'ab',
  'ab': 'g#',
  'a#': 'bb',
  'bb': 'a#',
};

// Check if two note representations are equivalent
export const areNotesEquivalent = (n1?: string | null, n2?: string | null): boolean => {
  if (!n1 || !n2) return false;
  const s1 = n1.trim().toLowerCase();
  const s2 = n2.trim().toLowerCase();
  if (s1 === s2) return true;
  const m1 = s1.match(/^([a-g][#bd𝄳𝄵]?)([0-9])$/u);
  const m2 = s2.match(/^([a-g][#bd𝄳𝄵]?)([0-9])$/u);
  if (m1 && m2 && m1[2] === m2[2]) {
    if (ENHARMONIC_MAP[m1[1]] === m2[1]) return true;
  }
  return false;
};

// Arabic note dictionary for rich bilingual terminology
const ARABIC_NOTE_DICTIONARY: Record<string, { arabic: string; translit: string }> = {
  'G3': { arabic: 'يكاه', translit: 'Yakah' },
  'G#3': { arabic: 'يكاه دييز', translit: 'Yakah Sharp' },
  'Ab3': { arabic: 'يكاه بيمول', translit: 'Yakah Flat' },
  'A3': { arabic: 'عشيران', translit: 'Ushayran' },
  'A#3': { arabic: 'عجم عشيران', translit: '‘Ajam Ushayran' },
  'Bb3': { arabic: 'عجم عشيران', translit: '‘Ajam Ushayran' },
  'Bd3': { arabic: 'عراق', translit: '‘Iraq' },
  'B3': { arabic: 'كواشت', translit: 'Kawasht' },
  'C4': { arabic: 'راست', translit: 'Rast' },
  'C#4': { arabic: 'زنكولاه', translit: 'Zangulah' },
  'Db4': { arabic: 'زنكولاه', translit: 'Zangulah' },
  'D4': { arabic: 'دوكاه', translit: 'Dukah' },
  'D#4': { arabic: 'كردي', translit: 'Kurdi' },
  'Eb4': { arabic: 'كردي', translit: 'Kurdi' },
  'Ed4': { arabic: 'سيكاه', translit: 'Sikah' },
  'E4': { arabic: 'بوسليك', translit: 'Busalik' },
  'F4': { arabic: 'جهاركاه', translit: 'Jiharkah' },
  'F#4': { arabic: 'حجاز', translit: 'Hijaz' },
  'Gb4': { arabic: 'حجاز', translit: 'Hijaz' },
  'G4': { arabic: 'نوى', translit: 'Nawa' },
  'G#4': { arabic: 'حصار', translit: 'Hisar' },
  'Ab4': { arabic: 'حصار', translit: 'Hisar' },
  'Ad4': { arabic: 'صبا', translit: 'Saba' },
  'A4': { arabic: 'حسيني', translit: 'Husayni' },
  'A#4': { arabic: 'عجم', translit: '‘Ajam' },
  'Bb4': { arabic: 'عجم', translit: '‘Ajam' },
  'Bd4': { arabic: 'أوج', translit: 'Awj' },
  'B4': { arabic: 'ماهور', translit: 'Mahur' },
  'C5': { arabic: 'كردان', translit: 'Kirdan' },
  'C#5': { arabic: 'شاهناز', translit: 'Shahnaz' },
  'Db5': { arabic: 'شاهناز', translit: 'Shahnaz' },
  'D5': { arabic: 'محير', translit: 'Muhayyar' },
  'D#5': { arabic: 'سنبلة', translit: 'Sunbulah' },
  'Eb5': { arabic: 'سنبلة', translit: 'Sunbulah' },
  'Ed5': { arabic: 'بزرك', translit: 'Buzurk' },
  'E5': { arabic: 'جواب بوسليك', translit: 'Jawab Busalik' },
  'F5': { arabic: 'جواب جهاركاه', translit: 'Jawab Jiharkah' },
  'F#5': { arabic: 'جواب حجاز', translit: 'Jawab Hijaz' },
  'Gb5': { arabic: 'جواب حجاز', translit: 'Jawab Hijaz' },
  'G5': { arabic: 'جواب نوى', translit: 'Jawab Nawa' },
  'G#5': { arabic: 'جواب حصار', translit: 'Jawab Hisar' },
  'Ab5': { arabic: 'جواب حصار', translit: 'Jawab Hisar' },
  'A5': { arabic: 'جواب حسيني', translit: 'Jawab Husayni' },
  'A#5': { arabic: 'جواب عجم', translit: 'Jawab ‘Ajam' },
  'Bb5': { arabic: 'جواب عجم', translit: 'Jawab ‘Ajam' },
  'Bd5': { arabic: 'جواب أوج', translit: 'Jawab Awj' },
  'B5': { arabic: 'جواب ماهور', translit: 'Jawab Mahur' },
  'C6': { arabic: 'رَمَل', translit: 'Ramal' },
};

export const ViolinFingerboard: React.FC<Props> = ({
  scalePitches = [],
  activePitchIndex = null,
  timbre = 'violin',
  currentMaqam,
  violinTuning: propViolinTuning,
  onViolinTuningChange,
}) => {
  // Resolve active maqam (fallback to Rast if none passed)
  const activeMaqam = useMemo(() => {
    return currentMaqam ?? MaqamatCatalogue.buildRast();
  }, [currentMaqam]);

  // Derive active scale pitches
  const effectiveScalePitches = useMemo(() => {
    if (scalePitches && scalePitches.length > 0) {
      return scalePitches;
    }
    return activeMaqam.getScale();
  }, [scalePitches, activeMaqam]);

  // Component UI state
  const [namingMode, setNamingMode] = useState<AccidentalNaming>('sharps');
  const [playMode, setPlayMode] = useState<PlayMode>('bow');
  const [handPosition, setHandPosition] = useState<HandPosition>('1st');
  const [scaleFilter, setScaleFilter] = useState<ScaleFilterMode>('all-notes');
  const [showQuarterTones, setShowQuarterTones] = useState<boolean>(true);
  const [internalViolinTuning, setInternalViolinTuning] = useState<ViolinTuningPreset>('arabic');
  const [isStringsReversed, setIsStringsReversed] = useState<boolean>(false);
  const [hoveredNote, setHoveredNote] = useState<BoardNote | null>(null);
  const [activeNoteKey, setActiveNoteKey] = useState<string | null>(null);
  const [deduplicateInPosition, setDeduplicateInPosition] = useState<boolean>(true);

  // Active violin tuning is controlled by prop if provided, else internal state
  const violinTuning = propViolinTuning ?? internalViolinTuning;
  const setViolinTuning = (tuning: ViolinTuningPreset | ((prev: ViolinTuningPreset) => ViolinTuningPreset)) => {
    const nextVal = typeof tuning === 'function' ? tuning(violinTuning) : tuning;
    setInternalViolinTuning(nextVal);
    if (onViolinTuningChange) onViolinTuningChange(nextVal);
  };

  // Define string setup: IV (lowest pitch) down to I (highest pitch), or reversed (I to IV)
  const baseStrings = useMemo(() => {
    if (violinTuning === 'arabic') {
      return [
        { id: 'string-4', name: 'IV', letter: 'G', openNote: 'G3', openMidi: 55, openQt: 86, arabic: 'يكاه (Yakah)', pitch: new ArabicPitch('G', '♮', 3) },
        { id: 'string-3', name: 'III', letter: 'D', openNote: 'D4', openMidi: 62, openQt: 100, arabic: 'دوكاه (Dukah)', pitch: new ArabicPitch('D', '♮', 4) },
        { id: 'string-2', name: 'II', letter: 'G', openNote: 'G4', openMidi: 67, openQt: 110, arabic: 'نوى (Nawa)', pitch: new ArabicPitch('G', '♮', 4) },
        { id: 'string-1', name: 'I', letter: 'D', openNote: 'D5', openMidi: 74, openQt: 124, arabic: 'محير (Muhayyar)', pitch: new ArabicPitch('D', '♮', 5) }
      ];
    } else {
      return [
        { id: 'string-4', name: 'IV', letter: 'G', openNote: 'G3', openMidi: 55, openQt: 86, arabic: 'يكاه (Yakah)', pitch: new ArabicPitch('G', '♮', 3) },
        { id: 'string-3', name: 'III', letter: 'D', openNote: 'D4', openMidi: 62, openQt: 100, arabic: 'دوكاه (Dukah)', pitch: new ArabicPitch('D', '♮', 4) },
        { id: 'string-2', name: 'II', letter: 'A', openNote: 'A4', openMidi: 69, openQt: 114, arabic: 'حسيني (Husayni)', pitch: new ArabicPitch('A', '♮', 4) },
        { id: 'string-1', name: 'I', letter: 'E', openNote: 'E5', openMidi: 76, openQt: 128, arabic: 'بوسليك (Busalik)', pitch: new ArabicPitch('E', '♮', 5) }
      ];
    }
  }, [violinTuning]);

  const stringSetup = useMemo(() => {
    return isStringsReversed ? [...baseStrings].reverse() : baseStrings;
  }, [baseStrings, isStringsReversed]);

  // Geometric coordinates for tapered fingerboard SVG
  const SVG_WIDTH = 1140;
  const SVG_HEIGHT = 310;
  const NUT_X = 142;
  const NUT_WIDTH = 9;
  const BOARD_START_X = 150;
  const BOARD_END_X = 1110;

  // Board height narrows at Nut (left) and tapers wider towards Bridge (right)
  const NUT_TOP_Y = 56;
  const NUT_BOTTOM_Y = 246;
  const END_TOP_Y = 32;
  const END_BOTTOM_Y = 270;

  // String Y coordinates at Nut and at End
  const STRING_Y_NUT = [80, 126, 174, 222]; // IV, III, II, I
  const STRING_Y_END = [62, 118, 184, 240];

  const getStringY = (stringIndex: number, x: number): number => {
    const t = Math.max(0, Math.min(1, (x - NUT_X) / (BOARD_END_X - NUT_X)));
    const yNut = STRING_Y_NUT[stringIndex];
    const yEnd = STRING_Y_END[stringIndex];
    return yNut + t * (yEnd - yNut);
  };

  // Semitone column positions (0 = open string at X=88, 1..12 across the neck)
  const SEMITONE_X_COORDS: Record<number, number> = {
    0: 88, // open string pegbox
    1: 215,
    2: 290, // 1st finger
    3: 365,
    4: 440, // 2nd finger
    5: 515, // 3rd finger
    6: 590,
    7: 665, // 4th finger
    8: 740,
    9: 815,
    10: 890,
    11: 965,
    12: 1040,
  };

  // Standard chromatic pitch dictionary
  const PITCH_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const PITCH_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  // Check whether a semitone falls within the hand position reach
  const isSemitoneInPosition = (semitone: number, pos: HandPosition): boolean => {
    if (pos === 'all') return true;
    if (pos === '1st') {
      // 1st position: open string (0) through 4th finger (7)
      return semitone >= 0 && semitone <= 7;
    }
    if (pos === '2nd') {
      // 2nd position: semitones 2 to 9, plus open string 0
      return (semitone >= 2 && semitone <= 9) || semitone === 0;
    }
    if (pos === '3rd') {
      // 3rd position: semitones 4 to 11, plus open string 0
      return (semitone >= 4 && semitone <= 11) || semitone === 0;
    }
    if (pos === '4th') {
      // 4th position: semitones 6 to 12, plus open string 0
      return (semitone >= 6 && semitone <= 12) || semitone === 0;
    }
    return true;
  };

  // Calculate finger number for a note in a given hand position
  const getFingerNumber = (semitone: number, pos: HandPosition): number => {
    if (semitone === 0) return 0;
    if (pos === '1st' || pos === 'all') {
      if (semitone <= 2) return 1;
      if (semitone <= 4) return 2;
      if (semitone <= 6) return 3;
      return 4;
    }
    if (pos === '2nd') {
      const rel = semitone - 2;
      if (rel <= 1) return 1;
      if (rel <= 3) return 2;
      if (rel <= 5) return 3;
      return 4;
    }
    if (pos === '3rd') {
      const rel = semitone - 4;
      if (rel <= 1) return 1;
      if (rel <= 3) return 2;
      if (rel <= 5) return 3;
      return 4;
    }
    if (pos === '4th') {
      const rel = semitone - 6;
      if (rel <= 1) return 1;
      if (rel <= 3) return 2;
      if (rel <= 5) return 3;
      return 4;
    }
    return 1;
  };

  // Generate board notes
  const rawBoardNotes: BoardNote[] = useMemo(() => {
    const list: BoardNote[] = [];

    stringSetup.forEach((str, sIdx) => {
      // Semitones 0 to 12
      for (let semitone = 0; semitone <= 12; semitone++) {
        const midi = str.openMidi + semitone;
        const octave = Math.floor(midi / 12) - 1;
        const pitchIdx = midi % 12;
        const qtIndex = str.openQt + semitone * 2;

        const sharpLetter = PITCH_NAMES_SHARP[pitchIdx];
        const flatLetter = PITCH_NAMES_FLAT[pitchIdx];
        const sharpName = `${sharpLetter}${octave}`;
        const flatName = `${flatLetter}${octave}`;
        const noteKey = sharpName;

        const dictEntry = ARABIC_NOTE_DICTIONARY[noteKey] || ARABIC_NOTE_DICTIONARY[flatName];
        const arabicName = dictEntry?.arabic || '';
        const arabicShort = arabicName.split(' ')[0] || sharpName;

        const x = SEMITONE_X_COORDS[semitone] ?? (BOARD_START_X + semitone * 75);
        const y = semitone === 0 ? STRING_Y_NUT[sIdx] : getStringY(sIdx, x);

        let fingerTape: BoardNote['fingerTape'] = 'other';
        if (semitone === 0) fingerTape = 'open';
        else if (semitone === 2) fingerTape = '1st';
        else if (semitone === 4) fingerTape = '2nd';
        else if (semitone === 5) fingerTape = '3rd';
        else if (semitone === 7) fingerTape = '4th';

        // Parse diatonic base and accidental for ArabicPitch representation
        const diatonicBase = (sharpLetter.charAt(0) as DiatonicBase) || 'C';
        const accidentalChar: MicrotonalAccidental = sharpLetter.includes('#') ? '♯' : '♮';
        const pitchObj = new ArabicPitch(diatonicBase, accidentalChar, octave);

        const inReach = isSemitoneInPosition(semitone, handPosition);
        const fingerNum = getFingerNumber(semitone, handPosition);

        list.push({
          id: `${str.id}-semi-${semitone}`,
          stringIndex: sIdx,
          stringName: str.name,
          letter: str.letter,
          openNote: str.openNote,
          noteKey,
          pitch: pitchObj,
          sharpName,
          flatName,
          halfFlatName: sharpName,
          arabicName,
          arabicShort,
          semitoneIndex: semitone,
          isQuarterTone: false,
          baseMidi: midi,
          qtIndex,
          x,
          y,
          fingerTape,
          inPositionRange: inReach,
          isDuplicateInPosition: false,
          fingerNumber: fingerNum,
        });

        // Special authentic Arabic Quarter-tones (half-flats): Sikah (Ed4), Awj (Bd4), Iraq (Bd3), etc.
        // Insert intermediate microtonal nodes between steps (e.g. at semitone + 0.5)
        if (showQuarterTones && semitone < 12) {
          let isAuthenticQuarter = false;
          let qName = '';
          let qDiatonic = 'E';
          let qOctave = 4;

          // Check if this step corresponds to quintessential Arabic quarter tones
          if (str.openNote === 'D4' && semitone === 1) {
            // Ed4 (Sikah) is 1.5 semitones above D4 (between Eb4 and E4)
            isAuthenticQuarter = true;
            qName = 'Ed4';
            qDiatonic = 'E';
            qOctave = 4;
          } else if ((str.openNote === 'G4' || str.openNote === 'G3') && semitone === 3) {
            // Bd4 (Awj) or Bd3 (Iraq) is 3.5 semitones above G (between Bb and B)
            isAuthenticQuarter = true;
            qName = str.openNote === 'G4' ? 'Bd4' : 'Bd3';
            qDiatonic = 'B';
            qOctave = str.openNote === 'G4' ? 4 : 3;
          } else if (str.openNote === 'A4' && semitone === 1) {
            // Bd4 (Awj) on Western A string
            isAuthenticQuarter = true;
            qName = 'Bd4';
            qDiatonic = 'B';
            qOctave = 4;
          } else if (str.openNote === 'D5' && semitone === 1) {
            // Ed5 (Buzurk)
            isAuthenticQuarter = true;
            qName = 'Ed5';
            qDiatonic = 'E';
            qOctave = 5;
          } else if (str.openNote === 'G4' && semitone === 1) {
            // Ad4 (nim Ajam / Saba)
            isAuthenticQuarter = true;
            qName = 'Ad4';
            qDiatonic = 'A';
            qOctave = 4;
          }

          if (isAuthenticQuarter) {
            const nextX = SEMITONE_X_COORDS[semitone + 1] || x + 75;
            const qX = (x + nextX) / 2;
            const qY = getStringY(sIdx, qX);
            const dictQ = ARABIC_NOTE_DICTIONARY[qName];
            const arabicQ = dictQ?.arabic || '';
            const arabicShortQ = arabicQ.split(' ')[0] || qName;
            const qQtIndex = qtIndex + 1;

            const qPitchObj = new ArabicPitch(qDiatonic as DiatonicBase, '𝄳', qOctave);
            const qInReach = isSemitoneInPosition(semitone, handPosition);
            const qFingerNum = getFingerNumber(semitone, handPosition);

            list.push({
              id: `${str.id}-quarter-${semitone}`,
              stringIndex: sIdx,
              stringName: str.name,
              letter: str.letter,
              openNote: str.openNote,
              noteKey: qName,
              pitch: qPitchObj,
              sharpName: qName.replace('d', '𝄳'),
              flatName: qName.replace('d', '𝄳'),
              halfFlatName: qName.replace('d', '𝄳'),
              arabicName: arabicQ,
              arabicShort: arabicShortQ,
              semitoneIndex: semitone,
              isQuarterTone: true,
              baseMidi: midi,
              qtIndex: qQtIndex,
              x: qX,
              y: qY,
              fingerTape: '2nd-neutral',
              inPositionRange: qInReach,
              isDuplicateInPosition: false,
              fingerNumber: qFingerNum,
            });
          }
        }
      }
    });

    return list;
  }, [stringSetup, handPosition, showQuarterTones]);

  // Check if a note is in the active Maqam scale
  const isPitchInMaqam = (pitch: ArabicPitch, noteKey: string): boolean => {
    // 1. Direct match with scale pitches
    if (effectiveScalePitches.some(sp => sp.equals(pitch))) {
      return true;
    }
    // 2. Quarter-tone index match
    const qt = pitch.toQuarterToneIndex();
    if (effectiveScalePitches.some(sp => sp.toQuarterToneIndex() === qt)) {
      return true;
    }
    // 3. Normalized string equivalence (e.g. D4, Ed4)
    return effectiveScalePitches.some(sp => areNotesEquivalent(sp.toScientificString(), noteKey));
  };

  /**
   * CRITICAL PEDAGOGICAL DEDUPLICATION:
   * "In every individual position, highlighted notes should appear once."
   *
   * For every individual position (1st, 2nd, 3rd, 4th):
   * When multiple candidates on adjacent strings represent the same pitch (e.g. D4 open vs 4th finger G,
   * G4 open vs 3rd finger D, A4 open vs 4th finger D, D5 open vs 4th finger G/A),
   * we score and select the single optimal string placement for that position.
   * All redundant duplicate candidate notes are marked as `isDuplicateInPosition = true`.
   */
  const boardNotes: BoardNote[] = useMemo(() => {
    if (!deduplicateInPosition || handPosition === 'all') {
      return rawBoardNotes;
    }

    // Map candidate notes in the active position reach that are highlighted in the Maqam
    const candidatesByQt: Map<number, BoardNote[]> = new Map();

    rawBoardNotes.forEach(n => {
      if (n.inPositionRange && isPitchInMaqam(n.pitch, n.noteKey)) {
        const canonicalQt = n.pitch.toQuarterToneIndex();
        const list = candidatesByQt.get(canonicalQt) || [];
        list.push(n);
        candidatesByQt.set(canonicalQt, list);
      }
    });

    // Score and select the single winning placement for each pitch
    const winningNoteIds = new Set<string>();

    candidatesByQt.forEach((candidates) => {
      if (candidates.length === 1) {
        winningNoteIds.add(candidates[0].id);
        return;
      }

      // Priority scoring function according to violin position pedagogy
      let bestCandidate = candidates[0];
      let bestScore = -Infinity;

      candidates.forEach(cand => {
        let score = 0;

        if (handPosition === '1st') {
          // In 1st position:
          // Open string (semitone 0) on the higher string is the natural bridge to continue upward,
          // avoiding awkward 4th finger stretch on lower string (e.g. Open D3 on string III > 4th finger on string IV).
          if (cand.semitoneIndex === 0) {
            score = 100; // Open string preference for 1st position scale playing
          } else if (cand.semitoneIndex <= 6) {
            score = 90 - cand.semitoneIndex; // Fingers 1, 2, 3 have high priority
          } else {
            score = 40; // 4th finger (semitone 7) is secondary when open string exists
          }
        } else if (handPosition === '2nd') {
          // In 2nd position:
          // Stopped fingers (fingers 1 to 4, semitones 2 to 9) in hand position take precedence over open strings!
          if (cand.semitoneIndex >= 2 && cand.semitoneIndex <= 9) {
            score = 100 - Math.abs(cand.semitoneIndex - 4);
          } else if (cand.semitoneIndex === 0) {
            score = 25; // Open string fallback
          } else {
            score = 10;
          }
        } else if (handPosition === '3rd') {
          // In 3rd position:
          // Stopped fingers (semitones 4 to 11) in 3rd position take precedence over open strings!
          // (e.g. G4 on D string with finger 1 > open G string).
          if (cand.semitoneIndex >= 4 && cand.semitoneIndex <= 11) {
            score = 100 - Math.abs(cand.semitoneIndex - 6);
          } else if (cand.semitoneIndex === 0) {
            score = 25; // Open string fallback
          } else {
            score = 10;
          }
        } else if (handPosition === '4th') {
          // In 4th position:
          // Stopped fingers (semitones 6 to 12) take precedence over open strings.
          if (cand.semitoneIndex >= 6 && cand.semitoneIndex <= 12) {
            score = 100 - Math.abs(cand.semitoneIndex - 8);
          } else if (cand.semitoneIndex === 0) {
            score = 25;
          } else {
            score = 10;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = cand;
        }
      });

      winningNoteIds.add(bestCandidate.id);
    });

    // Mark non-winning duplicates
    return rawBoardNotes.map(n => {
      const inMaqam = isPitchInMaqam(n.pitch, n.noteKey);
      if (n.inPositionRange && inMaqam && !winningNoteIds.has(n.id)) {
        return { ...n, isDuplicateInPosition: true };
      }
      return n;
    });
  }, [rawBoardNotes, handPosition, deduplicateInPosition, effectiveScalePitches]);

  // Play sound handler (Bow vs Pizzicato)
  const handlePlay = (note: BoardNote) => {
    setActiveNoteKey(note.noteKey);
    setTimeout(() => setActiveNoteKey(null), 1200);

    const duration = playMode === 'bow' ? 1.4 : 0.6;
    const activeTimbre: TimbreType = playMode === 'bow' ? timbre : 'oud'; // bow vs pluck

    MicrotonalAudioEngine.playPitch(note.pitch, duration, activeTimbre, 0.85);
  };

  // Quick tune open string trigger
  const handleTuneString = (sIdx: number) => {
    const str = stringSetup[sIdx];
    const openNote = boardNotes.find(n => n.stringIndex === sIdx && n.semitoneIndex === 0);
    if (openNote) {
      handlePlay(openNote);
    } else {
      MicrotonalAudioEngine.playPitch(str.pitch, 1.4, 'violin', 0.85);
      setActiveNoteKey(str.openNote);
      setTimeout(() => setActiveNoteKey(null), 1200);
    }
  };

  // Determine note visibility on the fingerboard
  const isNoteVisible = (n: BoardNote): boolean => {
    // 1. If currently sounding, keep visible
    if (activeNoteKey && areNotesEquivalent(activeNoteKey, n.noteKey)) {
      return true;
    }
    if (activePitchIndex !== null && effectiveScalePitches[activePitchIndex]?.equals(n.pitch)) {
      return true;
    }

    // 2. Position filter
    if (!n.inPositionRange) {
      return false;
    }

    // 3. Deduplication rule: In every individual position, highlighted notes appear once!
    // In maqam-only mode, completely hide the duplicate instance
    if (deduplicateInPosition && handPosition !== 'all' && n.isDuplicateInPosition && scaleFilter === 'maqam-only') {
      return false;
    }

    // 4. Note filter (either All (0-12) notes within that position, or Maqam Scale Only)
    if (scaleFilter === 'maqam-only') {
      return isPitchInMaqam(n.pitch, n.noteKey) && !n.isDuplicateInPosition;
    }

    return true;
  };

  // Format label based on accidental naming preference
  const getNoteDisplayLabel = (n: BoardNote): string => {
    if (n.isQuarterTone) {
      return n.noteKey.replace('d', '𝄳');
    }
    if (namingMode === 'flats') {
      return n.flatName;
    }
    if (namingMode === 'arabic') {
      return n.arabicShort;
    }
    return n.sharpName;
  };

  // Active playing pitch for ripple animation
  const isNoteActiveNow = (n: BoardNote): boolean => {
    if (activeNoteKey && areNotesEquivalent(activeNoteKey, n.noteKey)) return true;
    if (activePitchIndex !== null && effectiveScalePitches[activePitchIndex]?.equals(n.pitch)) return true;
    return false;
  };

  const tonicPitch = activeMaqam.getTonic();
  const ghammazPitch = activeMaqam.getGhammaz();

  return (
    <Card className="w-full bg-slate-900/90 border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Top Controls Header */}
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                Violin Fingerboard
              </span>
              <span className="text-xs font-serif text-amber-300 font-bold">لوحة أصابع الكمان</span>
              <Badge variant="secondary" className="text-[11px] font-mono border-amber-500/30 text-amber-300">
                Maqam {activeMaqam.name}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono border-cyan-800/60 text-cyan-400">
                {violinTuning === 'arabic'
                  ? (isStringsReversed ? 'Arabic (Reversed): D5-G4-D4-G3' : 'Arabic: G3-D4-G4-D5')
                  : (isStringsReversed ? 'Western (Reversed): E5-A4-D4-G3' : 'Western: G3-D4-A4-E5')}
              </Badge>
            </div>
            <CardTitle className="text-lg sm:text-xl mt-1 flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-400" />
              <span>Tapered Ebony Neck &amp; Fretless Microtonal Intonation</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5 text-slate-400">
              Interactive 24-EDO violin neck with authentic string acoustics, quarter-tone stops (𝄳), and deduplicated position fingering.
            </CardDescription>
          </div>

          {/* Top Right Action Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Global Accidental Naming */}
            <button
              type="button"
              onClick={() => {
                const modes: AccidentalNaming[] = ['sharps', 'flats', 'arabic'];
                const next = modes[(modes.indexOf(namingMode) + 1) % modes.length];
                setNamingMode(next);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-mono tracking-wider border border-cyan-600/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Toggle accidental note notation"
            >
              Naming: <span className="font-bold text-white">{namingMode === 'sharps' ? 'Sharps (#)' : namingMode === 'flats' ? 'Flats (♭)' : 'Arabic Names'}</span>
            </button>

            {/* Bow vs Pizzicato */}
            <button
              type="button"
              onClick={() => setPlayMode(prev => prev === 'bow' ? 'pizzicato' : 'bow')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                playMode === 'bow'
                  ? 'border-amber-500/60 bg-amber-950/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'border-cyan-500/60 bg-cyan-950/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              }`}
            >
              <span>{playMode === 'bow' ? '🎻 Bow Mode (قوس)' : '🪕 Pizzicato (نقر)'}</span>
            </button>

            {/* Microtone Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowQuarterTones(prev => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                showQuarterTones
                  ? 'border-emerald-600/60 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
            >
              <span>{showQuarterTones ? 'Quarter-Tones: On 𝄳' : '12-TET Only'}</span>
            </button>

            {/* Violin Tuning Preset Toggle: Arabic vs Western */}
            <button
              type="button"
              onClick={() => setViolinTuning(prev => prev === 'arabic' ? 'western' : 'arabic')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                violinTuning === 'arabic'
                  ? 'border-amber-500/60 bg-amber-950/40 text-amber-300'
                  : 'border-indigo-500/60 bg-indigo-950/40 text-indigo-300'
              }`}
              title="Switch violin tuning between Classical Arabic (G-D-G-D) and Western Standard (G-D-A-E)"
            >
              <span>Tuning: <strong className="font-bold">{violinTuning === 'arabic' ? 'Arabic (G-D-G-D)' : 'Western (G-D-A-E)'}</strong></span>
            </button>

            {/* Reverse Strings Order Button */}
            <button
              type="button"
              onClick={() => setIsStringsReversed(prev => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                isStringsReversed
                  ? 'border-cyan-500/70 bg-cyan-950/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white'
              }`}
              title="Reverse strings order (IV-III-II-I <-> I-II-III-IV)"
            >
              <span>⇄ Reverse:</span>
              <span className="font-mono font-bold text-amber-300">
                {isStringsReversed
                  ? (violinTuning === 'arabic' ? 'D5 G4 D4 G3' : 'E5 A4 D4 G3')
                  : (violinTuning === 'arabic' ? 'G3 D4 G4 D5' : 'G3 D4 A4 E5')}
              </span>
            </button>
          </div>
        </div>

        {/* Pedagogical Positioning Notice */}
        <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 bg-emerald-500/10 font-mono text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {handPosition === 'all'
                  ? 'Full Neck Overview (All Positions 1–4)'
                  : `Individual Position ${handPosition}: Highlighted notes appear once`}
              </span>
            </Badge>

            {handPosition !== 'all' && (
              <button
                type="button"
                onClick={() => setDeduplicateInPosition(prev => !prev)}
                className={`text-[11px] px-2.5 py-0.5 rounded-md border font-mono transition cursor-pointer ${
                  deduplicateInPosition
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle individual position note deduplication"
              >
                {deduplicateInPosition ? 'Deduplication: On (Appear Once)' : 'Allow Unisons'}
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-arabic">
            في كل وضعية منفردة، تظهر النغمات المظللة مرة واحدة لمنع تكرار مواضع الأصابع.
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* Mobile Horizontal Scroll Affordance */}
        <div className="flex md:hidden items-center justify-between px-1 text-[11px] text-amber-400/90 mb-1 font-medium">
          <span className="flex items-center gap-1.5">
            <MoveHorizontal className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Swipe neck horizontally (اسحب أفقياً لتصفح الأوضاع 1–4)</span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">Positions 1–4</span>
        </div>

        {/* Tapered Fingerboard SVG Stage */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin select-none">
          <div className="min-w-245 relative">
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="w-full h-auto drop-shadow-2xl"
              style={{ minHeight: '270px' }}
            >
              <defs>
                {/* Authentic African Ebony Camber Gradient (arched cylindrical crown across neck) */}
                <linearGradient id="ebonyCamber" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2c2621" />
                  <stop offset="3%" stopColor="#1c1815" />
                  <stop offset="15%" stopColor="#13100e" />
                  <stop offset="46%" stopColor="#1e1915" />
                  <stop offset="52%" stopColor="#251f1a" />
                  <stop offset="60%" stopColor="#1c1814" />
                  <stop offset="85%" stopColor="#13100e" />
                  <stop offset="97%" stopColor="#0b0908" />
                  <stop offset="100%" stopColor="#040303" />
                </linearGradient>

                {/* Ebony Wood Grain Fiber Pattern */}
                <pattern id="ebonyGrain" width="240" height="40" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="7" x2="240" y2="8" stroke="#ffffff" strokeWidth="0.45" strokeOpacity="0.02" />
                  <line x1="0" y1="15" x2="240" y2="14" stroke="#000000" strokeWidth="0.8" strokeOpacity="0.5" />
                  <line x1="0" y1="24" x2="240" y2="25" stroke="#ffffff" strokeWidth="0.35" strokeOpacity="0.018" />
                  <line x1="0" y1="33" x2="240" y2="32" stroke="#000000" strokeWidth="0.65" strokeOpacity="0.45" />
                </pattern>

                {/* Carved Flamed Maple Neck Wood Strip (peeking below the ebony board) */}
                <linearGradient id="mapleNeck" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3d2314" />
                  <stop offset="20%" stopColor="#55321a" />
                  <stop offset="40%" stopColor="#3c2212" />
                  <stop offset="65%" stopColor="#522f18" />
                  <stop offset="85%" stopColor="#381f10" />
                  <stop offset="100%" stopColor="#27150a" />
                </linearGradient>

                {/* Pegbox Aged Maple Wood */}
                <linearGradient id="pegboxWood" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e120a" />
                  <stop offset="45%" stopColor="#140b06" />
                  <stop offset="100%" stopColor="#070402" />
                </linearGradient>

                {/* Aged Ivory / Bone Nut Gradient */}
                <linearGradient id="ivoryNut" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#faf6ee" />
                  <stop offset="30%" stopColor="#f1e7d4" />
                  <stop offset="70%" stopColor="#e2d4bd" />
                  <stop offset="100%" stopColor="#baaa8d" />
                </linearGradient>

                {/* Nut Contact Shadow (fading onto ebony fingerboard) */}
                <linearGradient id="nutShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(0, 0, 0, 0.85)" />
                  <stop offset="40%" stopColor="rgba(0, 0, 0, 0.4)" />
                  <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                </linearGradient>

                {/* Mother-of-Pearl Inlay Dots */}
                <radialGradient id="pearlInlay" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="55%" stopColor="#e2e8f0" />
                  <stop offset="85%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </radialGradient>

                {/* String Metallic Shaders */}
                <linearGradient id="stringG" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f1f5f9" />
                  <stop offset="35%" stopColor="#cbd5e1" />
                  <stop offset="70%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>

                <linearGradient id="stringD" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="35%" stopColor="#e2e8f0" />
                  <stop offset="70%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#71717a" />
                </linearGradient>

                <linearGradient id="stringA" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#f1f5f9" />
                  <stop offset="70%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>

                <linearGradient id="stringE" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="35%" stopColor="#fde047" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>

                {/* Deep 3D Instrument Drop Shadows */}
                <filter id="neck3DShadow" x="-5%" y="-15%" width="110%" height="145%">
                  <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#000000" floodOpacity="0.95" />
                </filter>

                <filter id="stringShadow" x="-5%" y="-20%" width="110%" height="180%">
                  <feDropShadow dx="0" dy="2.8" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Layer 1: Ambient Drop Shadow of the Fingerboard */}
              <polygon
                points={`${BOARD_START_X},${NUT_TOP_Y} ${BOARD_END_X},${END_TOP_Y} ${BOARD_END_X},${END_BOTTOM_Y + 14} ${BOARD_START_X},${NUT_BOTTOM_Y + 10}`}
                fill="#000000"
                filter="url(#neck3DShadow)"
                opacity="0.95"
              />

              {/* Layer 2: Pegbox / Open String Area Background */}
              <rect
                x="20"
                y="40"
                width={NUT_X - 20}
                height="230"
                rx="10"
                fill="url(#pegboxWood)"
                stroke="#3a2214"
                strokeWidth="1.8"
              />
              <rect
                x="26"
                y="46"
                width={NUT_X - 32}
                height="218"
                rx="7"
                fill="#080402"
                stroke="#211208"
                strokeWidth="1.2"
              />

              {/* Layer 3: Flamed Maple Neck Wood Strip */}
              <polygon
                points={`${BOARD_START_X},${NUT_BOTTOM_Y - 1} ${BOARD_END_X},${END_BOTTOM_Y - 1} ${BOARD_END_X},${END_BOTTOM_Y + 8} ${BOARD_START_X},${NUT_BOTTOM_Y + 6}`}
                fill="url(#mapleNeck)"
                stroke="#261409"
                strokeWidth="0.8"
              />

              {/* Layer 4: Solid Ebony Fingerboard with Camber Curve */}
              <polygon
                points={`${BOARD_START_X},${NUT_TOP_Y} ${BOARD_END_X},${END_TOP_Y} ${BOARD_END_X},${END_BOTTOM_Y} ${BOARD_START_X},${NUT_BOTTOM_Y}`}
                fill="url(#ebonyCamber)"
                stroke="#3d332a"
                strokeWidth="1.6"
              />

              {/* Layer 5: Wood Grain Texture Overlay */}
              <polygon
                points={`${BOARD_START_X},${NUT_TOP_Y} ${BOARD_END_X},${END_TOP_Y} ${BOARD_END_X},${END_BOTTOM_Y} ${BOARD_START_X},${NUT_BOTTOM_Y}`}
                fill="url(#ebonyGrain)"
                opacity="0.9"
              />

              {/* Layer 6: Top and Bottom Edge Chamfer Highlight Lines */}
              <line
                x1={BOARD_START_X}
                y1={NUT_TOP_Y}
                x2={BOARD_END_X}
                y2={END_TOP_Y}
                stroke="rgba(245, 230, 211, 0.28)"
                strokeWidth="1.6"
              />
              <line
                x1={BOARD_START_X}
                y1={NUT_BOTTOM_Y}
                x2={BOARD_END_X}
                y2={END_BOTTOM_Y}
                stroke="rgba(0, 0, 0, 0.85)"
                strokeWidth="2.4"
              />

              {/* Layer 7: Fretless Intonation Marker Lines across all 12 semitones */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(s => {
                const xPos = SEMITONE_X_COORDS[s];
                if (!xPos) return null;
                const t = (xPos - NUT_X) / (BOARD_END_X - NUT_X);
                const topY = NUT_TOP_Y + t * (END_TOP_Y - NUT_TOP_Y);
                const botY = NUT_BOTTOM_Y + t * (END_BOTTOM_Y - NUT_BOTTOM_Y);

                const isPrimaryFinger = s === 2 || s === 4 || s === 5 || s === 7;
                const isSikahQuarter = s === 3; // Neutral 2nd in Arabic tradition
                const fingerLabel = s === 2 ? '1' : s === 4 ? '2' : s === 5 ? '3' : s === 7 ? '4' : null;

                return (
                  <g key={`fret-marker-${s}`}>
                    {/* Translucent Finger Tape Guide Band */}
                    {isPrimaryFinger && (
                      <rect
                        x={xPos - 8}
                        y={topY}
                        width="16"
                        height={botY - topY}
                        fill="rgba(56, 189, 248, 0.06)"
                        rx="2"
                      />
                    )}

                    {/* Fret Marker Line Inlay */}
                    <line
                      x1={xPos}
                      y1={topY}
                      x2={xPos}
                      y2={botY}
                      stroke={
                        isPrimaryFinger
                          ? 'rgba(255, 255, 255, 0.24)'
                          : isSikahQuarter
                          ? 'rgba(245, 158, 11, 0.32)'
                          : 'rgba(255, 255, 255, 0.08)'
                      }
                      strokeWidth={isPrimaryFinger ? 1.2 : isSikahQuarter ? 1.1 : 0.75}
                      strokeDasharray={isSikahQuarter ? '3 2' : 'none'}
                    />

                    {/* Finger Number above neck */}
                    {fingerLabel && (
                      <text
                        x={xPos}
                        y={topY - 11}
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="13"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                      >
                        {fingerLabel}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Layer 8: Inlaid Mother-of-Pearl Position Dots along the top neck rail */}
              {[
                { s: 3, double: false },  // Minor 3rd
                { s: 5, double: false },  // 3rd Finger (4th)
                { s: 7, double: false },  // 4th Finger (5th)
                { s: 9, double: false },  // Major 6th
                { s: 12, double: true },  // Octave double-dot
              ].map(dot => {
                const xPos = SEMITONE_X_COORDS[dot.s];
                if (!xPos) return null;
                const t = (xPos - NUT_X) / (BOARD_END_X - NUT_X);
                const topY = NUT_TOP_Y + t * (END_TOP_Y - NUT_TOP_Y);

                return (
                  <g key={`pearl-dot-${dot.s}`}>
                    {dot.double ? (
                      <>
                        <circle cx={xPos - 4} cy={topY - 4.5} r="2.8" fill="url(#pearlInlay)" stroke="#1a1410" strokeWidth="0.8" />
                        <circle cx={xPos + 4} cy={topY - 4.5} r="2.8" fill="url(#pearlInlay)" stroke="#1a1410" strokeWidth="0.8" />
                      </>
                    ) : (
                      <circle cx={xPos} cy={topY - 4.5} r="3.2" fill="url(#pearlInlay)" stroke="#1a1410" strokeWidth="0.8" />
                    )}
                  </g>
                );
              })}

              {/* Layer 9: Nut Contact Drop Shadow onto the Ebony Board */}
              <rect
                x={NUT_X + NUT_WIDTH / 2}
                y={NUT_TOP_Y}
                width="14"
                height={NUT_BOTTOM_Y - NUT_TOP_Y}
                fill="url(#nutShadow)"
              />

              {/* Layer 10: Aged Bone / Ivory Nut */}
              <rect
                x={NUT_X - NUT_WIDTH / 2}
                y={NUT_TOP_Y - 4}
                width={NUT_WIDTH}
                height={NUT_BOTTOM_Y - NUT_TOP_Y + 8}
                rx="3"
                fill="url(#ivoryNut)"
                stroke="#8c775a"
                strokeWidth="1.2"
                className="drop-shadow-md"
              />

              {/* Nut String Notches */}
              {stringSetup.map((str, sIdx) => {
                const yStart = STRING_Y_NUT[sIdx];
                return (
                  <circle
                    key={`nut-notch-${str.id}`}
                    cx={NUT_X}
                    cy={yStart}
                    r="2"
                    fill="#24170e"
                    opacity="0.85"
                  />
                );
              })}

              {/* Layer 11: Real Metallic Strings with Floating 3D Shadows */}
              {stringSetup.map((str, sIdx) => {
                const yStart = STRING_Y_NUT[sIdx];
                const yEnd = STRING_Y_END[sIdx];
                const gaugeByRegister: Record<string, number> = {
                  'IV': 3.8,
                  'III': 3.0,
                  'II': 2.2,
                  'I': 1.5,
                };
                const strokeThickness = gaugeByRegister[str.name] ?? (3.8 - sIdx * 0.75);

                const stringShader = str.name === 'IV'
                  ? 'url(#stringG)'
                  : str.name === 'III'
                  ? 'url(#stringD)'
                  : str.name === 'II'
                  ? 'url(#stringA)'
                  : 'url(#stringE)';

                return (
                  <g key={`string-line-${str.id}`}>
                    {/* Open String Letter on the far left */}
                    <text
                      x="45"
                      y={yStart + 5.5}
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="18"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      className="select-none drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                    >
                      {str.letter}
                    </text>

                    {/* Open String Pegbox wire with shadow */}
                    <line
                      x1="65"
                      y1={yStart + 2}
                      x2={NUT_X}
                      y2={yStart + 2}
                      stroke="rgba(0,0,0,0.85)"
                      strokeWidth={strokeThickness + 1}
                    />
                    <line
                      x1="65"
                      y1={yStart}
                      x2={NUT_X}
                      y2={yStart}
                      stroke={stringShader}
                      strokeWidth={strokeThickness}
                    />

                    {/* 3D Realistic String Drop Shadow */}
                    <line
                      x1={NUT_X + NUT_WIDTH / 2}
                      y1={yStart + 3.2}
                      x2={BOARD_END_X + 10}
                      y2={yEnd + 3.6}
                      stroke="rgba(0, 0, 0, 0.78)"
                      strokeWidth={strokeThickness + 1.2}
                      strokeLinecap="round"
                      filter="url(#stringShadow)"
                    />

                    {/* Vibrating Metallic String Wire */}
                    <line
                      x1={NUT_X + NUT_WIDTH / 2}
                      y1={yStart}
                      x2={BOARD_END_X + 10}
                      y2={yEnd}
                      stroke={stringShader}
                      strokeWidth={strokeThickness}
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_3px_rgba(255,255,255,0.4)]"
                    />

                    {/* High Specular Wire Sheen */}
                    <line
                      x1={NUT_X + NUT_WIDTH / 2}
                      y1={yStart - 0.5}
                      x2={BOARD_END_X + 10}
                      y2={yEnd - 0.5}
                      stroke="#ffffff"
                      strokeWidth={Math.max(0.6, strokeThickness * 0.35)}
                      strokeOpacity="0.45"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* Layer 12: Note Pins & Nodes */}
              {boardNotes.filter(isNoteVisible).map((note) => {
                const inMaqam = isPitchInMaqam(note.pitch, note.noteKey);
                // When deduplicating in individual positions, duplicate unisons are NOT highlighted
                const isHighlightedNote = inMaqam && (!deduplicateInPosition || handPosition === 'all' || !note.isDuplicateInPosition);

                const isTonicNote = isHighlightedNote && (tonicPitch ? note.pitch.equals(tonicPitch) || areNotesEquivalent(tonicPitch.toScientificString(), note.noteKey) : false);
                const isGhammazNote = isHighlightedNote && (ghammazPitch ? note.pitch.equals(ghammazPitch) || areNotesEquivalent(ghammazPitch.toScientificString(), note.noteKey) : false);
                const isActive = isNoteActiveNow(note);

                const displayLabel = getNoteDisplayLabel(note);
                const isHovered = hoveredNote?.id === note.id;

                // Node radius
                const radius = note.semitoneIndex === 0 ? 15 : note.isQuarterTone ? 13 : 14.5;

                return (
                  <g
                    key={note.id}
                    transform={`translate(${note.x}, ${note.y})`}
                    onClick={() => handlePlay(note)}
                    onMouseEnter={() => setHoveredNote(note)}
                    onMouseLeave={() => setHoveredNote(null)}
                    className="cursor-pointer transition-transform"
                  >
                    {/* Animated Active Ripple Ring */}
                    {isActive && (
                      <circle
                        r={radius + 8}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                        opacity="0.9"
                        className="animate-ping"
                      />
                    )}

                    {/* Pin Drop Shadow */}
                    <circle
                      r={radius}
                      cx="0"
                      cy="2.5"
                      fill="rgba(0, 0, 0, 0.75)"
                      filter="blur(1.5px)"
                    />

                    {/* Node Background Circle */}
                    <circle
                      r={radius}
                      fill={
                        isActive
                          ? '#fbbf24'
                          : isTonicNote
                          ? '#f59e0b'
                          : isGhammazNote
                          ? '#06b6d4'
                          : isHighlightedNote
                          ? '#059669'
                          : note.isQuarterTone
                          ? '#1c1917'
                          : 'rgba(15, 13, 12, 0.95)'
                      }
                      stroke={
                        isActive
                          ? '#ffffff'
                          : isTonicNote
                          ? '#fde68a'
                          : isGhammazNote
                          ? '#67e8f9'
                          : isHighlightedNote
                          ? '#a7f3d0'
                          : isHovered
                          ? '#38bdf8'
                          : note.isQuarterTone
                          ? '#f59e0b'
                          : '#3e3832'
                      }
                      strokeWidth={isActive || isTonicNote || isGhammazNote ? 2.5 : isHighlightedNote ? 2 : 1.4}
                      className="transition-all duration-150"
                    />

                    {/* Main Note Label */}
                    <text
                      x="0"
                      y={note.semitoneIndex === 0 ? 4 : -1}
                      textAnchor="middle"
                      fill={
                        isActive
                          ? '#090d16'
                          : isTonicNote
                          ? '#18181b'
                          : isGhammazNote
                          ? '#082f49'
                          : isHighlightedNote
                          ? '#ffffff'
                          : note.isQuarterTone
                          ? '#fbbf24'
                          : '#94a3b8'
                      }
                      fontSize={note.semitoneIndex === 0 ? '11.5' : '10'}
                      fontWeight={isActive || isTonicNote || isHighlightedNote ? 'bold' : '600'}
                      fontFamily="sans-serif"
                      className="select-none pointer-events-none"
                    >
                      {displayLabel}
                    </text>

                    {/* Semitone Index Number Underneath */}
                    {note.semitoneIndex > 0 && !note.isQuarterTone && (
                      <text
                        x="0"
                        y="9.5"
                        textAnchor="middle"
                        fill={
                          isActive || isTonicNote || isGhammazNote
                            ? '#000000'
                            : isHighlightedNote
                            ? '#d1fae5'
                            : '#64748b'
                        }
                        fontSize="8"
                        fontWeight="600"
                        fontFamily="monospace"
                        className="select-none pointer-events-none"
                      >
                        {note.semitoneIndex}
                      </text>
                    )}

                    {/* Quarter tone half-flat symbol underneath */}
                    {note.isQuarterTone && (
                      <text
                        x="0"
                        y="8.5"
                        textAnchor="middle"
                        fill="#f59e0b"
                        fontSize="9"
                        fontWeight="bold"
                        className="select-none pointer-events-none"
                      >
                        𝄳
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Helper instruction line */}
        <div className="text-center text-xs text-muted-foreground font-normal">
          Tap notes above to audition with realistic violin bow dynamics. The small number indicates the semitone distance above the open string.
        </div>

        {/* Bottom Bar: Position Selector & Note Display Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/80">
          <div className="flex flex-wrap items-center gap-3">
            {/* Position Tabs (1st, 2nd, 3rd, 4th, All) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Position:</span>
              {[
                { id: '1st', label: '1st (الأولى)' },
                { id: '2nd', label: '2nd (الثانية)' },
                { id: '3rd', label: '3rd (الثالثة)' },
                { id: '4th', label: '4th (الرابعة)' },
                { id: 'all', label: 'All (1-4 كامل)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHandPosition(tab.id as HandPosition)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    handPosition === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-1 ring-amber-300'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* Note Display Filter: All (0-12) vs Maqam Scale Only */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setScaleFilter('all-notes')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  scaleFilter === 'all-notes'
                    ? 'bg-slate-800 text-white font-bold shadow ring-1 ring-slate-600'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                All (0-12)
              </button>
              <button
                type="button"
                onClick={() => setScaleFilter('maqam-only')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  scaleFilter === 'maqam-only'
                    ? 'bg-emerald-600 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)] border border-emerald-400 ring-1 ring-emerald-300'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Maqam Scale Only
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span>Tonic (قرار)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              <span>Dominant (غمّاز)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-400" />
              <span>Maqam Degree</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded-full bg-slate-900 border border-amber-500" />
              <span>𝄳 Half-Flat</span>
            </div>
          </div>
        </div>

        {/* Tune Open Strings Bar */}
        <div className="mt-4 pt-3 border-t border-border/80">
          <div className="text-xs text-amber-400 font-semibold mb-2 flex items-center justify-between">
            <span>Tune open strings (دوزان الأوتار المطلقة)</span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Click to audition open resonant frequency
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {stringSetup.map((str, sIdx) => {
              const isPlayingThisString = activeNoteKey && areNotesEquivalent(activeNoteKey, str.openNote);

              return (
                <button
                  key={`tune-${str.id}`}
                  type="button"
                  onClick={() => handleTuneString(sIdx)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                    isPlayingThisString
                      ? 'border-amber-400 bg-amber-950/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-amber-500/80 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{str.name}</span>
                    <span className="text-sm font-bold text-white">{str.letter}</span>
                    <span className="text-xs font-mono text-slate-400">{str.openNote}</span>
                  </div>
                  <span className="text-xs font-serif text-amber-300/90">{str.arabic}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Inspector Status Bar */}
        <div className="mt-4 pt-3 border-t border-border/80 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <div>
            {activeNoteKey ? (
              <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-800/60 px-3 py-1 rounded-full text-amber-300 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
                <span className="font-semibold">Now Sounding: {activeNoteKey}</span>
                {ARABIC_NOTE_DICTIONARY[activeNoteKey]?.arabic && (
                  <span className="text-amber-200 font-serif">({ARABIC_NOTE_DICTIONARY[activeNoteKey]?.arabic})</span>
                )}
              </div>
            ) : hoveredNote ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-300 font-medium">Hovered Pitch:</span>
                <span className="text-amber-400 font-bold text-sm">{hoveredNote.noteKey}</span>
                <span className="text-emerald-400 font-serif">
                  {hoveredNote.arabicName || ''}
                </span>
                <span className="text-slate-400 font-mono">
                  ({hoveredNote.pitch.toFrequency().toFixed(1)} Hz)
                </span>
                <span className="text-[11px] text-cyan-300 font-mono">
                  String {hoveredNote.stringName} • Finger {hoveredNote.fingerNumber}
                </span>
              </div>
            ) : (
              <span>Tap notes above to play with realistic violin dynamics. Open strings can be auditioned below.</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>Mode: {playMode.toUpperCase()}</span>
            <span>•</span>
            <span>Tuning: {violinTuning.toUpperCase()}</span>
            <span>•</span>
            <span>Position: {handPosition.toUpperCase()}</span>
            <span>•</span>
            <span>A4=440Hz</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
