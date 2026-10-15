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
  family: 'Rast' | 'Bayati' | 'Sikah' | 'Hijaz' | 'Nahawand' | 'Kurd' | 'Nikriz' | 'Ajam' | 'None';
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
  "C3": { arabic: "قرار راست (qarar Rast)", accidental: "natural" },
  "D3": { arabic: "قرار دوكاه (qarar Dukah)", accidental: "natural" },
  "Ed3": { arabic: "قرار سيكاه (qarar Sikah)", accidental: "half-flat" },
  "F3": { arabic: "قرار جهاركاه (qarar Jiharkah)", accidental: "natural" },
  "G3": { arabic: "يكاه (Yakah)", accidental: "natural" },
  "G#3": { arabic: "قرار حصار (qarar Hisar)", accidental: "sharp" },
  "Ab3": { arabic: "قرار حصار (qarar Hisar)", accidental: "flat" },
  "Gd3": { arabic: "قرار نيم حصار (qarar nim Hisar)", accidental: "half-flat" },
  "A3": { arabic: "عشيران (Ushayran)", accidental: "natural" },
  "Bb3": { arabic: "قرار عجم (qarar Ajam)", accidental: "flat" },
  "Ad3": { arabic: "قرار نيم عجم (qarar nim Ajam)", accidental: "half-flat" },
  "B3": { arabic: "كواشت (Kawasht)", accidental: "natural" },
  "Bd3": { arabic: "عراق (Iraq)", accidental: "half-flat" },
  
  // Octave 4 (Wast)
  "C4": { arabic: "راست (Rast)", accidental: "natural" },
  "C#4": { arabic: "زركلاه (Zirkulah)", accidental: "sharp" },
  "Cd4": { arabic: "نيم زركلاه (nim Zirkulah)", accidental: "half-flat" },
  "D4": { arabic: "دوكاه (Dukah)", accidental: "natural" },
  "Eb4": { arabic: "كردي (Kurd)", accidental: "flat" },
  "Ed4": { arabic: "سيكاه (Sikah)", accidental: "half-flat" },
  "E4": { arabic: "بوسليك (Busalik)", accidental: "natural" },
  "F4": { arabic: "جهاركاه (Jiharkah)", accidental: "natural" },
  "F#4": { arabic: "حجاز (Hijaz)", accidental: "sharp" },
  "Fd4": { arabic: "نيم حجاز (nim Hijaz)", accidental: "half-flat" },
  "Gb4": { arabic: "صبا / كواشت (Saba / Kawasht)", accidental: "flat" },
  "G4": { arabic: "نوى (Nawa)", accidental: "natural" },
  "G#4": { arabic: "حصار (Hisar)", accidental: "sharp" },
  "Ab4": { arabic: "حصار (Hisar)", accidental: "flat" },
  "Gd4": { arabic: "نيم حصار (nim Hisar)", accidental: "half-flat" },
  "A4": { arabic: "حسيني (Husayni)", accidental: "natural" },
  "Bb4": { arabic: "عجم (Ajam)", accidental: "flat" },
  "Ad4": { arabic: "نيم عجم (nim Ajam)", accidental: "half-flat" },
  "B4": { arabic: "ماهوران (Mahuran)", accidental: "natural" },
  "Bd4": { arabic: "أوج (Awj)", accidental: "half-flat" },

  // Octave 5 (Jawab)
  "C5": { arabic: "كردان (Kirdan)", accidental: "natural" },
  "C#5": { arabic: "شاهناز (Shahnaz)", accidental: "sharp" },
  "Cd5": { arabic: "نيم شاهناز (nim Shahnaz)", accidental: "half-flat" },
  "Db5": { arabic: "نيم محير (nim Muhayar)", accidental: "flat" },
  "D5": { arabic: "محير (Muhayar)", accidental: "natural" },
  "Eb5": { arabic: "سنبلة (Sunbulah)", accidental: "flat" },
  "Ed5": { arabic: "بزرك (Buzurk)", accidental: "half-flat" },
  "E5": { arabic: "جواب بوسليك (jawab Busalik)", accidental: "natural" },
  "F5": { arabic: "جواب جهاركاه (jawab Jiharkah)", accidental: "natural" },
  "F#5": { arabic: "جواب حجاز (jawab Hijaz)", accidental: "sharp" },
  "G5": { arabic: "جواب نوى (jawab Nawa)", accidental: "natural" },
  "A5": { arabic: "جواب حسيني (jawab Husayni)", accidental: "natural" }
};
