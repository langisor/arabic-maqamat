import { useEffect, useRef, useState } from "react"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import AudioPlayer from "osmd-audio-player"
import type { PlaybackEvent } from "osmd-audio-player/dist/PlaybackEngine"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  FileDown,
  Gauge,
  Loader2,
  Music4,
  Pause,
  Play,
  Square,
} from "lucide-react"

interface SheetMusicInteractiveViewerProps {
  musicXml: string
}

interface ScoreMeasure {
  measureNumber: number
  x: number
  y: number
  width: number
  height: number
  playbackStep: number
}

export function SheetMusicInteractiveViewer({
  musicXml,
}: SheetMusicInteractiveViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)
  const measureStepsRef = useRef<Map<number, number>>(new Map())

  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoverBox, setHoverBox] = useState<ScoreMeasure | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempo, setTempo] = useState(100)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let player: AudioPlayer | null = null
    setIsLoaded(false)
    setIsPlaying(false)
    setHoverBox(null)
    setError(null)

    const osmd = new OpenSheetMusicDisplay(container, {
      autoResize: false,
      backend: "svg",
      drawTitle: true,
      drawingParameters: "compacttight",
    })
    osmdRef.current = osmd

    const loadScore = async () => {
      try {
        await osmd.load(musicXml)
        if (cancelled) return

        osmd.render()
        osmd.cursor.show()

        const measureSteps = new Map<number, number>()
        osmd.cursor.reset()
        let step = 0
        while (!osmd.cursor.iterator.EndReached) {
          const measureIndex = osmd.cursor.iterator.CurrentMeasureIndex
          if (!measureSteps.has(measureIndex)) {
            measureSteps.set(measureIndex, step)
          }
          osmd.cursor.next()
          step += 1
        }
        osmd.cursor.reset()
        measureStepsRef.current = measureSteps

        player = new AudioPlayer()
        playerRef.current = player
        await player.loadScore(
          osmd as unknown as Parameters<AudioPlayer["loadScore"]>[0]
        )
        if (cancelled) {
          void player.stop().catch((loadError: unknown) => {
            console.error("Unable to stop the unloaded score player:", loadError)
          })
          return
        }
        player.on("iteration" as PlaybackEvent, () => {
          if (!cancelled && osmd.cursor.iterator.EndReached) {
            setIsPlaying(false)
            osmd.cursor.reset()
          }
        })
        setIsLoaded(true)
      } catch (loadError) {
        if (cancelled) return
        console.error("MusicXML score initialization failed:", loadError)
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The MusicXML score could not be loaded."
        )
      }
    }

    void loadScore()

    return () => {
      cancelled = true
      if (player) {
        void player.stop().catch((stopError: unknown) => {
          console.error("Unable to stop the score player:", stopError)
        })
      }
      if (playerRef.current === player) playerRef.current = null
      if (osmdRef.current === osmd) osmdRef.current = null
      measureStepsRef.current.clear()
      container.replaceChildren()
    }
  }, [musicXml])

  useEffect(() => {
    if (isLoaded) playerRef.current?.setBpm(tempo)
  }, [isLoaded, tempo])

  useEffect(() => {
    if (!isLoaded || !osmdRef.current) return

    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        setHoverBox(null)
        osmdRef.current?.render()
      }, 250)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [isLoaded])

  const handleSheetMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const osmd = osmdRef.current
    const container = containerRef.current
    if (!osmd || !isLoaded || !container || isPrinting) return

    const rect = container.getBoundingClientRect()
    const scale = osmd.Zoom * 10
    const x = (event.clientX - rect.left) / scale
    const y = (event.clientY - rect.top) / scale

    for (const page of osmd.GraphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            const bounds = measure.PositionAndShape
            const measureLeft = bounds.AbsolutePosition.x
            const measureTop = bounds.AbsolutePosition.y
            if (
              x < measureLeft ||
              x > measureLeft + bounds.Size.width ||
              y < measureTop ||
              y > measureTop + bounds.Size.height
            ) {
              continue
            }

            const sourceMeasure = measure.parentSourceMeasure
            setHoverBox({
              measureNumber: sourceMeasure.MeasureNumber,
              x: measureLeft * scale,
              y: measureTop * scale,
              width: bounds.Size.width * scale,
              height: bounds.Size.height * scale,
              playbackStep:
                measureStepsRef.current.get(sourceMeasure.measureListIndex) ??
                0,
            })
            return
          }
        }
      }
    }
    setHoverBox(null)
  }

  const handleSheetClick = () => {
    const player = playerRef.current
    if (!player || !isLoaded || !hoverBox || isPrinting) return
    const wasPlaying = isPlaying
    if (wasPlaying) player.pause()
    player.jumpToStep(hoverBox.playbackStep)
    if (wasPlaying) {
      void player.play().catch((playError: unknown) => {
        console.error("Unable to resume score playback:", playError)
        setIsPlaying(false)
      })
    }
  }

  const togglePlayback = async () => {
    const player = playerRef.current
    if (!player || !isLoaded) return
    try {
      if (isPlaying) {
        player.pause()
        setIsPlaying(false)
      } else {
        await player.play()
        setIsPlaying(true)
      }
    } catch (playError) {
      console.error("Unable to play the score:", playError)
      setError(
        playError instanceof Error
          ? playError.message
          : "Audio playback could not start."
      )
      setIsPlaying(false)
    }
  }

  const stopPlayback = () => {
    const player = playerRef.current
    const osmd = osmdRef.current
    if (!player || !osmd) return
    void player.stop().catch((stopError: unknown) => {
      console.error("Unable to stop score playback:", stopError)
      setError("Audio playback could not be stopped.")
    })
    osmd.cursor.reset()
    setIsPlaying(false)
  }

  const handleTempoChange = (values: number | readonly number[]) => {
    const targetTempo = typeof values === "number" ? values : values[0]
    if (targetTempo === undefined) return
    setTempo(targetTempo)
    playerRef.current?.setBpm(targetTempo)
  }

  const handleExportPDF = () => {
    const osmd = osmdRef.current
    if (!osmd || !isLoaded) return
    setIsPrinting(true)
    setHoverBox(null)
    osmd.cursor.hide()
    window.setTimeout(() => {
      try {
        window.print()
      } finally {
        osmd.cursor.show()
        setIsPrinting(false)
      }
    }, 150)
  }

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden shadow-md print:w-full print:max-w-none print:border-0 print:shadow-none">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .music-print-container, .music-print-container * { visibility: visible; }
          .music-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          .music-scroll-frame {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            padding: 0 !important;
          }
          .music-sheet-vector { filter: none !important; }
          svg { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-muted/30 p-4 print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? "default" : "secondary"}
            size="sm"
            onClick={togglePlayback}
            disabled={!isLoaded}
          >
            {isPlaying ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4 fill-current" />
            )}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={stopPlayback}
            disabled={!isLoaded}
          >
            <Square className="mr-2 h-4 w-4 fill-current" />
            Stop
          </Button>
        </div>

        <div className="flex max-w-md flex-1 items-center justify-end gap-4">
          <div className="flex min-w-[150px] flex-1 items-center gap-2">
            <Gauge className="h-4 w-4 shrink-0 text-muted-foreground" />
            <label
              htmlFor="score-tempo"
              className="w-20 shrink-0 text-xs font-mono text-muted-foreground"
            >
              {tempo} BPM
            </label>
            <Slider
              id="score-tempo"
              value={[tempo]}
              min={30}
              max={200}
              step={1}
              onValueChange={handleTempoChange}
              disabled={!isLoaded}
              className="cursor-pointer"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={!isLoaded}
            className="shrink-0 gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <ScrollArea className="music-print-container music-scroll-frame relative h-[550px] w-full bg-white p-4 dark:bg-zinc-950">
        {!isLoaded && !error && (
          <div className="flex h-[450px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground print:hidden">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading sheet music…</span>
          </div>
        )}
        {error && (
          <div
            className="flex h-[450px] items-center justify-center p-6 text-center text-sm text-destructive print:hidden"
            role="alert"
          >
            Unable to load this score: {error}
          </div>
        )}
        <div
          className="relative w-full cursor-pointer select-none"
          onMouseMove={handleSheetMouseMove}
          onMouseLeave={() => setHoverBox(null)}
          onClick={handleSheetClick}
        >
          {hoverBox && !isPrinting && (
            <>
              <div
                className="pointer-events-none absolute rounded border-2 border-primary/30 bg-primary/5 mix-blend-multiply dark:mix-blend-screen print:hidden"
                style={{
                  left: `${hoverBox.x}px`,
                  top: `${hoverBox.y}px`,
                  width: `${hoverBox.width}px`,
                  height: `${hoverBox.height}px`,
                }}
              />
              <div
                className="pointer-events-none absolute z-50 flex w-40 -translate-x-1/2 -translate-y-full flex-col gap-1.5 rounded-lg border bg-popover p-3 text-popover-foreground shadow-xl print:hidden"
                style={{
                  left: `${hoverBox.x + hoverBox.width / 2}px`,
                  top: `${hoverBox.y - 8}px`,
                }}
              >
                <div className="flex items-center gap-1 border-b pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Music4 className="h-3 w-3 text-primary" />
                  <span>Measure {hoverBox.measureNumber}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Click to play from this measure
                </span>
              </div>
            </>
          )}
          <div
            ref={containerRef}
            className="music-sheet-vector w-full dark:invert dark:hue-rotate-180"
          />
        </div>
      </ScrollArea>
    </Card>
  )
}
