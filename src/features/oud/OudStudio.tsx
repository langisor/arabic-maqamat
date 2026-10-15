import { useEffect, useRef, useState } from "react"
import { Music, Play, Square, Volume2 } from "lucide-react"
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

interface OudStudioProps {
  currentMaqam: Maqam
}

export function OudStudio({ currentMaqam }: OudStudioProps) {
  const { language, t } = useLanguage()
  const [positionRange, setPositionRange] = useState<12 | 24>(12)
  const [activePitch, setActivePitch] = useState<string | null>(null)
  const [isPlayingScale, setIsPlayingScale] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const activePitchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

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
          else setActivePitch(`scale-${index}`)
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
              <Volume2
                className="h-4 w-4 text-amber-400"
                aria-hidden="true"
              />
              {t("oudCourses")}
            </CardTitle>
            <CardDescription className="mt-1 text-amber-100/60">
              {t("oudArabicTuning")} · C2 F2 A2 D3 G3 C4
            </CardDescription>
          </div>
          <div
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
        </CardHeader>

        <CardContent className="space-y-4 p-3 sm:p-5">
          <div
            className="scrollbar-thin overflow-x-auto rounded-[2rem] border border-amber-200/20 bg-[radial-gradient(ellipse_at_92%_50%,rgba(120,53,15,0.72)_0%,rgba(55,31,20,0.88)_20%,transparent_21%),linear-gradient(110deg,#432a1c,#21150f_35%,#392319)] p-3 shadow-[inset_0_0_35px_rgba(0,0,0,0.7)] sm:p-5"
            dir="ltr"
          >
            <div
              className="relative w-max min-w-full overflow-hidden rounded-[1.5rem] border border-amber-100/10 bg-gradient-to-r from-[#3b2418] via-[#24160f] to-[#302016] px-3 py-4 shadow-[inset_0_2px_18px_rgba(0,0,0,0.65)]"
              style={{ minWidth: `${Math.max(760, (positionRange + 1) * 42 + 180)}px` }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 rounded-l-[1.5rem] border-r-4 border-[#b99a70] bg-gradient-to-r from-[#5a3824] to-[#3b2418] shadow-[3px_0_8px_rgba(0,0,0,0.6)]"
              >
                <div className="absolute inset-y-2 left-2 flex flex-col justify-around">
                  {OUD_COURSES.map((course) => (
                    <span
                      key={course.id}
                      className="h-2.5 w-2.5 rounded-full border border-amber-100/50 bg-[#16100d] shadow-[0_0_0_2px_rgba(120,78,44,0.75)]"
                    />
                  ))}
                </div>
              </div>

              <div className="relative z-0 ml-14 space-y-2 rounded-r-2xl border-y border-amber-100/10 bg-gradient-to-b from-[#302016] via-[#1d130e] to-[#39251a] py-2 shadow-inner">
                {OUD_COURSES.map((course, index) => (
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
                    <span className="absolute left-[-3.4rem] z-20 w-12 truncate text-[10px] font-semibold text-amber-100/80">
                      {language === "ar"
                        ? `${t("oudCourse")} ${index + 1}`
                        : course.label}
                    </span>
                    <div className="relative z-10 ml-4 flex">
                      {Array.from({ length: positionRange + 1 }, (_, position) => {
                        const pitch = getOudPositionPitch(
                          course.openPitch,
                          position
                        )
                        const key = `${course.id}-${position}`
                        const isActive = activePitch === key
                        const hasSemitoneTape = position > 0 && position % 2 === 0
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={isStarting}
                            onClick={() => void playPitch(pitch, key)}
                            aria-label={`${t("oudPlayScale")} ${pitch.toString()} ${t("oudCourse")} ${index + 1}, ${t("oudSemitone")} ${Math.ceil(position / 2)}`}
                            title={`${pitch.toString()} · +${position * 50} cents`}
                            className={`relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md font-mono text-[10px] transition focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-wait ${
                              isActive
                                ? "z-20 rounded-lg bg-amber-400 font-bold text-slate-950 shadow-[0_0_14px_rgba(251,191,36,0.45)]"
                                : position === 0
                                  ? "font-semibold text-amber-50 hover:bg-amber-900/75"
                                  : "text-amber-100/75 hover:bg-amber-900/75 hover:text-white"
                            }`}
                          >
                            {hasSemitoneTape && (
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-y-0 left-0 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-100 via-amber-300 to-amber-100 shadow-[0_0_5px_rgba(251,191,36,0.6)]"
                              />
                            )}
                            {pitch.toDisplayString()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 z-20 flex h-24 w-28 -translate-y-1/2 items-center justify-center rounded-[45%] border border-amber-200/20 bg-gradient-to-br from-[#58351f] via-[#28170f] to-[#4b2b19] shadow-[0_0_18px_rgba(0,0,0,0.7)]"
              >
                <span className="h-10 w-10 rounded-full border-4 border-[#a7794c]/70 bg-[#130e0b] shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]" />
                <span className="absolute left-3 top-1/2 h-1.5 w-4 -translate-y-1/2 rounded bg-[#ba946b]" />
                <span className="absolute right-3 top-1/2 h-1.5 w-4 -translate-y-1/2 rounded bg-[#ba946b]" />
              </div>
              <div className="ml-16 mt-3 flex items-center gap-2 text-[10px] text-amber-100/70">
                <span className="h-3 w-[3px] rounded bg-amber-300 shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
                {t("oudSemitoneTapes")}
                <span className="ml-3 text-amber-100/45">
                  {t("oudOpenString")}
                </span>
              </div>
            </div>
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
