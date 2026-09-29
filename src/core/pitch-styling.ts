// src/core/pitch-styling.ts
import { ArabicPitch, MicrotonalAccidental } from './pitch';

export type AccidentalCategory = 
  | 'neutral-flat'   // Half-flat / quarter-tone flat (𝄳)
  | 'neutral-sharp'  // Half-sharp / quarter-tone sharp (𝄵)
  | 'natural'        // Natural (♮)
  | 'flat'           // Standard flat / double flat (♭, 𝄫)
  | 'sharp';         // Standard sharp / double sharp (♯, 𝄪)

export type PitchStyleVariant = 'subtle' | 'solid' | 'badge' | 'fingerboard' | 'card';

export interface PitchColorTokens {
  readonly category: AccidentalCategory;
  readonly isQuarterTone: boolean;
  readonly bg: string;
  readonly border: string;
  readonly text: string;
  readonly ring: string;
  readonly combined: string;
}

/**
 * Categorize any microtonal or standard accidental into one of the 5 core accidental types.
 */
export function getAccidentalCategory(accidental: MicrotonalAccidental): AccidentalCategory {
  switch (accidental) {
    case '𝄳':
      return 'neutral-flat';
    case '𝄵':
      return 'neutral-sharp';
    case '♭':
    case '𝄫':
      return 'flat';
    case '♯':
    case '𝄪':
      return 'sharp';
    case '♮':
    default:
      return 'natural';
  }
}

/**
 * Checks whether an accidental is microtonal (quarter-tone: 𝄳 or 𝄵).
 */
export function isMicrotonalAccidental(accidental: MicrotonalAccidental): boolean {
  return accidental === '𝄳' || accidental === '𝄵';
}

/**
 * Provides a localized descriptor for the accidental category.
 */
export function getAccidentalCategoryLabel(
  category: AccidentalCategory,
  language: 'en' | 'ar' = 'en'
): string {
  const labels: Record<AccidentalCategory, { en: string; ar: string }> = {
    'neutral-flat': { en: 'Half-Flat (𝄳)', ar: 'نصف بيمول (𝄳)' },
    'neutral-sharp': { en: 'Half-Sharp (𝄵)', ar: 'نصف دييز (𝄵)' },
    'natural': { en: 'Natural (♮)', ar: 'طبيعي (♮)' },
    'flat': { en: 'Flat (♭)', ar: 'بيمول (♭)' },
    'sharp': { en: 'Sharp (♯)', ar: 'دييز (♯)' }
  };
  return labels[category][language];
}

/**
 * Resolves unified styling classes for any ArabicPitch or accidental across the entire application.
 * Ensures consistent visual feedback for neutral half-flat, neutral half-sharp, naturals, flats, and sharps.
 */
