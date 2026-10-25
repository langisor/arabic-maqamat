import React, { useEffect, useRef, useState } from "react"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import AudioPlayer from "osmd-audio-player"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, Loader2, Music4 } from "lucide-react"

interface SheetMusicInteractiveViewerProps {
  musicXmlUrl: string
}

interface HoverOverlayState {
  x: number
  y: number
  width: number
  height: number
  measureIndex: number
  timeSignature: string
  keySignature: string
  clefType: string
}

export function SheetMusicInteractiveViewer({
  musicXmlUrl,
}: SheetMusicInteractiveViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoverBox, setHoverBox] = useState<HoverOverlayState | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      autoResize: true,
      backend: "svg",
      drawTitle: true,
      drawingParameters: "compacttight",
    })
    osmdRef.current = osmd

    osmd.load(musicXmlUrl).then(() => {
      osmd.render()
      osmd.cursor.show()

      const player = new AudioPlayer()
      playerRef.current = player
      player.loadScore(osmd)

      player.on("iteration", () => {
        osmdRef.current?.cursor.next()
      })

      player.on("end", () => {
        setIsPlaying(false)
        osmdRef.current?.cursor.reset()
      })

      setIsLoaded(true)
    })

    return () => {
      if (playerRef.current) playerRef.current.stop()
      if (containerRef.current) containerRef.current.innerHTML = ""
    }
  }, [musicXmlUrl])

  /**
   * MOUSE TRACKER: Extracts notation attributes safely
   */
  const handleSheetMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const osmd = osmdRef.current
    if (!osmd || !isLoaded || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const graphicSheet = osmd.GraphicSheet
    if (!graphicSheet || !graphicSheet.Pages) {
      setHoverBox(null)
      return
    }

    const nearestTimestamp = graphicSheet.GetNearestTimestamp({ x, y })
    if (!nearestTimestamp) {
      setHoverBox(null)
      return
    }

    const sourceMeasure = nearestTimestamp.SourceMeasure
    if (!sourceMeasure) {
      setHoverBox(null)
      return
    }

    const measureIndex = sourceMeasure.MeasureNumber

    // Type casting internals to `any` prevents TypeScript compilation failures
    // due to unexported sub-types in structural library modules.
    const measureData = sourceMeasure as any

    // 1. Time Signature Resolution
    const activeTimeSig = measureData.ActiveTimeSignature
    const timeSignatureString = activeTimeSig
      ? `${activeTimeSig.Numerator}/${activeTimeSig.Denominator}`
      : "4/4"

    // 2. Key Signature Identification
    const fifths =
      measureData.FirstInstructionList?.[0]?.keyInstruction?.Fifths ?? 0
    const keySignatureString = parseKeySignature(fifths)

    // 3. Clef Configuration Parser
    const clefType =
      measureData.FirstInstructionList?.[0]?.clefInstruction?.ClefType?.toString() ??
      "Treble"

    let matchedBox: any = null
    for (const page of graphicSheet.Pages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const visualMeasure of staffLine.Measures) {
            if (visualMeasure.MeasureNumber === measureIndex) {
              matchedBox = visualMeasure.PositionAndShape
              break
            }
          }
        }
      }
    }

    if (matchedBox && matchedBox.AbsolutePosition) {
      const scale = osmd.Zoom * 10
      setHoverBox({
        x: matchedBox.AbsolutePosition.x * scale,
        y: matchedBox.AbsolutePosition.y * scale,
        width: matchedBox.Size.width * scale,
        height: matchedBox.Size.height * scale,
        measureIndex,
        timeSignature: timeSignatureString,
        keySignature: keySignatureString,
        clefType,
      })
    } else {
      setHoverBox(null)
    }
  }

  const parseKeySignature = (fifths: number): string => {
    const majorKeys: Record<number, string> = {
      "-4": "Ab Major",
      "-3": "Eb Major",
      "-2": "Bb Major",
      "-1": "F Major",
      "0": "C Major",
      "1": "G Major",
      "2": "D Major",
      "3": "A Major",
      "4": "E Major",
      "5": "B Major",
    }
    return majorKeys[fifths] || `${fifths} Accidentals`
  }

  const handleSheetClick = () => {
    const osmd = osmdRef.current
    const player = playerRef.current
    if (!osmd || !player || !isLoaded || !hoverBox) return

    osmd.cursor.reset()
    while (
      osmd.cursor.iterator.CurrentMeasureIndex < hoverBox.measureIndex &&
      !osmd.cursor.iterator.EndReached
    ) {
      osmd.cursor.next()
    }

    const wasPlaying = isPlaying
    if (wasPlaying) player.pause()

    player.jumpToStep(hoverBox.measureIndex)

    if (wasPlaying) {
      player
        .play()
        .catch((err) => console.error("Playback restart failed:", err))
    }
  }

  const togglePlayback = async () => {
    if (!playerRef.current || !isLoaded) return
    if (isPlaying) {
      playerRef.current.pause()
      setIsPlaying(false)
    } else {
      await playerRef.current.play()
      setIsPlaying(true)
    }
  }

  const stopPlayback = () => {
    if (!playerRef.current || !osmdRef.current) return
    playerRef.current.stop()
    osmdRef.current.cursor.reset()
    setIsPlaying(false)
  }

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/40 p-4">
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
            <Square className="mr-2 h-4 w-4 fill-current" /> Stop
          </Button>
        </div>
      </div>

      <ScrollArea className="relative h-[550px] w-full bg-white p-4 dark:bg-zinc-950">
        {!isLoaded && (
          <div className="flex h-[450px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Compiling interactive score schemas...</span>
          </div>
        )}

        <div
          className="relative w-full cursor-pointer select-none"
          onMouseMove={handleSheetMouseMove}
          onMouseLeave={() => setHoverBox(null)}
          onClick={handleSheetClick}
        >
          {hoverBox && (
            <>
              <div
                className="pointer-events-none absolute rounded border-2 border-primary/30 bg-primary/5 mix-blend-multiply dark:mix-blend-screen"
                style={{
                  left: `${hoverBox.x}px`,
                  top: `${hoverBox.y}px`,
                  width: `${hoverBox.width}px`,
                  height: `${hoverBox.height}px`,
                }}
              />

              <div
                className="animate-in fade-in-0 zoom-in-95 pointer-events-none absolute z-50 flex flex-col gap-1.5 rounded-lg border bg-popover p-3 text-popover-foreground shadow-xl duration-150"
                style={{
                  left: `${hoverBox.x + hoverBox.width / 2 - 80}px`,
                  top: `${hoverBox.y - 95}px`,
                  width: "160px",
                }}
              >
                <div className="flex items-center gap-1 border-b pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  <Music4 className="h-3 w-3 text-primary" />
                  <span>Measure {hoverBox.measureIndex}</span>
                </div>

                <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-xs font-medium">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="text-right font-mono font-bold text-foreground">
                    {hoverBox.timeSignature}
                  </span>

                  <span className="text-muted-foreground">Key:</span>
                  <span className="truncate text-right text-foreground">
                    {hoverBox.keySignature}
                  </span>

                  <span className="text-muted-foreground">Clef:</span>
                  <span className="text-right text-foreground capitalize">
                    {hoverBox.clefType.toLowerCase()}
                  </span>
                </div>
              </div>
            </>
          )}

          <div
            ref={containerRef}
            className="w-full dark:hue-rotate-180 dark:invert"
          />
        </div>
      </ScrollArea>
    </Card>
  )
}
