// src/components/ModulationPathwaysDrawer.tsx
import React, { useState, useMemo } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "./ui/drawer"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  GitFork,
  ArrowRight,
  Play,
  Square,
  Sparkles,
  Volume2,
  CheckCircle2,
  BookOpen,
  X,
  Layers,
  ChevronRight,
  Compass,
  ArrowUpDown,
  Music,
  HelpCircle,
  TrendingUp,
} from "lucide-react"
import { Maqam, MaqamatCatalogue } from "../theory/maqam"
import {
  ModulationPathwayEngine,
  ModulationPathway,
  ModulationRelation,
} from "../theory/modulation-pathways"
import { MicrotonalAudioEngine, TimbreType } from "../audio/microtonal-audio"
import { ArabicPitch } from "../core/pitch"
import { getPitchThemeClasses } from "../core/pitch-styling"
import { useLanguage } from "../state/language"

interface ModulationPathwaysDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentMaqam: Maqam
  timbre?: TimbreType
  onSelectMaqam?: (maqam: Maqam) => void
}

const RELATION_FILTERS: {
  id: "all" | ModulationRelation
  label: string
  arabic: string
}[] = [
  { id: "all", label: "All Pathways", arabic: "جميع المسارات" },
  { id: "same-family", label: "Same Family", arabic: "نفس الفصيلة" },
  { id: "ghammaz-pivot", label: "Ghammaz Pivots", arabic: "محاور الغماز" },
  { id: "shared-jins", label: "Shared Ajnas", arabic: "أجناس مشتركة" },
  { id: "relative-family", label: "Related Families", arabic: "فصائل متقاربة" },
  { id: "tonic-shift", label: "Parallel Tonic", arabic: "على نفس القرار" },
]

