import React, { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import AudioPlayer from "osmd-audio-player";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, Loader2, Music4, Volume2, Gauge, FileDown } from "lucide-react";

interface SheetMusicInteractiveViewerProps {
  /** Relative public path or fully qualified URL pointing to a .xml or .musicxml resource */
  musicXmlUrl: string;
}

interface HoverOverlayState {
  x: number;
  y: number;
  width: number;
  height: number;
  measureIndex: number;
  timeSignature: string;
  keySignature: string;
  clefType: string;
}

export function SheetMusicInteractiveViewer({ musicXmlUrl }: SheetMusicInteractiveViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  // Core Processing States
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoverBox, setHoverBox] = useState<HoverOverlayState | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Audio Processing Parameters
  const [tempo, setTempo] = useState<number>(100); 
  const [volume, setVolume] = useState<number>(80); 

  // 1. Initial Setup and Load Cycle
  useEffect(() => {
    if (!containerRef.current) return;

    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      autoResize: false, 
      backend: "svg",
      drawTitle: true,
      drawingParameters: "compacttight",
    });
    osmdRef.current = osmd;

    osmd.load(musicXmlUrl).then(() => {
      if (!osmdRef.current) return;
      osmdRef.current.render();
      osmdRef.current.cursor.show();

      const player = new AudioPlayer();
      playerRef.current = player;
      player.loadScore(osmdRef.current);

      player.on("iteration", () => {
        osmdRef.current?.cursor.next();
      });

      player.on("end", () => {
        setIsPlaying(false);
        osmdRef.current?.cursor.reset();
      });

      setIsLoaded(true);
    }).catch((err) => {
      console.error("OSMD initialization failed:", err);
    });

    return () => {
      if (playerRef.current) playerRef.current.stop();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [musicXmlUrl]);

  // 2. Debounced Window Resize Observer
  useEffect(() => {
    if (!isLoaded || !osmdRef.current) return;

    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (osmdRef.current) {
          setHoverBox(null); 
          osmdRef.current.render();
        }
      }, 250);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isLoaded]);

  // 3. Vector Collision Detection and Metadata Harvester
  const handleSheetMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const osmd = osmdRef.current;
    if (!osmd || !isLoaded || !containerRef.current || isPrinting) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const graphicSheet = osmd.GraphicSheet;
    if (!graphicSheet || !graphicSheet.Pages) {
      setHoverBox(null);
      return;
    }

    const nearestTimestamp = graphicSheet.GetNearestTimestamp({ x, y });
    if (!nearestTimestamp) {
      setHoverBox(null);
      return;
    }

    const sourceMeasure = nearestTimestamp.SourceMeasure;
    if (!sourceMeasure) {
      setHoverBox(null);
      return;
    }

    const measureIndex = sourceMeasure.MeasureNumber;
    const measureData = sourceMeasure as any;
    
    const activeTimeSig = measureData.ActiveTimeSignature;
    const timeSignatureString = activeTimeSig 
      ? `${activeTimeSig.Numerator}/${activeTimeSig.Denominator}` 
      : "4/4";

    const fifths = measureData.FirstInstructionList?.?.keyInstruction?.Fifths ?? 0;
    const keySignatureString = parseKeySignature(fifths);
    const clefType = measureData.FirstInstructionList?.?.clefInstruction?.ClefType?.toString() ?? "Treble";

    let matchedBox: any = null;
    for (const page of graphicSheet.Pages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const visualMeasure of staffLine.Measures) {
            if (visualMeasure.MeasureNumber === measureIndex) {
              matchedBox = visualMeasure.PositionAndShape;
              break;
            }
          }
        }
      }
    }

    if (matchedBox && matchedBox.AbsolutePosition) {
      const scale = osmd.Zoom * 10;
      setHoverBox({
        x: matchedBox.AbsolutePosition.x * scale,
        y: matchedBox.AbsolutePosition.y * scale,
        width: matchedBox.Size.width * scale,
        height: matchedBox.Size.height * scale,
        measureIndex,
        timeSignature: timeSignatureString,
        keySignature: keySignatureString,
        clefType
      });
    } else {
      setHoverBox(null);
    }
  };

  const parseKeySignature = (fifths: number): string => {
    const majorKeys: Record<string, string> = {
      "-4": "Ab Major", "-3": "Eb Major", "-2": "Bb Major", "-1": "F Major",
      "0": "C Major",
      "1": "G Major", "2": "D Major", "3": "A Major", "4": "E Major", "5": "B Major"
    };
    return majorKeys[String(fifths)] || `${fifths} Accidentals`;
  };

  // 4. Score Navigation Click Routine
  const handleSheetClick = () => {
    const osmd = osmdRef.current;
    const player = playerRef.current;
    if (!osmd || !player || !isLoaded || !hoverBox || isPrinting) return;

    osmd.cursor.reset();
    while (
      osmd.cursor.iterator.CurrentMeasureIndex < hoverBox.measureIndex && 
      !osmd.cursor.iterator.EndReached
    ) {
      osmd.cursor.next();
    }

    const wasPlaying = isPlaying;
    if (wasPlaying) player.pause();
    
    player.jumpToStep(hoverBox.measureIndex);
    
    if (wasPlaying) {
      player.play().catch((err) => console.error("Playback restart failed:", err));
    }
  };

  // 5. Audio Bridge Control Hooks
  const togglePlayback = async () => {
    if (!playerRef.current || !isLoaded) return;
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      await playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (!playerRef.current || !osmdRef.current) return;
    playerRef.current.stop();
    osmdRef.current.cursor.reset();
    setIsPlaying(false);
  };

  const handleTempoChange = (values: number[]) => {
    const targetTempo = values[0];
    if (targetTempo === undefined) return;
    setTempo(targetTempo);
    if (playerRef.current) {
      playerRef.current.setBpm(targetTempo);
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const targetVolume = values[0];
    if (targetVolume === undefined) return;
    setVolume(targetVolume);
    if (playerRef.current) {
      (playerRef.current as any).volume = targetVolume / 100;
    }
  };

  // 6. Vector PDF Export Engine Link
  const handleExportPDF = () => {
    if (!osmdRef.current || !isLoaded) return;
    
    setIsPrinting(true);
    setHoverBox(null);
    osmdRef.current.cursor.hide();

    setTimeout(() => {
      window.print();
      osmdRef.current?.cursor.show();
      setIsPrinting(false);
    }, 150);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-md print:border-0 print:shadow-none print:w-full print:max-w-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .music-print-container, .music-print-container * {
            visibility: visible;
          }
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
          .music-sheet-vector {
            filter: none !important;
          }
          svg {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}} />

      {/* Control Dock Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b bg-muted/30 print:hidden">
        
        {/* Core Media Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant={isPlaying ? "default" : "secondary"} 
            size="sm" 
            onClick={togglePlayback} 
            disabled={!isLoaded}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2 fill-current" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button variant="outline" size="sm" onClick={stopPlayback} disabled={!isLoaded}>
            <Square className="h-4 w-4 mr-2 fill-current" /> Stop
          </Button>
        </div>

        {/* Dynamic Modifiers */}
        <div className="flex items-center gap-6 flex-1 max-w-md justify-end">
          
          {/* Tempo BPM Adjuster */}
          <div className="flex items-center gap-2 flex-1 min-w-[130px]">
            <Gauge className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono w-16 shrink-0 text-muted-foreground">{tempo}% BPM</span>
            <Slider
              value={[tempo]}
              min={30}
              max={200}
              step={1}
              onValueChange={handleTempoChange}
              disabled={!isLoaded}
              className="cursor-pointer"
            />
          </div>

          {/* Master Output Gain Slider */}
          <div className="flex items-center gap-2 w-32 shrink-0">
            <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={5}
              onValueChange={handleVolumeChange}
              disabled={!isLoaded}
              className="cursor-pointer"
            />
          </div>

          {/* PDF Export Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF} 
            disabled={!isLoaded}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/5 shrink-0"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Sheet Presentation Workspace */}
      <ScrollArea className="h-[550px] w-full bg-white dark:bg-zinc-950 p-4 relative music-scroll-frame music-print-container">
        {!isLoaded && (
          <div className="flex flex-col h-[450px] items-center justify-center gap-2 text-sm text-muted-foreground print:hidden">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Compiling music matrix schemas...</span>
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
              {/* Collision Mask Box */}
              <div 
                className="absolute pointer-events-none rounded bg-primary/5 border-2 border-primary/30 mix-blend-multiply dark:mix-blend-screen print:hidden"
                style={{
                  left: `${hoverBox.x}px`,
                  top: `${hoverBox.y}px`,
                  width: `${hoverBox.width}px`,
                  height: `${hoverBox.height}px`,
                }}
              />

              {/* Floating Context Tooltip */}
              <div 
                className="absolute z-50 flex flex-col gap-1.5 p-3 rounded-lg shadow-xl border bg-popover text-popover-foreground pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150 print:hidden"
                style={{
                  left: `${hoverBox.x + (hoverBox.width / 2) - 80}px`, 
                  top: `${hoverBox.y - 95}px`,
                  width: "160px"
                }}
              >
                <div className="flex items-center gap-1 border-b pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Music4 className="h-3 w-3 text-primary" />
                  <span>Measure {hoverBox.measureIndex}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-xs font-medium">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="text-right font-mono font-bold text-foreground">{hoverBox.timeSignature}</span>
                  
                  <span className="text-muted-foreground">Key:</span>
                  <span className="text-right text-foreground truncate">{hoverBox.keySignature}</span>

                  <span className="text-muted-foreground">Clef:</span>
                  <span className="text-right capitalize text-foreground">{hoverBox.clefType.toLowerCase()}</span>
                </div>
              </div>
            </>
          )}

          {/* Target Core Injection Dom Element */}
          <div ref={containerRef} className="w-full dark:invert dark:hue-rotate-180 music-sheet-vector" />
        </div>
      </ScrollArea>
    </Card>
  );
}