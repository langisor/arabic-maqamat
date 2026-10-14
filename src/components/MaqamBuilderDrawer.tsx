// src/components/MaqamBuilderDrawer.tsx
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
import { Input } from "./ui/input"
import {
  Sparkles,
  Music,
  X,
  Radio,
  CheckCircle2,
  Wand2,
  Play,
  Square,
} from "lucide-react"
import { ArabicPitch, DiatonicBase, MicrotonalAccidental } from "../core/pitch"
import { Jins, AjnasLibrary } from "../theory/jins"
import {
  Maqam,
  MaqamatCatalogue,
  MaqamConnection,
  MaqamFamilyMnemonic,
  MaqamScaleStructure,
} from "../theory/maqam"
import { MicrotonalAudioEngine, TimbreType } from "../audio/microtonal-audio"
import { formatPitchWithLargeAccidentalReact } from "../core/pitch-styling"

interface PresetTemplate {
  name: string
  arabicName: string
  lowerJinsId: string
  tonic: { diatonic: DiatonicBase; accidental: MicrotonalAccidental; octave: number }
  connection: MaqamConnection
  upperJinsId: string
  family: MaqamFamilyMnemonic
  description: string
}

const BUILDER_PRESETS: PresetTemplate[] = [
  {
    name: "Maqam Suznak (سوزناك)",
    arabicName: "مقام سوزناك",
    lowerJinsId: "rast",
    tonic: { diatonic: "C", accidental: "♮", octave: 4 },
    connection: "Infisal",
    upperJinsId: "hijaz",
    family: "Rast",
    description: "Rast root with dramatic upper Hijaz on G4 (characteristic of Turkish and Arab art music).",
  },
  {
    name: "Maqam Bayati Shuri (شورى)",
    arabicName: "مقام بياتي شورى",
    lowerJinsId: "bayati",
    tonic: { diatonic: "D", accidental: "♮", octave: 4 },
    connection: "Ittisal",
    upperJinsId: "hijaz",
    family: "Bayati",
    description: "Heartfelt Bayati root transitioning into intense upper Hijaz on G4.",
  },
  {
    name: "Maqam Shawq Afza (شوق أفزا)",
    arabicName: "مقام شوق أفزا",
    lowerJinsId: "nahawand",
    tonic: { diatonic: "C", accidental: "♮", octave: 4 },
    connection: "Infisal",
    upperJinsId: "hijaz",
    family: "Nahawand",
    description: "Melancholic Nahawand on C with fiery upper Hijaz on G4.",
  },
  {
    name: "Maqam Nairuz / Yakah (نيروز)",
    arabicName: "مقام نيروز",
    lowerJinsId: "rast",
    tonic: { diatonic: "C", accidental: "♮", octave: 4 },
    connection: "Infisal",
    upperJinsId: "bayati",
    family: "Rast",
    description: "Classical Rast on C with upper Bayati on G4 featuring Awj (B𝄳4).",
  },
  {
    name: "Maqam Mahur (ماهور)",
    arabicName: "مقام ماهور",
    lowerJinsId: "rast",
    tonic: { diatonic: "C", accidental: "♮", octave: 4 },
    connection: "Infisal",
    upperJinsId: "ajam",
    family: "Rast",
    description: "Rast on C ascending into celebratory upper Ajam major pentachord on G4.",
  },
  {
    name: "Maqam Hijazkar Kurd (حجازكار كرد)",
    arabicName: "مقام حجازكار كرد",
    lowerJinsId: "kurd",
    tonic: { diatonic: "D", accidental: "♮", octave: 4 },
    connection: "Ittisal",
    upperJinsId: "hijaz",
    family: "Kurd",
    description: "Somber Kurd root on D with brilliant upper Hijaz on G4.",
  },
]

interface TonicChoice {
  label: string
  pitch: ArabicPitch
}

