// src/components/SayrVisualizationDialog.tsx
import React, { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Compass,
  X,
  Volume2,
  Play,
  Square,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react"
import { SayrVisualization, type SayrStop } from "./SayrVisualization"
import { Maqam, SayrTrajectory } from "../theory/maqam"
import { MicrotonalAudioEngine, TimbreType } from "../audio/microtonal-audio"
import { ArabicPitch } from "../core/pitch"

interface SayrVisualizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  maqam: Maqam
  timbre?: TimbreType
}

const TRAJECTORY_BADGES: Record<
  SayrTrajectory,
  { label: string; arabic: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  ascending: {
    label: "Ascending Sayr (سير صاعد)",
    arabic: "سير صاعد يبدأ من القرار ويتدرج صعوداً",
    icon: ArrowUp,
    color: "border-emerald-500/60 bg-emerald-950/40 text-emerald-300",
  },
  descending_octave_first: {
    label: "Descending / Octave Sayr (سير هابط)",
    arabic: "سير هابط يستهل من الجواب ويستقر على القرار",
    icon: ArrowDown,
    color: "border-sky-500/60 bg-sky-950/40 text-sky-300",
  },
  undulating: {
    label: "Undulating Sayr (سير متموج)",
    arabic: "سير متموج يتنقل بين الغماز والقرار والطبقات العليا",
    icon: ArrowUpDown,
    color: "border-amber-500/60 bg-amber-950/40 text-amber-300",
  },
}

export const SayrVisualizationDialog: React.FC<SayrVisualizationDialogProps> = ({
  open,
  onOpenChange,
  maqam,
  timbre = "violin",
}) => {
  const [isPlayingSayr, setIsPlayingSayr] = useState(false)
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null)

  const trajectoryInfo = TRAJECTORY_BADGES[maqam.sayrDirection] || TRAJECTORY_BADGES.ascending
  const TrajectoryIcon = trajectoryInfo.icon

  const handleStopSelect = (stop: SayrStop) => {
    setActiveStopIndex(stop.index)
    if (stop.pitch) {
      const match = stop.pitch.match(/^([A-G][𝄫♭𝄳♮𝄲♯𝄪]?)([0-9])$/u)
      if (match) {
        const diatonic = match[1].charAt(0) as ArabicPitch["diatonic"]
        let acc: ArabicPitch["accidental"] = "♮"
        if (match[1].includes("𝄳")) acc = "𝄳"
        else if (match[1].includes("𝄲")) acc = "𝄲"
        else if (match[1].includes("♭") || match[1].includes("b")) acc = "♭"
        else if (match[1].includes("♯") || match[1].includes("#")) acc = "♯"
        const oct = parseInt(match[2], 10) || 4
        const pitchObj = new ArabicPitch(diatonic, acc, oct)
        MicrotonalAudioEngine.playPitch(pitchObj, 1.2, timbre, 0.9)
      }
    }
  }

  const handlePlaySayrCourse = () => {
    if (isPlayingSayr) {
      MicrotonalAudioEngine.stopSequence("sayr-dialog-playback")
      setIsPlayingSayr(false)
      setActiveStopIndex(null)
    } else {
      setIsPlayingSayr(true)
      const scalePitches = maqam.getScale()
      const sequence = maqam.sayrDirection === "descending_octave_first"
        ? [...scalePitches].reverse()
        : scalePitches

      MicrotonalAudioEngine.playSequence(
        sequence,
        480,
        timbre,
        (idx) => setActiveStopIndex(idx === -1 ? null : idx),
        () => {
          setIsPlayingSayr(false)
          setActiveStopIndex(null)
        },
        undefined,
        "sayr-dialog-playback"
      )
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] max-h-[92vh] w-full max-w-none flex flex-col justify-between overflow-y-auto bg-slate-950 p-0 text-slate-100 border-t border-amber-800/40 shadow-2xl scrollbar-thin"
        showCloseButton={false}
      >
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
                <span>Sayr Trajectory &amp; Melodic Path</span>
                <span className="font-arabic text-amber-400 text-sm font-semibold">
                  (سير {maqam.arabicName || maqam.name})
                </span>
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span>Active Maqam: <strong className="text-white">{maqam.name}</strong></span>
                <span>•</span>
                <span>Family: <strong className="text-amber-300">{maqam.family}</strong></span>
              </SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 ${trajectoryInfo.color}`}>
              <TrajectoryIcon className="h-3 w-3" />
              <span>{trajectoryInfo.label}</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-6 py-5 flex-1 space-y-6 overflow-y-auto max-w-6xl mx-auto w-full">
          <div className="rounded-2xl border border-slate-800 bg-linear-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Understanding the Sayr (السير) in Arabic Music</span>
                  <Badge variant="secondary" className="text-[10px]">Classical Course</Badge>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  The <strong>Sayr</strong> is the melodic trajectory and temporal progression that brings a maqam to life. Unlike static Western scales, the identity of {maqam.name} is shaped by where phrases begin, which ajnas they explore, how they pivot around the Ghammaz, and the cadence (Qafla) that resolves to the Qarar.
                </p>
                <p className="text-[11px] text-amber-300 font-arabic mt-1">
                  {trajectoryInfo.arabic}
                </p>
              </div>
            </div>

            <Button
              variant={isPlayingSayr ? "destructive" : "default"}
              size="sm"
              onClick={handlePlaySayrCourse}
              className="gap-2 cursor-pointer shadow-md bg-linear-to-r from-amber-600 to-amber-500 text-slate-950 font-bold hover:from-amber-500 hover:to-amber-400"
            >
              {isPlayingSayr ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop Trajectory</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Audition Sayr Course (عزف السير)</span>
                </>
              )}
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-2 sm:p-4 shadow-xl">
            <SayrVisualization
              sayrDirection={maqam.sayrDirection}
              maqamName={maqam.name}
              maqam={maqam}
              onStopSelect={handleStopSelect}
            />
          </div>
        </div>

        <div className="border-t border-slate-800 px-6 py-3.5 bg-slate-950 flex flex-row items-center justify-between sticky bottom-0 z-10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Interactive Quarter-Tone Distance Mapping (1 qt = 50¢)</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 cursor-pointer"
          >
            Close Trajectory
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