export function getPitchThemeClasses(
  target: ArabicPitch | MicrotonalAccidental,
  variant: PitchStyleVariant = 'subtle',
  options: {
    isSounding?: boolean;
    isSelected?: boolean;
    isTonic?: boolean;
    isGhammaz?: boolean;
    hasHover?: boolean;
  } = {}
): PitchColorTokens {
  const accidental = target instanceof ArabicPitch ? target.accidental : target;
  const category = getAccidentalCategory(accidental);
  const isQuarter = isMicrotonalAccidental(accidental);
  const { hasHover = true } = options;

  let bg: string;
  let border: string;
  let text: string;
  let ring: string;

  switch (variant) {
    case 'solid':
      switch (category) {
        case 'neutral-flat':
          bg = 'bg-amber-500';
          border = 'border-amber-300';
          text = 'text-slate-950 font-black';
          ring = 'ring-2 ring-amber-400/70 shadow-amber-500/30';
          break;
        case 'neutral-sharp':
          bg = 'bg-orange-500';
          border = 'border-orange-300';
          text = 'text-slate-950 font-black';
          ring = 'ring-2 ring-orange-400/70 shadow-orange-500/30';
          break;
        case 'flat':
          bg = 'bg-sky-500';
          border = 'border-sky-300';
          text = 'text-slate-950 font-bold';
          ring = 'ring-2 ring-sky-400/40 shadow-sky-500/20';
          break;
        case 'sharp':
          bg = 'bg-rose-500';
          border = 'border-rose-300';
          text = 'text-white font-bold';
          ring = 'ring-2 ring-rose-400/40 shadow-rose-500/20';
          break;
        case 'natural':
        default:
          bg = 'bg-slate-700 dark:bg-slate-600';
          border = 'border-slate-500';
          text = 'text-white font-bold';
          ring = 'ring-1 ring-slate-400/30';
          break;
      }
      break;

    case 'badge':
      switch (category) {
        case 'neutral-flat':
          bg = 'bg-amber-500/20 dark:bg-amber-500/25';
          border = 'border-amber-500/50';
          text = 'text-amber-800 dark:text-amber-300 font-semibold';
          ring = 'ring-1 ring-amber-500/30';
          break;
        case 'neutral-sharp':
          bg = 'bg-orange-500/20 dark:bg-orange-500/25';
          border = 'border-orange-500/50';
          text = 'text-orange-800 dark:text-orange-300 font-semibold';
          ring = 'ring-1 ring-orange-500/30';
          break;
        case 'flat':
          bg = 'bg-sky-500/20 dark:bg-sky-500/25';
          border = 'border-sky-500/50';
          text = 'text-sky-800 dark:text-sky-300 font-semibold';
          ring = 'ring-1 ring-sky-500/30';
          break;
        case 'sharp':
          bg = 'bg-rose-500/20 dark:bg-rose-500/25';
          border = 'border-rose-500/50';
          text = 'text-rose-800 dark:text-rose-300 font-semibold';
          ring = 'ring-1 ring-rose-500/30';
          break;
        case 'natural':
        default:
          bg = 'bg-slate-100 dark:bg-slate-800/80';
          border = 'border-slate-300 dark:border-slate-700';
          text = 'text-slate-800 dark:text-slate-300';
          ring = 'ring-1 ring-slate-400/20';
          break;
      }
      break;

    case 'card':
      switch (category) {
        case 'neutral-flat':
          bg = 'bg-amber-500/10 dark:bg-amber-500/15';
          border = 'border-amber-500/40 dark:border-amber-500/40';
          text = 'text-amber-950 dark:text-amber-200';
          ring = 'hover:border-amber-500 dark:hover:border-amber-400';
          break;
        case 'neutral-sharp':
          bg = 'bg-orange-500/10 dark:bg-orange-500/15';
          border = 'border-orange-500/40 dark:border-orange-500/40';
          text = 'text-orange-950 dark:text-orange-200';
          ring = 'hover:border-orange-500 dark:hover:border-orange-400';
          break;
        case 'flat':
          bg = 'bg-sky-500/10 dark:bg-sky-500/15';
          border = 'border-sky-500/35 dark:border-sky-500/40';
          text = 'text-sky-950 dark:text-sky-200';
          ring = 'hover:border-sky-500 dark:hover:border-sky-400';
          break;
        case 'sharp':
          bg = 'bg-rose-500/10 dark:bg-rose-500/15';
          border = 'border-rose-500/35 dark:border-rose-500/40';
          text = 'text-rose-950 dark:text-rose-200';
          ring = 'hover:border-rose-500 dark:hover:border-rose-400';
          break;
        case 'natural':
        default:
          bg = 'bg-card dark:bg-slate-950/70';
          border = 'border-border dark:border-slate-800';
          text = 'text-foreground dark:text-slate-200';
          ring = 'hover:border-slate-400 dark:hover:border-slate-700';
          break;
      }
      break;

    case 'fingerboard':
      // Physical violin fingerboard marker disc
      switch (category) {
        case 'neutral-flat':
          bg = 'bg-amber-500';
          border = 'border-amber-200';
          text = 'text-slate-950 font-black';
          ring = 'ring-4 ring-amber-400/60 shadow-lg shadow-amber-500/30';
          break;
        case 'neutral-sharp':
          bg = 'bg-orange-500';
          border = 'border-orange-200';
          text = 'text-slate-950 font-black';
          ring = 'ring-4 ring-orange-400/60 shadow-lg shadow-orange-500/30';
          break;
        case 'flat':
          bg = 'bg-sky-600';
          border = 'border-sky-300';
          text = 'text-white font-bold';
          ring = 'ring-2 ring-sky-400/40 shadow-sm';
          break;
        case 'sharp':
          bg = 'bg-rose-600';
          border = 'border-rose-300';
          text = 'text-white font-bold';
          ring = 'ring-2 ring-rose-400/40 shadow-sm';
          break;
        case 'natural':
        default:
          bg = 'bg-slate-700';
          border = 'border-slate-400';
          text = 'text-slate-100 font-bold';
          ring = 'ring-2 ring-slate-500/40';
          break;
      }
      break;

    case 'subtle':
    default:
      switch (category) {
        case 'neutral-flat':
          bg = 'bg-amber-500/15 dark:bg-amber-500/20';
          border = 'border-amber-500/40 dark:border-amber-500/40';
          text = 'text-amber-900 dark:text-amber-300';
          ring = hasHover ? 'hover:bg-amber-500/25 hover:border-amber-500' : '';
          break;
        case 'neutral-sharp':
          bg = 'bg-orange-500/15 dark:bg-orange-500/20';
          border = 'border-orange-500/40 dark:border-orange-500/40';
          text = 'text-orange-900 dark:text-orange-300';
          ring = hasHover ? 'hover:bg-orange-500/25 hover:border-orange-500' : '';
          break;
        case 'flat':
          bg = 'bg-sky-500/15 dark:bg-sky-500/20';
          border = 'border-sky-500/40 dark:border-sky-500/40';
          text = 'text-sky-900 dark:text-sky-300';
          ring = hasHover ? 'hover:bg-sky-500/25 hover:border-sky-500' : '';
          break;
        case 'sharp':
          bg = 'bg-rose-500/15 dark:bg-rose-500/20';
          border = 'border-rose-500/40 dark:border-rose-500/40';
          text = 'text-rose-900 dark:text-rose-300';
          ring = hasHover ? 'hover:bg-rose-500/25 hover:border-rose-500' : '';
          break;
        case 'natural':
        default:
          bg = 'bg-slate-100 dark:bg-slate-900';
          border = 'border-slate-300 dark:border-slate-800';
          text = 'text-slate-800 dark:text-slate-200';
          ring = hasHover ? 'hover:border-slate-400 dark:hover:border-slate-700' : '';
          break;
      }
      break;
  }

  // Priority state overrides
  if (options.isSounding) {
    ring = `${ring} ring-4 ring-amber-300 dark:ring-amber-400 animate-pulse scale-105 z-30 shadow-xl`;
  }
  if (options.isSelected) {
    ring = `${ring} ring-2 ring-white dark:ring-white z-20 shadow-md`;
  }

  const combined = `${bg} ${border} ${text} ${ring}`.trim().replace(/\s+/g, ' ');

  return {
    category,
    isQuarterTone: isQuarter,
    bg,
    border,
    text,
    ring,
    combined
  };
}

