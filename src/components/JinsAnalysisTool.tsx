// src/components/JinsAnalysisTool.tsx
import React, { useState, useMemo, useCallback, useEffect } from "react"
import { ArabicPitch, DiatonicBase } from "../core/pitch"
import { Jins, JinsDefinition, AjnasLibrary } from "../theory/jins"
import { ArabicNoteSpine } from "../core/note-spine"
import { MicrotonalAudioEngine, TimbreType } from "../audio/microtonal-audio"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Package,
  Play,
  Square,
  Radio,
  ArrowUpDown,
  BookOpen,
  Volume2,
  Sparkles,
  X,
  Compass,
  BadgeCheck,
  CircleOff,
} from "lucide-react"

export interface JinsAnalysisToolProps {
  initialJinsId?: string
  initialRoot?: ArabicPitch
  timbre?: TimbreType
  onTimbreChange?: (timbre: TimbreType) => void
  isCompact?: boolean
  onClose?: () => void
}

interface NoteDisplayData {
  pitch: ArabicPitch
  stepOffset: number // Diatonic step relative to C4 = 0
  staffY: number
  staffX: number
  isBaggage: boolean
  isTonic: boolean
  offsetCents: number
  offsetQuarterTones: number
  arabicName: string
  roleLabel: string
  degreeLabel: string
}

/**
 * Common roots available for transposition
 */
const COMMON_ROOTS: { label: string; pitch: ArabicPitch }[] = [
  { label: "C4 (Rast)", pitch: new ArabicPitch("C", "♮", 4) },
  { label: "D4 (Dukah)", pitch: new ArabicPitch("D", "♮", 4) },
  { label: "E𝄳4 (Sikah)", pitch: new ArabicPitch("E", "𝄳", 4) },
  { label: "F4 (Jiharkah)", pitch: new ArabicPitch("F", "♮", 4) },
  { label: "G4 (Nawa)", pitch: new ArabicPitch("G", "♮", 4) },
  { label: "A4 (Husayni)", pitch: new ArabicPitch("A", "♮", 4) },
  { label: "B♭3 (Ajam)", pitch: new ArabicPitch("B", "♭", 3) },
  { label: "B𝄳3 (Iraq)", pitch: new ArabicPitch("B", "𝄳", 3) },
]

/**
 * Diatonic order helper: C4 = 0
 */
const DIATONIC_ORDER: Record<DiatonicBase, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

/**
 * Calculates exact staff Y coordinate for a given pitch on the treble clef staff.
 * Staff lines:
 * F5 (top, line 5) = 48
 * D5 (line 4) = 64
 * B4 (line 3) = 80
 * G4 (line 2) = 96
 * E4 (bottom, line 1) = 112
 * Middle C4 (ledger line 1 below) = 128
 * Each diatonic step delta = 8px.
 */
function calculateStaffY(pitch: ArabicPitch): { step: number; y: number } {
  const step = (pitch.octave - 4) * 7 + DIATONIC_ORDER[pitch.diatonic]
  // step 0 (C4) = 136; step 2 (E4) = 120; step 4 (G4) = 104; step 6 (B4) = 88; step 8 (D5) = 72; step 10 (F5) = 56
  const y = 136 - step * 8
  return { step, y }
}

