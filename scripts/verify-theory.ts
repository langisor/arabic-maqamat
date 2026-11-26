import { MaqamatCatalogue } from "../src/theory/maqam.ts"
import { MAQAM_SCALE_FIXTURES } from "../src/theory/maqam-fixtures.ts"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

for (const fixture of MAQAM_SCALE_FIXTURES) {
  const maqam = MaqamatCatalogue.findById(fixture.id)
  assert(maqam, `Missing catalogue Maqam: ${fixture.id}`)

  const pitches = maqam.getScale()
  const pitchStrings = pitches.map((pitch) => pitch.toString())
  const tonicOffset = maqam.getTonic().toQuarterToneIndex()
  const steps = pitches.map(
    (pitch) => pitch.toQuarterToneIndex() - tonicOffset
  )
  const intervals = maqam.getIntervals()

  assert(
    pitchStrings.join("|") === fixture.pitches.join("|"),
    `${fixture.id}: pitch mismatch\nExpected: ${fixture.pitches.join("-")}\nActual: ${pitchStrings.join("-")}`
  )
  assert(
    steps.join("|") === fixture.steps.join("|"),
    `${fixture.id}: 24-EDO step mismatch\nExpected: ${fixture.steps.join("-")}\nActual: ${steps.join("-")}`
  )
  assert(
    intervals.join("|") === fixture.intervals.join("|"),
    `${fixture.id}: interval mismatch\nExpected: ${fixture.intervals.join("-")}\nActual: ${intervals.join("-")}`
  )
}

console.log("Verified Huzam and Rahat al-Arwah theory fixtures.")
