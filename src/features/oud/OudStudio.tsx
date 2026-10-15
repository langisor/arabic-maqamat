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
import { getOudPositionPitch, OUD_COURSES } from "./oud-instrument"

const OUD_SEQUENCE_SCOPE = "oud-feature"
type OudTuning = "arabic" | "high"
type FingerboardOrientation = "horizontal" | "vertical"

interface OudStudioProps {
  currentMaqam: Maqam
}

export function OudStudio({ currentMaqam }: OudStudioProps) {
  const { language, t } = useLanguage()
  const [positionRange, setPositionRange] = useState<12 | 24>(12)
  const [tuning, setTuning] = useState<OudTuning>("arabic")
  const [orientation, setOrientation] =
    useState<FingerboardOrientation>("horizontal")
  const [includeBassCourse, setIncludeBassCourse] = useState(true)
  const [reverseCourses, setReverseCourses] = useState(false)
  const [highlightMaqam, setHighlightMaqam] = useState(true)
  const [activePitch, setActivePitch] = useState<string | number | null>(null)
  const [isPlayingScale, setIsPlayingScale] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const activePitchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const courses = OUD_COURSES.map((course) => ({
    ...course,
    openPitch:
      tuning === "high" ? course.openPitch.transpose(10) : course.openPitch,
  }))
  const visibleCourses = includeBassCourse
    ? courses
    : courses.filter((course) => course.id !== "course-6")
  const displayedCourses = reverseCourses
    ? [...visibleCourses].reverse()
    : visibleCourses
  const maqamScale = currentMaqam.getScale()
  const maqamPitchClasses = new Set(
    maqamScale.map(
      (pitch) => ((pitch.toQuarterToneIndex() % 24) + 24) % 24
    )
  )
  const tonicPitchClass =
    ((currentMaqam.getTonic().toQuarterToneIndex() % 24) + 24) % 24

  const renderPosition = (
    course: (typeof courses)[number],
    position: number,
    vertical = false
  ) => {
    const pitch = getOudPositionPitch(course.openPitch, position)
    const pitchClass = ((pitch.toQuarterToneIndex() % 24) + 24) % 24
    const isTonic = pitchClass === tonicPitchClass
    const isMaqamNote = maqamPitchClasses.has(pitchClass)
    const isActive =
      activePitch === `${course.id}-${position}` ||
      activePitch === pitch.toQuarterToneIndex()
    const originalCourseNumber =
      OUD_COURSES.findIndex(({ id }) => id === course.id) + 1
    const highlightClass =
      highlightMaqam && isTonic
        ? "bg-amber-400 font-bold text-slate-950 shadow-[0_0_14px_rgba(251,191,36,0.4)]"
        : highlightMaqam && isMaqamNote
          ? "bg-sky-500/25 font-semibold text-sky-100 ring-1 ring-inset ring-sky-300/45"
          : position === 0
            ? "font-semibold text-amber-50 hover:bg-amber-900/75"
            : "text-amber-100/75 hover:bg-amber-900/75 hover:text-white"

    return (
      <button
        key={`${course.id}-${position}`}
        type="button"
        disabled={isStarting}
        onClick={() => void playPitch(pitch, `${course.id}-${position}`)}
        aria-label={`${t("oudPlayScale")} ${pitch.toString()} ${t("oudCourse")} ${originalCourseNumber}, ${t("oudSemitone")} ${Math.ceil(position / 2)}`}
        aria-pressed={isActive}
        title={`${pitch.toString()} · +${position * 50} cents`}
        className={`relative flex shrink-0 cursor-pointer items-center justify-center rounded-md font-mono text-[10px] transition focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:cursor-wait ${
          vertical ? "h-8 w-full" : "h-10 w-10"
        } ${
          isActive
            ? "z-20 rounded-lg bg-amber-400 font-bold text-slate-950 shadow-[0_0_14px_rgba(251,191,36,0.45)]"
            : highlightClass
        }`}
      >
        {position > 0 && position % 2 === 0 && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute rounded-full bg-gradient-to-b from-amber-100 via-amber-300 to-amber-100 shadow-[0_0_5px_rgba(251,191,36,0.6)] ${
              vertical
                ? "inset-x-0 top-0 h-[3px]"
                : "inset-y-0 left-0 w-[3px] -translate-x-1/2"
            }`}
          />
        )}
        {pitch.toDisplayString()}
      </button>
    )
  }

  useEffect(() => {
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
      MicrotonalAudioEngine.stopSequence(OUD_SEQUENCE_SCOPE)
      if (activePitchTimeout.current !== null) {
        clearTimeout(activePitchTimeout.current)
      }
    }
  }, [])

  const playPitch = async (
    pitch: (typeof OUD_COURSES)[number]["openPitch"],
    key: string
  ) => {
    setIsStarting(true)
    setAudioError(null)
    try {
      await MicrotonalAudioEngine.startAudioContext()
      MicrotonalAudioEngine.playPitch(pitch, 1.2, "oud", 0.8)
      setActivePitch(key)
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
    try {
      await MicrotonalAudioEngine.startAudioContext()
      if (activePitchTimeout.current !== null) {
        clearTimeout(activePitchTimeout.current)
        activePitchTimeout.current = null
      }
      MicrotonalAudioEngine.playSequence(
        currentMaqam.getScale(),
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
    MicrotonalAudioEngine.stopSequence(OUD_SEQUENCE_SCOPE)
    setIsPlayingScale(false)
    setActivePitch(null)
  }

  return (
    <section
      className="space-y-5"
      aria-labelledby="oud-studio-title"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-900/50 bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">
              24-EDO
            </Badge>
            <span className="text-sm text-amber-200/80">
              {t("instrumentOud")}
            </span>
          </div>
          <h3
            id="oud-studio-title"
            className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl"
          >
            <Music className="h-5 w-5 text-amber-400" aria-hidden="true" />
            {t("instrumentOud")}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            {t("oudDescription")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isPlayingScale ? (
            <Button variant="amberOutline" onClick={stopScale}>
              <Square className="h-3.5 w-3.5" />
              {t("oudStopScale")}
            </Button>
          ) : (
            <Button
              variant="amber"
              onClick={() => void playScale()}
              disabled={isStarting}
            >
              <Play className="h-3.5 w-3.5" />
              {t("oudPlayScale")} {currentMaqam.name}
            </Button>
          )}
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

      <Card className="overflow-hidden border-amber-950/70 bg-[#21150f] text-amber-50">
        <CardHeader className="gap-3 border-b border-amber-900/50 bg-[#2b1a12] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-amber-50">
              <Volume2 className="h-4 w-4 text-amber-400" aria-hidden="true" />
              {t(displayedCourses.length === 5 ? "oudFiveCourses" : "oudCourses")}
            </CardTitle>
            <CardDescription className="mt-1 text-amber-100/60">
              {t(tuning === "arabic" ? "oudArabicTuning" : "oudHighTuning")} ·{" "}
              {displayedCourses
                .map((course) => course.openPitch.toString())
                .join(" ")}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={includeBassCourse}
              onClick={() => setIncludeBassCourse((included) => !included)}
              className="h-9 border-amber-100/15 bg-black/20 text-xs text-amber-100 hover:bg-amber-900/40 hover:text-white"
            >
              {t(includeBassCourse ? "oudRemoveBassCourse" : "oudAddBassCourse")}
            </Button>
            <div
              role="group"
              className="flex items-center gap-1 rounded-xl border border-amber-100/10 bg-black/20 p-1"
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
                      : "text-amber-100/65 hover:text-amber-50"
                  }`}
                >
                  {t(preset === "arabic" ? "oudArabicTuning" : "oudHighTuning")}
                </button>
              ))}
            </div>
            <div
              role="group"
              className="flex items-center gap-1 rounded-xl border border-amber-100/10 bg-black/20 p-1"
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
                      : "text-amber-100/65 hover:text-amber-50"
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
              aria-pressed={reverseCourses}
              onClick={() => setReverseCourses((reversed) => !reversed)}
              className={`h-9 border-amber-100/15 bg-black/20 text-xs text-amber-100 hover:bg-amber-900/40 hover:text-white ${
                reverseCourses
                  ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                  : ""
              }`}
              title={t("oudReverseCourses")}
            >
              <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
              {t("oudReverseCourses")}
              {reverseCourses && (
                <span className="font-mono text-[10px] text-amber-300">
                  {t("oudReversed")}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={highlightMaqam}
              onClick={() => setHighlightMaqam((enabled) => !enabled)}
              className={`h-9 border-amber-100/15 bg-black/20 text-xs text-amber-100 hover:bg-amber-900/40 hover:text-white ${
                highlightMaqam
                  ? "border-sky-400/50 bg-sky-500/10 text-sky-200"
                  : ""
              }`}
              title={t("oudHighlightMaqam")}
            >
              <Music className="h-3.5 w-3.5" aria-hidden="true" />
              {t("oudHighlightMaqam")}
            </Button>
            <div
              role="group"
              className="flex items-center gap-1 rounded-xl border border-amber-100/10 bg-black/20 p-1"
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
                      : "text-amber-100/65 hover:text-amber-50"
                  }`}
                >
                  {range === 12 ? t("oudHalfOctave") : t("oudFullOctave")}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-3 sm:p-5">
          <div
            className={`scrollbar-thin rounded-[2rem] border border-amber-200/20 bg-[radial-gradient(ellipse_at_92%_50%,rgba(120,53,15,0.72)_0%,rgba(55,31,20,0.88)_20%,transparent_21%),linear-gradient(110deg,#432a1c,#21150f_35%,#392319)] p-3 shadow-[inset_0_0_35px_rgba(0,0,0,0.7)] sm:p-5 ${
              orientation === "vertical"
                ? "max-h-[70vh] overflow-auto"
                : "overflow-x-auto"
            }`}
            dir="ltr"
          >
            {orientation === "horizontal" ? (
              <div
                className="relative w-max min-w-full overflow-hidden rounded-[1.5rem] border border-amber-100/10 bg-gradient-to-r from-[#3b2418] via-[#24160f] to-[#302016] px-3 py-4 shadow-[inset_0_2px_18px_rgba(0,0,0,0.65)]"
                style={{
                  minWidth: `${Math.max(760, (positionRange + 1) * 42 + 180)}px`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 rounded-l-[1.5rem] border-r-4 border-[#b99a70] bg-gradient-to-r from-[#5a3824] to-[#3b2418] shadow-[3px_0_8px_rgba(0,0,0,0.6)]"
                >
                  <div className="absolute inset-y-2 left-2 flex flex-col justify-around">
                    {displayedCourses.map((course) => (
                      <span
                        key={course.id}
                        className="h-2.5 w-2.5 rounded-full border border-amber-100/50 bg-[#16100d] shadow-[0_0_0_2px_rgba(120,78,44,0.75)]"
                      />
                    ))}
                  </div>
                </div>
                <div className="relative z-0 ml-14 space-y-2 rounded-r-2xl border-y border-amber-100/10 bg-gradient-to-b from-[#302016] via-[#1d130e] to-[#39251a] py-2 shadow-inner">
                  {displayedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="relative flex h-12 items-center border-b border-amber-100/[0.04] last:border-b-0"
                    >
                      <div
                        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      >
                        <span
                          className="absolute inset-x-0 top-[-2px] block rounded-full bg-gradient-to-b from-amber-100/80 via-amber-700/90 to-amber-100/60 shadow-[0_0_8px_rgba(251,191,36,0.18)]"
                          style={{ height: course.thickness }}
                        />
                        <span
                          className="absolute inset-x-0 top-[2px] block rounded-full bg-gradient-to-b from-amber-50/60 via-amber-600/80 to-amber-50/50"
                          style={{ height: course.thickness }}
                        />
                      </div>
                      <span className="absolute left-[-3.4rem] z-20 flex w-12 flex-col text-[10px] font-semibold leading-tight text-amber-100/80">
                        <span className="block truncate">
                          {language === "ar"
                            ? `${t("oudCourse")} ${OUD_COURSES.findIndex(({ id }) => id === course.id) + 1}`
                            : course.label}
                        </span>
                        <span className="font-mono text-[9px] text-amber-200">
                          {course.openPitch.toDisplayString()}
                        </span>
                      </span>
                      <div className="relative z-10 ml-4 flex">
                        {Array.from(
                          { length: positionRange + 1 },
                          (_, position) => renderPosition(course, position)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3 z-20 flex h-24 w-28 -translate-y-1/2 items-center justify-center rounded-[45%] border border-amber-200/20 bg-gradient-to-br from-[#58351f] via-[#28170f] to-[#4b2b19] shadow-[0_0_18px_rgba(0,0,0,0.7)]"
                >
                  <span className="h-10 w-10 rounded-full border-4 border-[#a7794c]/70 bg-[#130e0b] shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]" />
                  <span className="absolute top-1/2 left-3 h-1.5 w-4 -translate-y-1/2 rounded bg-[#ba946b]" />
                  <span className="absolute top-1/2 right-3 h-1.5 w-4 -translate-y-1/2 rounded bg-[#ba946b]" />
                </div>
              </div>
            ) : (
              <div
                className="relative w-max min-w-full rounded-[1.5rem] border border-amber-100/10 bg-gradient-to-b from-[#3b2418] via-[#24160f] to-[#302016] p-4 shadow-[inset_0_2px_18px_rgba(0,0,0,0.65)]"
                style={{
                  minWidth: `${Math.max(660, displayedCourses.length * 96 + 32)}px`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="mb-3 h-3 rounded-md border-y-2 border-[#b99a70] bg-gradient-to-b from-[#5a3824] to-[#3b2418] shadow-[0_3px_8px_rgba(0,0,0,0.6)]"
                />
                <div className="flex items-start justify-around gap-2 rounded-2xl border-x border-amber-100/10 bg-gradient-to-r from-[#302016] via-[#1d130e] to-[#39251a] px-2 py-3 shadow-inner">
                  {displayedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="relative flex w-20 shrink-0 flex-col items-center gap-1"
                    >
                      <span className="z-10 min-h-8 text-center text-[10px] font-semibold leading-tight text-amber-100/80">
                        {language === "ar"
                          ? `${t("oudCourse")} ${OUD_COURSES.findIndex(({ id }) => id === course.id) + 1}`
                          : course.label}
                        <span className="block font-mono text-[9px] font-normal text-amber-200">
                          {course.openPitch.toDisplayString()}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-10 bottom-0 rounded-full bg-gradient-to-r from-amber-100/70 via-amber-700/90 to-amber-100/60 shadow-[0_0_8px_rgba(251,191,36,0.18)]"
                        style={{ width: course.thickness }}
                      />
                      <div className="relative z-10 flex w-full flex-col gap-0.5">
                        {Array.from(
                          { length: positionRange + 1 },
                          (_, position) =>
                            renderPosition(course, position, true)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  aria-hidden="true"
                  className="mt-3 h-4 rounded-[50%] border border-amber-200/20 bg-gradient-to-r from-[#58351f] via-[#28170f] to-[#4b2b19] shadow-[0_0_18px_rgba(0,0,0,0.7)]"
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-amber-100/70">
            <span className="flex items-center gap-2">
              <span className="h-3 w-[3px] rounded bg-amber-300 shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
              {t("oudSemitoneTapes")}
            </span>
            <span>{t("oudOpenString")}</span>
            {highlightMaqam && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  {t("oudMaqamTonic")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                  {t("oudMaqamNotes")}
                </span>
              </>
            )}
          </div>
          <p className="text-center text-[11px] text-amber-100/55">
            {t("oudTapNote")} · {t("oudPositionUnit")} · {t("oudPlayScale")}{" "}
            {currentMaqam.name}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
