// src/components/ui/PitchBadge.tsx
import React from 'react';
import { ArabicPitch, getAccidentalLabel } from '../../core/pitch';
import { getPitchThemeClasses, PitchStyleVariant } from '../../core/pitch-styling';
import { ArabicNoteSpine } from '../../core/note-spine';

export interface PitchBadgeProps {
  readonly pitch: ArabicPitch;
  readonly variant?: PitchStyleVariant;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly showOctave?: boolean;
  readonly showFrequency?: boolean;
  readonly showCents?: boolean;
  readonly showArabicSpine?: boolean;
  readonly arabicSpineName?: string;
  readonly badgeLabel?: string | number;
  readonly badgeColor?: 'emerald' | 'sky' | 'amber' | 'purple' | 'slate';
  readonly isActive?: boolean;
  readonly isSelected?: boolean;
  readonly isTonic?: boolean;
  readonly isGhammaz?: boolean;
  readonly onClick?: () => void;
  readonly className?: string;
  readonly title?: string;
  readonly ariaLabel?: string;
  readonly children?: React.ReactNode;
}

const BADGE_COLOR_CLASSES: Record<'emerald' | 'sky' | 'amber' | 'purple' | 'slate', string> = {
  emerald: 'bg-emerald-500 text-slate-950',
  sky: 'bg-sky-500 text-slate-950',
  amber: 'bg-amber-500 text-slate-950',
  purple: 'bg-purple-500 text-white',
  slate: 'bg-slate-700 text-white'
};

export const PitchBadge: React.FC<PitchBadgeProps> = ({
  pitch,
  variant = 'subtle',
  size = 'md',
  showOctave = true,
  showFrequency = false,
  showCents = false,
  showArabicSpine = false,
  arabicSpineName,
  badgeLabel,
  badgeColor = 'amber',
  isActive = false,
  isSelected = false,
  isTonic = false,
  isGhammaz = false,
  onClick,
  className = '',
  title,
  ariaLabel,
  children
}) => {
  const styling = getPitchThemeClasses(pitch, variant, {
    isSounding: isActive,
    isSelected,
    isTonic,
    isGhammaz,
    hasHover: Boolean(onClick)
  });

  const spine = showArabicSpine
    ? (arabicSpineName || ArabicNoteSpine.findByPitch(pitch)?.transliteration || '')
    : null;

  // Resolve accessible descriptive label
  const accDescription = getAccidentalLabel(pitch.accidental, 'en');
  const accessibleName = ariaLabel || `${pitch.toScientificString()} (${accDescription}), octave ${pitch.octave}, ${pitch.toFrequency().toFixed(1)} Hertz`;

  // Size variations
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1 min-h-7',
    md: 'px-2.5 py-1.5 text-xs sm:text-sm gap-1.5 min-h-9',
    lg: 'px-3.5 py-2.5 text-sm sm:text-base gap-2 min-h-12'
  }[size];

  // Indicator badge if present or derived from tonic/ghammaz
  const resolvedBadgeLabel = badgeLabel ?? (isTonic ? '1' : isGhammaz ? 'G' : null);
  const resolvedBadgeColor = badgeColor ?? (isTonic ? 'emerald' : isGhammaz ? 'sky' : 'amber');

  const content = (
    <>
      <div className="flex items-center gap-1">
        <span className="font-mono font-bold">
          {pitch.toScientificString()}
        </span>

        {showOctave && (
          <span className="text-[10px] opacity-75 font-mono">
            {pitch.octave}
          </span>
        )}

        {resolvedBadgeLabel && (
          <span
            className={`rounded px-1 text-[9px] font-black uppercase tracking-tight shadow-xs ${BADGE_COLOR_CLASSES[resolvedBadgeColor]}`}
          >
            {resolvedBadgeLabel}
          </span>
        )}
      </div>

      {showFrequency && (
        <span className="text-[10px] font-mono opacity-80">
          {pitch.toFrequency().toFixed(1)} Hz
        </span>
      )}

      {showCents && (
        <span className="text-[10px] font-mono opacity-80">
          {pitch.toOctaveCents()}¢
        </span>
      )}

      {spine && (
        <span className="text-[10px] font-serif opacity-80 truncate max-w-28">
          {spine}
        </span>
      )}

      {children}
    </>
  );

  const containerClasses = `inline-flex flex-col items-center justify-center rounded-xl border transition-all select-none ${styling.combined} ${sizeClasses} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={accessibleName}
        aria-pressed={isActive || isSelected}
        title={title || accessibleName}
        className={`${containerClasses} cursor-pointer active:scale-95 touch-manipulation`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      title={title || accessibleName}
      aria-label={accessibleName}
      className={containerClasses}
    >
      {content}
    </div>
  );
};
