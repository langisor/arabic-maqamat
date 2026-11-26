export interface MaqamScaleFixture {
  readonly id: string
  readonly tonic: string
  readonly steps: readonly number[]
  readonly pitches: readonly string[]
  readonly intervals: readonly number[]
}

export const MAQAM_SCALE_FIXTURES: readonly MaqamScaleFixture[] = [
  {
    id: "huzam",
    tonic: "E𝄳4",
    steps: [0, 3, 7, 9, 15, 17, 21, 24],
    pitches: ["E𝄳4", "F4", "G4", "A♭4", "B4", "C5", "D5", "E𝄳5"],
    intervals: [3, 4, 2, 6, 2, 4, 3],
  },
  {
    id: "rahat-al-arwah",
    tonic: "B𝄳3",
    steps: [0, 3, 7, 9, 15, 17, 21, 24],
    pitches: ["B𝄳3", "C4", "D4", "E♭4", "F♯4", "G4", "A4", "B𝄳4"],
    intervals: [3, 4, 2, 6, 2, 4, 3],
  },
] as const
