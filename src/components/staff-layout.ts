import { ArabicPitch, type DiatonicBase } from "../core/pitch"

const DIATONIC_ORDER: Record<DiatonicBase, number> = {
  // Natural-letter order matches ascending staff positions, independent of accidentals.
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

/**
 * Convert a pitch into its diatonic staff position and SVG y-coordinate.
 *
 * The reference position is C4 at y=136 (step 0). Each letter/octave step
 * moves by 8 SVG units, half the 16-unit spacing between the staff lines.
 * Accidentals do not affect vertical placement: they change pitch height
 * chromatically, but a note's written letter and octave determine its staff slot.
 */
export function calculateStaffY(pitch: ArabicPitch): {
  step: number
  y: number
} {
  // Count seven letter positions per octave relative to C4, then invert the
  // direction because SVG y coordinates increase downward on the screen.
  const step = (pitch.octave - 4) * 7 + DIATONIC_ORDER[pitch.diatonic]
  const y = 136 - step * 8
  return { step, y }
}