const TONIC_CHOICES: TonicChoice[] = [
  { label: "C4 (راست)", pitch: new ArabicPitch("C", "♮", 4) },
  { label: "D4 (دوكاه)", pitch: new ArabicPitch("D", "♮", 4) },
  { label: "E𝄳4 (سيكاه)", pitch: new ArabicPitch("E", "𝄳", 4) },
  { label: "E♭4 (كرد)", pitch: new ArabicPitch("E", "♭", 4) },
  { label: "F4 (جهاركاه)", pitch: new ArabicPitch("F", "♮", 4) },
  { label: "G4 (نوى)", pitch: new ArabicPitch("G", "♮", 4) },
  { label: "A4 (حسيني)", pitch: new ArabicPitch("A", "♮", 4) },
  { label: "B𝄳4 (أوج)", pitch: new ArabicPitch("B", "𝄳", 4) },
  { label: "B♭4 (عجم)", pitch: new ArabicPitch("B", "♭", 4) },
  { label: "G3 (يكاه)", pitch: new ArabicPitch("G", "♮", 3) },
  { label: "B𝄳3 (عراق)", pitch: new ArabicPitch("B", "𝄳", 3) },
]

interface MaqamBuilderDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectMaqam: (maqam: Maqam) => void
  timbre?: TimbreType
}

