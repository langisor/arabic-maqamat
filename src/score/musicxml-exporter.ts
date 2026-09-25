// src/score/musicxml-exporter.ts
import { ArabicPitch, type MicrotonalAccidental } from '../core/pitch';
import { Maqam } from '../theory/maqam';

export class MusicXMLExporter {
  private static accidentalToXml(acc: MicrotonalAccidental): { alter: number; name: string } {
    switch (acc) {
      case '𝄫': return { alter: -2.0, name: 'flat-flat' };
      case '♭': return { alter: -1.0, name: 'flat' };
      case '𝄳': return { alter: -0.5, name: 'quarter-flat' };
      case '♮': return { alter: 0.0, name: 'natural' };
      case '𝄵': return { alter: 0.5, name: 'quarter-sharp' };
      case '♯': return { alter: 1.0, name: 'sharp' };
      case '𝄪': return { alter: 2.0, name: 'double-sharp' };
    }
  }

  /**
   * Generates a fully compliant MusicXML 4.0 string for any Maqam scale (ascending + descending).
   */
  public static generateScaleMusicXML(maqam: Maqam): string {
    const ascending = maqam.getScale();
    const descending = [...ascending].reverse().slice(1);
    const allPitches = [...ascending, ...descending];

    let measuresXml = '';
    const notesPerMeasure = 4;
    let measureIndex = 1;

    for (let i = 0; i < allPitches.length; i += notesPerMeasure) {
      const slice = allPitches.slice(i, i + notesPerMeasure);
      measuresXml += `
    <measure number="${measureIndex}">
      ${measureIndex === 1 ? `
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>` : ''}
      ${slice.map(p => this.pitchToNoteXml(p)).join('\n')}
    </measure>`;
      measureIndex++;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>${maqam.name} - Ascending &amp; Descending</work-title></work>
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    ${measuresXml}
  </part>
</score-partwise>`;
  }

  /**
   * Generates MusicXML 4.0 for an arbitrary melodic phrase (e.g. Sayr or Qafla).
   */
  public static generatePhraseMusicXML(title: string, pitches: ArabicPitch[]): string {
    let measuresXml = '';
    const notesPerMeasure = 4;
    let measureIndex = 1;

    for (let i = 0; i < pitches.length; i += notesPerMeasure) {
      const slice = pitches.slice(i, i + notesPerMeasure);
      measuresXml += `
    <measure number="${measureIndex}">
      ${measureIndex === 1 ? `
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>` : ''}
      ${slice.map(p => this.pitchToNoteXml(p)).join('\n')}
    </measure>`;
      measureIndex++;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>${title}</work-title></work>
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    ${measuresXml}
  </part>
</score-partwise>`;
  }

  private static pitchToNoteXml(pitch: ArabicPitch): string {
    const { alter, name } = this.accidentalToXml(pitch.accidental);
    return `
      <note>
        <pitch>
          <step>${pitch.diatonic}</step>
          ${alter !== 0 ? `<alter>${alter.toFixed(1)}</alter>` : ''}
          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
        ${pitch.accidental !== '♮' ? `<accidental>${name}</accidental>` : ''}
      </note>`;
  }
}
