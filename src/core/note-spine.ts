// src/core/note-spine.ts
import { ArabicPitch } from './pitch';

export interface ArabicNoteInfo {
  readonly arabicName: string;
  readonly transliteration: string;
  readonly pitch: ArabicPitch;
  readonly roleDescription: string;
}

/**
 * Traditional Note Spine as detailed in Level 2, Module 6.
 * Pitch reference centered around Rast = C4.
 */
export class ArabicNoteSpine {
  private static readonly SPINE: ArabicNoteInfo[] = [
    { arabicName: 'يكاه', transliteration: 'Yakah', pitch: new ArabicPitch('G', '♮', 3), roleDescription: 'G below Rast' },
    { arabicName: 'عشيران', transliteration: 'Ushayran', pitch: new ArabicPitch('A', '♮', 3), roleDescription: 'A below Rast' },
    { arabicName: 'عراق', transliteration: "‘Iraq", pitch: new ArabicPitch('B', '𝄳', 3), roleDescription: 'Neutral 7th below Rast' },
    { arabicName: 'راست', transliteration: 'Rast', pitch: new ArabicPitch('C', '♮', 4), roleDescription: 'Tonic base / Fundamental' },
    { arabicName: 'دوكاه', transliteration: 'Dukah', pitch: new ArabicPitch('D', '♮', 4), roleDescription: 'Root for Bayati, Hijaz, Kurd, Saba' },
    { arabicName: 'سيكاه', transliteration: 'Sikah', pitch: new ArabicPitch('E', '𝄳', 4), roleDescription: 'Neutral third above Rast' },
    { arabicName: 'جهاركاه', transliteration: 'Jiharkah', pitch: new ArabicPitch('F', '♮', 4), roleDescription: 'Subdominant 4th' },
    { arabicName: 'نوى', transliteration: 'Nawa', pitch: new ArabicPitch('G', '♮', 4), roleDescription: 'Upper 5th / Octave of Yakah' },
    { arabicName: 'حسيني', transliteration: 'Husayni', pitch: new ArabicPitch('A', '♮', 4), roleDescription: '6th scale degree above Rast' },
    { arabicName: 'أوج', transliteration: 'Awj', pitch: new ArabicPitch('B', '𝄳', 4), roleDescription: 'Upper neutral 7th' },
    { arabicName: 'كردان', transliteration: 'Kirdan', pitch: new ArabicPitch('C', '♮', 5), roleDescription: 'Octave above Rast' },
    { arabicName: 'محير', transliteration: 'Muhayyar', pitch: new ArabicPitch('D', '♮', 5), roleDescription: 'Octave above Dukah' }
  ];

  public static getSpine(): readonly ArabicNoteInfo[] {
    return this.SPINE;
  }

  public static findByPitch(pitch: ArabicPitch): ArabicNoteInfo | undefined {
    return this.SPINE.find(entry => entry.pitch.equals(pitch));
  }

  public static findByName(name: string): ArabicNoteInfo | undefined {
    const query = name.trim().toLowerCase();
    return this.SPINE.find(
      entry => entry.transliteration.toLowerCase() === query || entry.arabicName === query
    );
  }

  public static resolveDegreeName(pitch: ArabicPitch): string {
    const found = this.findByPitch(pitch);
    return found ? `${found.transliteration} (${pitch.toString()})` : pitch.toString();
  }
}
