// src/components/MaqamExplorer.tsx
import React, { useState } from "react"
import {
  Maqam,
  MaqamatCatalogue,
  type MaqamFamilyMnemonic,
} from "../theory/maqam"
import {
  ArabicPitch,
  type DiatonicBase,
  type MicrotonalAccidental,
} from "../core/pitch"
import { ArabicNoteSpine } from "../core/note-spine"
import {
  MicrotonalAudioEngine,
  type TimbreType,
} from "../audio/microtonal-audio"
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Play,
  Square,
  Radio,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  // Music2,
  // ArrowRight,
  // Layers,
  // Volume2
} from "lucide-react"

interface Props {
  currentMaqam: Maqam
  onSelectMaqam: (maqam: Maqam) => void
  timbre: TimbreType
  isPlayingScale: boolean
  onPlayScale: (pitches: ArabicPitch[]) => void
  onStopScale: () => void
  isDroneActive: boolean
  onToggleDrone: (pitch: ArabicPitch) => void
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
}) => {
  // Transposition tab mode: 'classical' | 'spine' | 'custom'
  const [transpositionTab, setTranspositionTab] = useState<string>("classical")

  // Custom tonic note builder state
  const [customDiatonic, setCustomDiatonic] = useState<DiatonicBase>("G")
  const [customAccidental, setCustomAccidental] =
    useState<MicrotonalAccidental>("♮")
  const [customOctave, setCustomOctave] = useState<number>(4)

  const allMaqamat = MaqamatCatalogue.getAllMaqamat()
  const families = Object.values(MaqamatCatalogue.FAMILIES)
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

  const handleFamilyClick = (mnemonic: MaqamFamilyMnemonic) => {
    const found = allMaqamat.find((m) => m.family === mnemonic)
    if (found) {
      onSelectMaqam(found)
    }
  }

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

  return (
    <div className="space-y-6">
      {/* 8 Families Mnemonic Banner (صُنِعَ بِسِحْرِك) */}
      <Accordion className="border-amber-800/30 bg-linear-to-r from-amber-950/40 via-slate-900/90 to-indigo-950/40">
        <AccordionItem
          value="taxonomy"
          className="border-b border-border/50 pb-3"
        >
          <AccordionTrigger className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest uppercase">
                  The 8 Fundamental Families
                </span>
                <Badge variant="secondary" className="font-arabic text-[10px]">
                  صُـنِـعَ بِـسِـحْـرِكَ
                </Badge>
              </div>
              <CardTitle className="mt-1 text-xl sm:text-2xl">
                Maqam Family Taxonomy
              </CardTitle>
            </div>
            <CardDescription className="max-w-sm text-[11px] text-slate-300">
              The classical mnemonic{" "}
              <span className="font-serif text-sm font-bold text-amber-300">
                "صُنع بسحرك"
              </span>{" "}
              categorizes modal systems by their root lower Jins.
            </CardDescription>
          </AccordionTrigger>

          {/* 8 Family Interactive Grid */}
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
              {families.map((fam) => {
                const isSelected = currentMaqam.family === fam.mnemonic
                return (
                  <button
                    key={fam.mnemonic}
                    onClick={() => handleFamilyClick(fam.mnemonic)}
                    className={`group flex cursor-pointer flex-col items-center justify-between rounded-xl border p-3 text-center transition-all ${
                      isSelected
                        ? "scale-102 border-amber-300 bg-amber-500 text-slate-950 shadow-lg ring-2 ring-amber-400/40"
                        : "border-slate-800/80 bg-slate-950/70 text-slate-200 hover:border-amber-500/40 hover:bg-slate-800/80"
                    }`}
                  >
                    <span
                      className={`font-serif text-2xl font-bold ${isSelected ? "text-slate-950" : "text-amber-400 transition-transform group-hover:scale-110"}`}
                    >
                      {fam.arabicLetter}
                    </span>
                    <span className="mt-1 text-xs font-bold">
                      {fam.mnemonic}
                    </span>
                    <span
                      className={`mt-0.5 text-[10px] ${isSelected ? "font-medium text-slate-800" : "text-slate-400"}`}
                    >
                      {fam.rootJinsDef.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Selected Maqam Inspector & Playback Controls */}
      <Card className="border-slate-800/90 bg-slate-900/90">
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-2xl font-black sm:text-3xl">
                  {currentMaqam.name}
                </CardTitle>
                {currentMaqam.arabicName && (
                  <span className="hidden font-serif text-xl font-bold text-amber-400/90 sm:inline">
                    {currentMaqam.arabicName}
                  </span>
                )}
                <Badge variant="secondary">Family: {currentMaqam.family}</Badge>

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
                  <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                    Jins al-Asl (جنس الأصل)
                  </span>
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
                    {currentMaqam.lowerJins.root.toScientificString()}
                    {currentMaqam.lowerJins.root.octave}
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
                  {tonic.toScientificString()}
                  {tonic.octave}
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
                  Ghammaz (غمّاز): {ghammaz.toScientificString()}
                  {ghammaz.octave}
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
                  <span className="text-[11px] font-bold tracking-wider text-purple-400 uppercase">
                    Jins al-Far' (جنس الفرع)
                  </span>
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
                    {currentMaqam.upperJins.root.toScientificString()}
                    {currentMaqam.upperJins.root.octave}
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
                  ]?.toScientificString() ||
                    currentMaqam.upperJins.getTopPitch().toScientificString()}
                </span>
              </div>
            </div>
          </div>

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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {scalePitches.map((pitch, idx) => {
                const isTonic = pitch.equals(tonic)
                const isGhammaz = pitch.equals(ghammaz)
                const isQuarter =
                  pitch.accidental === "𝄳" || pitch.accidental === "𝄵"

                return (
                  <button
                    key={idx}
                    onClick={() =>
                      MicrotonalAudioEngine.playPitch(pitch, 0.7, timbre)
                    }
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-2.5 transition hover:scale-105 ${
                      isTonic
                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-md ring-1 ring-emerald-500/30"
                        : isGhammaz
                          ? "border-sky-500/50 bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30"
                          : isQuarter
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-base font-bold">
                        {pitch.toScientificString()}
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
                          {note.pitch.toScientificString()}
                          {note.pitch.octave}
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
                              { acc: "𝄵", label: "𝄵 Quarter-Sharp (+50¢)" },
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

                    {/* Candidate Pitch Summary & Apply Action */}
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-right">
                        <span className="block text-[10px] text-slate-400">
                          Selected Target Note:
                        </span>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono text-lg font-bold text-white">
                            {candidatePitch.toScientificString()}
                            {candidatePitch.octave}
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
                          setCustomDiatonic(qp.diatonic)
                          setCustomAccidental(qp.accidental)
                          setCustomOctave(qp.octave)
                          handleTransposeToPitch(qp)
                        }}
                        className={`cursor-pointer rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                          tonic.equals(qp)
                            ? "border-amber-400 bg-amber-500 text-slate-950"
                            : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white"
                        }`}
                      >
                        {qp.toScientificString()}
                        {qp.octave}
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