export const ModulationPathwaysDrawer: React.FC<ModulationPathwaysDrawerProps> = ({
  open,
  onOpenChange,
  currentMaqam,
  timbre = "violin",
  onSelectMaqam,
}) => {
  const { language } = useLanguage()
  const isArabic = language === "ar"

  const [filterRelation, setFilterRelation] = useState<"all" | ModulationRelation>("all")
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | null>(null)
  const [playingPathwayId, setPlayingPathwayId] = useState<string | null>(null)
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null)

  // Compute available pathways from current active Maqam
  const pathways = useMemo(() => {
    return ModulationPathwayEngine.findPathwaysForMaqam(currentMaqam)
  }, [currentMaqam])

  // Filtered list
  const filteredPathways = useMemo(() => {
    if (filterRelation === "all") return pathways
    return pathways.filter((p) => p.relation === filterRelation)
  }, [pathways, filterRelation])

  // Active pathway detail
  const activePathway = useMemo(() => {
    if (!filteredPathways.length) return null
    if (selectedPathwayId) {
      const found = filteredPathways.find((p) => p.id === selectedPathwayId)
      if (found) return found
    }
    return filteredPathways[0]
  }, [filteredPathways, selectedPathwayId])

  // Stop playback on unmount or drawer close
  const stopAudio = () => {
    MicrotonalAudioEngine.stopSequence("modulation-pathway-playback")
    setPlayingPathwayId(null)
    setActiveNoteIdx(null)
  }

  const handleAuditionBridge = (pathway: ModulationPathway) => {
    if (playingPathwayId === pathway.id) {
      stopAudio()
      return
    }

    stopAudio()
    setPlayingPathwayId(pathway.id)

    // Audition transition bridge notes sequence
    MicrotonalAudioEngine.playSequence(
      pathway.transitionNotes,
      480,
      timbre,
      (idx) => setActiveNoteIdx(idx === -1 ? null : idx),
      () => {
        setPlayingPathwayId(null)
        setActiveNoteIdx(null)
      },
      undefined,
      "modulation-pathway-playback"
    )
  }

  const handlePlaySinglePitch = (pitch: ArabicPitch) => {
    MicrotonalAudioEngine.playPitch(pitch, 0.8, timbre, 0.9)
  }

  const handleApplyTargetMaqam = (target: Maqam) => {
    stopAudio()
    if (onSelectMaqam) {
      onSelectMaqam(target)
    }
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={(val) => {
      if (!val) stopAudio()
      onOpenChange(val)
    }}>
      <DrawerContent className="max-h-[92vh] h-[92vh] w-full max-w-none flex flex-col justify-between overflow-hidden bg-slate-950 p-0 text-slate-100 border-t border-amber-800/40 shadow-2xl">
        {/* Drawer Header */}
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <DrawerTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
                <span>Modulation Pathways &amp; Pivot Ajnas</span>
                <span className="font-arabic text-amber-400 text-sm font-semibold">
                  (مسارات التحويل والمحاور النغمية)
                </span>
              </DrawerTitle>
              <DrawerDescription className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span>Active Anchor: <strong className="text-white">{currentMaqam.name}</strong></span>
                <span>•</span>
                <span>Family: <strong className="text-amber-300">{currentMaqam.family}</strong></span>
                <span>•</span>
                <span>Tonic: <strong className="text-emerald-300 font-mono">{currentMaqam.getTonic().toScientificString()}</strong></span>
                <span>•</span>
                <span>Ghammaz Pivot: <strong className="text-sky-300 font-mono">{currentMaqam.getGhammaz().toScientificString()}</strong></span>
              </DrawerDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 border-amber-500/50 bg-amber-950/40 text-amber-300">
              <Sparkles className="h-3 w-3" />
              <span>{pathways.length} Idiomatic Pathways Found</span>
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                stopAudio()
                onOpenChange(false)
              }}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="border-b border-slate-800/80 px-6 py-2.5 bg-slate-900/60 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1.5 mr-1">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span>Filter Pathways:</span>
          </span>
          {RELATION_FILTERS.map((f) => {
            const isSelected = filterRelation === f.id
            const count = f.id === "all" ? pathways.length : pathways.filter((p) => p.relation === f.id).length
            return (
              <button
                key={f.id}
                onClick={() => setFilterRelation(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50"
                }`}
              >
                <span>{isArabic ? f.arabic : f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? "bg-slate-950/30 text-slate-950" : "bg-slate-900 text-slate-400"
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content Body: Split Master-Detail Layout */}
        <div className="flex-1 overflow-y-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
          {/* Left Column: Pathways List (5 cols) */}
          <div className="lg:col-span-5 space-y-3 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Suggested Target Maqamat ({filteredPathways.length})</span>
              <span>Sorted by Harmonic Affinity</span>
            </div>

            {filteredPathways.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-slate-400">
                <GitFork className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold">No pathways match this filter.</p>
                <p className="text-xs text-slate-500 mt-1">Select another filter tab to view alternative routes.</p>
              </div>
            ) : (
              filteredPathways.map((pathway) => {
                const isSelected = activePathway?.id === pathway.id
                const isPlaying = playingPathwayId === pathway.id

                return (
                  <div
                    key={pathway.id}
                    onClick={() => {
                      setSelectedPathwayId(pathway.id)
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden group ${
                      isSelected
                        ? "border-amber-400 bg-linear-to-r from-amber-950/40 via-slate-900 to-slate-900/90 shadow-lg ring-1 ring-amber-400/40"
                        : "border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                            {pathway.targetMaqam.name}
                          </span>
                          <span className="font-arabic text-xs text-amber-400 font-semibold">
                            {pathway.targetMaqam.arabicName}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-2 font-mono ${
                              pathway.relation === "same-family"
                                ? "border-emerald-500/60 text-emerald-300 bg-emerald-950/30"
                                : pathway.relation === "ghammaz-pivot"
                                ? "border-sky-500/60 text-sky-300 bg-sky-950/30"
                                : pathway.relation === "shared-jins"
                                ? "border-purple-500/60 text-purple-300 bg-purple-950/30"
                                : "border-amber-500/60 text-amber-300 bg-amber-950/30"
                            }`}
                          >
                            {pathway.relation.replace("-", " ")}
                          </Badge>

                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                            {pathway.technique}
                          </Badge>

                          <span className="text-[11px] text-slate-400">
                            Family: <strong className="text-slate-200">{pathway.targetMaqam.family}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Affinity Score Circle */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] uppercase font-mono text-slate-400">Affinity</span>
                        <span className="text-sm font-black font-mono text-amber-300">
                          {pathway.affinityScore}%
                        </span>
                      </div>
                    </div>

                    {/* Pivot summary */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-semibold">Pivot:</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-white text-[11px]">
                          {pathway.pivotPoint.pitchName} ({pathway.pivotPoint.role})
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          → {pathway.bridgeJins.definition.name}
                        </span>
                      </div>

                      <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? "text-amber-400 translate-x-1" : "text-slate-600"}`} />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Right Column: Pathway Deep-Dive Inspector (7 cols) */}
          <div className="lg:col-span-7">
            {activePathway ? (
              <div className="space-y-5 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
                {/* Header & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-amber-500/50 text-amber-300 text-xs px-2 py-0.5">
                        {activePathway.technique} Modulation
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {activePathway.relation.replace("-", " ")}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
                      <span>{currentMaqam.name}</span>
                      <ArrowRight className="h-5 w-5 text-amber-400 shrink-0" />
                      <span className="text-amber-300">{activePathway.targetMaqam.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-arabic mt-0.5">
                      الانتقال اللحني من {currentMaqam.arabicName || currentMaqam.name} إلى {activePathway.targetMaqam.arabicName || activePathway.targetMaqam.name}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={playingPathwayId === activePathway.id ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleAuditionBridge(activePathway)}
                      className="gap-2 cursor-pointer shadow-md bg-linear-to-r from-amber-600 to-amber-500 text-slate-950 font-bold hover:from-amber-500 hover:to-amber-400"
                    >
                      {playingPathwayId === activePathway.id ? (
                        <>
                          <Square className="h-3.5 w-3.5 fill-current" />
                          <span>Stop Bridge</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Audition Bridge (عزف الانتقال)</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTargetMaqam(activePathway.targetMaqam)}
                      className="border-slate-700 bg-slate-950 text-emerald-300 hover:text-white hover:bg-emerald-950/40 cursor-pointer gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Switch to {activePathway.targetMaqam.name}</span>
                    </Button>
                  </div>
                </div>

                {/* Pivot Point & Bridge Jins Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pivot Point Card */}
                  <div className="rounded-xl border border-sky-900/40 bg-sky-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5" />
                        <span>Pivot Point (محور التحويل)</span>
                      </span>
                      <Badge variant="outline" className="border-sky-500/60 text-sky-200 font-mono text-[11px]">
                        Degree #{activePathway.pivotPoint.scaleDegree} ({activePathway.pivotPoint.role})
                      </Badge>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl font-black font-mono text-white">
                        {activePathway.pivotPoint.pitchName}
                      </span>
                      <span className="text-xs text-sky-400 font-arabic">
                        نغمة المحور
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isArabic ? activePathway.pivotPoint.arabicDescription : activePathway.pivotPoint.description}
                    </p>
                  </div>

                  {/* Bridge Jins Card */}
                  <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        <span>Bridge Jins (جنس التحويل)</span>
                      </span>
                      <Badge variant="outline" className="border-amber-500/60 text-amber-200 text-[11px]">
                        {activePathway.bridgeJins.definition.type}
                      </Badge>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl font-black text-white">
                        {activePathway.bridgeJins.definition.name}
                      </span>
                      <span className="text-xs text-amber-400 font-arabic font-semibold">
                        ({activePathway.bridgeJins.definition.arabicName})
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Built on <strong>{activePathway.bridgeJins.root.toScientificString()}</strong> ({activePathway.bridgeJins.definition.description})
                    </p>
                  </div>
                </div>

                {/* Transition Bridge Notes Matrix */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Volume2 className="h-4 w-4 text-amber-400" />
                      <span>Melodic Transition Sequence (سلسلة النغمات الانتقالية)</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Click note to audition single pitch
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {activePathway.transitionNotes.map((pitch, idx) => {
                      const isSounding = activeNoteIdx === idx
                      const isPivot = pitch.equals(activePathway.pivotPoint.pitch)
                      const theme = getPitchThemeClasses(pitch, "card", { isSounding })

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePlaySinglePitch(pitch)}
                          className={`group px-3 py-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${theme.combined} ${
                            isPivot ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950" : ""
                          }`}
                        >
                          <span className="text-[10px] font-mono opacity-75">
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-bold font-mono my-0.5">
                            {pitch.toScientificString()}
                          </span>
                          <span className="text-[9px] font-serif opacity-90">
                            {isPivot ? "★ Pivot" : `deg`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Theory Rationale & Historical Practice */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Theoretical Rationale &amp; Classical Tradition
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isArabic ? activePathway.arabicRationale : activePathway.rationale}
                  </p>

                  <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{activePathway.historicalContext}</span>
                  </div>
                </div>

                {/* Scale Comparison: Source vs Target */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Comparative Scale Framework
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-slate-400 shrink-0 font-medium">{currentMaqam.name}:</span>
                      <div className="flex flex-wrap gap-1 font-mono">
                        {currentMaqam.getScale().map((p, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                              p.equals(activePathway.pivotPoint.pitch)
                                ? "bg-amber-500 text-slate-950 font-bold"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {p.toScientificString()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-24 text-amber-300 shrink-0 font-semibold">{activePathway.targetMaqam.name}:</span>
                      <div className="flex flex-wrap gap-1 font-mono">
                        {activePathway.targetMaqam.getScale().map((p, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                              p.equals(activePathway.pivotPoint.pitch)
                                ? "bg-amber-500 text-slate-950 font-bold"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {p.toScientificString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-800 px-6 py-3.5 bg-slate-950 flex flex-row items-center justify-between sticky bottom-0 z-10 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Classical Ajnas-Based Modulation Model (علم الانتقال والتنجيس)</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              stopAudio()
              onOpenChange(false)
            }}
            className="border-slate-700 cursor-pointer"
          >
            Close Pathways
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