export function JinsAnalysisTool({
  initialJinsId = "bayati",
  initialRoot,
  timbre = "violin",
  onTimbreChange,
  isCompact = false,
  onClose,
}: JinsAnalysisToolProps) {
  // Selected Jins & Root
  const allDefinitions = useMemo(() => AjnasLibrary.getAllDefinitions(), [])
  const [selectedJinsId, setSelectedJinsId] = useState<string>(initialJinsId)

  const selectedDef = useMemo(() => {
    return (
      allDefinitions.find((d) => d.id === selectedJinsId) || AjnasLibrary.BAYATI
    )
  }, [allDefinitions, selectedJinsId])

  const [currentRoot, setCurrentRoot] = useState<ArabicPitch>(() => {
    return initialRoot || selectedDef.defaultRoot
  })

  // Whenever user picks a different jins definition, reset root to that jins' default root if desired
  const handleSelectJins = (def: JinsDefinition) => {
    setSelectedJinsId(def.id)
    setCurrentRoot(def.defaultRoot)
  }

  // Instantiate Jins object
  const jinsInstance = useMemo(() => {
    return new Jins(selectedDef, currentRoot)
  }, [selectedDef, currentRoot])

  // Baggage notes & Core pitches
  const baggagePitches = useMemo(() => {
    return jinsInstance.getBaggageNotes()
  }, [jinsInstance])

  const topPitch = useMemo(() => jinsInstance.getTopPitch(), [jinsInstance])
  const rootQt = currentRoot.toQuarterToneIndex()
  const topQt = topPitch.toQuarterToneIndex()
  const lowerBaggagePitches = useMemo(
    () => baggagePitches.filter((pitch) => pitch.toQuarterToneIndex() < rootQt),
    [baggagePitches, rootQt]
  )
  const upperBaggagePitches = useMemo(
    () => baggagePitches.filter((pitch) => pitch.toQuarterToneIndex() > topQt),
    [baggagePitches, topQt]
  )

  const corePitches = useMemo(() => {
    return jinsInstance.getPitches()
  }, [jinsInstance])

  // Combined full scale with baggage
  const fullScaleWithBaggage = useMemo(() => {
    return jinsInstance.getPitchesWithBaggage()
  }, [jinsInstance])

  // Audio & Playing state
  const [activePlaybackSequence, setActivePlaybackSequence] = useState<
    string | null
  >(null)
  const [activeSoundingPitch, setActiveSoundingPitch] =
    useState<ArabicPitch | null>(null)
  const [isDroneOn, setIsDroneOn] = useState<boolean>(false)
  const [hoveredNote, setHoveredNote] = useState<NoteDisplayData | null>(null)

  // Filters & Tabs
  const [jinsFilter, setJinsFilter] = useState<
    "all" | "trichord" | "tetrachord" | "pentachord" | "undefined"
  >("all")
  const [activeViewTab, setActiveViewTab] = useState<
    "staff" | "theory" | "compare"
  >("staff")
  const [comparisonJinsId, setComparisonJinsId] = useState<string>("saba")

  const handleTimbreSelect = (t: TimbreType) => {
    onTimbreChange?.(t)
  }

  // Stop all sequence playing on unmount
  useEffect(() => {
    return () => {
      MicrotonalAudioEngine.stopSequence("jins-analysis")
      if (isDroneOn) {
        MicrotonalAudioEngine.toggleDrone(currentRoot, false)
      }
    }
  }, [currentRoot, isDroneOn])

  // Toggle Drone
  const handleToggleDrone = () => {
    if (isDroneOn) {
      MicrotonalAudioEngine.toggleDrone(currentRoot, false)
      setIsDroneOn(false)
    } else {
      MicrotonalAudioEngine.toggleDrone(currentRoot, true)
      setIsDroneOn(true)
    }
  }

  // Play single note
  const handlePlayNote = useCallback(
    (pitch: ArabicPitch) => {
      setActiveSoundingPitch(pitch)
      MicrotonalAudioEngine.playPitch(pitch, 1.0, timbre, 0.85)
      setTimeout(() => {
        setActiveSoundingPitch(null)
      }, 700)
    },
    [timbre]
  )

  // Play Sequence Helper
  const playPitchList = useCallback(
    (pitches: ArabicPitch[], sequenceId: string, durationPerNoteMs = 450) => {
      if (activePlaybackSequence) {
        MicrotonalAudioEngine.stopSequence("jins-analysis")
      }
      setActivePlaybackSequence(sequenceId)

      MicrotonalAudioEngine.playSequence(
        pitches,
        durationPerNoteMs,
        timbre,
        (stepIndex: number) => {
          if (pitches[stepIndex]) {
            setActiveSoundingPitch(pitches[stepIndex])
          }
        },
        () => {
          setActivePlaybackSequence(null)
          setActiveSoundingPitch(null)
        },
        undefined,
        "jins-analysis"
      )
    },
    [activePlaybackSequence, timbre]
  )

  // Stop playback
  const handleStopPlayback = useCallback(() => {
    MicrotonalAudioEngine.stopSequence("jins-analysis")
    setActivePlaybackSequence(null)
    setActiveSoundingPitch(null)
  }, [])

  // 1. Play Baggage Only
  const handlePlayBaggageOnly = () => {
    if (baggagePitches.length === 0) return
    const sequence = [
      ...lowerBaggagePitches,
      currentRoot,
      ...upperBaggagePitches,
    ]
    playPitchList(sequence, "baggage")
  }

  // 2. Play Core Jins
  const handlePlayCoreJins = () => {
    playPitchList(corePitches, "core")
  }

  // 3. Play Complete (Baggage + Core Ascending)
  const handlePlayCompleteScale = () => {
    playPitchList(fullScaleWithBaggage, "complete")
  }

  // 4. Play Authentic Abu Shumays Qafla (Descent with Baggage resolving to Tonic)
  const handlePlayQaflaDescent = () => {
    if (corePitches.length === 0) return
    const topPitch = corePitches[corePitches.length - 1]
    const secondTop = corePitches[corePitches.length - 2] || topPitch
    const secondDegree = corePitches[1] || currentRoot

    // Phrase: top -> down to 2nd degree -> tonic -> dip into baggage -> resolve up to tonic!
    const phrase: ArabicPitch[] = []
    phrase.push(topPitch)
    if (corePitches.length > 3) phrase.push(secondTop)
    phrase.push(secondDegree)
    phrase.push(currentRoot)

    if (lowerBaggagePitches.length > 0) {
      for (let i = lowerBaggagePitches.length - 1; i >= 0; i--) {
        phrase.push(lowerBaggagePitches[i])
      }
      if (lowerBaggagePitches.length > 1) {
        phrase.push(lowerBaggagePitches[lowerBaggagePitches.length - 1])
      }
    }
    // Resolute cadence landing on tonic
    phrase.push(currentRoot)

    playPitchList(phrase, "qafla", 520)
  }

  // Staff SVG note data generation
  const staffNotesData = useMemo<NoteDisplayData[]>(() => {
    const data: NoteDisplayData[] = []
    const leftMargin = 105
    const rightMargin = 730

    const totalNotes = baggagePitches.length + corePitches.length
    const availableWidth = rightMargin - leftMargin
    const spacing = Math.min(
      68,
      Math.max(48, (availableWidth - 32) / Math.max(totalNotes, 6))
    )

    let currentX = leftMargin

    const appendBaggageGroup = (
      pitches: ArabicPitch[],
      anchor: ArabicPitch,
      label: "Sub" | "Above"
    ) => {
      pitches.forEach((pitch, idx) => {
        const { step, y } = calculateStaffY(pitch)
        const qtDiff = anchor.diffQuarterTones(pitch)
        const centsDiff = anchor.diffCents(pitch)
        const degreeLabel =
          label === "Sub" ? `Sub-${pitches.length - idx}` : `Above+${idx + 1}`
        const spineInfo = ArabicNoteSpine.findByPitch(pitch)

        data.push({
          pitch,
          stepOffset: step,
          staffY: y,
          staffX: currentX,
          isBaggage: true,
          isTonic: false,
          offsetCents: centsDiff,
          offsetQuarterTones: qtDiff,
          arabicName: spineInfo?.arabicName || pitch.toDisplayString(),
          roleLabel: `Baggage Note ${degreeLabel} (${centsDiff}¢)`,
          degreeLabel,
        })

        currentX += spacing
      })
    }

    appendBaggageGroup(lowerBaggagePitches, currentRoot, "Sub")

    if (lowerBaggagePitches.length > 0) {
      currentX += 16
    }

    // Core pitches (tonic upwards)
    corePitches.forEach((pitch, idx) => {
      const { step, y } = calculateStaffY(pitch)
      const qtDiff = currentRoot.diffQuarterTones(pitch)
      const centsDiff = currentRoot.diffCents(pitch)
      const spineInfo = ArabicNoteSpine.findByPitch(pitch)
      const isTonic = idx === 0

      data.push({
        pitch,
        stepOffset: step,
        staffY: y,
        staffX: currentX,
        isBaggage: false,
        isTonic,
        offsetCents: centsDiff,
        offsetQuarterTones: qtDiff,
        arabicName: spineInfo?.arabicName || pitch.toDisplayString(),
        roleLabel: isTonic
          ? "Tonic (الأساس)"
          : `Degree ${idx + 1} (+${centsDiff}¢)`,
        degreeLabel: isTonic ? "Tonic" : `${idx + 1}`,
      })

      currentX += spacing
    })

    if (upperBaggagePitches.length > 0) {
      currentX += 16
    }
    appendBaggageGroup(upperBaggagePitches, topPitch, "Above")

    return data
  }, [
    baggagePitches,
    corePitches,
    currentRoot,
    lowerBaggagePitches,
    upperBaggagePitches,
    topPitch,
  ])

  const baggageBoundaries = useMemo(() => {
    const boundaryFor = (label: string, pitches: ArabicPitch[]) => {
      const notes = staffNotesData.filter((note) =>
        pitches.some((pitch) => pitch.equals(note.pitch))
      )
      if (notes.length === 0) return null
      const startX = notes[0].staffX
      const endX = notes[notes.length - 1].staffX
      return {
        label,
        startX,
        endX,
        width: endX - startX,
        centerX: (startX + endX) / 2,
      }
    }
    return [
      boundaryFor("Below tonic", lowerBaggagePitches),
      boundaryFor("Above top pitch", upperBaggagePitches),
    ].filter((boundary) => boundary !== null)
  }, [staffNotesData, lowerBaggagePitches, upperBaggagePitches])

  const coreBoundary = useMemo(() => {
    const coreNotes = staffNotesData.filter((n) => !n.isBaggage)
    if (coreNotes.length === 0) return null
    const startX = coreNotes[0].staffX
    const endX = coreNotes[coreNotes.length - 1].staffX
    return {
      startX,
      endX,
      width: endX - startX,
      centerX: (startX + endX) / 2,
    }
  }, [staffNotesData])

  // Comparison Jins
  const comparisonDef = useMemo(() => {
    return (
      allDefinitions.find((d) => d.id === comparisonJinsId) || AjnasLibrary.SABA
    )
  }, [allDefinitions, comparisonJinsId])

  const comparisonInstance = useMemo(() => {
    return new Jins(comparisonDef, currentRoot)
  }, [comparisonDef, currentRoot])

  // Filtered ajnas list
  const filteredAjnas = useMemo(() => {
    if (jinsFilter === "all") return allDefinitions
    if (jinsFilter === "undefined")
      return allDefinitions.filter((d) => d.type === "UndefinedSize")
    return allDefinitions.filter((d) => d.type.toLowerCase() === jinsFilter)
  }, [allDefinitions, jinsFilter])

  return (
    <div className={`space-y-6 ${isCompact ? "p-1" : ""}`}>
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-amber-950/40 p-5 shadow-xl backdrop-blur-md sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/20 text-purple-400 shadow-inner">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                    <span>Jins Analysis Tool</span>
                    <span className="font-arabic text-sm font-normal text-purple-400">
                      أمتعة الأجناس الموسيقية
                    </span>
                  </h2>
                  <Badge
                    variant="outline"
                    className="border-purple-400/40 text-[10px] text-purple-300"
                  >
                    Maqam World 24-EDO Model
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                  Explore ajnas by size alongside baggage notes (أمتعة الجنس):
                  negative offsets fall below the tonic, while positive offsets
                  extend above the jins top pitch. Note if the data with red
                  circle off icon{" "}
                  <span>
                    <CircleOff className="mx-1 inline-block w-4 text-red-500" />{" "}
                    and verified if{" "}
                    <BadgeCheck className="inline-block w-4 text-green-500 mx-1" />
                  </span>
                  is note verified (from maqamworld.com)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Close button if in drawer */}
          <div className="flex items-center gap-2 self-end md:self-center">
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                title="Close Tool"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Jins Selector Carousel / Filter Bar */}
        <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-slate-800/80 pt-4 sm:flex-row sm:items-center">
          <div className="flex w-full scrollbar-none items-center gap-1.5 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            {(
              [
                { id: "all", label: `All (${allDefinitions.length})` },
                { id: "trichord", label: "3-note (Trichords)" },
                { id: "tetrachord", label: "4-note (Tetrachords)" },
                { id: "pentachord", label: "5-note (Pentachords)" },
                { id: "undefined", label: "(undefined size)" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setJinsFilter(id)}
                className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                  jinsFilter === id
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-500/30"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Root Transposition Dropdown / Quick Select */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-medium text-slate-400">
              <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
              Root Tonic:
            </span>
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
              {COMMON_ROOTS.slice(0, 4).map((r) => {
                const isSelected = r.pitch.equals(currentRoot)
                return (
                  <button
                    key={r.label}
                    onClick={() => setCurrentRoot(r.pitch)}
                    className={`cursor-pointer rounded-lg px-2 py-0.5 font-mono text-[11px] transition-all ${
                      isSelected
                        ? "bg-amber-500 font-bold text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {r.pitch.toString()}
                  </button>
                )
              })}
              {/* Reset to Jins default root if different */}
              {!currentRoot.equals(selectedDef.defaultRoot) && (
                <button
                  onClick={() => setCurrentRoot(selectedDef.defaultRoot)}
                  className="cursor-pointer rounded-lg border border-purple-800/60 bg-purple-950/60 px-2 py-0.5 text-[10px] text-purple-300 transition-all hover:text-purple-100"
                  title={`Reset to default root ${selectedDef.defaultRoot.toString()}`}
                >
                  Reset ({selectedDef.defaultRoot.toString()})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ajnas Horizontal Selection Cards */}
      <div className="flex scrollbar-thin gap-2.5 overflow-x-auto pb-2">
        {filteredAjnas.map((def) => {
          const isSelected = def.id === selectedJinsId
          const baggageCount = def.baggageIntervals?.length || 0
          return (
            <button
              key={def.id}
              onClick={() => handleSelectJins(def)}
              className={`min-w-[170px] flex-shrink-0 cursor-pointer rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? "border-purple-500 bg-purple-950/70 text-white shadow-md ring-1 shadow-purple-500/10 ring-purple-500/40"
                  : "border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-1">
                <span className="text-sm font-bold tracking-tight">
                  {def.name}
                </span>
                <span className="font-arabic text-xs text-amber-400">
                  {def.arabicName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <Badge
                  variant="secondary"
                  className={`px-1.5 py-0 text-[10px] ${
                    isSelected
                      ? "bg-purple-800/60 text-purple-200"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {def.sizeLabel || def.type}
                </Badge>
                {baggageCount > 0 ? (
                  <span className="font-mono text-purple-400">
                    {baggageCount} baggage note{baggageCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-slate-500">No baggage</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Primary Interactive Section: Staff + Controls */}
      <Card className="overflow-hidden border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-md">
        <CardHeader className="border-b border-slate-800/80 bg-slate-900/40 p-4 sm:p-5">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <CardTitle className="flex items-center gap-2 text-base text-white sm:text-lg md:text-sm">
                  <span>Interactive Musical Staff: {selectedDef.name}</span>
                  <span className="font-arabic text-md text-amber-400">
                    {selectedDef.arabicName}
                  </span>
                  <span className="text-md rounded-md border border-purple-800/50 bg-purple-950/50 px-2 py-0.5 font-mono text-amber-400">
                    on {currentRoot.toString()}
                  </span>
                  <span className="rounded-md border border-slate-700/50 bg-slate-800/50 px-1.5 py-0.5 text-xs text-slate-400">
                    <span className="text-lg dark:text-white">
                      {selectedDef.intervals.join(" - ")}
                    </span>
                  </span>

                  <span>
                    {selectedDef.verified ? (
                      <BadgeCheck className="text-green-500" />
                    ) : (
                      <CircleOff className="text-red-500" />
                    )}
                  </span>
                </CardTitle>
              </div>
              <CardDescription className="mt-1 text-sm text-slate-400">
                {selectedDef.description ||
                  "No description available for this jins."}
              </CardDescription>
            </div>

            {/* Audio & Playback Toolbar - Responsive */}
            <div className="flex w-full flex-wrap items-center gap-1.5 sm:gap-2 lg:w-auto">
              {/* Tonic Drone Button */}
              <Button
                variant={isDroneOn ? "default" : "outline"}
                size="sm"
                onClick={handleToggleDrone}
                className={`h-7 cursor-pointer gap-1 rounded-xl px-2 text-[11px] sm:h-8 sm:gap-1.5 sm:px-2.5 sm:text-xs ${
                  isDroneOn
                    ? "bg-amber-500 font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400"
                    : "border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
                title={
                  isDroneOn
                    ? "Stop tonic drone"
                    : `Start tonic drone (${currentRoot.toString()})`
                }
              >
                <Radio
                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isDroneOn ? "text-slate-950" : "text-amber-400"}`}
                />
                <span>Drone</span>
              </Button>

              {/* Play Baggage Only Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayBaggageOnly}
                disabled={
                  baggagePitches.length === 0 || activePlaybackSequence !== null
                }
                className="h-7 cursor-pointer rounded-xl border-purple-500/50 bg-purple-950/30 px-2 text-[11px] text-purple-200 hover:bg-purple-900/40 disabled:opacity-50 sm:h-8 sm:px-2.5 sm:text-xs"
              >
                <Play className="mr-1 h-3 w-3 text-purple-400 sm:h-3.5 sm:w-3.5" />
                Play Baggage
              </Button>

              {/* Play Core Jins Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayCoreJins}
                disabled={activePlaybackSequence !== null}
                className="h-7 cursor-pointer rounded-xl border-amber-500/40 bg-amber-950/30 px-2 text-[11px] text-amber-200 hover:bg-amber-900/40 disabled:opacity-50 sm:h-8 sm:px-2.5 sm:text-xs"
              >
                <Play className="mr-1 h-3 w-3 text-amber-400 sm:h-3.5 sm:w-3.5" />
                Core Jins
              </Button>

              {/* Play Full Scale (Baggage + Core) */}
              <Button
                variant="default"
                size="sm"
                onClick={handlePlayCompleteScale}
                disabled={activePlaybackSequence !== null}
                className="h-7 cursor-pointer rounded-xl bg-purple-600 px-2.5 text-[11px] font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500 disabled:opacity-50 sm:h-8 sm:px-3 sm:text-xs"
              >
                <Play className="mr-1 h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />
                Full Scale
              </Button>

              {/* Play Abu Shumays Qafla Descent */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayQaflaDescent}
                disabled={activePlaybackSequence !== null}
                className="h-7 cursor-pointer rounded-xl border-emerald-500/50 bg-emerald-950/30 px-2 text-[11px] text-emerald-300 hover:bg-emerald-900/40 disabled:opacity-50 sm:h-8 sm:px-2.5 sm:text-xs"
                title="Audition characteristic descent phrase dipping into baggage and landing on tonic"
              >
                <Compass className="mr-1 h-3 w-3 text-emerald-400 sm:h-3.5 sm:w-3.5" />
                Qafla
              </Button>

              {/* Stop Button */}
              {activePlaybackSequence && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopPlayback}
                  className="h-7 animate-pulse cursor-pointer rounded-xl px-2 text-[11px] sm:h-8 sm:px-2.5 sm:text-xs"
                >
                  <Square className="mr-1 h-3 w-3" />
                  Stop
                </Button>
              )}

              {/* Timbre Switcher */}
              <div className="ml-auto flex items-center rounded-xl border border-slate-800 bg-slate-900 p-0.5 text-xs lg:ml-0">
                {(["violin", "oud"] as TimbreType[]).map((tVal) => (
                  <button
                    key={tVal}
                    onClick={() => handleTimbreSelect(tVal)}
                    className={`cursor-pointer rounded-lg px-1.5 py-0.5 text-[11px] font-medium capitalize transition-all sm:px-2 sm:text-xs ${
                      timbre === tVal
                        ? "border border-purple-500/30 bg-purple-600/30 text-purple-200"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tVal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          {/* Mobile Horizontal Scroll Hint */}
          <div className="mb-3 flex items-center justify-between rounded-xl border border-purple-500/25 bg-purple-950/30 px-3 py-1.5 text-[11px] text-purple-300/90 md:hidden">
            <span className="flex items-center gap-1.5">
              <span>↔</span>
              <span>Swipe staff to view full octave &amp; baggage</span>
            </span>
            <span className="font-arabic text-[10px] text-purple-400/80">
              اسحب النوتة
            </span>
          </div>

          {/* Todo: separate to new component named 'SVGStaff' */}
          {/* THE INTERACTIVE SVG STAFF */}
          <div className="relative touch-pan-x scrollbar-thin overflow-x-auto rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-950 to-slate-900 p-2 shadow-inner sm:p-5">
            <svg
              viewBox="0 0 850 270"
              className="h-auto w-full min-w-[720px] overflow-visible select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Glow Filter for Baggage Notes */}
                <filter
                  id="purpleGlow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Glow Filter for Tonic */}
                <filter
                  id="emeraldGlow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="4.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Glow Filter for Core notes */}
                <filter
                  id="amberGlow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="3.0" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Gradient for Baggage noteheads */}
                <linearGradient
                  id="baggageGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>

                {/* Gradient for Tonic notehead */}
                <linearGradient
                  id="tonicGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* Gradient for Core noteheads */}
                <linearGradient
                  id="coreGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Manuscript Background Tint */}
              <rect
                x="10"
                y="10"
                width="830"
                height="252"
                rx="14"
                fill="#0b0f19"
                stroke="#1e293b"
                strokeWidth="1"
              />

              {/* 5 Standard Staff Lines */}
              {/* Line 5 (F5, y=56) */}
              <line
                x1="30"
                y1="56"
                x2="820"
                y2="56"
                stroke="#475569"
                strokeWidth="1.2"
              />
              {/* Line 4 (D5, y=72) */}
              <line
                x1="30"
                y1="72"
                x2="820"
                y2="72"
                stroke="#475569"
                strokeWidth="1.2"
              />
              {/* Line 3 (B4, y=88) */}
              <line
                x1="30"
                y1="88"
                x2="820"
                y2="88"
                stroke="#475569"
                strokeWidth="1.2"
              />
              {/* Line 2 (G4, y=104) */}
              <line
                x1="30"
                y1="104"
                x2="820"
                y2="104"
                stroke="#475569"
                strokeWidth="1.2"
              />
              {/* Line 1 (E4, y=120) */}
              <line
                x1="30"
                y1="120"
                x2="820"
                y2="120"
                stroke="#475569"
                strokeWidth="1.2"
              />

              {/* Beginning Measure Barline */}
              <line
                x1="30"
                y1="56"
                x2="30"
                y2="120"
                stroke="#64748b"
                strokeWidth="2"
              />
              <line
                x1="820"
                y1="56"
                x2="820"
                y2="120"
                stroke="#64748b"
                strokeWidth="2"
              />

              {/* Treble Clef Graphic centered on G4 (line 2, y=104) */}
              <g transform="translate(42, 36) scale(0.68)">
                <path
                  d="M18.4,78.2 C18.1,76.5 17.5,74.7 16.7,73.1 C14.6,68.9 11.2,66.1 7.2,65.2 C5.8,64.9 4.3,64.9 2.9,65.3 C0.9,65.9 -0.6,67.4 -1.1,69.4 C-1.6,71.4 -0.9,73.5 0.7,74.9 C2.3,76.3 4.6,76.8 6.6,76.2 C7.9,75.8 8.8,74.9 9.3,73.7 C9.5,73.2 9.4,72.7 9.1,72.3 C8.8,71.9 8.2,71.7 7.7,71.9 C6.8,72.3 5.7,72.2 4.9,71.5 C4.3,71.0 4.1,70.3 4.3,69.5 C4.5,68.7 5.2,68.1 6.0,67.9 C7.9,67.6 9.8,68.8 10.6,70.6 C11.9,73.5 11.5,77.1 9.5,79.7 C7.6,82.2 4.5,83.7 1.4,83.6 C-2.4,83.5 -5.8,81.4 -7.5,78.0 C-9.3,74.4 -9.3,70.0 -7.4,66.3 C-4.8,61.1 0.3,57.5 5.9,56.5 C8.1,56.1 10.3,56.2 12.5,56.8 L12.5,33.5 C10.9,34.8 9.2,36.3 7.7,37.9 C6.3,39.4 5.2,40.9 4.3,42.5 C4.0,43.0 3.5,43.3 2.9,43.3 C2.3,43.3 1.8,43.0 1.5,42.5 C0.9,41.5 1.2,40.1 2.2,39.2 C3.5,38.0 5.0,36.5 6.6,35.0 C8.5,33.2 10.5,31.7 12.5,30.3 L12.5,18.0 C12.5,13.2 14.1,8.6 17.0,5.0 C19.9,1.4 23.9,-0.6 28.5,-0.6 C32.6,-0.6 36.3,1.1 38.8,4.1 C41.3,7.1 42.4,11.2 41.9,15.3 C41.2,21.5 37.6,26.9 32.2,30.2 C27.8,32.9 22.8,34.4 17.6,34.8 L17.6,58.8 C21.4,60.2 24.8,62.6 27.2,65.8 C29.7,69.2 31.0,73.3 30.7,77.6 C30.2,83.7 26.6,89.1 21.2,92.1 C18.3,93.7 15.1,94.6 11.9,94.7 L11.9,103.5 C11.9,106.6 10.7,109.6 8.5,111.8 C6.3,114.0 3.3,115.2 0.2,115.2 C-3.0,115.2 -6.0,114.0 -8.2,111.8 C-10.4,109.6 -11.6,106.6 -11.6,103.5 C-11.6,100.4 -10.4,97.4 -8.2,95.2 C-6.0,93.0 -3.0,91.8 0.2,91.8 C2.0,91.8 3.8,92.2 5.4,93.0 L5.4,85.2 C9.8,84.9 14.2,82.8 16.9,79.5 C17.7,78.5 18.2,77.3 18.4,76.1 Z"
                  fill="#94a3b8"
                />
              </g>

              {baggageBoundaries.map((boundary) => (
                <g key={boundary.label}>
                  <rect
                    x={boundary.startX - 32}
                    y={22}
                    width={boundary.width + 64}
                    height={205}
                    rx="8"
                    fill="#a855f7"
                    fillOpacity="0.06"
                    stroke="#a855f7"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <path
                    d={`M ${boundary.startX - 14} 228
                        L ${boundary.startX - 14} 236
                        L ${boundary.centerX - 10} 236
                        L ${boundary.centerX} 242
                        L ${boundary.centerX + 10} 236
                        L ${boundary.endX + 14} 236
                        L ${boundary.endX + 14} 228`}
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="1.8"
                  />
                  <text
                    x={boundary.centerX}
                    y={255}
                    textAnchor="middle"
                    fill="#e9d5ff"
                    fontSize="11"
                    fontWeight="bold"
                    letterSpacing="0.05em"
                  >
                    Baggage • {boundary.label}
                  </text>
                </g>
              ))}

              {/* Core Jins Region Highlight Bracket */}
              {coreBoundary && (
                <g>
                  {/* Overline Bracket for Core Jins */}
                  <path
                    d={`M ${coreBoundary.startX - 14} 34 
                        L ${coreBoundary.startX - 14} 26 
                        L ${coreBoundary.centerX - 10} 26 
                        L ${coreBoundary.centerX} 20 
                        L ${coreBoundary.centerX + 10} 26 
                        L ${coreBoundary.endX + 14} 26 
                        L ${coreBoundary.endX + 14} 34`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.8"
                  />
                  <text
                    x={coreBoundary.centerX}
                    y={15}
                    textAnchor="middle"
                    fill="#fef3c7"
                    fontSize="11"
                    fontWeight="bold"
                    letterSpacing="0.05em"
                  >
                    Core Jins Structure (
                    {selectedDef.sizeLabel || selectedDef.type})
                  </text>
                </g>
              )}

              {/* NOTEHEADS, LEDGER LINES, ACCIDENTALS & STEMS */}
              {staffNotesData.map((note) => {
                const isHovered = hoveredNote?.pitch.equals(note.pitch)
                const isSounding = activeSoundingPitch?.equals(note.pitch)

                // Ledger Lines Logic
                // Step 0 is C4 (y=136). Ledger lines every 2 diatonic steps:
                // y=136 (C4), y=152 (A3), y=168 (F3), y=184 (D3)
                const ledgerLines: number[] = []
                if (note.stepOffset <= 0) {
                  ledgerLines.push(136) // Middle C (C4)
                  if (note.stepOffset <= -2) ledgerLines.push(152) // A3
                  if (note.stepOffset <= -4) ledgerLines.push(168) // F3
                  if (note.stepOffset <= -6) ledgerLines.push(184) // D3
                } else if (note.stepOffset >= 12) {
                  ledgerLines.push(40) // A5 ledger line above
                  if (note.stepOffset >= 14) ledgerLines.push(24) // C6
                }

                // Stem direction: line 3 (B4, step 6, y=88) or higher -> stem points down on left; otherwise points up on right
                const isStemDown = note.stepOffset >= 6
                const stemX = isStemDown ? note.staffX - 7 : note.staffX + 7
                const stemStartY = note.staffY
                const stemEndY = isStemDown
                  ? note.staffY + 34
                  : note.staffY - 34

                // Color tokens
                const noteColor = note.isTonic
                  ? "#10b981"
                  : note.isBaggage
                    ? "#a855f7"
                    : "#f59e0b"

                const noteFilter = note.isTonic
                  ? "url(#emeraldGlow)"
                  : note.isBaggage
                    ? "url(#purpleGlow)"
                    : "url(#amberGlow)"

                const noteFill = note.isTonic
                  ? "url(#tonicGrad)"
                  : note.isBaggage
                    ? "url(#baggageGrad)"
                    : "url(#coreGrad)"

                // Anti-collision pitch pill Y position:
                // If stem is down, label is above notehead at note.staffY - 14.
                // If stem is up, label is above stem at note.staffY - 44 (clamped to >= 26).
                const pitchPillY = isStemDown
                  ? note.staffY - 14
                  : Math.max(26, note.staffY - 44)

                return (
                  <g
                    key={`${note.pitch.toString()}-${note.isBaggage ? "bag" : "core"}`}
                    className="group cursor-pointer transition-all"
                    onClick={() => handlePlayNote(note.pitch)}
                    onMouseEnter={() => setHoveredNote(note)}
                    onMouseLeave={() => setHoveredNote(null)}
                  >
                    {/* Vertical Interactive Guide Line on hover or sounding */}
                    {(isHovered || isSounding) && (
                      <line
                        x1={note.staffX}
                        y1={24}
                        x2={note.staffX}
                        y2={228}
                        stroke={noteColor}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity={isSounding ? 0.9 : 0.5}
                      />
                    )}

                    {/* Ledger Lines behind the notehead */}
                    {ledgerLines.map((ledgerY) => (
                      <line
                        key={ledgerY}
                        x1={note.staffX - 16}
                        y1={ledgerY}
                        x2={note.staffX + 16}
                        y2={ledgerY}
                        stroke="#64748b"
                        strokeWidth="1.5"
                      />
                    ))}

                    {/* Stem */}
                    <line
                      x1={stemX}
                      y1={stemStartY}
                      x2={stemX}
                      y2={stemEndY}
                      stroke={noteColor}
                      strokeWidth="1.8"
                    />

                    {/* Sounding Acoustic Ripple / Pulse Animation */}
                    {isSounding && (
                      <ellipse
                        cx={note.staffX}
                        cy={note.staffY}
                        rx="18"
                        ry="13"
                        fill="none"
                        stroke={noteColor}
                        strokeWidth="2.5"
                        opacity="0.8"
                        className="animate-ping"
                      />
                    )}

                    {/* Touch Hitbox for mobile fingertips */}
                    <circle
                      cx={note.staffX}
                      cy={note.staffY}
                      r="22"
                      fill="transparent"
                      className="cursor-pointer"
                    />

                    {/* Notehead (Rotated ellipse for musical font look) */}
                    <ellipse
                      cx={note.staffX}
                      cy={note.staffY}
                      rx={isHovered || isSounding ? "10" : "8.5"}
                      ry={isHovered || isSounding ? "6.8" : "5.8"}
                      transform={`rotate(-22 ${note.staffX} ${note.staffY})`}
                      fill={noteFill}
                      stroke={isHovered || isSounding ? "#ffffff" : noteColor}
                      strokeWidth={isHovered || isSounding ? "2.5" : "1.5"}
                      filter={isHovered || isSounding ? noteFilter : undefined}
                    />

                    {/* Microtonal Accidental Glyphs to left of notehead */}
                    {note.pitch.accidental !== "♮" && (
                      <text
                        x={note.staffX - 17}
                        y={note.staffY + 5}
                        textAnchor="middle"
                        fill={
                          note.pitch.accidental === "𝄳" ||
                          note.pitch.accidental === "𝄲"
                            ? "#38bdf8" // Cyan for microtonal quarter-tones
                            : "#e2e8f0"
                        }
                        fontSize={
                          note.pitch.accidental === "𝄳" ||
                          note.pitch.accidental === "𝄲"
                            ? "19"
                            : "17"
                        }
                        fontWeight="bold"
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))"
                      >
                        {note.pitch.accidental}
                      </text>
                    )}

                    {/* Pitch Name Badge Pill (Anti-collision with staff lines) */}
                    <rect
                      x={note.staffX - 17}
                      y={pitchPillY - 9}
                      width="34"
                      height="15"
                      rx="4"
                      fill="#0b0f19"
                      fillOpacity="0.94"
                      stroke={isHovered || isSounding ? "#ffffff" : noteColor}
                      strokeWidth="1"
                    />
                    <text
                      x={note.staffX}
                      y={pitchPillY + 2}
                      textAnchor="middle"
                      fill={isHovered || isSounding ? "#ffffff" : "#f8fafc"}
                      fontSize="10.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {note.pitch.toString()}
                    </text>

                    {/* Row 1: Arabic Note Name Below Staff (Clean, fixed altitude) */}
                    <text
                      x={note.staffX}
                      y={196}
                      textAnchor="middle"
                      fill={noteColor}
                      fontSize="11"
                      fontWeight="bold"
                      className="font-arabic"
                    >
                      {note.arabicName}
                    </text>

                    {/* Row 2: Cents Offset Below Staff */}
                    <text
                      x={note.staffX}
                      y={210}
                      textAnchor="middle"
                      fill={note.isBaggage ? "#e9d5ff" : "#94a3b8"}
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {note.isTonic
                        ? "0¢"
                        : note.isBaggage
                          ? `${note.offsetCents}¢`
                          : `+${note.offsetCents}¢`}
                    </text>

                    {/* Row 3: Role / Degree Below Staff */}
                    <text
                      x={note.staffX}
                      y={222}
                      textAnchor="middle"
                      fill={
                        note.isTonic
                          ? "#34d399"
                          : note.isBaggage
                            ? "#c084fc"
                            : "#fbbf24"
                      }
                      fontSize="8"
                      fontWeight="600"
                    >
                      {note.degreeLabel}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Active Note Hover Inspector Card */}
          {hoveredNote && (
            <div className="animate-in fade-in mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-purple-500/30 bg-purple-950/40 p-3.5 backdrop-blur-md sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-md ${
                    hoveredNote.isTonic
                      ? "bg-emerald-500 text-slate-950"
                      : hoveredNote.isBaggage
                        ? "bg-purple-600 text-white"
                        : "bg-amber-500 text-slate-950"
                  }`}
                >
                  {hoveredNote.pitch.toScientificString()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {hoveredNote.pitch.toString()} • {hoveredNote.arabicName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        hoveredNote.isTonic
                          ? "border-emerald-400 text-emerald-300"
                          : hoveredNote.isBaggage
                            ? "border-purple-400 text-purple-300"
                            : "border-amber-400 text-amber-300"
                      }`}
                    >
                      {hoveredNote.isTonic
                        ? "Tonic Anchor"
                        : hoveredNote.isBaggage
                          ? hoveredNote.degreeLabel.startsWith("Sub-")
                            ? "Baggage (Below Tonic)"
                            : "Baggage (Above Top Pitch)"
                          : "Jins Core Step"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-slate-300">
                    <span>
                      {hoveredNote.isTonic
                        ? "Tonic Reference"
                        : `${hoveredNote.offsetCents} cents (${hoveredNote.offsetQuarterTones > 0 ? "+" : ""}${hoveredNote.offsetQuarterTones} quarter-tones)`}
                    </span>
                    <span>•</span>
                    <span>{hoveredNote.pitch.toFrequency().toFixed(1)} Hz</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Volume2 className="h-3.5 w-3.5 text-purple-400" />
                <span>Click note on staff to hear microtone</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TABS FOR DEEP-DIVE ANALYSIS */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveViewTab("staff")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeViewTab === "staff"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Baggage Breakdown ({selectedDef.name})</span>
        </button>

        <button
          onClick={() => setActiveViewTab("theory")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeViewTab === "theory"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Abu Shumays Theory Primer</span>
        </button>

        <button
          onClick={() => setActiveViewTab("compare")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeViewTab === "compare"
              ? "border-purple-500 text-purple-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>Compare Baggage with Another Jins</span>
        </button>
      </div>

      {/* TAB 1: BAGGAGE NOTES BREAKDOWN */}
      {activeViewTab === "staff" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Baggage Explanation Card */}
          <Card className="border-purple-500/30 bg-purple-950/20 shadow-lg md:col-span-1">
            <CardHeader className="border-b border-purple-500/20 p-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-purple-300">
                <Package className="h-4 w-4 text-purple-400" />
                <span>Why This Jins Has Baggage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-xs leading-relaxed text-slate-300">
              <p>
                {selectedDef.baggageDescription ||
                  `In ${selectedDef.name}, baggage notes are offsets outside the core jins: negative values are below the root, while positive values are above the top pitch.`}
              </p>
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Size Category:</span>
                  <span className="font-semibold text-white">
                    {selectedDef.sizeLabel || selectedDef.type}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Core Intervals:</span>
                  <span className="text-amber-300">
                    {selectedDef.intervals.join(" - ")} qt
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Baggage Intervals:</span>
                  <span className="text-purple-300">
                    {selectedDef.baggageIntervals &&
                    selectedDef.baggageIntervals.length > 0
                      ? selectedDef.baggageIntervals.join(" , ") + " qt"
                      : "None"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Baggage Notes Cards */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>
                Baggage Notes for {selectedDef.name} on {currentRoot.toString()}
                :
              </span>
              <span className="font-mono text-[11px] text-purple-400">
                {baggagePitches.length} note
                {baggagePitches.length > 1 ? "s" : ""} outside the core
              </span>
            </div>

            {baggagePitches.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-400">
                This jins has no baggage intervals defined in this model.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {baggagePitches.map((pitch) => {
                  const spineInfo = ArabicNoteSpine.findByPitch(pitch)
                  const isBelowRoot = pitch.toQuarterToneIndex() < rootQt
                  const anchor = isBelowRoot ? currentRoot : topPitch
                  const centsDiff = anchor.diffCents(pitch)
                  const qtDiff = anchor.diffQuarterTones(pitch)

                  return (
                    <div
                      key={pitch.toString()}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-purple-500/30 bg-slate-900/70 p-3.5 shadow-sm transition-all hover:bg-slate-900"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-500/40 bg-purple-600/30 font-mono text-xs font-bold text-purple-300">
                            {pitch.toString()}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {spineInfo?.transliteration || pitch.diatonic}{" "}
                              <span className="font-arabic text-amber-400">
                                {spineInfo?.arabicName || ""}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {qtDiff < 0
                                ? `Below root ${qtDiff} qt`
                                : `Above top +${qtDiff} qt`}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlayNote(pitch)}
                          className="h-7 px-2 text-xs text-purple-300 hover:bg-purple-900/40 hover:text-white"
                          title="Audition note"
                        >
                          <Play className="mr-1 h-3 w-3 text-purple-400" />
                          Hear
                        </Button>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono text-[11px] text-slate-400">
                        <span>Offset:</span>
                        <span className="font-bold text-purple-300">
                          {centsDiff}¢ ({qtDiff} qt)
                        </span>
                        <span>Freq:</span>
                        <span className="text-slate-300">
                          {pitch.toFrequency().toFixed(1)} Hz
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SAMI ABU SHUMAYS THEORY PRIMER */}
      {activeViewTab === "theory" && (
        <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
          <CardHeader className="border-b border-slate-800/80 p-5">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
              <BookOpen className="h-5 w-5 text-amber-400" />
              <span>
                Sami Abu Shumays&apos; Theory of Jins Baggage (أمتعة الجنس)
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Key tenets from &quot;Maqam Analysis: A Primer&quot; that redefine
              how Arab music scales function in practice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-xs leading-relaxed text-slate-300">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200">
              <p className="mb-1 text-sm font-semibold">
                &quot;A jins is not an isolated ascending ladder—it carries
                gravitational baggage.&quot;
              </p>
              <p className="text-xs text-amber-300/80">
                In Arab music pedagogy, scales are conventionally taught as
                ascending tetrachords or pentachords starting on the tonic. But
                in actual master performance (taqsim and mawwal), performers
                never treat the tonic as a hard floor.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-sm font-bold text-purple-300">
                  1. Cadential Preparation (القفلة)
                </h4>
                <p>
                  Negative baggage offsets are anchored below the tonic and can
                  shape melodic approaches and cadences. Positive offsets, when
                  present, are measured above the jins top pitch rather than the
                  tonic.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-sm font-bold text-purple-300">
                  2. Signed Pitch Extensions
                </h4>
                <p>
                  The signed offsets describe two distinct anchors: negative
                  values from the root and positive values from the top of the
                  core jins. This keeps baggage pitch placement consistent when
                  the core interval span changes.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-sm font-bold text-purple-300">
                  3. Core and Baggage Together
                </h4>
                <p>
                  The extended pitch sequence combines baggage with the core
                  pitches in ascending order. The staff and playback preserve
                  the distinction between below-root and above-top baggage.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-sm font-bold text-purple-300">
                  4. Secondary &amp; Specialized Ajnas
                </h4>
                <p>
                  Abu Shumays identified previously unnamed ajnas (e.g.,
                  Secondary Rast G/C, Hijazkar with diminished 3rd framing,
                  Pseudo-Sikah, and Secondary Saba) whose defining criteria are
                  often how their baggage interacts with primary tonics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: COMPARE BAGGAGE ACROSS TWO AJNAS */}
      {activeViewTab === "compare" && (
        <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
          <CardHeader className="border-b border-slate-800/80 p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
                  <ArrowUpDown className="h-4 w-4 text-purple-400" />
                  <span>
                    Baggage Comparison: {selectedDef.name} vs.{" "}
                    {comparisonDef.name}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Compare how two ajnas use baggage offsets outside their core
                  pitches on the same root ({currentRoot.toString()}).
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Compare with:</span>
                <select
                  value={comparisonJinsId}
                  onChange={(e) => setComparisonJinsId(e.target.value)}
                  className="cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  {allDefinitions
                    .filter((d) => d.id !== selectedJinsId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.arabicName})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Left Jins */}
              <div className="space-y-3 rounded-xl border border-purple-500/40 bg-purple-950/20 p-4">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                  <span className="text-sm font-bold text-white">
                    {selectedDef.name}
                  </span>
                  <span className="font-arabic text-xs text-amber-400">
                    {selectedDef.arabicName}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  <strong>Baggage Notes:</strong>{" "}
                  {baggagePitches.length > 0
                    ? baggagePitches.map((p) => p.toString()).join(" , ")
                    : "None"}
                </div>
                <div className="text-xs text-slate-300">
                  <strong>Signed offsets:</strong>{" "}
                  {selectedDef.baggageIntervals?.join(" , ") || "None"} qt
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  {selectedDef.baggageDescription ||
                    "Standard baggage profile."}
                </p>
              </div>

              {/* Right Jins */}
              <div className="space-y-3 rounded-xl border border-sky-500/40 bg-sky-950/20 p-4">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                  <span className="text-sm font-bold text-white">
                    {comparisonDef.name}
                  </span>
                  <span className="font-arabic text-xs text-amber-400">
                    {comparisonDef.arabicName}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  <strong>Baggage Notes:</strong>{" "}
                  {comparisonInstance.getBaggageNotes().length > 0
                    ? comparisonInstance
                        .getBaggageNotes()
                        .map((p) => p.toString())
                        .join(" , ")
                    : "None"}
                </div>
                <div className="text-xs text-slate-300">
                  <strong>Signed offsets:</strong>{" "}
                  {comparisonDef.baggageIntervals?.join(" , ") || "None"} qt
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  {comparisonDef.baggageDescription ||
                    "Standard baggage profile."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