/**
 * Returns violin fingerboard color class based on finger ergonomics AND accidental microtonality.
 * If the pitch is a quarter-tone (Half-Flat 𝄳 or Half-Sharp 𝄵), it receives the unified amber/orange highlight.
 * Open strings (0) retain emerald, and numbered fingers 1-4 retain their positions unless microtonally altered.
 */
export function getViolinNoteColorClass(
  finger: number,
  accidental: MicrotonalAccidental
): string {
  const category = getAccidentalCategory(accidental);

  if (category === 'neutral-flat') {
    return 'bg-amber-500 text-slate-950 border-amber-200 ring-4 ring-amber-400/60 font-black shadow-lg';
  }
  if (category === 'neutral-sharp') {
    return 'bg-orange-500 text-slate-950 border-orange-200 ring-4 ring-orange-400/60 font-black shadow-lg';
  }

  if (finger === 0) {
    return 'bg-emerald-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/40';
  }

  switch (finger) {
    case 1:
      return 'bg-sky-500 text-slate-950 border-sky-300 ring-2 ring-sky-400/30';
    case 2:
      return 'bg-indigo-500 text-slate-100 border-indigo-300 ring-2 ring-indigo-400/30';
    case 3:
      return 'bg-fuchsia-500 text-slate-100 border-fuchsia-300 ring-2 ring-fuchsia-400/30';
    case 4:
      return 'bg-purple-500 text-slate-100 border-purple-300 ring-2 ring-purple-400/30';
    default:
      return 'bg-slate-600 text-slate-100';
  }
}
