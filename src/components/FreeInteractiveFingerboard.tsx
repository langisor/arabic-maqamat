import { useEffect, useMemo, useRef, useState } from "react"
import { ArabicPitch } from "../core/pitch"
import {
  MicrotonalAudioEngine,
  type TimbreType,
} from "../audio/microtonal-audio"
import type { ViolinTuningPreset } from "./ViolinFingerboard"
import { Button } from "./ui/button"
import { OUD_COURSES } from "../features/oud/oud-instrument"
import type { Maqam } from "../theory/maqam"
import { useLanguage } from "../state/language"

type BoardOrientation = "horizontal" | "vertical"
type OudTuning = "arabic" | "high"

interface FreeInteractiveFingerboardProps {
  currentMaqam: Maqam
  instrument: TimbreType
  onInstrumentChange: (instrument: TimbreType) => void
  violinTuning: ViolinTuningPreset
  onViolinTuningChange: (tuning: ViolinTuningPreset) => void
  customPitches: ArabicPitch[]
}

interface BoardCourse {
  id: string
  label: string
  openPitch: ArabicPitch
}

const POSITION_COUNT = 48

export function FreeInteractiveFingerboard({
  currentMaqam,
  instrument,
  onInstrumentChange,
  violinTuning,
  onViolinTuningChange,
  customPitches,
}: FreeInteractiveFingerboardProps) {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const [orientation, setOrientation] = useState<BoardOrientation>("horizontal")
  const [reverseStrings, setReverseStrings] = useState(instrument === "violin")
  const [oudTuning, setOudTuning] = useState<OudTuning>("arabic")
  const [activePitch, setActivePitch] = useState<number | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const activePitchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const courses = useMemo<BoardCourse[]>(() => {
    if (instrument === "oud") {
      return OUD_COURSES.map((course) => ({
        id: course.id,
        label: isArabic ? course.arabicLabel : course.label,
        openPitch:
          oudTuning === "high"
            ? course.openPitch.transpose(10)
            : course.openPitch,
      }))
    }

    const arabicTuning = violinTuning === "arabic"
    return [
      {
        id: "G",
        label: isArabic ? "صول" : "G string",
        openPitch: new ArabicPitch("G", "♮", 3),
      },
      {
        id: "D",
        label: isArabic ? "ري" : "D string",
        openPitch: new ArabicPitch("D", "♮", 4),
      },
      {
        id: "A",
        label: isArabic ? "صول" : "A string",
        openPitch: arabicTuning
          ? new ArabicPitch("G", "♮", 4)
          : new ArabicPitch("A", "♮", 4),
      },
      {
        id: "E",
        label: isArabic ? "ري" : "E string",
        openPitch: arabicTuning
          ? new ArabicPitch("D", "♮", 5)
          : new ArabicPitch("E", "♮", 5),
      },
    ]
  }, [instrument, isArabic, oudTuning, violinTuning])

  const displayedCourses = useMemo(
    () => (reverseStrings ? [...courses].reverse() : courses),
    [courses, reverseStrings]
  )

  const maqamPitchClasses = useMemo(
    () =>
      new Set(
        currentMaqam
          .getScale()
          .map((pitch) => ((pitch.toQuarterToneIndex() % 24) + 24) % 24)
      ),
    [currentMaqam]
  )
  const tonicPitchClass =
    ((currentMaqam.getTonic().toQuarterToneIndex() % 24) + 24) % 24
  const customPitchClasses = useMemo(
    () =>
      new Set(
        customPitches.map(
          (pitch) => ((pitch.toQuarterToneIndex() % 24) + 24) % 24
        )
      ),
    [customPitches]
  )

  useEffect(
    () => () => {
      if (activePitchTimeout.current !== null) {
        clearTimeout(activePitchTimeout.current)
      }
    },
    []
  )

  const playPitch = async (pitch: ArabicPitch) => {
    setAudioError(null)
    try {
      await MicrotonalAudioEngine.startAudioContext()
      MicrotonalAudioEngine.playPitch(pitch, 0.8, instrument)
      setActivePitch(pitch.toQuarterToneIndex())
      if (activePitchTimeout.current !== null) {
        clearTimeout(activePitchTimeout.current)
      }
      activePitchTimeout.current = setTimeout(() => setActivePitch(null), 900)
    } catch (error) {
      setAudioError(
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذّر تشغيل النغمة."
            : "Could not play this pitch."
      )
    }
  }

  const tuningLabels =
    instrument === "oud"
      ? isArabic
        ? { arabic: "عربي", high: "مرتفع" }
        : { arabic: "Arabic", high: "High" }
      : isArabic
        ? { arabic: "عربي (صول-ري-صول-ري)", western: "غربي (صول-ري-لا-مي)" }
        : { arabic: "Arabic (G-D-G-D)", western: "Western (G-D-A-E)" }

  return (
    <section
      className="space-y-4 rounded-2xl border border-border bg-card p-3 sm:p-5"
      aria-label={
        isArabic ? "لوحة تفاعلية حرة" : "Free interactive fingerboard"
      }
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            {isArabic ? "لوحة تفاعلية حرة" : "Free Interactive Fingerboard"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isArabic
              ? "جميع درجات ربع الصوت ضمن مدى أوكتافين"
              : "All quarter-tone positions across two octaves"}
          </p>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={isArabic ? "الآلة" : "Instrument"}
        >
          {(["oud", "violin"] as const).map((choice) => (
            <Button
              key={choice}
              type="button"
              size="sm"
              variant={instrument === choice ? "default" : "outline"}
              aria-pressed={instrument === choice}
              onClick={() => onInstrumentChange(choice)}
            >
              {choice === "oud"
                ? isArabic
                  ? "العود"
                  : "Oud"
                : isArabic
                  ? "الكمان"
                  : "Violin"}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
        <label className="flex items-center gap-2 text-xs">
          <span>{isArabic ? "الضبط" : "Tuning"}</span>
          <select
            value={
              instrument === "oud"
                ? oudTuning
                : violinTuning === "arabic"
                  ? "arabic"
                  : "western"
            }
            onChange={(event) => {
              if (instrument === "oud") {
                setOudTuning(event.target.value as OudTuning)
              } else {
                onViolinTuningChange(
                  event.target.value === "arabic" ? "arabic" : "western"
                )
              }
            }}
            className="h-8 max-w-full rounded-lg border border-border bg-background px-2 text-xs"
          >
            {instrument === "oud" ? (
              <>
                <option value="arabic">{tuningLabels.arabic}</option>
                <option value="high">{tuningLabels.high}</option>
              </>
            ) : (
              <>
                <option value="arabic">{tuningLabels.arabic}</option>
                <option value="western">{tuningLabels.western}</option>
              </>
            )}
          </select>
        </label>

        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-pressed={reverseStrings}
          onClick={() => setReverseStrings((current) => !current)}
        >
          {isArabic ? "عكس الأوتار" : "Reverse strings"}
        </Button>
        <div
          className="ms-auto flex gap-1"
          role="group"
          aria-label={isArabic ? "اتجاه اللوحة" : "Board orientation"}
        >
          {(["horizontal", "vertical"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={orientation === value ? "default" : "outline"}
              aria-pressed={orientation === value}
              onClick={() => setOrientation(value)}
            >
              {value === "horizontal"
                ? isArabic
                  ? "أفقي"
                  : "Horizontal"
                : isArabic
                  ? "عمودي"
                  : "Vertical"}
            </Button>
          ))}
        </div>
      </div>

      <div
        className={`max-h-[65vh] overflow-auto rounded-xl border border-border bg-slate-950/70 p-3 ${
          orientation === "horizontal"
            ? "overscroll-x-contain"
            : "overscroll-y-contain"
        }`}
      >
        <div
          className={
            orientation === "horizontal"
              ? "min-w-max space-y-3"
              : "flex min-w-max items-start gap-3"
          }
        >
          {displayedCourses.map((course) => (
            <div
              key={course.id}
              className={
                orientation === "horizontal"
                  ? "flex items-center gap-2 border-b border-slate-700/70 pb-3 last:border-0"
                  : "flex flex-col items-center gap-2 border-e border-slate-700/70 pe-3 last:border-0"
              }
            >
              <div
                className={
                  orientation === "horizontal"
                    ? "w-20 shrink-0 text-xs font-semibold text-slate-300"
                    : "w-16 shrink-0 text-center text-xs font-semibold text-slate-300"
                }
              >
                <span className="block">{course.label}</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {course.openPitch.toString()}
                </span>
              </div>
              <div
                className={`flex gap-1 ${
                  orientation === "horizontal"
                    ? "items-center border-t border-amber-700/60 pt-1"
                    : "flex-col items-center border-s border-amber-700/60 ps-1"
                }`}
              >
                {Array.from({ length: POSITION_COUNT + 1 }, (_, position) => {
                  const pitch = course.openPitch.transpose(position)
                  const pitchIndex = pitch.toQuarterToneIndex()
                  const pitchClass = ((pitchIndex % 24) + 24) % 24
                  const isTonic = pitchClass === tonicPitchClass
                  const isMaqamPitch = maqamPitchClasses.has(pitchClass)
                  const isCustomPitch = customPitchClasses.has(pitchClass)
                  const isActive = activePitch === pitchIndex
                  const colorClass = isTonic
                    ? "border-amber-200 bg-amber-500 text-slate-950"
                    : isMaqamPitch
                      ? "border-sky-300 bg-sky-700 text-white"
                      : "border-slate-700 bg-slate-800 text-slate-300"

                  return (
                    <button
                      key={`${course.id}-${position}`}
                      type="button"
                      onClick={() => void playPitch(pitch)}
                      aria-label={`${course.label}, ${pitch.toString()}, ${position === 0 ? (isArabic ? "مفتوح" : "open") : `${position * 50} cents`}`}
                      aria-pressed={isActive}
                      title={`${pitch.toString()} · ${position * 50} cents`}
                      className={`flex h-8 w-10 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] font-semibold transition-colors hover:border-amber-300 hover:bg-amber-400 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none ${
                        isActive
                          ? "border-white bg-amber-300 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                          : colorClass
                      } ${isCustomPitch ? "ring-2 ring-violet-300 ring-offset-1 ring-offset-slate-950" : ""}`}
                    >
                      {pitch.toString()}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-700" />
          {isArabic ? "نغمات أخرى" : "Other pitches"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-sky-700" />
          {isArabic ? "درجات المقام" : "Maqam pitches"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-500" />
          {isArabic ? "القرار" : "Tonic"}
        </span>
        {customPitches.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border-2 border-violet-300" />
            {isArabic ? "النغمات المخصصة" : "Custom pitches"}
          </span>
        )}
      </div>
      {audioError && (
        <p role="alert" className="text-xs text-destructive">
          {audioError}
        </p>
      )}
    </section>
  )
}
