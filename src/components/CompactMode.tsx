import { useMemo, useState } from "react"
import { ArabicPitch } from "../core/pitch"
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
        <Button type="button" onClick={openCustomSheet}>
          {isArabic ? "نغمات مخصصة" : "Custom Pitches"}
        </Button>
      </div>

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
