// src/types/maqam.ts

export type TuningSystem = '24-EDO' | '12-TET';
export type ViolinTuningPreset = 'standard' | 'arabic'; // standard: G3 D4 A4 E5, arabic: G3 D4 G4 D5

export interface MicrotoneNote {
  name: string;              // Western representation e.g. "Ed", "F#", "Bd"
  arabicName: string;        // Historical Arabic name e.g. "Sikah", "Rast", "Dukah"
  quarterIndex: number;      // 0 to 23 relative to C (each step = 50 cents)
  accidental: 'natural' | 'flat' | 'half-flat' | 'sharp' | 'half-sharp';
  cents: number;             // Offset in cents from C within the octave
}

export interface Jins {
  name: string;
  tonicArabicName: string;
  intervalsInCents: number[]; // e.g. [150, 150, 200] for Rast
  description: string;
}

export interface MaqamScale {
  id: string;
  name: string;
  arabicName: string;
  family: 'Rast' | 'Bayati' | 'Sikah' | 'Hijaz' | 'Nahwand' | 'Kurd' | 'Saba' | 'Ajam';
  tonicNote: string;         // e.g. "C4", "D4", "Ed4", "Bb3"
  tonicArabicName: string;   // e.g. "Rast", "Dukah", "Sikah"
  ghammazArabicName: string; // Dominant/modulation degree e.g. "Nawa"
  scaleNotes: string[];      // Array of note names ascending e.g. ["C4", "D4", "Ed4", "F4", "G4", "A4", "Bd4", "C5"]
  descendingNotes?: string[];// Specific descending pathway if different (e.g. Nahwand, Hijaz, Rast)
  jinsAsl: Jins;             // Root jins
  jinsFar: Jins;             // Secondary jins
  sayrNotes: string;         // Melodic movement guidance
  theoreticalNote?: string;
}

// 24 Quarter-Tone pitch map with Arabic note names across the central registers
export const ARABIC_NOTE_DICTIONARY: Record<string, { arabic: string; accidental: MicrotoneNote['accidental'] }> = {
  // Octave 3 (Qarar)
  "C3": { arabic: "qarar Rast (قرار راست)", accidental: "natural" },
  "D3": { arabic: "qarar Dukah (قرار دوكاه)", accidental: "natural" },
  "Ed3": { arabic: "qarar Sikah (قرار سيكاه)", accidental: "half-flat" },
  "F3": { arabic: "qarar Jiharkah (قرار جهاركاه)", accidental: "natural" },
  "G3": { arabic: "Yakah (يكاه)", accidental: "natural" },
  "G#3": { arabic: "qarar Hisar (قرار حصار)", accidental: "sharp" },
  "Ab3": { arabic: "qarar Hisar (قرار حصار)", accidental: "flat" },
  "Gd3": { arabic: "qarar nim Hisar (قرار نيم حصار)", accidental: "half-flat" },
  "A3": { arabic: "Ushayran (عشيران)", accidental: "natural" },
  "Bb3": { arabic: "qarar Ajam (قرار عجم)", accidental: "flat" },
  "Ad3": { arabic: "qarar nim Ajam (قرار نيم عجم)", accidental: "half-flat" },
  "B3": { arabic: "Kawasht (كواشت)", accidental: "natural" },
  "Bd3": { arabic: "Iraq (عراق)", accidental: "half-flat" },

  // Octave 4 (Wast)
  "C4": { arabic: "Rast (راست)", accidental: "natural" },
  "C#4": { arabic: "Zirkulah (زركولاه)", accidental: "sharp" },
  "Cd4": { arabic: "nim Zirkulah (نيم زركولاه)", accidental: "half-flat" },
  "D4": { arabic: "Dukah (دوكاه)", accidental: "natural" },
  "Eb4": { arabic: "Kurd (كرد)", accidental: "flat" },
  "Ed4": { arabic: "Sikah (سيكاه)", accidental: "half-flat" },
  "E4": { arabic: "Busalik (بوسليك)", accidental: "natural" },
  "F4": { arabic: "Jiharkah (جهاركاه)", accidental: "natural" },
  "F#4": { arabic: "Hijaz (حجاز)", accidental: "sharp" },
  "Fd4": { arabic: "nim Hijaz (نيم حجاز)", accidental: "half-flat" },
  "Gb4": { arabic: "Saba / Kawasht (صبا)", accidental: "flat" },
  "G4": { arabic: "Nawa (نوى)", accidental: "natural" },
  "G#4": { arabic: "Hisar (حصار)", accidental: "sharp" },
  "Ab4": { arabic: "Hisar (حصار)", accidental: "flat" },
  "Gd4": { arabic: "nim Hisar (نيم حصار)", accidental: "half-flat" },
  "A4": { arabic: "Husayni (حسيني)", accidental: "natural" },
  "Bb4": { arabic: "Ajam (عجم)", accidental: "flat" },
  "Ad4": { arabic: "nim Ajam (نيم عجم)", accidental: "half-flat" },
  "B4": { arabic: "Mahuran (ماهوران)", accidental: "natural" },
  "Bd4": { arabic: "Awj (أوج)", accidental: "half-flat" },

  // Octave 5 (Jawab)
  "C5": { arabic: "Kirdan (كردان)", accidental: "natural" },
  "C#5": { arabic: "Shahnaz (شهناز)", accidental: "sharp" },
  "Cd5": { arabic: "nim Shahnaz (نيم شهناز)", accidental: "half-flat" },
  "Db5": { arabic: "nim Muhayar (نيم محير)", accidental: "flat" },
  "D5": { arabic: "Muhayar (محير)", accidental: "natural" },
  "Eb5": { arabic: "Sunbulah (سنبلة)", accidental: "flat" },
  "Ed5": { arabic: "Buzurk (بزرك)", accidental: "half-flat" },
  "E5": { arabic: "jawab Busalik (جواب بوسليك)", accidental: "natural" },
  "F5": { arabic: "jawab Jiharkah (جواب جهاركاه)", accidental: "natural" },
  "F#5": { arabic: "jawab Hijaz (جواب حجاز)", accidental: "sharp" },
  "G5": { arabic: "jawab Nawa (جواب نوى)", accidental: "natural" },
  "A5": { arabic: "jawab Husayni (جواب حسيني)", accidental: "natural" }
};
