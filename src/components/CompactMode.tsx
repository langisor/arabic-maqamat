import { useMemo, useState } from "react"
import { ArabicPitch } from "../core/pitch"
import type { DiatonicBase, MicrotonalAccidental } from "../core/pitch"
import { ArabicNoteSpine } from "../core/note-spine"
import type { TimbreType } from "../audio/microtonal-audio"
import type { ViolinTuningPreset } from "./ViolinFingerboard"
import type { Maqam } from "../theory/maqam"
import { MaqamatCatalogue } from "../theory/maqam"
import { Button } from "./ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { FreeInteractiveFingerboard } from "./FreeInteractiveFingerboard"
import { useLanguage } from "../state/language"

interface CompactModeProps {
  currentMaqam: Maqam
  onSelectMaqam: (maqam: Maqam) => void
  instrument: TimbreType
  onInstrumentChange: (instrument: TimbreType) => void
  violinTuning: ViolinTuningPreset
  onViolinTuningChange: (tuning: ViolinTuningPreset) => void
}

const MAX_CUSTOM_PITCHES = 16
const MAX_CUSTOM_SPAN_QUARTER_TONES = 48
const MIN_ROOT_INDEX = 24
const MAX_ROOT_INDEX = 24 * 8 + 23

export function CompactMode({
  currentMaqam,
  onSelectMaqam,
  instrument,
  onInstrumentChange,
  violinTuning,
  onViolinTuningChange,
}: CompactModeProps) {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const [isCustomSheetOpen, setIsCustomSheetOpen] = useState(false)
  const [customPitches, setCustomPitches] = useState<ArabicPitch[]>([])
  const [draftPitches, setDraftPitches] = useState<ArabicPitch[]>([])
  const [nextPitchIndex, setNextPitchIndex] = useState("")
  const [customError, setCustomError] = useState<string | null>(null)
  const [targetDiatonic, setTargetDiatonic] = useState<DiatonicBase>(
    currentMaqam.getTonic().diatonic
  )
  const [targetAccidental, setTargetAccidental] =
    useState<MicrotonalAccidental>(currentMaqam.getTonic().accidental)
  const [targetOctave, setTargetOctave] = useState(
    currentMaqam.getTonic().octave
  )

  const maqams = useMemo(() => {
    const catalogueMaqams = MaqamatCatalogue.getAll()
    return catalogueMaqams.some((maqam) => maqam.id === currentMaqam.id)
      ? catalogueMaqams
      : [currentMaqam, ...catalogueMaqams]
  }, [currentMaqam])

  const rootOptions = useMemo(() => {
    const indexes = Array.from(
      { length: MAX_ROOT_INDEX - MIN_ROOT_INDEX + 1 },
      (_, index) => MIN_ROOT_INDEX + index
    )
    const tonicIndex = currentMaqam.getTonic().toQuarterToneIndex()
    if (!indexes.includes(tonicIndex)) indexes.push(tonicIndex)
    return indexes.sort((a, b) => a - b)
  }, [currentMaqam])

  const currentRootIndex =
    draftPitches[0]?.toQuarterToneIndex() ??
    currentMaqam.getTonic().toQuarterToneIndex()
  const lastDraftPitch = draftPitches[draftPitches.length - 1]
  const lastDraftIndex =
    lastDraftPitch?.toQuarterToneIndex() ?? currentRootIndex
  const availableNextIndexes = Array.from(
    {
      length: Math.max(
        0,
        currentRootIndex + MAX_CUSTOM_SPAN_QUARTER_TONES - lastDraftIndex
      ),
    },
    (_, index) => lastDraftIndex + index + 1
  )
  const baseMaqam = useMemo(() => {
    const baseId = currentMaqam.id.split("-transposed-")[0]
    return MaqamatCatalogue.findById(baseId) ?? currentMaqam
  }, [currentMaqam])
  const originalTonic = baseMaqam.getTonic()
  const currentTonic = currentMaqam.getTonic()
  const targetTonic = new ArabicPitch(
    targetDiatonic,
    targetAccidental,
    targetOctave
  )
  const transposeTo = (pitch: ArabicPitch) =>
    onSelectMaqam(baseMaqam.transpose(pitch))

  const openCustomSheet = () => {
    const tonic = currentMaqam.getTonic()
    setDraftPitches([tonic])
    setNextPitchIndex("")
    setCustomError(null)
    setIsCustomSheetOpen(true)
  }

  const handleRootChange = (value: string) => {
    const tonic = ArabicPitch.fromQuarterToneIndex(Number(value))
    setDraftPitches([tonic])
    setNextPitchIndex("")
    setCustomError(null)
  }

  const handleAddPitch = () => {
    const selectedIndex = Number(nextPitchIndex)
    const candidate = ArabicPitch.fromQuarterToneIndex(selectedIndex)
    const previous = draftPitches[draftPitches.length - 1]
    const root = draftPitches[0]
    if (
      !Number.isFinite(selectedIndex) ||
      !previous ||
      !root ||
      candidate.toFrequency() <= previous.toFrequency() ||
      candidate.toQuarterToneIndex() - root.toQuarterToneIndex() >
        MAX_CUSTOM_SPAN_QUARTER_TONES ||
      draftPitches.length >= MAX_CUSTOM_PITCHES
    ) {
      setCustomError(
        isArabic
          ? "يجب أن تكون النغمة أعلى من السابقة وألا يتجاوز السلم ١٦ نغمة أو أوكتافين."
          : "The pitch must be higher than the previous one; the series is limited to 16 pitches and two octaves."
      )
      return
    }
    setDraftPitches((pitches) => [...pitches, candidate])
    setNextPitchIndex("")
    setCustomError(null)
  }

  const handleSaveCustomPitches = () => {
    setCustomPitches(draftPitches)
    setIsCustomSheetOpen(false)
  }

  return (
    <section
      className="mx-auto w-full max-w-7xl space-y-4"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <header className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)] sm:items-end">
        <div>
          <h1 className="text-xl font-bold">
            {isArabic ? "الوضع البسيط" : "Compact Mode"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isArabic
              ? "اختر مقاماً واعزف نغماته على لوحة الآلة."
              : "Choose a Maqam and play its pitches on the instrument board."}
          </p>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">
          <span>{isArabic ? "اختر المقام" : "Select a Maqam"}</span>
          <select
            value={currentMaqam.id}
            onChange={(event) => {
              const maqam = maqams.find(
                (item) => item.id === event.target.value
              )
              if (maqam) onSelectMaqam(maqam)
            }}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            {maqams.map((maqam) => (
              <option key={maqam.id} value={maqam.id}>
                {maqam.name} · {maqam.getTonic().toString()}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
        <div>
          <p className="font-semibold">{currentMaqam.name}</p>
          <p className="text-xs text-muted-foreground">
            {isArabic ? "القرار" : "Tonic"}:{" "}
            <span className="font-mono">
              {currentMaqam.getTonic().toString()}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={currentTonic.equals(originalTonic)}
            onClick={() => onSelectMaqam(baseMaqam)}
          >
            {isArabic ? "إعادة القرار" : "Reset tonic"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={customPitches.length === 0}
            onClick={() => setCustomPitches([])}
          >
            {isArabic ? "استعادة المقام" : "Restore Maqam"}
          </Button>
          <Button type="button" onClick={openCustomSheet}>
            {isArabic ? "نغمات مخصصة" : "Custom Pitches"}
          </Button>
        </div>
      </div>

      <section
        className="space-y-3 rounded-2xl border border-border bg-card p-4"
        aria-labelledby="compact-transposition-title"
      >
        <div>
          <h2 id="compact-transposition-title" className="font-semibold">
            {isArabic
              ? "تصوير المقام / تغيير القرار"
              : "Transpose Maqam / Change Tonic"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isArabic
              ? "اختر قراراً جديداً مع الحفاظ على أبعاد المقام."
              : "Choose a new tonic while preserving the maqam intervals."}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {isArabic ? "درجات تقليدية" : "Classical targets"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: isArabic ? "الأصل" : "Original", pitch: originalTonic },
              {
                label: isArabic ? "الدرجة الثانية" : "2nd degree",
                pitch: originalTonic.transpose(4),
              },
              {
                label: isArabic ? "الغمّاز" : "Ghammaz",
                pitch: baseMaqam.getGhammaz(),
              },
              {
                label: isArabic ? "الجواب" : "Octave apex",
                pitch: originalTonic.transpose(24),
              },
            ].map(({ label, pitch }) => (
              <Button
                key={label}
                type="button"
                size="sm"
                variant={currentTonic.equals(pitch) ? "default" : "outline"}
                onClick={() => transposeTo(pitch)}
              >
                {label} · {pitch.toString()}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {isArabic
              ? "السلم الصوتي العربي (١٢ درجة)"
              : "12-note Arabic spine"}
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ArabicNoteSpine.getSpine().map((note) => (
              <Button
                key={note.transliteration}
                type="button"
                size="sm"
                variant={
                  currentTonic.equals(note.pitch) ? "default" : "outline"
                }
                onClick={() => transposeTo(note.pitch)}
              >
                <span className="font-mono">{note.pitch.toString()}</span>
                <span>
                  {isArabic ? note.arabicName : note.transliteration.trim()}
                </span>
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end">
          <label className="grid gap-1 text-sm">
            <span>{isArabic ? "النغمة" : "Note"}</span>
            <select
              value={targetDiatonic}
              onChange={(event) =>
                setTargetDiatonic(event.target.value as DiatonicBase)
              }
              className="h-9 rounded-lg border border-border bg-background px-2"
            >
              {(["C", "D", "E", "F", "G", "A", "B"] as DiatonicBase[]).map(
                (note) => (
                  <option key={note}>{note}</option>
                )
              )}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>{isArabic ? "العلامة" : "Accidental"}</span>
            <select
              value={targetAccidental}
              onChange={(event) =>
                setTargetAccidental(event.target.value as MicrotonalAccidental)
              }
              className="h-9 rounded-lg border border-border bg-background px-2"
            >
              {(
                ["𝄫", "♭", "𝄳", "♮", "𝄲", "♯", "𝄪"] as MicrotonalAccidental[]
              ).map((accidental) => (
                <option key={accidental}>{accidental}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>{isArabic ? "الأوكتاف" : "Octave"}</span>
            <select
              value={targetOctave}
              onChange={(event) => setTargetOctave(Number(event.target.value))}
              className="h-9 rounded-lg border border-border bg-background px-2"
            >
              {[3, 4, 5].map((octave) => (
                <option key={octave} value={octave}>
                  {octave}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={() => transposeTo(targetTonic)}>
            {isArabic
              ? `تصوير إلى ${targetTonic.toString()}`
              : `Transpose to ${targetTonic.toString()}`}
          </Button>
        </div>
      </section>

      <FreeInteractiveFingerboard
        currentMaqam={currentMaqam}
        instrument={instrument}
        onInstrumentChange={onInstrumentChange}
        violinTuning={violinTuning}
        onViolinTuningChange={onViolinTuningChange}
        customPitches={customPitches}
      />

      <Sheet open={isCustomSheetOpen} onOpenChange={setIsCustomSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] gap-4 overflow-y-auto rounded-t-2xl p-5"
        >
          <SheetHeader>
            <SheetTitle>
              {isArabic
                ? "إنشاء سلسلة نغمات مخصصة"
                : "Build a custom pitch series"}
            </SheetTitle>
            <SheetDescription>
              {isArabic
                ? "اختر القرار ثم أضف النغمات تصاعدياً. الحد الأقصى ١٦ نغمة ضمن أوكتافين."
                : "Choose a root, then add pitches in ascending frequency. Maximum: 16 pitches within two octaves."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-1">
            <label className="grid gap-1.5 text-sm font-medium">
              <span>
                {isArabic ? "القرار / النغمة الأساسية" : "Tonic / root pitch"}
              </span>
              <select
                value={currentRootIndex}
                onChange={(event) => handleRootChange(event.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3"
              >
                {rootOptions.map((index) => {
                  const pitch = ArabicPitch.fromQuarterToneIndex(index)
                  return (
                    <option key={index} value={index}>
                      {pitch.toString()}
                    </option>
                  )
                })}
              </select>
            </label>

            <div className="flex flex-wrap items-end gap-2">
              <label className="grid min-w-48 flex-1 gap-1.5 text-sm font-medium">
                <span>
                  {isArabic
                    ? `النغمة التالية (${draftPitches.length}/${MAX_CUSTOM_PITCHES})`
                    : `Next pitch (${draftPitches.length}/${MAX_CUSTOM_PITCHES})`}
                </span>
                <select
                  value={nextPitchIndex}
                  onChange={(event) => setNextPitchIndex(event.target.value)}
                  disabled={
                    draftPitches.length >= MAX_CUSTOM_PITCHES ||
                    availableNextIndexes.length === 0
                  }
                  className="h-10 rounded-xl border border-border bg-background px-3 disabled:opacity-50"
                >
                  <option value="">
                    {isArabic ? "اختر النغمة" : "Choose a pitch"}
                  </option>
                  {availableNextIndexes.map((index) => {
                    const pitch = ArabicPitch.fromQuarterToneIndex(index)
                    return (
                      <option key={index} value={index}>
                        {pitch.toString()}
                      </option>
                    )
                  })}
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddPitch}
                disabled={
                  !nextPitchIndex || draftPitches.length >= MAX_CUSTOM_PITCHES
                }
              >
                {isArabic ? "إضافة" : "Add pitch"}
              </Button>
              {draftPitches.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDraftPitches((pitches) => pitches.slice(0, -1))
                    setNextPitchIndex("")
                    setCustomError(null)
                  }}
                >
                  {isArabic ? "حذف الأخيرة" : "Remove last"}
                </Button>
              )}
            </div>

            <ol
              className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-border bg-background/70 p-3"
              aria-label={isArabic ? "تسلسل النغمات" : "Pitch series"}
            >
              {draftPitches.map((pitch, index) => (
                <li
                  key={`${pitch.toQuarterToneIndex()}-${index}`}
                  className={`rounded-lg px-2.5 py-1 font-mono text-sm ${
                    index === 0
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-700 text-white"
                  }`}
                >
                  {pitch.toString()}
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {isArabic
                ? "كل نغمة أعلى تردداً من السابقة. يشمل الحد الأقصى نغمة القرار."
                : "Each pitch must be higher in frequency than the previous one. The 16-pitch limit includes the root."}
            </p>
            {customError && (
              <p role="alert" className="text-xs text-destructive">
                {customError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomSheetOpen(false)}
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="button" onClick={handleSaveCustomPitches}>
                {isArabic ? "تطبيق على اللوحة" : "Apply to board"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
