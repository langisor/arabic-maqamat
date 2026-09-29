// src/score/musicxml-exporter.ts
import {
  ArabicPitch,
  type DiatonicBase,
  type MicrotonalAccidental,
} from '../core/pitch';
import { Maqam } from '../theory/maqam';

/**
 * Escapes characters that have special syntactic meaning in XML content.
 */
export function escapeXmlText(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escapes characters that have special syntactic meaning in XML attribute values.
 */
export function escapeXmlAttribute(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface MusicXMLNoteInput {
  pitch: ArabicPitch;
  durationQuarter?: number;
  arabicName?: string;
  lyric?: string;
  isRest?: boolean;
}

export interface PhraseExportOptions {
  timeSignature?: '4/4' | '3/4' | '2/4' | '6/8' | '10/8';
  tempoBpm?: number;
  partName?: string;
  partId?: string;
  maqamName?: string;
  includeLyrics?: boolean;
  divisions?: number;
  measuresPerSystem?: number;
  conciseLyrics?: boolean;
}

export interface ScaleExportOptions {
  tempoBpm?: number;
  partName?: string;
  divisions?: number;
  direction?: 'both' | 'ascending' | 'descending';
}

export type MusicXMLValidationIssueCode =
  | 'EMPTY_PHRASE'
  | 'INVALID_PITCH'
  | 'OCTAVE_OUT_OF_RANGE'
  | 'UNUSUAL_DURATION'
  | 'NON_POSITIVE_DURATION'
  | 'NON_STANDARD_SUBDIVISION'
  | 'MEASURE_OVERFLOW'
  | 'XML_MALFORMED';

export interface MusicXMLValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: MusicXMLValidationIssueCode;
  message: string;
  noteIndex?: number;
  details?: Record<string, unknown>;
}

export interface MusicXMLValidationResult {
  isValid: boolean;
  canExport: boolean;
  issues: MusicXMLValidationIssue[];
  errors: string[];
  warnings: string[];
  stats: {
    totalNotes: number;
    totalDurationBeats: number;
    estimatedMeasures: number;
    quarterToneCount: number;
    standardAccidentalCount: number;
    naturalCount: number;
  };
}

export interface ParsedMusicXMLNote {
  pitch: ArabicPitch;
  durationQuarter: number;
  durationDivisions: number;
  noteType: string;
  dots: number;
  accidentalName?: string;
  lyric?: string;
  isRest?: boolean;
}

export interface ParsedMusicXMLMeasure {
  measureNumber: number;
  notes: ParsedMusicXMLNote[];
}

export interface ParsedMusicXML {
  workTitle: string;
  partName: string;
  divisions: number;
  beats: number;
  beatType: number;
  tempoBpm?: number;
  measures: ParsedMusicXMLMeasure[];
  allNotes: ParsedMusicXMLNote[];
}

export interface RoundTripReport {
  success: boolean;
  notesTested: number;
  exactPitchMatches: number;
  exactDurationMatches: number;
  quarterTonesPreserved: number;
  failures: string[];
}

const VALID_DIATONIC_BASES = new Set<string>(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
const VALID_ACCIDENTALS = new Set<string>(['𝄫', '♭', '𝄳', '♮', '𝄵', '♯', '𝄪']);

export class MusicXMLExporter {
  public static readonly DEFAULT_DIVISIONS = 16;

  /**
   * Converts a microtonal accidental into MusicXML alter value and standard accidental name.
   * Complies with MusicXML 4.0 specification for 24-EDO microtones.
   */
  public static accidentalToXml(acc: MicrotonalAccidental): { alter: number; name: string } {
    switch (acc) {
      case '𝄫':
        return { alter: -2.0, name: 'flat-flat' };
      case '♭':
        return { alter: -1.0, name: 'flat' };
      case '𝄳':
        return { alter: -0.5, name: 'quarter-flat' };
      case '♮':
        return { alter: 0.0, name: 'natural' };
      case '𝄵':
        return { alter: 0.5, name: 'quarter-sharp' };
      case '♯':
        return { alter: 1.0, name: 'sharp' };
      case '𝄪':
        return { alter: 2.0, name: 'double-sharp' };
      default:
        return { alter: 0.0, name: 'natural' };
    }
  }

  /**
   * Converts MusicXML alter and accidental name back into an Arabic microtonal accidental.
   */
  public static xmlToAccidental(alter: number, accidentalName?: string): MicrotonalAccidental {
    // If exact name matches known MusicXML 4.0 names:
    if (accidentalName) {
      const lower = accidentalName.toLowerCase();
      if (lower === 'quarter-flat' || lower === 'slash-flat' || lower === 'half-flat') return '𝄳';
      if (lower === 'quarter-sharp' || lower === 'slash-sharp' || lower === 'half-sharp') return '𝄵';
      if (lower === 'flat-flat') return '𝄫';
      if (lower === 'double-sharp') return '𝄪';
      if (lower === 'flat') return '♭';
      if (lower === 'sharp') return '♯';
      if (lower === 'natural') return '♮';
    }

    // Match by numeric alter (semitones)
    const rounded = Math.round(alter * 2) / 2;
    if (rounded === -2.0) return '𝄫';
    if (rounded === -1.0) return '♭';
    if (rounded === -0.5) return '𝄳';
    if (rounded === 0.0) return '♮';
    if (rounded === 0.5) return '𝄵';
    if (rounded === 1.0) return '♯';
    if (rounded === 2.0) return '𝄪';

    return '♮';
  }

  /**
   * Normalizes note input which can be ArabicPitch or MusicXMLNoteInput.
   */
  public static normalizeNoteInput(
    item: ArabicPitch | MusicXMLNoteInput | { pitch: ArabicPitch; durationQuarter?: number; arabicName?: string }
  ): MusicXMLNoteInput {
    if (item instanceof ArabicPitch || (item && typeof item === 'object' && 'diatonic' in item && 'accidental' in item)) {
      return {
        pitch: item as ArabicPitch,
        durationQuarter: 1.0,
      };
    }
    const note = item as MusicXMLNoteInput;
    return {
      pitch: note.pitch,
      durationQuarter: typeof note.durationQuarter === 'number' && !isNaN(note.durationQuarter) ? note.durationQuarter : 1.0,
      arabicName: note.arabicName,
      lyric: note.lyric,
      isRest: note.isRest,
    };
  }

  /**
   * Validates melodic phrase notes, checking for empty phrases, unusual durations,
   * out-of-range octaves, and unsupported pitch data.
   */
  public static validatePhrase(
    notes: unknown[],
    options?: PhraseExportOptions
  ): MusicXMLValidationResult {
    const issues: MusicXMLValidationIssue[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const stats = {
      totalNotes: 0,
      totalDurationBeats: 0,
      estimatedMeasures: 0,
      quarterToneCount: 0,
      standardAccidentalCount: 0,
      naturalCount: 0,
    };

    if (!Array.isArray(notes) || notes.length === 0) {
      const msg = 'Melody phrase is empty. Cannot export an empty MusicXML score.';
      issues.push({
        severity: 'error',
        code: 'EMPTY_PHRASE',
        message: msg,
      });
      errors.push(msg);
      return {
        isValid: false,
        canExport: false,
        issues,
        errors,
        warnings,
        stats,
      };
    }

    const timeSig = options?.timeSignature || '4/4';
    const measureCapacity = timeSig === '4/4' ? 4.0 : timeSig === '3/4' ? 3.0 : timeSig === '2/4' ? 2.0 : timeSig === '6/8' ? 3.0 : 5.0;

    let accumulatedBeats = 0;
    stats.totalNotes = notes.length;

    notes.forEach((rawNote, idx) => {
      const noteNum = idx + 1;
      const normalized = this.normalizeNoteInput(rawNote as ArabicPitch | MusicXMLNoteInput);
      const pitch = normalized.pitch;
      const duration = normalized.durationQuarter ?? 1.0;

      // 1. Pitch validation
      if (!pitch || typeof pitch !== 'object') {
        const msg = `Note #${noteNum} has missing or malformed pitch data.`;
        issues.push({
          severity: 'error',
          code: 'INVALID_PITCH',
          message: msg,
          noteIndex: idx,
        });
        errors.push(msg);
      } else {
        if (!pitch.diatonic || !VALID_DIATONIC_BASES.has(pitch.diatonic)) {
          const msg = `Note #${noteNum} has unsupported diatonic step "${pitch.diatonic}". Must be one of A, B, C, D, E, F, G.`;
          issues.push({
            severity: 'error',
            code: 'INVALID_PITCH',
            message: msg,
            noteIndex: idx,
          });
          errors.push(msg);
        }

        if (!pitch.accidental || !VALID_ACCIDENTALS.has(pitch.accidental)) {
          const msg = `Note #${noteNum} has unsupported accidental "${pitch.accidental}". Supported: 𝄫, ♭, 𝄳, ♮, 𝄵, ♯, 𝄪.`;
          issues.push({
            severity: 'error',
            code: 'INVALID_PITCH',
            message: msg,
            noteIndex: idx,
          });
          errors.push(msg);
        } else {
          if (pitch.accidental === '𝄳' || pitch.accidental === '𝄵') {
            stats.quarterToneCount++;
          } else if (pitch.accidental === '♮') {
            stats.naturalCount++;
          } else {
            stats.standardAccidentalCount++;
          }
        }

        if (typeof pitch.octave !== 'number' || isNaN(pitch.octave) || pitch.octave < 1 || pitch.octave > 8) {
          const msg = `Note #${noteNum} has unusual octave (${pitch.octave}). Standard orchestral/Arabic range is octaves 2-7.`;
          issues.push({
            severity: 'warning',
            code: 'OCTAVE_OUT_OF_RANGE',
            message: msg,
            noteIndex: idx,
            details: { octave: pitch.octave },
          });
          warnings.push(msg);
        }
      }

      // 2. Duration validation
      if (typeof duration !== 'number' || isNaN(duration) || duration <= 0) {
        const msg = `Note #${noteNum} has non-positive or invalid duration (${duration} beats).`;
        issues.push({
          severity: 'error',
          code: 'NON_POSITIVE_DURATION',
          message: msg,
          noteIndex: idx,
        });
        errors.push(msg);
      } else {
        accumulatedBeats += duration;

        if (duration > measureCapacity) {
          const msg = `Note #${noteNum} duration (${duration} beats) exceeds measure capacity (${measureCapacity} beats) for ${timeSig}.`;
          issues.push({
            severity: 'warning',
            code: 'MEASURE_OVERFLOW',
            message: msg,
            noteIndex: idx,
          });
          warnings.push(msg);
        } else if (duration < 0.125) {
          const msg = `Note #${noteNum} duration (${duration} beats) is shorter than a 32nd note.`;
          issues.push({
            severity: 'warning',
            code: 'UNUSUAL_DURATION',
            message: msg,
            noteIndex: idx,
          });
          warnings.push(msg);
        } else {
          // Check standard binary / dotted subdivisions:
          // 4.0, 3.0, 2.0, 1.5, 1.0, 0.75, 0.5, 0.375, 0.25, 0.125
          const isStandardSubdivision = [
            4.0, 3.0, 2.0, 1.5, 1.0, 0.75, 0.5, 0.375, 0.25, 0.125,
          ].some((val) => Math.abs(duration - val) < 0.001);

          if (!isStandardSubdivision) {
            const msg = `Note #${noteNum} has non-standard duration (${duration} beats). It will be quantised to nearest division unit.`;
            issues.push({
              severity: 'info',
              code: 'NON_STANDARD_SUBDIVISION',
              message: msg,
              noteIndex: idx,
            });
          }
        }
      }
    });

    stats.totalDurationBeats = Math.round(accumulatedBeats * 100) / 100;
    stats.estimatedMeasures = Math.max(1, Math.ceil(accumulatedBeats / measureCapacity));

    const isValid = errors.length === 0;
    const canExport = isValid && stats.totalNotes > 0;

    return {
      isValid,
      canExport,
      issues,
      errors,
      warnings,
      stats,
    };
  }

  /**
   * Translates note duration in quarter-note beats to MusicXML divisions, note type, and dots.
   */
  public static durationToXmlAttributes(
    durationQuarter: number,
    divisions: number = MusicXMLExporter.DEFAULT_DIVISIONS
  ): { durationUnits: number; noteType: string; dots: number } {
    const safeDuration = Math.max(0.0625, durationQuarter);
    const durationUnits = Math.max(1, Math.round(safeDuration * divisions));

    let noteType: string;
    let dots = 0;

    if (safeDuration >= 3.8) {
      noteType = 'whole';
    } else if (safeDuration >= 2.8) {
      noteType = 'half';
      dots = 1;
    } else if (safeDuration >= 1.8) {
      noteType = 'half';
    } else if (safeDuration >= 1.4) {
      noteType = 'quarter';
      dots = 1;
    } else if (safeDuration >= 0.9) {
      noteType = 'quarter';
    } else if (safeDuration >= 0.7) {
      noteType = 'eighth';
      dots = 1;
    } else if (safeDuration >= 0.45) {
      noteType = 'eighth';
    } else if (safeDuration >= 0.35) {
      noteType = '16th';
      dots = 1;
    } else if (safeDuration >= 0.2) {
      noteType = '16th';
    } else {
      noteType = '32nd';
    }

    return { durationUnits, noteType, dots };
  }

  /**
   * Generates a fully compliant MusicXML 4.0 string for any Maqam scale (ascending + descending).
   * Escapes XML text and attribute values, sets tempo, and includes microtonal alteration.
   */
  public static generateScaleMusicXML(maqam: Maqam, options?: ScaleExportOptions): string {
    const divisions = options?.divisions || this.DEFAULT_DIVISIONS;
    const tempoBpm = options?.tempoBpm || 84;
    const partName = escapeXmlText(options?.partName || 'Violin');
    const partId = 'P1';

    const ascending = maqam.getScale();
    const direction = options?.direction || 'both';

    let allPitches: ArabicPitch[];
    if (direction === 'ascending') {
      allPitches = [...ascending];
    } else if (direction === 'descending') {
      allPitches = [...ascending].reverse();
    } else {
      const descending = [...ascending].reverse().slice(1);
      allPitches = [...ascending, ...descending];
    }

    const notesPerMeasure = 4;
    let measureIndex = 1;
    let measuresXml = '';

    const escapedMaqamName = escapeXmlText(maqam.name);
    const titleText = `${escapedMaqamName} - ${direction === 'both' ? 'Ascending &amp; Descending' : direction === 'ascending' ? 'Ascending Scale' : 'Descending Scale'}`;

    for (let i = 0; i < allPitches.length; i += notesPerMeasure) {
      const slice = allPitches.slice(i, i + notesPerMeasure);
      const isFirst = measureIndex === 1;

      measuresXml += `
    <measure number="${escapeXmlAttribute(String(measureIndex))}">
      ${
        isFirst
          ? `
      <attributes>
        <divisions>${divisions}</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${tempoBpm}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${tempoBpm}"/>
      </direction>`
          : ''
      }
      ${slice.map((p) => this.pitchToNoteXml(p, 1.0, divisions)).join('\n')}
    </measure>`;
      measureIndex++;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>${titleText}</work-title>
  </work>
  <part-list>
    <score-part id="${escapeXmlAttribute(partId)}">
      <part-name>${partName}</part-name>
      <score-instrument id="${escapeXmlAttribute(partId)}-I1">
        <instrument-name>${partName}</instrument-name>
      </score-instrument>
    </score-part>
  </part-list>
  <part id="${escapeXmlAttribute(partId)}">
    ${measuresXml}
  </part>
</score-partwise>`;
  }

  /**
   * Generates MusicXML 4.0 for an arbitrary melodic phrase (e.g. Sayr, Qafla, Sight-Reading).
   * Correctly preserves note durations, phrase timing, meters (4/4, 3/4, 2/4), tempo markings,
   * microtonal accidental alterations, and XML escaping.
   */
  public static generatePhraseMusicXML(
    title: string,
    notesOrPitches: (ArabicPitch | MusicXMLNoteInput | { pitch: ArabicPitch; durationQuarter?: number; arabicName?: string })[],
    options?: PhraseExportOptions
  ): string {
    const validation = this.validatePhrase(notesOrPitches, options);
    if (!validation.canExport) {
      throw new Error(`Cannot export MusicXML: ${validation.errors.join('; ')}`);
    }

    const divisions = options?.divisions || this.DEFAULT_DIVISIONS;
    const timeSig = options?.timeSignature || '4/4';
    const tempoBpm = options?.tempoBpm || 80;
    const partName = escapeXmlText(options?.partName || 'Violin');
    const partId = escapeXmlAttribute(options?.partId || 'P1');
    const escapedTitle = escapeXmlText(title || 'Melodic Phrase');

    let beats = 4;
    let beatType = 4;
    let measureCapacity = 4.0;

    if (timeSig === '3/4') {
      beats = 3;
      beatType = 4;
      measureCapacity = 3.0;
    } else if (timeSig === '2/4') {
      beats = 2;
      beatType = 4;
      measureCapacity = 2.0;
    } else if (timeSig === '6/8') {
      beats = 6;
      beatType = 8;
      measureCapacity = 3.0; // 6 eighths = 3 quarter beats
    } else if (timeSig === '10/8') {
      beats = 10;
      beatType = 8;
      measureCapacity = 5.0; // 10 eighths = 5 quarter beats
    }

    // Group notes into measures based on actual durations
    interface MeasureGroup {
      measureIndex: number;
      notes: MusicXMLNoteInput[];
    }

    const measures: MeasureGroup[] = [];
    let currentMeasureIndex = 1;
    let currentMeasureNotes: MusicXMLNoteInput[] = [];
    let currentMeasureBeats = 0;

    for (const raw of notesOrPitches) {
      const note = this.normalizeNoteInput(raw);
      const noteDuration = note.durationQuarter ?? 1.0;

      // If adding note would overflow measure and measure already has notes, close measure
      if (currentMeasureNotes.length > 0 && currentMeasureBeats + noteDuration > measureCapacity + 0.001) {
        measures.push({
          measureIndex: currentMeasureIndex,
          notes: currentMeasureNotes,
        });
        currentMeasureIndex++;
        currentMeasureNotes = [];
        currentMeasureBeats = 0;
      }

      currentMeasureNotes.push(note);
      currentMeasureBeats += noteDuration;

      // If measure reached or exceeded capacity, close it
      if (currentMeasureBeats >= measureCapacity - 0.001) {
        measures.push({
          measureIndex: currentMeasureIndex,
          notes: currentMeasureNotes,
        });
        currentMeasureIndex++;
        currentMeasureNotes = [];
        currentMeasureBeats = 0;
      }
    }

    // Push final remaining notes if any
    if (currentMeasureNotes.length > 0) {
      measures.push({
        measureIndex: currentMeasureIndex,
        notes: currentMeasureNotes,
      });
    }

    const measuresPerSystem = options?.measuresPerSystem;
    const conciseLyrics = Boolean(options?.conciseLyrics);

    let measuresXml = '';
    for (const measure of measures) {
      const isFirst = measure.measureIndex === 1;
      const shouldBreakSystem = !isFirst && measuresPerSystem === 1;
      const printBreakTag = shouldBreakSystem ? '\n      <print new-system="yes"/>' : '';

      measuresXml += `
    <measure number="${escapeXmlAttribute(String(measure.measureIndex))}">${printBreakTag}
      ${
        isFirst
          ? `
      <attributes>
        <divisions>${divisions}</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${tempoBpm}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${tempoBpm}"/>
      </direction>`
          : ''
      }
      ${measure.notes
        .map((n) => {
          const rawLyric = options?.includeLyrics !== false ? n.lyric || n.arabicName : undefined;
          const lyric = conciseLyrics && rawLyric ? MusicXMLExporter.formatConciseLyric(rawLyric) : rawLyric;
          return this.pitchToNoteXml(
            n.pitch,
            n.durationQuarter ?? 1.0,
            divisions,
            lyric
          );
        })
        .join('\n')}
    </measure>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>${escapedTitle}</work-title>
  </work>
  <part-list>
    <score-part id="${partId}">
      <part-name>${partName}</part-name>
      <score-instrument id="${partId}-I1">
        <instrument-name>${partName}</instrument-name>
      </score-instrument>
    </score-part>
  </part-list>
  <part id="${partId}">
    ${measuresXml}
  </part>
</score-partwise>`;
  }

  /**
   * Generates single <note> XML tag with accurate alter decimal, accidental text, duration, and type.
   */
  private static pitchToNoteXml(
    pitch: ArabicPitch,
    durationQuarter: number = 1.0,
    divisions: number = MusicXMLExporter.DEFAULT_DIVISIONS,
    lyric?: string
  ): string {
    const { alter, name } = this.accidentalToXml(pitch.accidental);
    const { durationUnits, noteType, dots } = this.durationToXmlAttributes(durationQuarter, divisions);

    const stepEscaped = escapeXmlText(pitch.diatonic);
    const alterTag = alter !== 0 ? `<alter>${alter.toFixed(1)}</alter>` : '';
    const dotsTag = dots > 0 ? '<dot/>'.repeat(dots) : '';
    const accidentalTag = pitch.accidental !== '♮' ? `<accidental>${name}</accidental>` : '';
    const lyricTag = lyric
      ? `<lyric number="1"><text>${escapeXmlText(lyric)}</text></lyric>`
      : '';

    return `      <note>
        <pitch>
          <step>${stepEscaped}</step>
          ${alterTag}
          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>${durationUnits}</duration>
        <type>${noteType}</type>
        ${dotsTag}
        ${accidentalTag}
        ${lyricTag}
      </note>`;
  }

  /**
   * Compacts long degree or phrase text into concise note labels for small screen notation.
   * e.g., 'القرار / Rast (Deg. 1)' -> 'Rast 1'
   */
  public static formatConciseLyric(lyric: string): string {
    if (!lyric || typeof lyric !== 'string') return '';
    const trimmed = lyric.trim();
    const degMatch = trimmed.match(/\b([A-Za-z]+)\s*\((?:Deg\.?|Oct\.?)\s*(\d+)\)/i);
    if (degMatch) {
      return `${degMatch[1]} ${degMatch[2]}`;
    }
    const slashParts = trimmed.split('/');
    if (slashParts.length >= 2) {
      const en = slashParts[1].replace(/\(.*?\)/g, '').trim();
      if (en) return en;
    }
    const clean = trimmed.replace(/\(.*?\)/g, '').trim();
    return clean.length > 10 ? clean.slice(0, 10).trim() : clean;
  }

  /**
   * Parses MusicXML 4.0 string back into structured representation,
   * preserving quarter tones, pitch spelling, and note durations.
   * Supports both browser DOMParser and Node.js environments.
   */
  public static parseMusicXML(xmlString: string): ParsedMusicXML {
    if (!xmlString || typeof xmlString !== 'string') {
      throw new Error('Invalid or empty MusicXML string');
    }

    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'application/xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error(`XML parsing error: ${parserError.textContent}`);
      }

      const workTitle = doc.querySelector('work-title')?.textContent?.trim() || '';
      const partName = doc.querySelector('part-name')?.textContent?.trim() || 'Violin';

      let divisions = this.DEFAULT_DIVISIONS;
      const divisionsEl = doc.querySelector('divisions');
      if (divisionsEl && divisionsEl.textContent) {
        const parsedDiv = parseInt(divisionsEl.textContent, 10);
        if (!isNaN(parsedDiv) && parsedDiv > 0) {
          divisions = parsedDiv;
        }
      }

      let beats = 4;
      let beatType = 4;
      const beatsEl = doc.querySelector('time > beats');
      const beatTypeEl = doc.querySelector('time > beat-type');
      if (beatsEl && beatsEl.textContent) beats = parseInt(beatsEl.textContent, 10) || 4;
      if (beatTypeEl && beatTypeEl.textContent) beatType = parseInt(beatTypeEl.textContent, 10) || 4;

      let tempoBpm: number | undefined;
      const soundEl = doc.querySelector('sound[tempo]');
      if (soundEl) {
        const tempoAttr = soundEl.getAttribute('tempo');
        if (tempoAttr) tempoBpm = parseFloat(tempoAttr);
      }

      const measures: ParsedMusicXMLMeasure[] = [];
      const allNotes: ParsedMusicXMLNote[] = [];

      const measureElements = doc.querySelectorAll('part > measure');
      measureElements.forEach((mEl) => {
        const mNumAttr = mEl.getAttribute('number');
        const measureNumber = mNumAttr ? parseInt(mNumAttr, 10) : measures.length + 1;
        const measureNotes: ParsedMusicXMLNote[] = [];

        const noteElements = mEl.querySelectorAll('note');
        noteElements.forEach((nEl) => {
          const isRest = nEl.querySelector('rest') !== null;
          const durationEl = nEl.querySelector('duration');
          const durationUnits = durationEl && durationEl.textContent ? parseInt(durationEl.textContent, 10) : divisions;
          const durationQuarter = durationUnits / divisions;
          const noteType = nEl.querySelector('type')?.textContent?.trim() || 'quarter';
          const dots = nEl.querySelectorAll('dot').length;
          const lyric = nEl.querySelector('lyric > text')?.textContent?.trim() || undefined;

          if (isRest) {
            const restNote: ParsedMusicXMLNote = {
              pitch: new ArabicPitch('C', '♮', 4),
              durationQuarter,
              durationDivisions: durationUnits,
              noteType,
              dots,
              isRest: true,
              lyric,
            };
            measureNotes.push(restNote);
            allNotes.push(restNote);
            return;
          }

          const stepText = nEl.querySelector('pitch > step')?.textContent?.trim() as DiatonicBase;
          const octaveText = nEl.querySelector('pitch > octave')?.textContent?.trim();
          const alterText = nEl.querySelector('pitch > alter')?.textContent?.trim();
          const accidentalText = nEl.querySelector('accidental')?.textContent?.trim();

          const step: DiatonicBase = VALID_DIATONIC_BASES.has(stepText) ? stepText : 'C';
          const octave = octaveText ? parseInt(octaveText, 10) : 4;
          const alter = alterText ? parseFloat(alterText) : 0.0;

          const accidental = this.xmlToAccidental(alter, accidentalText);
          const pitch = new ArabicPitch(step, accidental, octave);

          const parsedNote: ParsedMusicXMLNote = {
            pitch,
            durationQuarter,
            durationDivisions: durationUnits,
            noteType,
            dots,
            accidentalName: accidentalText,
            lyric,
            isRest: false,
          };

          measureNotes.push(parsedNote);
          allNotes.push(parsedNote);
        });

        measures.push({
          measureNumber,
          notes: measureNotes,
        });
      });

      return {
        workTitle,
        partName,
        divisions,
        beats,
        beatType,
        tempoBpm,
        measures,
        allNotes,
      };
    }

    // Node.js / non-browser regex fallback
    return this.parseMusicXMLRegex(xmlString);
  }

  /**
   * Deterministic regex parser for environments without native DOMParser (e.g. Node CLI, tests).
   */
  private static parseMusicXMLRegex(xml: string): ParsedMusicXML {
    const getTag = (source: string, tag: string): string => {
      const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(source);
      return match ? match[1].trim() : '';
    };

    const workTitle = getTag(xml, 'work-title');
    const partName = getTag(xml, 'part-name') || 'Violin';

    const divMatch = /<divisions>(\d+)<\/divisions>/i.exec(xml);
    const divisions = divMatch ? parseInt(divMatch[1], 10) : this.DEFAULT_DIVISIONS;

    const beatsMatch = /<beats>(\d+)<\/beats>/i.exec(xml);
    const beatTypeMatch = /<beat-type>(\d+)<\/beat-type>/i.exec(xml);
    const beats = beatsMatch ? parseInt(beatsMatch[1], 10) : 4;
    const beatType = beatTypeMatch ? parseInt(beatTypeMatch[1], 10) : 4;

    const soundMatch = /<sound[^>]*tempo="([^"]+)"/i.exec(xml);
    const tempoBpm = soundMatch ? parseFloat(soundMatch[1]) : undefined;

    const measures: ParsedMusicXMLMeasure[] = [];
    const allNotes: ParsedMusicXMLNote[] = [];

    const measureRegex = /<measure[^>]*number="?([^">\s]+)"?[^>]*>([\s\S]*?)<\/measure>/gi;
    let mMatch: RegExpExecArray | null;

    while ((mMatch = measureRegex.exec(xml)) !== null) {
      const mNum = parseInt(mMatch[1], 10) || measures.length + 1;
      const mContent = mMatch[2];
      const measureNotes: ParsedMusicXMLNote[] = [];

      const noteRegex = /<note[^>]*>([\s\S]*?)<\/note>/gi;
      let nMatch: RegExpExecArray | null;

      while ((nMatch = noteRegex.exec(mContent)) !== null) {
        const nContent = nMatch[1];
        const isRest = /<rest\s*\/?>/i.test(nContent);

        const durMatch = /<duration>(\d+)<\/duration>/i.exec(nContent);
        const durationUnits = durMatch ? parseInt(durMatch[1], 10) : divisions;
        const durationQuarter = durationUnits / divisions;

        const noteType = getTag(nContent, 'type') || 'quarter';
        const dots = (nContent.match(/<dot\s*\/?>/gi) || []).length;
        const lyric = getTag(getTag(nContent, 'lyric'), 'text') || undefined;

        if (isRest) {
          const restNote: ParsedMusicXMLNote = {
            pitch: new ArabicPitch('C', '♮', 4),
            durationQuarter,
            durationDivisions: durationUnits,
            noteType,
            dots,
            isRest: true,
            lyric,
          };
          measureNotes.push(restNote);
          allNotes.push(restNote);
          continue;
        }

        const stepText = getTag(getTag(nContent, 'pitch'), 'step') as DiatonicBase;
        const octaveText = getTag(getTag(nContent, 'pitch'), 'octave');
        const alterText = getTag(getTag(nContent, 'pitch'), 'alter');
        const accidentalText = getTag(nContent, 'accidental') || undefined;

        const step: DiatonicBase = VALID_DIATONIC_BASES.has(stepText) ? stepText : 'C';
        const octave = octaveText ? parseInt(octaveText, 10) : 4;
        const alter = alterText ? parseFloat(alterText) : 0.0;

        const accidental = this.xmlToAccidental(alter, accidentalText);
        const pitch = new ArabicPitch(step, accidental, octave);

        const parsedNote: ParsedMusicXMLNote = {
          pitch,
          durationQuarter,
          durationDivisions: durationUnits,
          noteType,
          dots,
          accidentalName: accidentalText,
          lyric,
          isRest: false,
        };

        measureNotes.push(parsedNote);
        allNotes.push(parsedNote);
      }

      measures.push({
        measureNumber: mNum,
        notes: measureNotes,
      });
    }

    return {
      workTitle,
      partName,
      divisions,
      beats,
      beatType,
      tempoBpm,
      measures,
      allNotes,
    };
  }

  /**
   * Verifies that quarter tones, pitch spelling, and note durations survive a round-trip
   * export and re-import via MusicXML 4.0.
   */
  public static verifyRoundTrip(
    originalNotes: (ArabicPitch | MusicXMLNoteInput | { pitch: ArabicPitch; durationQuarter?: number })[],
    exportedXml: string
  ): RoundTripReport {
    const failures: string[] = [];
    let exactPitchMatches = 0;
    let exactDurationMatches = 0;
    let quarterTonesPreserved = 0;

    let parsed: ParsedMusicXML;
    try {
      parsed = this.parseMusicXML(exportedXml);
    } catch (err) {
      return {
        success: false,
        notesTested: originalNotes.length,
        exactPitchMatches: 0,
        exactDurationMatches: 0,
        quarterTonesPreserved: 0,
        failures: [`XML Parsing Failed: ${String(err)}`],
      };
    }

    const nonRestParsedNotes = parsed.allNotes.filter((n) => !n.isRest);

    if (nonRestParsedNotes.length !== originalNotes.length) {
      failures.push(
        `Note count mismatch: original has ${originalNotes.length}, parsed has ${nonRestParsedNotes.length}`
      );
    }

    const count = Math.min(originalNotes.length, nonRestParsedNotes.length);

    for (let i = 0; i < count; i++) {
      const orig = this.normalizeNoteInput(originalNotes[i] as ArabicPitch | MusicXMLNoteInput);
      const imported = nonRestParsedNotes[i];

      const origPitch = orig.pitch;
      const impPitch = imported.pitch;

      const isQuarterTone = origPitch.accidental === '𝄳' || origPitch.accidental === '𝄵';

      // Check step and accidental spelling
      const spellingMatch =
        origPitch.diatonic === impPitch.diatonic &&
        origPitch.accidental === impPitch.accidental &&
        origPitch.octave === impPitch.octave;

      if (spellingMatch) {
        exactPitchMatches++;
        if (isQuarterTone) {
          quarterTonesPreserved++;
        }
      } else {
        failures.push(
          `Pitch mismatch at note #${i + 1}: expected ${origPitch.toString()} (${origPitch.toScientificString()}), received ${impPitch.toString()} (${impPitch.toScientificString()})`
        );
      }

      // Check duration match
      const expectedDur = orig.durationQuarter ?? 1.0;
      if (Math.abs(expectedDur - imported.durationQuarter) < 0.05) {
        exactDurationMatches++;
      } else {
        failures.push(
          `Duration mismatch at note #${i + 1}: expected ${expectedDur} beats, received ${imported.durationQuarter} beats`
        );
      }
    }

    const success = failures.length === 0 && exactPitchMatches === originalNotes.length;

    return {
      success,
      notesTested: originalNotes.length,
      exactPitchMatches,
      exactDurationMatches,
      quarterTonesPreserved,
      failures,
    };
  }
}