export const MaqamBuilderDrawer: React.FC<MaqamBuilderDrawerProps> = ({
  open,
  onOpenChange,
  onSelectMaqam,
  timbre = "violin",
}) => {
  const allAjnas = useMemo(() => AjnasLibrary.getAllDefinitions(), [])

  // State
  const [lowerJinsId, setLowerJinsId] = useState<string>("rast")
  const [selectedTonicIndex, setSelectedTonicIndex] = useState<number>(0)
  const [connectionType, setConnectionType] = useState<MaqamConnection>("Infisal")
  const [upperJinsId, setUpperJinsId] = useState<string>("hijaz")
  const [customMaqamName, setCustomMaqamName] = useState<string>("")
  const [customArabicName, setCustomArabicName] = useState<string>("")
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(false)
  const [activeAuditionIndex, setActiveAuditionIndex] = useState<number | null>(null)
  const [isDroneActive, setIsDroneActive] = useState<boolean>(false)

  const activeTonic = useMemo(
    () => TONIC_CHOICES[selectedTonicIndex]?.pitch ?? new ArabicPitch("C", "♮", 4),
    [selectedTonicIndex],
  )

  const lowerDef = useMemo(() => {
    return AjnasLibrary.findById(lowerJinsId) ?? AjnasLibrary.RAST
  }, [lowerJinsId])

  const upperDef = useMemo(() => {
    return AjnasLibrary.findById(upperJinsId) ?? AjnasLibrary.HIJAZ
  }, [upperJinsId])

  const lowerJins = useMemo(() => {
    return new Jins(lowerDef, activeTonic)
  }, [lowerDef, activeTonic])

  const upperRoot = useMemo(() => {
    const lowerTop = lowerJins.getTopPitch()
    if (connectionType === "Ittisal") {
      return lowerTop
    } else if (connectionType === "Infisal") {
      return lowerTop.transpose(4)
    } else {
      return lowerTop.transpose(-2)
    }
  }, [lowerJins, connectionType])

  const upperJins = useMemo(() => {
    return new Jins(upperDef, upperRoot)
  }, [upperDef, upperRoot])

  const ghammazPitch = useMemo(() => {
    return upperRoot
  }, [upperRoot])

  const suggestedName = useMemo(() => {
    if (customMaqamName.trim()) return customMaqamName.trim()
    return `Maqam ${lowerDef.name}-${upperDef.name}`
  }, [customMaqamName, lowerDef.name, upperDef.name])

  const suggestedArabic = useMemo(() => {
    if (customArabicName.trim()) return customArabicName.trim()
    return `مقام ${lowerDef.arabicName} ${upperDef.arabicName}`
  }, [customArabicName, lowerDef.arabicName, upperDef.arabicName])

  const familyMnemonic: MaqamFamilyMnemonic = useMemo(() => {
    switch (lowerDef.id) {
      case "rast": return "Rast"
      case "bayati": return "Bayati"
      case "hijaz": return "Hijaz"
      case "nahawand": return "Nahawand"
      case "kurd": return "Kurd"
      case "saba": return "صنع"
      case "sikah": return "Sikah"
      case "ajam": return "‘Ajam"
      default: return "Rast"
    }
  }, [lowerDef.id])

  const constructedMaqam = useMemo(() => {
    try {
      const structure: MaqamScaleStructure = {
        id: `custom-${lowerDef.id}-${upperDef.id}-${activeTonic.toScientificString()}${activeTonic.octave}-${connectionType.toLowerCase()}`,
        name: suggestedName,
        arabicName: suggestedArabic,
        family: familyMnemonic,
        lowerJins,
        connection: connectionType,
        upperJins,
        ghammaz: ghammazPitch,
        description: `Custom built Maqam combining lower Jins ${lowerDef.name} (${lowerDef.arabicName}) on ${activeTonic.toScientificString()}${activeTonic.octave} with upper Jins ${upperDef.name} (${upperDef.arabicName}) via ${connectionType} connection.`,
      }
      return new Maqam(structure)
    } catch {
      return MaqamatCatalogue.buildRast()
    }
  }, [lowerDef, upperDef, activeTonic, connectionType, lowerJins, upperJins, ghammazPitch, suggestedName, suggestedArabic, familyMnemonic])

  const scalePitches = useMemo(() => {
    return constructedMaqam.getScale()
  }, [constructedMaqam])

  const handleTogglePlay = () => {
    if (isPlayingScale) {
      MicrotonalAudioEngine.stopSequence("builder-scale")
      setIsPlayingScale(false)
      setActiveAuditionIndex(null)
    } else {
      setIsPlayingScale(true)
      MicrotonalAudioEngine.playSequence(
        scalePitches,
        500,
        timbre,
        (idx) => setActiveAuditionIndex(idx === -1 ? null : idx),
        () => {
          setIsPlayingScale(false)
          setActiveAuditionIndex(null)
        },
        undefined,
        "builder-scale"
      )
    }
  }

  const handleToggleDrone = () => {
    const nextState = !isDroneActive
    setIsDroneActive(nextState)
    MicrotonalAudioEngine.toggleDrone(activeTonic, nextState)
  }

  const handleApplyPreset = (preset: PresetTemplate) => {
    setLowerJinsId(preset.lowerJinsId)
    setUpperJinsId(preset.upperJinsId)
    setConnectionType(preset.connection)
    setCustomMaqamName(preset.name)
    setCustomArabicName(preset.arabicName)
    const targetTonic = new ArabicPitch(preset.tonic.diatonic, preset.tonic.accidental, preset.tonic.octave)
    const idx = TONIC_CHOICES.findIndex(c => c.pitch.equals(targetTonic))
    if (idx !== -1) setSelectedTonicIndex(idx)
  }

  const handleApplyToStudio = () => {
    if (isDroneActive) {
      MicrotonalAudioEngine.toggleDrone(activeTonic, false)
      setIsDroneActive(false)
    }
    if (isPlayingScale) {
      MicrotonalAudioEngine.stopSequence("builder-scale")
      setIsPlayingScale(false)
    }
    onSelectMaqam(constructedMaqam)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] bg-slate-950 text-slate-100 border-t border-amber-800/40">
        <DrawerHeader className="border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                  <span>Maqam Builder &amp; Architect</span>
                  <span className="font-arabic text-amber-400 text-sm font-semibold">
                    (معمارية وتركيب المقامات)
                  </span>
                </DrawerTitle>
                <DrawerDescription className="text-xs text-slate-400">
                  Compose, chain ajnas, audition in 24-EDO, and load custom modal structures directly into the Studio
                </DrawerDescription>
              </div>
            </div>
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
        </DrawerHeader>

        <div className="overflow-y-auto px-6 py-5 space-y-6 max-h-[calc(92vh-140px)] scrollbar-thin">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Classical Compound Templates (قوالب جاهزة):</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Click to load formula
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {BUILDER_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:border-amber-500/60 hover:bg-slate-800 hover:text-white cursor-pointer active:scale-95"
                >
                  <Music className="h-3 w-3 text-amber-400" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[11px]">1</span>
                  <span>Lower Jins (جنس الأصل)</span>
                </span>
                <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/30">
                  {lowerDef.sizeLabel || lowerDef.type}
                </Badge>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Root Tonic (القرار):
                </label>
                <select
                  value={selectedTonicIndex}
                  onChange={(e) => setSelectedTonicIndex(Number(e.target.value))}
                  className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-xs focus:border-amber-500 focus:outline-none"
                >
                  {TONIC_CHOICES.map((tc, idx) => (
                    <option key={idx} value={idx}>
                      {tc.label} ({tc.pitch.toScientificString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Root Jins Cell:
                </label>
                <select
                  value={lowerJinsId}
                  onChange={(e) => setLowerJinsId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-amber-300 shadow-xs focus:border-amber-500 focus:outline-none"
                >
                  {allAjnas.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name} ({j.arabicName}) — {j.sizeLabel || j.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-2.5 text-[11px] text-slate-300 border border-slate-800/80">
                <div className="font-semibold text-amber-200">{lowerDef.arabicName} ({lowerDef.name}):</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{lowerDef.description}</div>
                <div className="mt-1 text-[10px] font-mono text-cyan-300">
                  Intervals: [{lowerDef.intervals.join("-")}] qt ({lowerJins.getTotalSpanCents()}¢ span)
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[11px]">2</span>
                  <span>Connection (الوصل والغمّاز)</span>
                </span>
                <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-500/30">
                  Pivot
                </Badge>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1.5">
                  Jins Junction:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "Infisal", label: "Infisal (انفصال)", sub: "Disjunct: +1 Whole-Tone Gap (200¢)" },
                    { id: "Ittisal", label: "Ittisal (اتصال)", sub: "Conjunct: Shared Pivot Ghammaz Note" },
                    { id: "Tadakhul", label: "Tadakhul (تداخل)", sub: "Overlapping: Interlocked Ajnas" },
                  ].map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => setConnectionType(ct.id as MaqamConnection)}
                      className={`text-left px-3 py-2 rounded-xl border text-xs transition-all cursor-pointer ${
                        connectionType === ct.id
                          ? "border-cyan-500/80 bg-cyan-950/40 text-cyan-200 shadow-sm"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="font-bold">{ct.label}</div>
                      <div className="text-[10px] text-slate-400">{ct.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-2.5 text-[11px] text-slate-300 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-200">Ghammaz Pivot (الغمّاز):</span>
                  <Badge variant="secondary" className="font-mono text-cyan-300">
                    {formatPitchWithLargeAccidentalReact(ghammazPitch, { size: 'large' })}
                  </Badge>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Calculated frequency: {ghammazPitch.toFrequency().toFixed(1)} Hz
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[11px]">3</span>
                  <span>Upper Jins (جنس الفرع)</span>
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-300 border-emerald-500/30">
                  {upperDef.sizeLabel || upperDef.type}
                </Badge>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Upper Jins Root Pitch:
                </label>
                <div className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono font-bold text-emerald-300 flex items-center justify-between">
                  <span>{formatPitchWithLargeAccidentalReact(upperRoot, { size: 'large' })}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {upperRoot.toFrequency().toFixed(1)} Hz
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Upper Jins Cell:
                </label>
                <select
                  value={upperJinsId}
                  onChange={(e) => setUpperJinsId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-emerald-300 shadow-xs focus:border-emerald-500 focus:outline-none"
                >
                  {allAjnas.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name} ({j.arabicName}) — {j.sizeLabel || j.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-2.5 text-[11px] text-slate-300 border border-slate-800/80">
                <div className="font-semibold text-emerald-200">{upperDef.arabicName} ({upperDef.name}):</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{upperDef.description}</div>
                <div className="mt-1 text-[10px] font-mono text-cyan-300">
                  Intervals: [{upperDef.intervals.join("-")}] qt ({upperJins.getTotalSpanCents()}¢ span)
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Custom English Name (الاسم الإنجليزي):
              </label>
              <Input
                value={customMaqamName}
                onChange={(e) => setCustomMaqamName(e.target.value)}
                placeholder={suggestedName}
                className="bg-slate-900 border-slate-700 text-xs font-medium text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Custom Arabic Name (الاسم العربي):
              </label>
              <Input
                value={customArabicName}
                onChange={(e) => setCustomArabicName(e.target.value)}
                placeholder={suggestedArabic}
                dir="rtl"
                className="bg-slate-900 border-slate-700 text-xs font-arabic font-medium text-amber-300 text-right"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-linear-to-r from-amber-950/40 via-slate-900 to-indigo-950/30 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{suggestedName}</span>
                  <span className="font-arabic text-amber-400 text-sm">({suggestedArabic})</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Family: <strong className="text-amber-300">{familyMnemonic}</strong> · Tonic:{" "}
                  <strong className="text-white">{formatPitchWithLargeAccidentalReact(activeTonic, { size: 'large' })}</strong> · Connection:{" "}
                  <strong className="text-cyan-300">{connectionType}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={isPlayingScale ? "destructive" : "default"}
                  size="sm"
                  onClick={handleTogglePlay}
                  className="gap-1.5 cursor-pointer"
                >
                  {isPlayingScale ? (
                    <>
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Audition Scale (عزف السلم)</span>
                    </>
                  )}
                </Button>
                <Button
                  variant={isDroneActive ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleDrone}
                  className="gap-1.5 cursor-pointer border-slate-700"
                >
                  <Radio className={`h-3.5 w-3.5 ${isDroneActive ? "animate-pulse text-amber-300" : ""}`} />
                  <span>{isDroneActive ? "Drone On" : "Tonic Drone"}</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {scalePitches.map((p: ArabicPitch, idx: number) => {
                const isActive = activeAuditionIndex === idx
                const isTonic = p.equals(activeTonic)
                const isGhammaz = p.equals(ghammazPitch)
                const isQuarterTone = p.accidental === "𝄳" || p.accidental === "𝄲"
                return (
                  <div
                    key={idx}
                    onClick={() => MicrotonalAudioEngine.playPitch(p, 1.2, timbre, 0.85)}
                    className={`flex flex-col items-center p-2.5 rounded-xl border transition-all cursor-pointer min-w-16 active:scale-95 ${
                      isActive
                        ? "border-amber-400 bg-amber-500/30 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105"
                        : isTonic
                        ? "border-amber-500/70 bg-amber-950/60 text-amber-300 shadow-sm"
                        : isGhammaz
                        ? "border-cyan-500/70 bg-cyan-950/60 text-cyan-200 shadow-sm"
                        : "border-slate-800 bg-slate-900/80 text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-mono font-bold text-xs">
                      <span>{formatPitchWithLargeAccidentalReact(p, { size: 'large' })}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {isTonic ? (
                        <span className="text-amber-400 font-semibold">Tonic</span>
                      ) : isGhammaz ? (
                        <span className="text-cyan-400 font-semibold">Ghammaz</span>
                      ) : isQuarterTone ? (
                        <span className="text-amber-300">ربع صوت</span>
                      ) : (
                        `#${idx + 1}`
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {p.toFrequency().toFixed(1)} Hz
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t border-slate-800/80 px-6 py-3.5 flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={handleApplyToStudio}
            className="gap-2 bg-linear-to-r from-amber-600 to-amber-500 text-slate-950 font-bold hover:from-amber-500 hover:to-amber-400 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Apply to Studio &amp; All Labs (تطبيق على الاستوديو)</span>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
