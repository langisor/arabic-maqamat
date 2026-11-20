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

const POSITION_COUNT = 24
const FIRST_POSITION_MARKS = [4, 8, 10, 14]
const PITCH_SEQUENCE_SCOPE = "compact-fingerboard-pitches"

function getPositionOffset(position: number) {
  const normalizedDistance = 1 - 2 ** (-position / 24)
  return 8 + (normalizedDistance / 0.5) * 86
}

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
  const [isPlayingPitches, setIsPlayingPitches] = useState(false)
  const activePitchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playbackRequest = useRef(0)

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
      playbackRequest.current += 1
      MicrotonalAudioEngine.stopSequence(PITCH_SEQUENCE_SCOPE)
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

  const handlePlayPitches = async () => {
    if (isPlayingPitches) {
      playbackRequest.current += 1
      MicrotonalAudioEngine.stopSequence(PITCH_SEQUENCE_SCOPE)
      setIsPlayingPitches(false)
      setActivePitch(null)
      return
    }

    const pitches =
      customPitches.length > 0 ? customPitches : currentMaqam.getScale()
    const requestId = playbackRequest.current + 1
    playbackRequest.current = requestId
    setIsPlayingPitches(true)
    setAudioError(null)
    if (activePitchTimeout.current !== null) {
      clearTimeout(activePitchTimeout.current)
      activePitchTimeout.current = null
    }

    try {
      await MicrotonalAudioEngine.prepareTimbre(instrument)
      if (playbackRequest.current !== requestId) return

      MicrotonalAudioEngine.playSequence(
        pitches,
        550,
        instrument,
        (index) => {
          setActivePitch(
            index < 0 ? null : (pitches[index]?.toQuarterToneIndex() ?? null)
          )
        },
        () => {
          setIsPlayingPitches(false)
          setActivePitch(null)
        },
        undefined,
        PITCH_SEQUENCE_SCOPE
      )
    } catch (error) {
      if (playbackRequest.current !== requestId) return
      setIsPlayingPitches(false)
      setAudioError(
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذّر تشغيل النغمات."
            : "Could not play these pitches."
      )
    }
  }

  const renderPitchButton = (
    course: BoardCourse,
    position: number,
    vertical: boolean
  ) => {
    const pitch = course.openPitch.transpose(position)
    const pitchIndex = pitch.toQuarterToneIndex()
    const pitchClass = ((pitchIndex % 24) + 24) % 24
    const isTonic = pitchClass === tonicPitchClass
    const isMaqamPitch = maqamPitchClasses.has(pitchClass)
    const isCustomPitch = customPitchClasses.has(pitchClass)
    const isActive = activePitch === pitchIndex
    const colorClass = isTonic
      ? "border-amber-300 bg-slate-950/20 text-amber-200"
      : isMaqamPitch
        ? "border-sky-300 bg-slate-950/20 text-white"
        : "border-slate-600 bg-slate-950/20 text-slate-300"

    return (
      <button
        key={`${course.id}-${position}`}
        type="button"
        onClick={() => void playPitch(pitch)}
        aria-label={`${course.label}, ${pitch.toString()}, ${position === 0 ? (isArabic ? "مفتوح" : "open") : `${position * 50} cents`}`}
        aria-pressed={isActive}
        title={`${pitch.toString()} · ${position * 50} cents`}
        className={`absolute ${
          vertical ? "left-1/2 -translate-x-1/2" : "top-1/2 -translate-y-1/2"
        } z-20 flex size-10 flex-col items-center justify-center rounded-full border font-mono text-[9px] leading-none font-semibold transition-colors hover:border-amber-300 hover:bg-amber-400 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none ${
          position % 2 === 1 ? "border-dashed" : "border-solid"
        } ${
          isActive
            ? "border-white bg-amber-300 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
            : colorClass
        } ${isCustomPitch ? "ring-2 ring-violet-300 ring-offset-1 ring-offset-[#100e0d]" : ""}`}
        style={
          vertical
            ? { top: `${getPositionOffset(position)}%` }
            : { left: `${getPositionOffset(position)}%` }
        }
      >
        <span>{pitch.toString()}</span>
        {position > 0 && (
          <span className="mt-0.5 text-[8px] font-normal opacity-70">
            {Number((position / 2).toFixed(1))}
          </span>
        )}
      </button>
    )
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
              ? "درجات ربع الصوت ضمن مدى أوكتاف واحد"
              : "Quarter-tone positions across one octave"}
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
        <Button
          type="button"
          size="sm"
          variant={isPlayingPitches ? "default" : "outline"}
          aria-pressed={isPlayingPitches}
          onClick={() => void handlePlayPitches()}
        >
          {isArabic
            ? isPlayingPitches
              ? "إيقاف النغمات"
              : "تشغيل النغمات"
            : isPlayingPitches
              ? "Stop Pitches"
              : "Play Pitches"}
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
        className={`overflow-x-auto overscroll-x-contain rounded-xl border border-[#313035] bg-[#08090d] p-3 ${
          orientation === "vertical" ? "max-h-[65vh] overflow-y-auto" : ""
        }`}
      >
        {orientation === "horizontal" ? (
          <div
            className="relative min-w-[1200px] overflow-hidden rounded-md border-y border-[#40332b] py-1 pt-5 shadow-inner"
            style={{
              backgroundColor: "#191411",
              backgroundImage:
                "radial-gradient(ellipse at 28% 48%, rgba(111,69,39,.22), transparent 52%), repeating-linear-gradient(2deg, transparent 0 17px, rgba(227,178,124,.045) 18px, transparent 19px 33px), linear-gradient(90deg, #171310, #211812 42%, #171310)",
            }}
          >
            {FIRST_POSITION_MARKS.map((position, index) => (
              <div
                key={position}
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 z-0 w-[3px] -translate-x-1/2 border-x border-blue-500/40 bg-indigo-500/25 shadow-[0_0_9px_rgba(59,130,246,.22)]"
                style={{ left: `${getPositionOffset(position+0.4)}%` }}
              >
                <span className="absolute -top-5 -translate-x-1/2 font-mono text-[11px] font-bold text-indigo-300 pt-5">
                  {index + 1}
                </span>
              </div>
            ))}
            <div
              aria-hidden="true"
              className="absolute top-5 bottom-0 left-[8%] z-10 w-[7px] border-x border-[#d4c5a5] bg-linear-to-r from-[#8d7b5f] via-[#eee5cf] to-[#9a876a] shadow-[2px_0_5px_rgba(0,0,0,.65)]"
            />
            {displayedCourses.map((course) => (
              <div key={course.id} className="relative h-11">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-1/2 z-0 border-t border-[#71a8d7]/80 shadow-[0_1px_2px_rgba(123,190,255,.35)]"
                />
                <div className="absolute inset-y-0 left-0 z-20 flex w-[7%] items-center font-mono text-[10px] font-semibold text-slate-300">
                  {course.openPitch.toString()}
                </div>
                {Array.from({ length: POSITION_COUNT + 1 }, (_, position) =>
                  renderPitchButton(course, position, false)
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative flex h-[720px] w-max gap-3 ps-5">
            {FIRST_POSITION_MARKS.map((position, index) => (
              <div
                key={position}
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 z-0 -translate-y-1/2 border-t-2 border-sky-500/80"
                style={{ top: `${getPositionOffset(position)}%` }}
              >
                <span className="absolute -start-5 -translate-y-1/2 font-mono text-[10px] font-bold text-sky-300">
                  {index + 1}
                </span>
              </div>
            ))}
            {displayedCourses.map((course) => (
              <div key={course.id} className="relative h-full w-14">
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-1/2 z-0 border-s border-sky-700/80"
                />
                <div className="absolute inset-x-0 top-0 z-20 text-center font-mono text-[10px] font-semibold text-slate-300">
                  {course.openPitch.toString()}
                </div>
                {Array.from({ length: POSITION_COUNT + 1 }, (_, position) =>
                  renderPitchButton(course, position, true)
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-dashed border-slate-400" />
          {isArabic ? "نغمة ربع صوتية" : "Quarter tone"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 border-s-2 border-sky-500" />
          {isArabic ? "علامات الوضع الأول" : "First-position tape"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-slate-600 bg-slate-950" />
          {isArabic ? "نغمات أخرى" : "Other pitches"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-sky-300 bg-sky-900" />
          {isArabic ? "درجات المقام" : "Maqam pitches"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-amber-300 bg-amber-400" />
          {isArabic ? "القرار" : "Tonic"}
        </span>
        {customPitches.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-violet-300" />
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
