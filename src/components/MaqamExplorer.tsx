// src/components/MaqamExplorer.tsx
import React, { useMemo, useState } from "react"
import { Maqam, MaqamatCatalogue } from "../theory/maqam"
import {
  ArabicPitch,
  type DiatonicBase,
  type MicrotonalAccidental,
} from "../core/pitch"
import {
  getPitchThemeClasses,
  formatPitchWithLargeAccidentalReact,
} from "../core/pitch-styling"
import { ArabicNoteSpine } from "../core/note-spine"
import {
  MicrotonalAudioEngine,
  type TimbreType,
} from "../audio/microtonal-audio"
import {
  getWorkspaceState,
  updateWorkspaceDraft,
} from "../state/workspace-state"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import {
  Play,
  Square,
  Radio,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Wand2,
  Compass,
  GitFork,
  Network,
  Package,
} from "lucide-react"
import { SayrVisualizationDialog } from "./SayrVisualizationDialog"
import { ModulationPathwaysDrawer } from "./ModulationPathwaysDrawer"
import { MaqamNetworkGraph } from "./MaqamNetworkGraph"
import { MaqamTermTooltip } from "./MaqamTermTooltip"
import { SVGStaff } from "./JinsAnalysisTool"

interface Props {
  currentMaqam: Maqam
  onSelectMaqam: (maqam: Maqam) => void
  timbre: TimbreType
  isPlayingScale: boolean
  onPlayScale: (pitches: ArabicPitch[]) => void
  onStopScale: () => void
  isDroneActive: boolean
  onToggleDrone: (pitch: ArabicPitch) => void
  onOpenMaqamFacts?: () => void
  onOpenMaqamBuilder?: () => void
  onOpenSayrVisualization?: () => void
  onOpenModulationPathways?: () => void
  onOpenJinsAnalysis?: () => void
}

