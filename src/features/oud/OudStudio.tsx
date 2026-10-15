import { useEffect, useRef, useState } from "react"
import { Music, Play, Square, Volume2 } from "lucide-react"
import { AudioTransport } from "../../audio/audio-transport"
import { MicrotonalAudioEngine } from "../../audio/microtonal-audio"
import type { Maqam } from "../../theory/maqam"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { getOudPositionPitch, OUD_COURSES } from "./oud-instrument"

const OUD_SEQUENCE_SCOPE = "oud-feature"

interface OudStudioProps {
  currentMaqam: Maqam
}

export function OudStudio({ currentMaqam }: OudStudioProps) {
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

  const playPitch = async (pitch: (typeof OUD_COURSES)[number]["openPitch"], key: string) => {
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
      setAudioError(error instanceof Error ? error.message : "Audio could not start.")
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
      setAudioError(error instanceof Error ? error.message : "Audio could not start.")
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
    <section className="space-y-5" aria-labelledby="oud-studio-title">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-900/50 bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">
              Arabic 24-EDO
            </Badge>
            <span className="font-arabic text-sm text-amber-200/80" lang="ar" dir="rtl">
              العود العربي
            </span>
          </div>
          <h2 id="oud-studio-title" className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
            <Music className="h-5 w-5 text-amber-400" aria-hidden="true" />
            Oud Studio
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            Play six paired courses in traditional Arabic tuning. Every position advances by a quarter-tone for expressive maqam intonation.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isPlayingScale ? (
            <Button variant="amberOutline" onClick={stopScale}>
              <Square className="h-3.5 w-3.5" />
              Stop scale
            </Button>
          ) : (
            <Button variant="amber" onClick={() => void playScale()} disabled={isStarting}>
              <Play className="h-3.5 w-3.5" />
              Play {currentMaqam.name}
            </Button>
          )}
        </div>
      </div>

      {audioError && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {audioError}
        </p>
      )}

      <Card className="overflow-hidden border-amber-950/70 bg-[#21150f] text-amber-50">
        <CardHeader className="gap-3 border-b border-amber-900/50 bg-[#2b1a12] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-amber-50">
              <Volume2 className="h-4 w-4 text-amber-400" aria-hidden="true" />
              Six double-string courses
            </CardTitle>
            <CardDescription className="mt-1 text-amber-100/60">
              Standard Arabic tuning · C2 F2 A2 D3 G3 C4
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-amber-100/10 bg-black/20 p-1" aria-label="Position range">
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
                {range === 12 ? "Half octave" : "Full octave"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-3 sm:p-5">
          {OUD_COURSES.map((course) => (
            <div
              key={course.id}
              className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-amber-100 sm:text-xs">
                  {course.label}
                </p>
                <p className="font-arabic truncate text-[10px] text-amber-200/60" lang="ar" dir="rtl">
                  {course.arabicLabel} · {course.openPitch.toString()}
                </p>
              </div>
              <div className="scrollbar-thin overflow-x-auto rounded-xl border border-amber-100/10 bg-black/20 p-2">
                <div className="relative flex min-w-max items-center gap-1 px-1 py-1">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-amber-100/70 via-amber-700/70 to-amber-100/60 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                    style={{ height: course.thickness }}
                  />
                  {Array.from({ length: positionRange + 1 }, (_, position) => {
                    const pitch = getOudPositionPitch(course.openPitch, position)
                    const key = `${course.id}-${position}`
                    const isActive = activePitch === key
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isStarting}
                        onClick={() => void playPitch(pitch, key)}
                        aria-label={`Play ${pitch.toString()} on ${course.label}, quarter-tone position ${position}`}
                        title={`${pitch.toString()} · +${position * 50} cents`}
                        className={`relative z-10 flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border px-2 font-mono text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-wait ${
                          isActive
                            ? "border-amber-300 bg-amber-400 font-bold text-slate-950 shadow-[0_0_14px_rgba(251,191,36,0.45)]"
                            : position === 0
                              ? "border-amber-300/60 bg-amber-950/90 font-semibold text-amber-100 hover:border-amber-300"
                              : position % 2 === 0
                                ? "border-amber-100/15 bg-[#38251a]/95 text-amber-100/90 hover:border-amber-300/70 hover:bg-amber-900"
                                : "border-amber-100/10 bg-[#281b14]/95 text-amber-100/65 hover:border-amber-300/70 hover:bg-amber-900"
                        }`}
                      >
                        {pitch.toDisplayString()}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
          <p className="pt-2 text-center text-[11px] text-amber-100/55">
            Tap a note to pluck it · Each position is 50 cents · Select “Play {currentMaqam.name}” to hear the maqam on oud
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
