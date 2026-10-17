import { ArabicPitch, type DiatonicBase } from "../core/pitch"

const DIATONIC_ORDER: Record<DiatonicBase, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

export function calculateStaffY(pitch: ArabicPitch): {
  step: number
  y: number
} {
  const step = (pitch.octave - 4) * 7 + DIATONIC_ORDER[pitch.diatonic]
  const y = 136 - step * 8
  return { step, y }
}
