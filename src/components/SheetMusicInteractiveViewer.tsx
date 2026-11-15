import { useEffect, useRef, useState } from "react"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import AudioPlayer from "osmd-audio-player"
import type { PlaybackEvent } from "osmd-audio-player/dist/PlaybackEngine"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Download,
  FileDown,
  Gauge,
  Loader2,
  Music4,
  Pause,
  Play,
  Square,
  ZoomIn,
  ZoomOut,
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

function getSvgDimensions(svg: SVGSVGElement) {
  const viewBox = svg.viewBox.baseVal
  return {
    width:
      viewBox.width ||
      Number.parseFloat(svg.getAttribute("width") ?? "") ||
      svg.getBoundingClientRect().width,
    height:
      viewBox.height ||
      Number.parseFloat(svg.getAttribute("height") ?? "") ||
      svg.getBoundingClientRect().height,
  }
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
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [tempo, setTempo] = useState(100)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let player: AudioPlayer | null = null
    setIsLoaded(false)
    setIsPlaying(false)
    setHoverBox(null)
    setError(null)
    setExportError(null)
    setZoom(100)

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
            console.error(
              "Unable to stop the unloaded score player:",
              loadError
            )
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

  const getMeasureAt = (clientX: number, clientY: number) => {
    const osmd = osmdRef.current
    const container = containerRef.current
    if (!osmd || !isLoaded || !container || isPrinting) return null

    const rect = container.getBoundingClientRect()
    const scale = osmd.Zoom * 10
    const x = (clientX - rect.left) / scale
    const y = (clientY - rect.top) / scale

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
            return {
              measureNumber: sourceMeasure.MeasureNumber,
              x: measureLeft * scale,
              y: measureTop * scale,
              width: bounds.Size.width * scale,
              height: bounds.Size.height * scale,
              playbackStep:
                measureStepsRef.current.get(sourceMeasure.measureListIndex) ??
                0,
            }
          }
        }
      }
    }
    return null
  }

  const handleSheetMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    setHoverBox(getMeasureAt(event.clientX, event.clientY))
  }

  const handleSheetClick = (event?: React.MouseEvent<HTMLDivElement>) => {
    const player = playerRef.current
    if (!player || !isLoaded || isPrinting) return
    const measure = event
      ? getMeasureAt(event.clientX, event.clientY)
      : hoverBox
    if (event && !measure) return
    const wasPlaying = isPlaying
    if (wasPlaying) player.pause()
    player.jumpToStep(measure?.playbackStep ?? 0)
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

  const handleZoomChange = (change: number) => {
    const osmd = osmdRef.current
    if (!osmd || !isLoaded) return
    const nextZoom = Math.min(150, Math.max(60, zoom + change))
    setZoom(nextZoom)
    setHoverBox(null)
    osmd.Zoom = nextZoom / 100
    osmd.render()
  }

  const handlePrint = () => {
    const osmd = osmdRef.current
    if (!osmd || !isLoaded) return
    setIsPrinting(true)
    setHoverBox(null)
    osmd.cursor.hide()
    window.setTimeout(() => {
      try {
        window.print()
      } catch (printError) {
        console.error("Unable to print the score:", printError)
        setExportError("The score could not be sent to the print dialog.")
      } finally {
        osmd.cursor.show()
        setIsPrinting(false)
      }
    }, 150)
  }

  const handleDownloadPDF = async () => {
    const osmd = osmdRef.current
    const container = containerRef.current
    if (!osmd || !container || !isLoaded || isExporting) return

    const scorePages = Array.from(container.querySelectorAll("svg"))
    if (scorePages.length === 0) {
      setExportError("No rendered score pages are available to export.")
      return
    }

    setIsExporting(true)
    setExportError(null)
    setHoverBox(null)
    osmd.cursor.hide()

    try {
      const { jsPDF } = await import("jspdf")
      const firstPage = scorePages[0]
      if (!firstPage) throw new Error("No rendered score pages are available.")
      const firstPageSize = getSvgDimensions(firstPage)
      const pdf = new jsPDF({
        orientation:
          firstPageSize.width > firstPageSize.height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      })
      const pageMargin = 10

      for (const [index, sourceSvg] of scorePages.entries()) {
        const { width, height } = getSvgDimensions(sourceSvg)
        if (!width || !height) {
          throw new Error(`Score page ${index + 1} has invalid dimensions.`)
        }
        const svg = sourceSvg.cloneNode(true) as SVGSVGElement

        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        svg.setAttribute("width", `${width}`)
        svg.setAttribute("height", `${height}`)
        const serializedSvg = new XMLSerializer().serializeToString(svg)
        const svgUrl = URL.createObjectURL(
          new Blob([serializedSvg], { type: "image/svg+xml;charset=utf-8" })
        )
        try {
          const image = new Image()
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () =>
              reject(
                new Error(`Score page ${index + 1} could not be rendered.`)
              )
            image.src = svgUrl
          })

          const canvas = document.createElement("canvas")
          const scale = 2
          canvas.width = Math.ceil(width * scale)
          canvas.height = Math.ceil(height * scale)
          const context = canvas.getContext("2d")
          if (!context) {
            throw new Error("A canvas context is unavailable for PDF export.")
          }
          context.fillStyle = "#ffffff"
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.drawImage(image, 0, 0, canvas.width, canvas.height)

          const pageOrientation = width > height ? "landscape" : "portrait"
          if (index > 0) pdf.addPage("a4", pageOrientation)
          const availableWidth =
            pdf.internal.pageSize.getWidth() - pageMargin * 2
          const availableHeight =
            pdf.internal.pageSize.getHeight() - pageMargin * 2
          const fitScale = Math.min(
            availableWidth / canvas.width,
            availableHeight / canvas.height
          )
          const imageWidth = canvas.width * fitScale
          const imageHeight = canvas.height * fitScale
          const left = (pdf.internal.pageSize.getWidth() - imageWidth) / 2
          const top = (pdf.internal.pageSize.getHeight() - imageHeight) / 2
          pdf.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            left,
            top,
            imageWidth,
            imageHeight
          )
        } finally {
          URL.revokeObjectURL(svgUrl)
        }
      }

      pdf.save("maqam-score.pdf")
    } catch (exportError) {
      console.error("Unable to export the score as PDF:", exportError)
      setExportError(
        exportError instanceof Error
          ? exportError.message
          : "The score could not be exported as a PDF."
      )
    } finally {
      osmd.cursor.show()
      setIsExporting(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden shadow-md print:w-full print:max-w-none print:overflow-visible print:border-0 print:shadow-none">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .music-print-container, .music-print-container * { visibility: visible !important; }
          .music-viewer-controls, .music-export-error { display: none !important; }
          .music-print-container {
            position: absolute !important;
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

      <div className="music-viewer-controls flex flex-col gap-3 border-b bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isPlaying ? "default" : "secondary"}
            size="sm"
            onClick={togglePlayback}
            disabled={!isLoaded}
            className="min-h-10"
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
            className="min-h-10"
          >
            <Square className="mr-2 h-4 w-4 fill-current" />
            Stop
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleZoomChange(-10)}
              disabled={!isLoaded || zoom <= 60}
              aria-label="Zoom out"
              title="Zoom out"
              className="size-10"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-12 text-center text-xs text-muted-foreground tabular-nums">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleZoomChange(10)}
              disabled={!isLoaded || zoom >= 150}
              aria-label="Zoom in"
              title="Zoom in"
              className="size-10"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:max-w-xl sm:flex-1 sm:justify-end sm:gap-4">
          <div className="flex min-w-37.5 flex-1 items-center gap-2">
            <Gauge className="h-4 w-4 shrink-0 text-muted-foreground" />
            <label
              htmlFor="score-tempo"
              className="w-20 shrink-0 font-mono text-xs text-muted-foreground"
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
            onClick={handlePrint}
            disabled={!isLoaded}
            className="min-h-10 shrink-0 gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            <FileDown className="h-4 w-4" />
            Print PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={!isLoaded || isExporting}
            className="min-h-10 shrink-0 gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {exportError && (
        <div
          className="music-export-error border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive print:hidden"
          role="alert"
        >
          Unable to export this score: {exportError}
        </div>
      )}

      <ScrollArea className="music-print-container music-scroll-frame relative h-[70vh] max-h-137.5 min-h-90 w-full bg-white p-3 sm:h-137.5 sm:p-4 dark:bg-zinc-950">
        {!isLoaded && !error && (
          <div className="flex h-112.5 flex-col items-center justify-center gap-2 text-sm text-muted-foreground print:hidden">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading sheet music…</span>
          </div>
        )}
        {error && (
          <div
            className="flex h-112.5 items-center justify-center p-6 text-center text-sm text-destructive print:hidden"
            role="alert"
          >
            Unable to load this score: {error}
          </div>
        )}
        <div
          className="relative min-w-max cursor-pointer select-none"
          onMouseMove={handleSheetMouseMove}
          onMouseLeave={() => setHoverBox(null)}
          onClick={handleSheetClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              handleSheetClick()
            }
          }}
          role="button"
          tabIndex={isLoaded ? 0 : -1}
          aria-label="Score pages. Click a measure to play from it."
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
                <div className="flex items-center gap-1 border-b pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
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
            className="music-sheet-vector w-full dark:hue-rotate-180 dark:invert"
          />
        </div>
      </ScrollArea>
    </Card>
  )
}