export const MaqamExplorer: React.FC<Props> = ({
  currentMaqam,
  onSelectMaqam,
  timbre,
  isPlayingScale,
  onPlayScale,
  onStopScale,
  isDroneActive,
  onToggleDrone,
  onOpenMaqamBuilder,
  onOpenSayrVisualization,
  onOpenModulationPathways,
  onOpenJinsAnalysis,
}) => {
  const [showSayrDialogLocal, setShowSayrDialogLocal] = useState(false)
  const [showModulationDrawerLocal, setShowModulationDrawerLocal] =
    useState(false)
  const [explorerTab, setExplorerTab] = useState<
    "structure" | "network" | "svg-staff"
  >("structure")

  const handleOpenSayr = () => {
    if (onOpenSayrVisualization) {
      onOpenSayrVisualization()
    } else {
      setShowSayrDialogLocal(true)
    }
  }

  const handleOpenModulation = () => {
    if (onOpenModulationPathways) {
      onOpenModulationPathways()
    } else {
      setShowModulationDrawerLocal(true)
    }
  }

  // Transposition tab mode: 'classical' | 'spine' | 'custom'
  const [transpositionTab, setTranspositionTabState] = useState<string>(
    () => getWorkspaceState().drafts.explorer.transpositionTab
  )

  // Custom tonic note builder state
  const [customDiatonic, setCustomDiatonicState] = useState<DiatonicBase>(
    () => getWorkspaceState().drafts.explorer.customTonic.diatonic
  )
  const [customAccidental, setCustomAccidentalState] =
    useState<MicrotonalAccidental>(
      () => getWorkspaceState().drafts.explorer.customTonic.accidental
    )
  const [customOctave, setCustomOctaveState] = useState<number>(
    () => getWorkspaceState().drafts.explorer.customTonic.octave
  )

  const setTranspositionTab = (tab: string) => {
    const valid = tab === "spine" || tab === "custom" ? tab : "classical"
    setTranspositionTabState(valid)
    updateWorkspaceDraft("explorer", { transpositionTab: valid })
  }

  const setCustomDiatonic = (d: DiatonicBase) => {
    setCustomDiatonicState(d)
    updateWorkspaceDraft("explorer", {
      customTonic: {
        diatonic: d,
        accidental: customAccidental,
        octave: customOctave,
      },
    })
  }

  const setCustomAccidental = (a: MicrotonalAccidental) => {
    setCustomAccidentalState(a)
    updateWorkspaceDraft("explorer", {
      customTonic: {
        diatonic: customDiatonic,
        accidental: a,
        octave: customOctave,
      },
    })
  }

  const setCustomOctave = (oct: number) => {
    setCustomOctaveState(oct)
    updateWorkspaceDraft("explorer", {
      customTonic: {
        diatonic: customDiatonic,
        accidental: customAccidental,
        octave: oct,
      },
    })
  }

  const spineNotes = ArabicNoteSpine.getSpine()

  // Determine base original template for current maqam id
  const baseId = currentMaqam.id.split("-transposed-")[0]
  const baseMaqam = MaqamatCatalogue.findById(baseId) || currentMaqam
  const originalTonic = baseMaqam.getTonic()
  const currentTonic = currentMaqam.getTonic()
  const isTransposed = !currentTonic.equals(originalTonic)

  // Compute delta quarter tones and cents from original tonic
  const deltaQt = originalTonic.diffQuarterTones(currentTonic)
  const centsOffset = deltaQt * 50

  // Custom candidate pitch
  const candidatePitch = new ArabicPitch(
    customDiatonic,
    customAccidental,
    customOctave
  )
  const candidateDeltaQt = originalTonic.diffQuarterTones(candidatePitch)
  void candidateDeltaQt

  const handleTransposeToPitch = (targetPitch: ArabicPitch) => {
    const transposed = baseMaqam.transpose(targetPitch)
    onSelectMaqam(transposed)
  }

  const handleResetTransposition = () => {
    onSelectMaqam(baseMaqam)
  }

  const scalePitches = currentMaqam.getScale()
  const tonic = currentMaqam.getTonic()
  const ghammaz = currentMaqam.getGhammaz()
  const baggageNotes = currentMaqam.lowerJins.getBaggageNotes()

  const maqamStaffNotes = useMemo(
    () =>
      scalePitches.map((pitch, index) => {
        const spineInfo = ArabicNoteSpine.findByPitch(pitch)
        const noteOffset = index === 0 ? 0 : tonic.diffCents(pitch)
        return {
          pitch,
          isTonic: index === 0,
          isBaggage: false,
          stepOffset: index,
          staffY: undefined,
          staffX: undefined,
          offsetCents: noteOffset,
          offsetQuarterTones: index === 0 ? 0 : tonic.diffQuarterTones(pitch),
          arabicName: spineInfo?.arabicName || pitch.toDisplayString(),
          degreeLabel: index === 0 ? "Tonic" : `${index + 1}`,
          roleLabel: index === 0 ? "Tonic" : `Degree ${index + 1}`,
        }
      }),
    [scalePitches, tonic]
  )

  return (
    <div className="space-y-6">
      {/* Quick Studio Tools Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">
            Interactive Analysis &amp; Construction Tools:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenMaqamBuilder && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenMaqamBuilder}
              className="cursor-pointer gap-1.5 border-slate-700 bg-slate-900 text-slate-200 hover:text-white"
            >
              <Wand2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Maqam Builder</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenModulation}
            className="cursor-pointer gap-1.5 border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:border-emerald-500 hover:text-white"
          >
            <GitFork className="h-3.5 w-3.5 text-emerald-400" />
            <span>Modulation Pathways</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSayr}
            className="cursor-pointer gap-1.5 border-sky-700/60 bg-sky-950/40 text-sky-300 hover:border-sky-500 hover:text-white"
          >
            <Compass className="h-3.5 w-3.5 text-sky-400" />
            <span>Sayr Trajectory</span>
          </Button>
        </div>
      </div>

      {/* Selected Maqam Inspector & Playback Controls */}
      <Card className="border-slate-800/90 bg-slate-900/90 shadow-xl">
        <CardHeader className="border-border/60 border-b pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <MaqamTermTooltip term="maqam" showIcon={false}>
                  <CardTitle className="text-2xl font-black sm:text-3xl">
                    {currentMaqam.name}
                  </CardTitle>
                </MaqamTermTooltip>
                {currentMaqam.arabicName && (
                  <span className="hidden font-serif text-xl font-bold text-amber-400/90 sm:inline">
                    {currentMaqam.arabicName}
                  </span>
                )}
                <MaqamTermTooltip term="family" showIcon={false}>
                  <Badge variant="secondary">
                    Family: {currentMaqam.family}
                  </Badge>
                </MaqamTermTooltip>
                {isTransposed && (
                  <Badge
                    variant="default"
                    className="flex animate-pulse items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3 text-sky-400" />
                    Transposed ({deltaQt > 0 ? "+" : ""}
                    {centsOffset}¢ from {originalTonic.toScientificString()})
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1 max-w-2xl text-sm text-slate-300">
                {currentMaqam.description}
              </CardDescription>
            </div>

            {/* Scale Audio Playback & Tonic Drone */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isPlayingScale ? "destructive" : "default"}
                onClick={() =>
                  isPlayingScale ? onStopScale() : onPlayScale(scalePitches)
                }
                className="cursor-pointer gap-2 font-bold"
              >
                {isPlayingScale ? (
                  <Square className="fill-current" />
                ) : (
                  <Play className="fill-current" />
                )}
                {isPlayingScale ? "Stop Scale" : "Play Full Scale"}
              </Button>
              <Button
                variant={isDroneActive ? "default" : "outline"}
                onClick={() => onToggleDrone(tonic)}
                className="cursor-pointer gap-2"
              >
                <Radio className={isDroneActive ? "animate-pulse" : ""} />
                {isDroneActive ? "Drone Active" : "Qarar Drone"}
              </Button>
              {isTransposed && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleResetTransposition}
                  className="cursor-pointer gap-1.5"
                  title={`Reset to original ${baseMaqam.name}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Tonic
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-3">
            <span className="text-xs font-semibold text-slate-400">
              View Mode:
            </span>
            <div className="flex flex-wrap rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setExplorerTab("structure")}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                  explorerTab === "structure"
                    ? "bg-amber-500 font-bold text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Modal Structure &amp; Ajnas</span>
              </button>
              <button
                type="button"
                onClick={() => setExplorerTab("network")}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                  explorerTab === "network"
                    ? "bg-amber-500 font-bold text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                <span>Ajnas Network Graph (Abu Shumays)</span>
              </button>
              <button
                type="button"
                onClick={() => setExplorerTab("svg-staff")}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                  explorerTab === "svg-staff"
                    ? "bg-amber-500 font-bold text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>SVG Staff</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {explorerTab === "network" ? (
            <MaqamNetworkGraph maqam={currentMaqam} timbre={timbre} />
          ) : explorerTab === "svg-staff" ? (
            <SVGStaff
              notes={maqamStaffNotes}
              title="Maqam Staff View"
              selectedDefName={currentMaqam.name}
              selectedDefSizeLabel={currentMaqam.lowerJins.definition.sizeLabel}
            />
          ) : (
            <>
              {/* Structural Architecture: Lower Jins, Connection, Upper Jins */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Lower Jins with Baggage display */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <MaqamTermTooltip term="root jins" showIcon={false}>
                        <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                          Jins al-Asl (جنس الأصل)
                        </span>
                      </MaqamTermTooltip>
                      <Badge variant="default" className="text-[10px]">
                        {currentMaqam.lowerJins.definition.sizeLabel ||
                          currentMaqam.lowerJins.definition.type}
                      </Badge>
                    </div>
                    <h4 className="mt-1 text-lg font-bold text-white">
                      Jins {currentMaqam.lowerJins.definition.name}
                    </h4>
                    <p className="mt-1 text-xs text-slate-400">
                      Root:{" "}
                      <strong className="text-amber-300">
                        {formatPitchWithLargeAccidentalReact(
                          currentMaqam.lowerJins.root,
                          { size: "large" }
                        )}
                      </strong>{" "}
                      (
                      {ArabicNoteSpine.resolveDegreeName(
                        currentMaqam.lowerJins.root
                      )}
                      )
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-slate-300">
                      <span className="text-slate-500">Steps (qt):</span>
                      <span className="font-semibold text-amber-300">
                        [
                        {currentMaqam.lowerJins.definition.intervals.join(
                          " - "
                        )}
                        ]
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({currentMaqam.lowerJins.getTotalSpanCents()}¢)
                      </span>
                    </div>

                    {/* Baggage notes chip if available */}
                    {baggageNotes.length > 0 && (
                      <div className="mt-3 border-t border-slate-900 pt-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-purple-400" />
                            <span>Jins Baggage Notes (أمتعة الجنس):</span>
                          </div>
                          {onOpenJinsAnalysis && (
                            <button
                              type="button"
                              onClick={onOpenJinsAnalysis}
                              className="cursor-pointer text-[10px] text-purple-400 underline hover:text-purple-200"
                            >
                              Staff Analysis &rarr;
                            </button>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {baggageNotes.map((bp, i) => (
                            <span
                              key={i}
                              title={
                                bp.toQuarterToneIndex() >
                                currentMaqam.lowerJins
                                  .getTopPitch()
                                  .toQuarterToneIndex()
                                  ? "Above lower jins top pitch"
                                  : "Below lower jins root"
                              }
                              className="rounded border border-purple-800/60 bg-purple-950/40 px-1.5 py-0.5 font-mono text-[10px] text-purple-200"
                            >
                              {formatPitchWithLargeAccidentalReact(bp, {
                                size: "large",
                              })}
                              {bp.toQuarterToneIndex() >
                              currentMaqam.lowerJins
                                .getTopPitch()
                                .toQuarterToneIndex()
                                ? " ↑"
                                : " ↓"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-900 pt-3 text-xs">
                    <span className="text-slate-400">Tonic (قرار):</span>
                    <span className="font-bold text-emerald-400">
                      {formatPitchWithLargeAccidentalReact(tonic, {
                        size: "large",
                      })}
                    </span>
                  </div>
                </div>

                {/* Connection Type & Ghammaz */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold tracking-wider text-sky-400 uppercase">
                        Connection &amp; Pivot
                      </span>
                      <Badge variant="default" className="text-[10px]">
                        {currentMaqam.connection} (
                        {currentMaqam.connection === "Ittisal"
                          ? "اتصال"
                          : currentMaqam.connection === "Infisal"
                            ? "انفصال"
                            : "تداخل"}
                        )
                      </Badge>
                    </div>
                    <h4 className="mt-1 text-lg font-bold text-white">
                      <MaqamTermTooltip term="ghammaz" showIcon={false}>
                        Ghammaz (الغمّاز)
                      </MaqamTermTooltip>
                      :{" "}
                      {formatPitchWithLargeAccidentalReact(ghammaz, {
                        size: "large",
                      })}
                    </h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {currentMaqam.connection === "Ittisal"
                        ? "Conjunct: Lower Jins top merges into Upper Jins root (Pivot Note)."
                        : currentMaqam.connection === "Infisal"
                          ? "Disjunct: 1 whole tone (4 quarter-tones / 200¢) gap between cells."
                          : "Overlapping / Interlocking cell structure."}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-900 pt-3 text-xs">
                    <span className="text-slate-400">Ghammaz Frequency:</span>
                    <span className="font-bold text-sky-400">
                      {ghammaz.toFrequency().toFixed(1)} Hz
                    </span>
                  </div>
                </div>

                {/* Upper Jins */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <MaqamTermTooltip term="jins" showIcon={false}>
                        <span className="text-[11px] font-bold tracking-wider text-purple-400 uppercase">
                          Jins al-Far' (جنس الفرع)
                        </span>
                      </MaqamTermTooltip>
                      <Badge variant="default" className="text-[10px]">
                        {currentMaqam.upperJins.definition.sizeLabel ||
                          currentMaqam.upperJins.definition.type}
                      </Badge>
                    </div>
                    <h4 className="mt-1 text-lg font-bold text-white">
                      Jins {currentMaqam.upperJins.definition.name}
                    </h4>
                    <p className="mt-1 text-xs text-slate-400">
                      Root:{" "}
                      <strong className="text-purple-300">
                        {formatPitchWithLargeAccidentalReact(
                          currentMaqam.upperJins.root,
                          { size: "large" }
                        )}
                      </strong>{" "}
                      (
                      {ArabicNoteSpine.resolveDegreeName(
                        currentMaqam.upperJins.root
                      )}
                      )
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-slate-300">
                      <span className="text-slate-500">Steps (qt):</span>
                      <span className="font-semibold text-purple-300">
                        [
                        {currentMaqam.upperJins.definition.intervals.join(
                          " - "
                        )}
                        ]
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({currentMaqam.upperJins.getTotalSpanCents()}¢)
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-900 pt-3 text-xs">
                    <span className="text-slate-400">Upper Octave Apex:</span>
                    <span className="font-bold text-purple-400">
                      {currentMaqam.extraPitches[
                        currentMaqam.extraPitches.length - 1
                      ]
                        ? formatPitchWithLargeAccidentalReact(
                            currentMaqam.extraPitches[
                              currentMaqam.extraPitches.length - 1
                            ],
                            { size: "large" }
                          )
                        : formatPitchWithLargeAccidentalReact(
                            currentMaqam.upperJins.getTopPitch(),
                            { size: "large" }
                          )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Show alternate upper jins if available */}
              {currentMaqam.alternateUpperAjnas.length > 0 && (
                <Card className="border-slate-800 bg-slate-950/60 p-4">
                  <span className="mb-2 block text-xs font-semibold tracking-wider text-slate-300 uppercase">
                    Alternate Upper Ajnas (فروع نغمية بديلة)
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {currentMaqam.alternateUpperAjnas.map((jins, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-purple-300">
                            Jins {jins.jins.definition.name}
                          </span>
                          <Badge variant="outline" className="text-[11px]">
                            {jins.jins.definition.intervals.join(" - ")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          Root:{" "}
                          <strong className="text-purple-300">
                            {formatPitchWithLargeAccidentalReact(
                              jins.jins.root,
                              { size: "large" }
                            )}
                          </strong>
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {jins.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Scale Degree Buttons */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Scale Degrees &amp; Frequencies (24-EDO)
                  </span>
                  <span className="text-[11px] text-amber-400">
                    Click note to audition
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-8">
                  {scalePitches.map((pitch, idx) => {
                    const isTonic = pitch.equals(tonic)
                    const isGhammaz = pitch.equals(ghammaz)
                    const pitchTheme = getPitchThemeClasses(pitch, "card")
                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          MicrotonalAudioEngine.playPitch(pitch, 0.7, timbre)
                        }
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-2 transition hover:scale-105 sm:p-2.5 ${
                          isTonic
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-md ring-1 ring-emerald-500/30"
                            : isGhammaz
                              ? "border-sky-500/50 bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30"
                              : pitchTheme.combined
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm font-bold sm:text-base">
                            {formatPitchWithLargeAccidentalReact(pitch, {
                              size: "large",
                            })}
                          </span>
                          {isTonic && (
                            <span className="rounded bg-emerald-500 px-1 text-[9px] font-bold text-slate-950">
                              1
                            </span>
                          )}
                          {isGhammaz && (
                            <span className="rounded bg-sky-500 px-1 text-[9px] font-bold text-slate-950">
                              G
                            </span>
                          )}
                        </div>
                        <span className="mt-0.5 font-mono text-[10px] text-slate-400">
                          {pitch.toFrequency().toFixed(1)} Hz
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {ArabicNoteSpine.findByPitch(pitch)
                            ?.transliteration || ""}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Dynamic Transposition Hub */}
          <div className="border-border/60 border-t pt-6">
            <Tabs
              value={transpositionTab}
              onValueChange={setTranspositionTab}
              className="w-full"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                      Maqam Transposition Hub (تصوير المقامات)
                    </span>
                    {isTransposed && (
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        Shift: {deltaQt > 0 ? "+" : ""}
                        {centsOffset}¢ ({deltaQt > 0 ? "+" : ""}
                        {deltaQt} qt)
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-0.5 text-lg font-bold text-white">
                    Transpose {baseMaqam.name} to Any Target Tonic
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Preserves exact microtonal interval architecture, Ghammaz
                    pivot relationship, and violin ergonomics.
                  </p>
                </div>
                <TabsList>
                  <TabsTrigger value="classical">Classical Targets</TabsTrigger>
                  <TabsTrigger value="spine">12-Note Spine</TabsTrigger>
                  <TabsTrigger value="custom">Custom 24-EDO Tonic</TabsTrigger>
                </TabsList>
              </div>

              {/* Mode 1: Classical Transpositions */}
              <TabsContent value="classical" className="mt-3">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Standard Historical Transpositions for {baseMaqam.name}:
                  </span>
                  <span className="text-[11px] text-amber-400">
                    Click to apply transposition
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      pitch: originalTonic,
                      title: `${baseMaqam.name} (Original)`,
                      arabicTitle: "الأصل",
                      noteName: originalTonic.toScientificString(),
                    },
                    {
                      pitch: originalTonic.transpose(4),
                      title: `On 2nd Degree`,
                      arabicTitle: "على الدرجة الثانية",
                      noteName: originalTonic.transpose(4).toScientificString(),
                    },
                    {
                      pitch: ghammaz,
                      title: `On Ghammaz (${ghammaz.toScientificString()})`,
                      arabicTitle: "على الغمّاز",
                      noteName: ghammaz.toScientificString(),
                    },
                    {
                      pitch: originalTonic.transpose(24),
                      title: `Octave Apex (Jawab)`,
                      arabicTitle: "الجواب",
                      noteName: originalTonic
                        .transpose(24)
                        .toScientificString(),
                    },
                  ].map((item) => {
                    const isCurrent = tonic.equals(item.pitch)
                    const stepDeltaQt = originalTonic.diffQuarterTones(
                      item.pitch
                    )
                    const stepCents = stepDeltaQt * 50
                    return (
                      <button
                        key={item.title}
                        onClick={() => handleTransposeToPitch(item.pitch)}
                        className={`group flex cursor-pointer flex-col justify-between rounded-xl border p-3 text-left transition ${
                          isCurrent
                            ? "border-amber-400 bg-amber-500/20 text-white shadow-md ring-2 ring-amber-400/40"
                            : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-amber-500/40 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        <div className="flex w-full items-baseline justify-between">
                          <span className="text-xs font-bold text-white transition group-hover:text-amber-300">
                            {item.title}
                          </span>
                          <span className="font-serif text-xs font-bold text-amber-400">
                            {item.arabicTitle}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-slate-900 pt-2 text-[11px]">
                          <span className="font-mono font-semibold text-amber-300">
                            Target: {item.noteName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {stepDeltaQt === 0
                              ? "Original"
                              : `${stepDeltaQt > 0 ? "+" : ""}${stepCents}¢`}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </TabsContent>

              {/* Mode 2: Traditional Arabic Note Spine (12 degrees) */}
              <TabsContent value="spine" className="mt-3">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>12 Traditional Arabic Spinal Degrees:</span>
                  <span className="text-[11px] text-amber-400">
                    Yakah to Muhayyar
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
                  {spineNotes.map((note) => {
                    const isCurrent = tonic.equals(note.pitch)
                    const stepDelta = originalTonic.diffQuarterTones(note.pitch)
                    return (
                      <button
                        key={note.transliteration}
                        onClick={() => handleTransposeToPitch(note.pitch)}
                        className={`cursor-pointer rounded-xl border p-2 text-center text-xs transition ${
                          isCurrent
                            ? "border-amber-400 bg-amber-500 font-bold text-slate-950 shadow-md ring-2 ring-amber-400/40"
                            : "border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-amber-500/40 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        <div className="font-serif text-xs font-bold">
                          {note.arabicName}
                        </div>
                        <div className="truncate text-[11px] font-semibold">
                          {note.transliteration}
                        </div>
                        <div className="font-mono text-[10px] text-amber-300/80">
                          {formatPitchWithLargeAccidentalReact(note.pitch, {
                            size: "large",
                          })}
                        </div>
                        <div className="mt-0.5 font-mono text-[9px] text-slate-400">
                          {stepDelta === 0
                            ? "0¢"
                            : `${stepDelta > 0 ? "+" : ""}${stepDelta * 50}¢`}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </TabsContent>

              {/* Mode 3: Custom 24-EDO Tonic Pitch Builder */}
              <TabsContent value="custom" className="mt-3">
                <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Diatonic Base */}
                      <div>
                        <span className="mb-1 block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                          Diatonic Base:
                        </span>
                        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
                          {(
                            [
                              "C",
                              "D",
                              "E",
                              "F",
                              "G",
                              "A",
                              "B",
                            ] as DiatonicBase[]
                          ).map((d) => (
                            <button
                              key={d}
                              onClick={() => setCustomDiatonic(d)}
                              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded font-mono text-xs font-bold transition ${
                                customDiatonic === d
                                  ? "bg-amber-500 text-slate-950 shadow"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Microtonal Accidental */}
                      <div>
                        <span className="mb-1 block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                          Accidental (24-EDO):
                        </span>
                        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
                          {(
                            [
                              { acc: "♭", label: "♭ Flat (-100¢)" },
                              { acc: "𝄳", label: "𝄳 Quarter-Flat (-50¢)" },
                              { acc: "♮", label: "♮ Natural (0¢)" },
                              { acc: "𝄲", label: "𝄲 Quarter-Sharp (+50¢)" },
                              { acc: "♯", label: "♯ Sharp (+100¢)" },
                            ] as { acc: MicrotonalAccidental; label: string }[]
                          ).map((item) => (
                            <button
                              key={item.acc}
                              onClick={() => setCustomAccidental(item.acc)}
                              title={item.label}
                              className={`flex h-8 cursor-pointer items-center justify-center rounded px-2.5 text-xs font-bold transition ${
                                customAccidental === item.acc
                                  ? "bg-amber-500 text-slate-950 shadow"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {item.acc}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Octave */}
                      <div>
                        <span className="mb-1 block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                          Octave:
                        </span>
                        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
                          {[3, 4, 5].map((oct) => (
                            <button
                              key={oct}
                              onClick={() => setCustomOctave(oct)}
                              className={`flex h-8 cursor-pointer items-center justify-center rounded px-3 font-mono text-xs font-bold transition ${
                                customOctave === oct
                                  ? "bg-amber-500 text-slate-950 shadow"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Oct {oct}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-right">
                        <span className="block text-[10px] text-slate-400">
                          Selected Target Note:
                        </span>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono text-lg font-bold text-white">
                            {formatPitchWithLargeAccidentalReact(
                              candidatePitch,
                              { size: "large" }
                            )}
                          </span>
                          <span className="font-mono text-xs text-amber-300">
                            ({candidatePitch.toFrequency().toFixed(1)} Hz)
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="default"
                        onClick={() => handleTransposeToPitch(candidatePitch)}
                        className="cursor-pointer gap-2"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Transpose to {candidatePitch.toScientificString()}
                        {candidatePitch.octave}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Standalone Sayr Dialog */}
      {showSayrDialogLocal && (
        <SayrVisualizationDialog
          open={showSayrDialogLocal}
          onOpenChange={setShowSayrDialogLocal}
          maqam={currentMaqam}
          timbre={timbre}
        />
      )}

      {/* Standalone Modulation Pathways Drawer */}
      {showModulationDrawerLocal && (
        <ModulationPathwaysDrawer
          open={showModulationDrawerLocal}
          onOpenChange={setShowModulationDrawerLocal}
          currentMaqam={currentMaqam}
          onSelectMaqam={onSelectMaqam}
          timbre={timbre}
        />
      )}
    </div>
  )
}
