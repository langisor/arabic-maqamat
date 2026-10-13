// src/components/MaqamExplorer.tsx
import React, { useState } from "react"
import {
  Maqam,
  MaqamatCatalogue,
} from "../theory/maqam"
import {
  ArabicPitch,
  type DiatonicBase,
  type MicrotonalAccidental,
} from "../core/pitch"
import { getPitchThemeClasses, formatPitchWithLargeAccidentalReact } from "../core/pitch-styling"
import { ArabicNoteSpine } from "../core/note-spine"
import {
  MicrotonalAudioEngine,
  type TimbreType,
} from "../audio/microtonal-audio"
import { getWorkspaceState, updateWorkspaceDraft } from "../state/workspace-state"
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
} from "lucide-react"
import { SayrVisualizationDialog } from "./SayrVisualizationDialog"
import { ModulationPathwaysDrawer } from "./ModulationPathwaysDrawer"
import { MaqamTermTooltip } from "./MaqamTermTooltip"

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
}) => {
  const [showSayrDialogLocal, setShowSayrDialogLocal] = useState(false)
  const [showModulationDrawerLocal, setShowModulationDrawerLocal] = useState(false)

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
      customTonic: { diatonic: d, accidental: customAccidental, octave: customOctave },
    })
  }

  const setCustomAccidental = (a: MicrotonalAccidental) => {
    setCustomAccidentalState(a)
    updateWorkspaceDraft("explorer", {
      customTonic: { diatonic: customDiatonic, accidental: a, octave: customOctave },
    })
  }

  const setCustomOctave = (oct: number) => {
    setCustomOctaveState(oct)
    updateWorkspaceDraft("explorer", {
      customTonic: { diatonic: customDiatonic, accidental: customAccidental, octave: oct },
    })
  }

  const setCustomTonicDirect = (qp: ArabicPitch) => {
    setCustomDiatonicState(qp.diatonic)
    setCustomAccidentalState(qp.accidental)
    setCustomOctaveState(qp.octave)
    updateWorkspaceDraft("explorer", {
      customTonic: { diatonic: qp.diatonic, accidental: qp.accidental, octave: qp.octave },
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
  const candidateCents = candidateDeltaQt * 50


  const handleTransposeToPitch = (targetPitch: ArabicPitch) => {
    const transposed = baseMaqam.transpose(targetPitch)
    onSelectMaqam(transposed)
  }

  const handleResetTransposition = () => {
    onSelectMaqam(baseMaqam)
  }

  // Classical popular transpositions for the current base Maqam
  const getClassicalTranspositionsForMaqam = (): {
    pitch: ArabicPitch
    title: string
    arabicTitle: string
    noteName: string
  }[] => {
    switch (baseMaqam.id) {
      case "rast":
        return [
          {
            pitch: new ArabicPitch("G", "♮", 3),
            title: "Maqam Yakah",
            arabicTitle: "يكاه",
            noteName: "Yakah (G3)",
          },
          {
            pitch: new ArabicPitch("C", "♮", 4),
            title: "Maqam Rast (Original)",
            arabicTitle: "راست",
            noteName: "Rast (C4)",
          },
          {
            pitch: new ArabicPitch("D", "♮", 4),
            title: "Maqam Nirz",
            arabicTitle: "نيرز",
            noteName: "Dukah (D4)",
          },
          {
            pitch: new ArabicPitch("G", "♮", 4),
            title: "Maqam Mahur / Nawa",
            arabicTitle: "ماهور (راست نوى)",
            noteName: "Nawa (G4)",
          },
          {
            pitch: new ArabicPitch("C", "♮", 5),
            title: "Maqam Kirdan",
            arabicTitle: "كردان",
            noteName: "Kirdan (C5)",
          },
        ]
      case "bayati":
        return [
          {
            pitch: new ArabicPitch("C", "♮", 4),
            title: "Bayati ‘ala al-Rast",
            arabicTitle: "بياتي راست",
            noteName: "Rast (C4)",
          },
          {
            pitch: new ArabicPitch("D", "♮", 4),
            title: "Maqam Bayati (Original)",
            arabicTitle: "بياتي",
            noteName: "Dukah (D4)",
          },
          {
            pitch: new ArabicPitch("G", "♮", 4),
            title: "Maqam Shuri (Bayati Nawa)",
            arabicTitle: "شوري (بياتي نوى)",
            noteName: "Nawa (G4)",
          },
          {
            pitch: new ArabicPitch("A", "♮", 4),
            title: "Maqam Husayni",
            arabicTitle: "حسيني",
            noteName: "Husayni (A4)",
          },
        ]
      case "hijaz":
        return [
          {
            pitch: new ArabicPitch("C", "♮", 4),
            title: "Maqam Hijaz Kar",
            arabicTitle: "حجاز كار",
            noteName: "Rast (C4)",
          },
          {
            pitch: new ArabicPitch("D", "♮", 4),
            title: "Maqam Hijaz (Original)",
            arabicTitle: "حجاز",
            noteName: "Dukah (D4)",
          },
          {
            pitch: new ArabicPitch("G", "♮", 4),
            title: "Maqam Shahnaz",
            arabicTitle: "شهناز",
            noteName: "Nawa (G4)",
          },
          {
            pitch: new ArabicPitch("A", "♮", 4),
            title: "Maqam Suzidil",
            arabicTitle: "سوزدل",
            noteName: "Husayni (A4)",
          },
        ]
      case "nahawand":
        return [
          {
            pitch: new ArabicPitch("C", "♮", 4),
            title: "Maqam Nahawand (Original)",
            arabicTitle: "نهاوند",
            noteName: "Rast (C4)",
          },
          {
            pitch: new ArabicPitch("D", "♮", 4),
            title: "Nahawand Murassah",
            arabicTitle: "نهاوند مرصع",
            noteName: "Dukah (D4)",
          },
          {
            pitch: new ArabicPitch("G", "♮", 4),
            title: "Maqam Farahfaza",
            arabicTitle: "فرحفزا",
            noteName: "Nawa (G4)",
          },
        ]
      case "sikah":
        return [
          {
            pitch: new ArabicPitch("B", "𝄳", 3),
            title: "Maqam ‘Iraq",
            arabicTitle: "عراق",
            noteName: "‘Iraq (B𝄳3)",
          },
          {
            pitch: new ArabicPitch("E", "𝄳", 4),
            title: "Maqam Sikah (Original)",
            arabicTitle: "سيكاه",
            noteName: "Sikah (E𝄳4)",
          },
          {
            pitch: new ArabicPitch("B", "𝄳", 4),
            title: "Maqam Awj",
            arabicTitle: "أوج",
            noteName: "Awj (B𝄳4)",
          },
        ]
      case "kurd":
        return [
          {
            pitch: new ArabicPitch("C", "♮", 4),
            title: "Kurd ‘ala al-Rast",
            arabicTitle: "كرد راست",
            noteName: "Rast (C4)",
          },
          {
            pitch: new ArabicPitch("D", "♮", 4),
            title: "Maqam Kurd (Original)",
            arabicTitle: "كرد",
            noteName: "Dukah (D4)",
          },
          {
            pitch: new ArabicPitch("G", "♮", 4),
            title: "Maqam Kurd Nawa",
            arabicTitle: "كرد نوى",
            noteName: "Nawa (G4)",
          },
          {
            pitch: new ArabicPitch("A", "♮", 4),
            title: "Maqam Hijazkar Kurd",
            arabicTitle: "حجاز كار كرد",
            noteName: "Husayni (A4)",
          },
        ]
      case "ajam":
        return [
          {
            pitch: new ArabicPitch("B", "♭", 3),
            title: "Maqam ‘Ajam ‘Ushayran (Original)",
            arabicTitle: "عجم عشيران",
            noteName: "‘Ajam (B♭3)",
          },
          {
            pitch: new ArabicPitch("C", "♮", 4),
            title: "Maqam Jaharkah / ‘Ajam",
            arabicTitle: "جهاركاه / عجم",
            noteName: "Rast (C4)",
          },
          {
            pitch: new ArabicPitch("F", "♮", 4),
            title: "Maqam ‘Ajam Nawa",
            arabicTitle: "عجم نوى",
            noteName: "Jiharkah (F4)",
          },
        ]
      case "saba":
        return [
          {
            pitch: new ArabicPitch("C", "♮", 4),
            title: "Saba ‘ala al-Rast",
            arabicTitle: "صبا راست",
            noteName: "Rast (C4)",
          },
          {
            pitch: new ArabicPitch("D", "♮", 4),
            title: "Maqam Saba (Original)",
            arabicTitle: "صبا",
            noteName: "Dukah (D4)",
          },
          {
            pitch: new ArabicPitch("G", "♮", 4),
            title: "Maqam Saba Zamzam / Nawa",
            arabicTitle: "صبا زمزم",
            noteName: "Nawa (G4)",
          },
        ]
      case "nikriz":
        return [
          {
            pitch: new ArabicPitch("C", "♮", 4),
            title: "Maqam Nikriz (Original)",
            arabicTitle: "نكريز",
            noteName: "Rast (C4)",
          },
          {
            pitch: new ArabicPitch("G", "♮", 4),
            title: "Maqam Nawa Athar",
            arabicTitle: "نوى أثر",
            noteName: "Nawa (G4)",
          },
        ]
      default:
        return [
          {
            pitch: baseMaqam.getTonic(),
            title: `${baseMaqam.name} (Original)`,
            arabicTitle: "الأصل",
            noteName: baseMaqam.getTonic().toScientificString(),
          },
        ]
    }
  }

  const classicalTranspositions = getClassicalTranspositionsForMaqam()
  const scalePitches = currentMaqam.getScale()
  const tonic = currentMaqam.getTonic()
  const ghammaz = currentMaqam.getGhammaz()


  console.log("Current Maqam raw data: ", currentMaqam)

  return (
    <div className="space-y-6">
      {/* Quick Studio Tools Bar (Maqam Builder & Modulation Pathways) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xs">
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
              className="gap-1.5 border-slate-700 bg-slate-900 text-slate-200 hover:text-white cursor-pointer"
            >
              <Wand2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Maqam Builder</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenModulation}
            className="gap-1.5 border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:text-white hover:border-emerald-500 cursor-pointer"
          >
            <GitFork className="h-3.5 w-3.5 text-emerald-400" />
            <span>Modulation Pathways</span>
          </Button>
        </div>
      </div>

      {/* Selected Maqam Inspector & Playback Controls */}
      <Card className="border-slate-800/90 bg-slate-900/90">
        <CardHeader className="border-b border-border/60 pb-5">
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
                  <Badge variant="secondary">Family: {currentMaqam.family}</Badge>
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
                className="gap-2"
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
                className="gap-2"
              >
                <Radio className={isDroneActive ? "animate-pulse" : ""} />
                {isDroneActive ? "Drone Active" : "Qarar Drone"}
              </Button>

              {isTransposed && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleResetTransposition}
                  className="gap-1.5"
                  title={`Reset to original ${baseMaqam.name}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Tonic
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Structural Architecture: Lower Jins, Connection, Upper Jins */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Lower Jins */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-4">
              <div>
                <div className="flex items-center justify-between">
                  <MaqamTermTooltip term="root jins" showIcon={false}>
                    <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                      Jins al-Asl (جنس الأصل)
                    </span>
                  </MaqamTermTooltip>
                  <Badge variant="default" className="text-[10px]">
                    {currentMaqam.lowerJins.definition.type}
                  </Badge>
                </div>
                <h4 className="mt-1 text-lg font-bold text-white">
                  Jins {currentMaqam.lowerJins.definition.name}
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Root:{" "}
                  <strong className="text-amber-300">
                    {formatPitchWithLargeAccidentalReact(currentMaqam.lowerJins.root, { size: 'large' })}
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
                    [{currentMaqam.lowerJins.definition.intervals.join(" - ")}]
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({currentMaqam.lowerJins.getTotalSpanCents()}¢)
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-900 pt-3 text-xs">
                <span className="text-slate-400">Tonic (قرار):</span>
                <span className="font-bold text-emerald-400">
                  {formatPitchWithLargeAccidentalReact(tonic, { size: 'large' })}
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
                    Ghammaz (غمّاز)
                  </MaqamTermTooltip>
                  : {formatPitchWithLargeAccidentalReact(ghammaz, { size: 'large' })}
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
                    {currentMaqam.upperJins.definition.type}
                  </Badge>
                </div>
                <h4 className="mt-1 text-lg font-bold text-white">
                  Jins {currentMaqam.upperJins.definition.name}
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Root:{" "}
                  <strong className="text-purple-300">
                    {formatPitchWithLargeAccidentalReact(currentMaqam.upperJins.root, { size: 'large' })}
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
                    [{currentMaqam.upperJins.definition.intervals.join(" - ")}]
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
                  ] ? formatPitchWithLargeAccidentalReact(currentMaqam.extraPitches[currentMaqam.extraPitches.length - 1], { size: 'large' })
                    : formatPitchWithLargeAccidentalReact(currentMaqam.upperJins.getTopPitch(), { size: 'large' })}
                </span>
              </div>
            </div>
          </div>

          {/* Show alternate upper jins if available */}
          {currentMaqam.alternateUpperAjnas.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-300">
                  Alternate Upper Jins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {currentMaqam.alternateUpperAjnas.map((jins, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-800 p-3"
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
                          {formatPitchWithLargeAccidentalReact(jins.jins.root, { size: 'large' })}
                        </strong>{" "}
                        (
                        {ArabicNoteSpine.resolveDegreeName(jins.jins.root)}
                        )
                      </p>
                    </div>
                  ))}

            
                </div>

              </CardContent>
            </Card>
          )}


          {/* Sayr Melodic Trajectory Modal Trigger Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-sky-800/40 bg-linear-to-r from-sky-950/40 via-slate-900/90 to-indigo-950/40 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Sayr Melodic Trajectory &amp; Course</span>
                  <Badge variant="secondary" className="font-arabic text-[10px]">مسار السير والتحويلات</Badge>
                  <Badge variant="outline" className="text-[10px] text-sky-300 border-sky-500/30 capitalize">
                    {currentMaqam.sayrDirection.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Explore interactive quarter-tone trajectory curves, pivot stops (Qarar, Ghammaz, Jawab), and modulation branches in a dedicated modal dialog.
                </p>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleOpenSayr}
              className="gap-2 bg-linear-to-r from-sky-600 to-sky-500 text-slate-950 font-bold hover:from-sky-500 hover:to-sky-400 cursor-pointer shadow-sm"
            >
              <Compass className="h-4 w-4" />
              <span>Open Sayr Visualization</span>
            </Button>
          </div>

          {/* Standalone SayrVisualizationDialog when opened locally */}
          {showSayrDialogLocal && (
            <SayrVisualizationDialog
              open={showSayrDialogLocal}
              onOpenChange={setShowSayrDialogLocal}
              maqam={currentMaqam}
              timbre={timbre}
            />
          )}

          {/* Modulation Pathways Modal Trigger Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-800/40 bg-linear-to-r from-emerald-950/40 via-slate-900/90 to-teal-950/40 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <GitFork className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Modulation Pathways &amp; Pivot Ajnas</span>
                  <Badge variant="secondary" className="font-arabic text-[10px]">مسارات الانتقال والتنجيس</Badge>
                  <Badge variant="outline" className="text-[10px] text-emerald-300 border-emerald-500/30">
                    Shared Ajnas &amp; Cross-Family Pivots
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Discover idiomatic pivot points between <strong className="text-emerald-200">{currentMaqam.name}</strong> and other Maqamat in the {currentMaqam.family} family or related families. Audition pivot phrases in real-time.
                </p>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleOpenModulation}
              className="gap-2 bg-linear-to-r from-emerald-600 to-emerald-500 text-slate-950 font-bold hover:from-emerald-500 hover:to-emerald-400 cursor-pointer shadow-sm"
            >
              <GitFork className="h-4 w-4" />
              <span>Explore Modulation Pathways</span>
            </Button>
          </div>

          {/* Standalone ModulationPathwaysDrawer when opened locally */}
          {showModulationDrawerLocal && (
            <ModulationPathwaysDrawer
              open={showModulationDrawerLocal}
              onOpenChange={setShowModulationDrawerLocal}
              currentMaqam={currentMaqam}
              onSelectMaqam={onSelectMaqam}
              timbre={timbre}
            />
          )}

          {/* Quick Scale Degree Buttons */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                Scale Degrees &amp; Frequencies (24-EDO)
              </span>
              <span className="text-[11px] text-amber-400">
                Click note to audition
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 sm:grid-cols-4 lg:grid-cols-8">
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
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-2 sm:p-2.5 transition hover:scale-105 ${isTonic
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-md ring-1 ring-emerald-500/30"
                      : isGhammaz
                        ? "border-sky-500/50 bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30"
                        : pitchTheme.combined
                      }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm sm:text-base font-bold">
                        {formatPitchWithLargeAccidentalReact(pitch, { size: 'large' })}
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
                      {ArabicNoteSpine.findByPitch(pitch)?.transliteration ||
                        ""}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dynamic Transposition Hub (الـتـصـويـر) */}
          <div className="border-t border-border/60 pt-6">
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
                      Maqam Transposition Hub (تـصـويـر الـمـقـامـات)
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
                  {classicalTranspositions.map((item) => {
                    const isCurrent = tonic.equals(item.pitch)
                    const stepDeltaQt = originalTonic.diffQuarterTones(
                      item.pitch
                    )
                    const stepCents = stepDeltaQt * 50

                    return (
                      <button
                        key={item.title}
                        onClick={() => handleTransposeToPitch(item.pitch)}
                        className={`group flex cursor-pointer flex-col justify-between rounded-xl border p-3 text-left transition ${isCurrent
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
                        className={`cursor-pointer rounded-xl border p-2 text-center text-xs transition ${isCurrent
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
                          {formatPitchWithLargeAccidentalReact(note.pitch, { size: 'large' })}
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
                              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded font-mono text-xs font-bold transition ${customDiatonic === d
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
                              { acc: "𝄵", label: "𝄵 Quarter-Sharp (+50¢)" },
                              { acc: "♯", label: "♯ Sharp (+100¢)" },
                            ] as { acc: MicrotonalAccidental; label: string }[]
                          ).map((item) => (
                            <button
                              key={item.acc}
                              onClick={() => setCustomAccidental(item.acc)}
                              title={item.label}
                              className={`flex h-8 cursor-pointer items-center justify-center rounded px-2.5 text-xs font-bold transition ${customAccidental === item.acc
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
                              className={`flex h-8 cursor-pointer items-center justify-center rounded px-3 font-mono text-xs font-bold transition ${customOctave === oct
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

                    {/* Candidate Pitch Summary & Apply Action */}
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-right">
                        <span className="block text-[10px] text-slate-400">
                          Selected Target Note:
                        </span>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono text-lg font-bold text-white">
                            {formatPitchWithLargeAccidentalReact(candidatePitch, { size: 'large' })}
                          </span>
                          <span className="font-mono text-xs text-amber-300">
                            ({candidatePitch.toFrequency().toFixed(1)} Hz)
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          Shift:{" "}
                          {candidateDeltaQt === 0
                            ? "0¢ (Original)"
                            : `${candidateDeltaQt > 0 ? "+" : ""}${candidateCents}¢`}
                        </span>
                      </div>

                      <Button
                        variant="default"
                        onClick={() => handleTransposeToPitch(candidatePitch)}
                        className="gap-2"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Transpose {baseMaqam.name} to{" "}
                        {candidatePitch.toScientificString()}
                        {candidatePitch.octave}
                      </Button>
                    </div>
                  </div>

                  {/* Quick suggestion helper chips */}
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-900 pt-2 text-xs">
                    <span className="mr-1 text-[11px] text-slate-500">
                      Popular Quick Tonics:
                    </span>
                    {[
                      new ArabicPitch("G", "♮", 3), // Yakah
                      new ArabicPitch("C", "♮", 4), // Rast
                      new ArabicPitch("D", "♮", 4), // Dukah
                      new ArabicPitch("E", "𝄳", 4), // Sikah
                      new ArabicPitch("F", "♮", 4), // Jaharkah
                      new ArabicPitch("G", "♮", 4), // Nawa
                      new ArabicPitch("A", "♮", 4), // Husayni
                      new ArabicPitch("B", "♭", 4), // Ajam
                      new ArabicPitch("C", "♮", 5), // Kirdan
                    ].map((qp, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCustomTonicDirect(qp)
                          handleTransposeToPitch(qp)
                        }}
                        className={`cursor-pointer rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold transition ${tonic.equals(qp)
                          ? "border-amber-400 bg-amber-500 text-slate-950"
                          : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white"
                          }`}
                      >
                        {formatPitchWithLargeAccidentalReact(qp, { size: 'large' })}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
