import { useEffect, useRef, useState } from "react"
import {
  ArrowUpDown,
  Columns,
  Music,
  Play,
  Rows,
  Square,
  Volume2,
} from "lucide-react"
import { AudioTransport } from "../../audio/audio-transport"
import { MicrotonalAudioEngine } from "../../audio/microtonal-audio"
import type { ArabicPitch } from "../../core/pitch"
import type { Maqam } from "../../theory/maqam"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import { useLanguage } from "../../state/language"
import {
  getOudDisplayedPitch,
  getOudPositionPitch,
  OUD_COURSES,
} from "./oud-instrument"

const OUD_SEQUENCE_SCOPE = "oud-feature"
type OudTuning = "arabic" | "high"
type FingerboardOrientation = "horizontal" | "vertical"

interface OudStudioProps {
  currentMaqam: Maqam
}

export function OudStudio({ currentMaqam }: OudStudioProps) {
  const { language, t } = useLanguage()
  // These controls describe the visible fingerboard; the selected maqam remains
  // the source of pitches shown and played in either layout.
  const [positionRange, setPositionRange] = useState<12 | 24>(12)
  const [tuning, setTuning] = useState<OudTuning>("arabic")
  const [orientation, setOrientation] =
    useState<FingerboardOrientation>("horizontal")
  const [includeBassCourse, setIncludeBassCourse] = useState(false)
  const [reverseCourses, setReverseCourses] = useState(false)
  const [activePitch, setActivePitch] = useState<string | number | null>(null)
  const [isPlayingScale, setIsPlayingScale] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const activePitchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build the selected tuning from the shared course definitions. The high
  // preset raises each open course by ten quarter tones (a perfect fourth).
  const courses = OUD_COURSES.map((course) => ({
    ...course,
    openPitch:
      tuning === "high" ? course.openPitch.transpose(10) : course.openPitch,
  }))
  // The bass course is optional, and reversing creates a display-only order
  // without mutating the shared course list used for numbering.
  const visibleCourses = includeBassCourse
    ? courses
    : courses.filter((course) => course.id !== "course-6")
  const displayedCourses = reverseCourses
    ? [...visibleCourses].reverse()
    : visibleCourses
  const maqamScale = currentMaqam.getScale().map((x) => getOudDisplayedPitch(x))
  console.log("Maqam Scale: ", maqamScale)

  // Compare pitch classes rather than octaves so every position matching a
  // maqam degree is shown throughout the selected fingerboard range.
  const maqamPitchClasses = new Set(
    maqamScale.map((pitch) => ((pitch.toQuarterToneIndex() % 24) + 24) % 24)
  )
  const tonicPitchClass =
    ((currentMaqam.getTonic().toQuarterToneIndex() % 24) + 24) % 24

  const getCourseNotes = (course: (typeof courses)[number]) =>
    Array.from({ length: positionRange + 1 }, (_, position) => {
      const pitch = getOudPositionPitch(course.openPitch, position)
      const pitchClass = ((pitch.toQuarterToneIndex() % 24) + 24) % 24
      return { pitch, position, pitchClass }
    }).filter(({ pitchClass }) => maqamPitchClasses.has(pitchClass))

  useEffect(() => {
    // Track only this studio's sequence; clear its playback UI when the engine
    // reports that a sequence we observed has ended or has been stopped.
    let observedSequence = false
    const unsubscribe = AudioTransport.subscribe((status) => {
      const hasSequence = status.activeSessions.some(
        ({ scope }) => scope === OUD_SEQUENCE_SCOPE
      )
      if (hasSequence) {
        observedSequence = true
      } else if (observedSequence) {
        observedSequence = false
        setIsPlayingScale(false)
        setActivePitch(null)
      }
    })
    return () => {
      unsubscribe()
      // Stop component-owned playback and timer when leaving the studio.
      MicrotonalAudioEngine.stopSequence(OUD_SEQUENCE_SCOPE)
      if (activePitchTimeout.current !== null) {
        clearTimeout(activePitchTimeout.current)
      }
    }
  }, [])

  const playPitch = async (pitch: ArabicPitch, key: string) => {
    setIsStarting(true)
    setAudioError(null)
    console.log("Playing pitch: ", pitch.toString())
    try {
      // Audio contexts require a user gesture in many browsers, so initialize
      // before triggering the individual note.
      await MicrotonalAudioEngine.startAudioContext()
      MicrotonalAudioEngine.playPitch(pitch, 1.2, "oud", 0.8)
      setActivePitch(key)
      // Replace any prior timer so the active marker stays aligned with the
      // latest tapped note rather than an earlier note's timeout.
      if (activePitchTimeout.current !== null) {
        clearTimeout(activePitchTimeout.current)
      }
      activePitchTimeout.current = setTimeout(() => setActivePitch(null), 1200)
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : t("oudAudioError"))
    } finally {
      setIsStarting(false)
    }
  }

  const playScale = async () => {
    setIsStarting(true)
    setAudioError(null)
    // const lowerOctavePitches = maqamScale.map((x) => getOudDisplayedPitch(x))
    // 3-second countdown with on-screen counter
    setCountdown(3)
    await new Promise((resolve) => {
      let count = 3
      const interval = setInterval(() => {
        count -= 1
        setCountdown(count > 0 ? count : null)
        if (count === 0) {
          clearInterval(interval)
          resolve(null)
        }
      }, 1000)
    })
    try {
      await MicrotonalAudioEngine.startAudioContext()
      if (activePitchTimeout.current !== null) {
        clearTimeout(activePitchTimeout.current)
        activePitchTimeout.current = null
      }
      // Playback callbacks update the highlighted degree while the sequence
      // runs; the scope lets this studio stop only its own sequence.
      MicrotonalAudioEngine.playSequence(
        maqamScale,
        // lowerOctavePitches,
        500,
        "oud",
        (index) => {
          if (index < 0) setActivePitch(null)
          else setActivePitch(maqamScale[index].toQuarterToneIndex())
        },
        () => setIsPlayingScale(false),
        undefined,
        OUD_SEQUENCE_SCOPE
      )
      setIsPlayingScale(true)
    } catch (error) {
      setIsPlayingScale(false)
      setAudioError(error instanceof Error ? error.message : t("oudAudioError"))
    } finally {
      setIsStarting(false)
    }
  }

  const stopScale = () => {
    // The transport subscription also observes this stop and keeps playback
    // state synchronized if the sequence is ended from elsewhere.
    MicrotonalAudioEngine.stopSequence(OUD_SEQUENCE_SCOPE)
    setIsPlayingScale(false)
    setCountdown(null)
    setActivePitch(null)
  }

  const renderNote = (
    courseId: string,
    pitch: ArabicPitch,
    position: number,
    vertical = false
  ) => {
    // Normalize the absolute pitch into one 24-EDO octave for scale membership
    // and tonic highlighting, while retaining its full pitch for playback.
    const pitchClass = ((pitch.toQuarterToneIndex() % 24) + 24) % 24
    const isTonic = pitchClass === tonicPitchClass
    const displayedPitch = getOudDisplayedPitch(pitch.transpose(24))
    const key = `${courseId}-${position}`
    const isActive =
      activePitch === key || activePitch === pitch.toQuarterToneIndex()
    // Reserve a small margin at both ends so note buttons are not clipped.
    const positionPercent = 4 + (position / positionRange) * 92

    return (
      <button
        key={key}
        type="button"
        disabled={isStarting}
        onClick={() => void playPitch(pitch, key)}
        aria-label={`${t("oudPlayScale")} ${displayedPitch.toString()} ${t("oudPositionUnit")} ${position}`}
        aria-pressed={isActive}
        title={`${displayedPitch.toString()} · +${position * 50} cents`}
        className={`absolute z-10 flex h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border px-1 font-mono text-[10px] leading-none font-semibold transition focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:cursor-wait sm:h-9 sm:min-w-9 sm:text-[11px] ${
          isActive
            ? "scale-110 border-white bg-amber-300 text-slate-950 shadow-[0_0_14px_rgba(251,191,36,0.65)]"
            : isTonic
              ? "border-amber-200 bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.35)] hover:bg-amber-300"
              : "border-sky-200/70 bg-sky-600 text-white hover:bg-sky-500"
        } ${vertical ? "left-1/2" : "top-1/2"}`}
        style={
          vertical
            ? { top: `${positionPercent}%` }
            : { left: `${positionPercent}%` }
        }
      >
        {displayedPitch.toString()}
      </button>
    )
  }

  return (
    <section
      className="space-y-5"
      aria-labelledby="oud-studio-title"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-900/50 bg-linear-to-br from-amber-950/50 via-slate-900 to-slate-950 p-4 sm:flex-row sm:items-center sm:p-5">
        <div>
          <h2
            id="oud-studio-title"
            className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl"
          >
            <Music className="h-5 w-5 text-amber-400" aria-hidden="true" />
            {t("instrumentOud")}
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">
              24-EDO
            </Badge>
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            {t("oudDescription")}
          </p>
        </div>
      </div>

      {audioError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {audioError}
        </p>
      )}

      <Card className="overflow-hidden border-amber-950/70 bg-slate-950 text-amber-50">
        <CardHeader className="gap-3 border-b border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <Volume2 className="h-4 w-4 text-amber-400" aria-hidden="true" />
              {language === "ar"
                ? currentMaqam.arabicName
                : `Maqam ${currentMaqam.name}`}
            </CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              {t(tuning === "arabic" ? "oudArabicTuning" : "oudHighTuning")} ·{" "}
              {displayedCourses
                .map((course) =>
                  getOudDisplayedPitch(course.openPitch.transpose(24))
                )
                .join(" ")}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/70 p-1"
              aria-label={t("oudTuning")}
            >
              {(["arabic", "high"] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={tuning === preset}
                  onClick={() => setTuning(preset)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    tuning === preset
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {t(preset === "arabic" ? "oudArabicTuning" : "oudHighTuning")}
                </button>
              ))}
            </div>
            <div
              role="group"
              className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/70 p-1"
              aria-label={t("oudOrientation")}
            >
              {(["horizontal", "vertical"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={orientation === mode}
                  onClick={() => setOrientation(mode)}
                  title={t(
                    mode === "horizontal" ? "oudHorizontal" : "oudVertical"
                  )}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    orientation === mode
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {mode === "horizontal" ? (
                    <Rows className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Columns className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {t(mode === "horizontal" ? "oudHorizontal" : "oudVertical")}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={includeBassCourse}
              onClick={() => setIncludeBassCourse((included) => !included)}
              className="h-9 border-slate-700 bg-slate-950/70 text-xs text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              {t(
                includeBassCourse ? "oudRemoveBassCourse" : "oudAddBassCourse"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={reverseCourses}
              onClick={() => setReverseCourses((reversed) => !reversed)}
              className="h-9 border-slate-700 bg-slate-950/70 text-xs text-slate-200 hover:bg-slate-800 hover:text-white"
              title={t("oudReverseCourses")}
            >
              <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
              {t("oudReverseCourses")}
            </Button>
            <div
              role="group"
              className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/70 p-1"
              aria-label={t("oudPositionRange")}
            >
              {([12, 24] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  aria-pressed={positionRange === range}
                  onClick={() => setPositionRange(range)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    positionRange === range
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {range === 12 ? t("oudHalfOctave") : t("oudFullOctave")}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-3 sm:p-5">
          {/* The scale row doubles as playback progress: the sounding pitch is
              highlighted while the full maqam sequence plays. */}
          <div
            className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5"
            aria-label={`${currentMaqam.name} ${t("oudMaqamNotes")}`}
          >
            {maqamScale.map((pitch, index) => (
              <span
                key={`${pitch.toQuarterToneIndex()}-${index}`}
                className={`rounded-lg px-2.5 py-1 font-mono text-sm font-bold transition-all sm:text-base ${
                  activePitch === pitch.toQuarterToneIndex()
                    ? "scale-110 bg-amber-300 text-slate-950 ring-2 ring-white"
                    : index === 0
                      ? "bg-amber-500 text-slate-950"
                      : "bg-sky-950 text-sky-100"
                }`}
              >
                {pitch.toString()}
              </span>
            ))}
            {isPlayingScale ? (
              <Button
                type="button"
                size="sm"
                className={"bg-red-600"}
                onClick={stopScale}
              >
                <Square className="h-3.5 w-3.5" />
                {t("stopMaqam")}
              </Button>
            ) : countdown !== null ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                <span className="font-mono text-sm font-bold text-amber-300">
                  {countdown}
                </span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void playScale()}
              >
                <Play className="h-3.5 w-3.5" />
                {t("playMaqam")}
              </Button>
            )}
          </div>
          {/* Both views share the same course and note data. The orientation
              changes only which axis represents ascending fret position. */}
          {orientation === "horizontal" ? (
            <div
              className="overflow-x-auto rounded-2xl border border-amber-100/15 bg-gradient-to-r from-[#332319] via-[#211810] to-[#332319] p-4 shadow-inner"
              dir="ltr"
            >
              <div
                className="relative min-w-[740px] space-y-3"
                style={{
                  width: `${Math.max(740, positionRange * 42 + 160)}px`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 left-[4.75rem] z-0"
                >
                  {/* Fret markers appear every two positions (one semitone in
                      24-EDO); note buttons are layered above these guides. */}
                  {Array.from(
                    { length: positionRange / 2 },
                    (_, index) => (index + 1) * 2
                  ).map((position) => (
                    <span
                      key={position}
                      className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-amber-200/40 shadow-[0_0_5px_rgba(251,191,36,0.35)]"
                      style={{
                        left: `${4 + (position / positionRange) * 92}%`,
                      }}
                    />
                  ))}
                </div>
                {displayedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex h-14 items-center gap-3 border-b border-amber-100/10 last:border-b-0"
                  >
                    <div className="w-16 shrink-0 text-center">
                      <span className="block text-[10px] font-semibold text-amber-100/75">
                        {language === "ar"
                          ? `${t("oudCourse")} ${OUD_COURSES.findIndex(({ id }) => id === course.id) + 1}`
                          : course.label}
                      </span>
                      <span className="font-mono text-xs text-amber-50">
                        {getOudDisplayedPitch(
                          course.openPitch.transpose(24)
                        ).toString()}
                      </span>
                    </div>
                    <div className="relative h-10 flex-1">
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-100/80 via-amber-700 to-amber-100/70 shadow-[0_0_8px_rgba(251,191,36,0.18)]"
                        style={{ height: course.thickness }}
                      />
                      {getCourseNotes(course).map(({ pitch, position }) =>
                        renderNote(course.id, pitch, position)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="max-h-[70vh] overflow-auto rounded-2xl border border-amber-100/15 bg-gradient-to-b from-[#332319] via-[#211810] to-[#332319] p-4 shadow-inner"
              dir="ltr"
            >
              <div
                className="relative flex min-h-[700px] min-w-max justify-around gap-3"
                style={{
                  height: `${Math.max(700, positionRange * 32 + 100)}px`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-14 bottom-0 z-0"
                >
                  {/* The vertical layout reuses the same even-position guides
                      along the length of each course. */}
                  {Array.from(
                    { length: positionRange / 2 },
                    (_, index) => (index + 1) * 2
                  ).map((position) => (
                    <span
                      key={position}
                      className="absolute inset-x-0 h-0.5 -translate-y-1/2 bg-amber-200/40 shadow-[0_0_5px_rgba(251,191,36,0.35)]"
                      style={{
                        top: `${4 + (position / positionRange) * 92}%`,
                      }}
                    />
                  ))}
                </div>
                {displayedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="relative flex w-20 shrink-0 flex-col items-center"
                  >
                    <span className="z-10 h-12 text-center text-[10px] font-semibold text-amber-100/75">
                      {language === "ar"
                        ? `${t("oudCourse")} ${OUD_COURSES.findIndex(({ id }) => id === course.id) + 1}`
                        : course.label}
                      <span className="block font-mono text-xs text-amber-50">
                        {getOudDisplayedPitch(course.openPitch).toString()}
                      </span>
                    </span>
                    <div className="relative mt-2 w-full flex-1">
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-100/80 via-amber-700 to-amber-100/70 shadow-[0_0_8px_rgba(251,191,36,0.18)]"
                        style={{ width: course.thickness }}
                      />
                      {getCourseNotes(course).map(({ pitch, position }) =>
                        renderNote(course.id, pitch, position, true)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              {t("oudMaqamTonic")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
              {t("oudMaqamNotes")}
            </span>
            <span>{t("oudPositionUnit")}</span>
            <span>{t("oudTapNote")}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
