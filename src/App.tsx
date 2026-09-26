import React, { useState } from "react"
import { Maqam, MaqamatCatalogue } from "./theory/maqam"
import { ArabicPitch } from "./core/pitch"
import {
  MicrotonalAudioEngine,
  type TimbreType,
} from "./audio/microtonal-audio"
import { MaqamExplorer } from "./components/MaqamExplorer"
import { ViolinFingerboard } from "./components/ViolinFingerboard"
import { ScoreViewer } from "./components/ScoreViewer"
import { SayrQaflaLab } from "./components/SayrQaflaLab"
import { TuningWheel24EDO } from "./components/TuningWheel24EDO"
import { JinsDetectorLab } from "./components/JinsDetectorLab"
import { TranspositionLab } from "./components/TranspositionLab"
import { ThemeToggle } from "./components/ThemeToggle"
import { Metronome } from "./components/Metronome"
import { TrainingLab } from "./components/TrainingLab"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Card } from "./components/ui/card"
import {
  Music,
  Radio,
  Layers,
  Compass,
  Sliders,
  FileMusic,
  Sparkles,
  ArrowLeftRight,
  ChevronDown,
  Volume2,
  Settings2,
  X,
  CheckCircle2,
  GraduationCap,
} from "lucide-react"

export default function App() {
  const allMaqamat = MaqamatCatalogue.getAllMaqamat()
  const [currentMaqam, setCurrentMaqam] = useState<Maqam>(
    MaqamatCatalogue.buildRast()
  )
  const [activeTab, setActiveTab] = useState<
    | "explorer"
    | "transposition"
    | "violin"
    | "sayr"
    | "score"
    | "tuning"
    | "detector"
    | "training"
  >("explorer")
  const [timbre, setTimbre] = useState<TimbreType>("violin")
  const [isDroneActive, setIsDroneActive] = useState(false)
  const [isPlayingScale, setIsPlayingScale] = useState(false)
  const [activePitchIndex, setActivePitchIndex] = useState<number | null>(null)

  // Tone.js Audio DSP Studio Controls
  const [masterVolume, setMasterVolume] = useState<number>(85)
  const [reverbWet, setReverbWet] = useState<number>(20)
  const [referenceA4, setReferenceA4State] = useState<number>(440)
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false)

  const scalePitches = currentMaqam.getScale()
  const tonic = currentMaqam.getTonic()

  const handleVolumeChange = (val: number) => {
    setMasterVolume(val)
    MicrotonalAudioEngine.setMasterVolume(val / 100)
  }

  const handleReverbChange = (val: number) => {
    setReverbWet(val)
    MicrotonalAudioEngine.setReverbWet(val / 100)
  }

  const handleA4Change = (val: number) => {
    setReferenceA4State(val)
    MicrotonalAudioEngine.setReferenceA4(val)
  }

  const handleSelectMaqam = (m: Maqam) => {
    // If drone is active, adjust drone to new tonic
    if (isDroneActive) {
      MicrotonalAudioEngine.toggleDrone(m.getTonic(), true)
    }
    if (isPlayingScale) {
      MicrotonalAudioEngine.stopSequence()
      setIsPlayingScale(false)
      setActivePitchIndex(null)
    }
    setCurrentMaqam(m)
  }

  const handleToggleDrone = (pitch: ArabicPitch) => {
    const newState = !isDroneActive
    setIsDroneActive(newState)
    MicrotonalAudioEngine.toggleDrone(pitch, newState)
  }

  const handlePlayScale = (pitches: ArabicPitch[]) => {
    setIsPlayingScale(true)
    MicrotonalAudioEngine.playSequence(
      pitches,
      500,
      timbre,
      (idx) => {
        setActivePitchIndex(idx === -1 ? null : idx)
      },
      () => {
        setIsPlayingScale(false)
        setActivePitchIndex(null)
      }
    )
  }

  const handleStopScale = () => {
    MicrotonalAudioEngine.stopSequence()
    setIsPlayingScale(false)
    setActivePitchIndex(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Heritage Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 shadow-xs backdrop-blur-xl dark:bg-slate-950/90">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-linear-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Music className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-foreground">
                  Arabic Maqamat
                </span>
                <span
                  className="hidden font-arabic text-base font-bold text-amber-500 lg:inline"
                  dir="rtl"
                >
                  المقامات العربية
                </span>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  24-EDO Studio
                </Badge>
              </div>
              <p className="-mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                Arabic Music Theory &amp; Violin Pedagogy Engine
              </p>
            </div>
          </div>

          {/* Quick Maqam Selector Dropdown, Sound Controls & Theme Toggler */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <select
                value={currentMaqam.id}
                onChange={(e) => {
                  const found = allMaqamat.find((m) => m.id === e.target.value)
                  if (found) handleSelectMaqam(found)
                }}
                className="xs:max-w-[160px] max-w-28 cursor-pointer appearance-none truncate rounded-xl border border-border bg-muted/60 py-1.5 pr-7 pl-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:border-amber-500/60 focus:ring-2 focus:ring-amber-500/40 focus:outline-none sm:max-w-none sm:py-2 dark:bg-slate-900"
                title="Select Maqam"
              >
                {currentMaqam.id.includes("-transposed-") && (
                  <option value={currentMaqam.id}>
                    ⚡ {currentMaqam.name}
                  </option>
                )}
                {allMaqamat.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.family})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            {currentMaqam.id.includes("-transposed-") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const baseId = currentMaqam.id.split("-transposed-")[0]
                  const base = MaqamatCatalogue.findById(baseId)
                  if (base) handleSelectMaqam(base)
                }}
                className="hidden gap-1 xl:inline-flex"
                title="Reset to natural tonic"
              >
                <span>
                  Tonic: {tonic.toScientificString()}
                  {tonic.octave}
                </span>
                <span className="text-muted-foreground hover:text-foreground">
                  ✕
                </span>
              </Button>
            )}

            {/* Audio Settings / Tone.js DSP Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAudioSettings(true)}
              className="gap-1.5 px-2.5 text-muted-foreground hover:text-foreground sm:px-3"
              title="Tone.js DSP Audio Settings"
            >
              <Settings2 className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden text-xs font-medium lg:inline">
                Audio DSP
              </span>
            </Button>

            {/* Theme Toggler (Light / Dark / Auto) */}
            <ThemeToggle />
          </div>
        </div>
        {/* Timbre Toggle (Violin / Oud / Kanun) */}
        <div className="mx-auto flex max-w-7xl border-t border-border/60 px-2 sm:px-6 lg:px-8">
          <div className="flex rounded-xl border border-border bg-muted/60 p-0.5 text-[11px] sm:p-1 sm:text-xs dark:bg-slate-900">
            <Button
              variant={timbre === "violin" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimbre("violin")}
              className={`cursor-pointer rounded-lg px-2 py-1 font-medium transition sm:px-2.5 sm:py-1.5 ${
                timbre === "violin"
                  ? "bg-amber-500 font-bold text-slate-950 shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Violin Bowed Sound (Tone.js Model)"
            >
              Violin
            </Button>
            <Button
              disabled
              variant={timbre === "oud" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimbre("oud")}

              className={`cursor-pointer rounded-lg px-2 py-1 font-medium transition sm:px-2.5 sm:py-1.5 ${
                timbre === "oud"
                  ? "bg-amber-500 font-bold text-slate-950 shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Oud Plucked Sound (Tone.js Model)"
            >
              Oud
            </Button>
            <Button
              disabled
              variant={timbre === "kanun" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimbre("kanun")}
              className={`cursor-pointer rounded-lg px-2 py-1 font-medium transition sm:px-2.5 sm:py-1.5 ${
                timbre === "kanun"
                  ? "bg-amber-500 font-bold text-slate-950 shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Kanun Zither Sound (Tone.js Model)"
            >
              Kanun
            </Button>
          </div>

          {/* Continuous Drone Shortcut */}
          <Button
            variant={isDroneActive ? "default" : "ghost"}
            size="sm"
            onClick={() => handleToggleDrone(tonic)}
            className="gap-1.5 px-2.5 sm:px-3"
            title="Continuous Tonic Qarar Drone"
          >
            <Radio
              className={`h-3.5 w-3.5 ${isDroneActive ? "animate-pulse text-amber-400" : ""}`}
            />
            <span className="hidden md:inline">
              {isDroneActive ? "Drone: ON" : "Drone"}
            </span>
          </Button>

          {/* Synchronized Visual Metronome */}
          <Metronome />
        </div>
        {/* Studio Navigation Tabs (Mobile: Icons Only, Tablet/Desktop: Wrapped with Labels) */}
        <div className="mx-auto max-w-7xl border-t border-border/60 px-2 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center justify-around gap-1 py-2 text-xs font-semibold sm:justify-start sm:gap-2">
            <button
              onClick={() => setActiveTab("explorer")}
              aria-label="Maqam & 8 Families"
              title="Maqam & 8 Families"
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl p-2.5 whitespace-nowrap transition sm:gap-2 sm:px-3 sm:py-2 ${
                activeTab === "explorer"
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-600 shadow-xs dark:text-amber-300"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Maqam &amp; 8 Families</span>
            </button>

            <button
              onClick={() => setActiveTab("transposition")}
              aria-label="Transposition Lab (Taswir)"
              title="Transposition Lab (Taswir)"
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl p-2.5 whitespace-nowrap transition sm:gap-2 sm:px-3 sm:py-2 ${
                activeTab === "transposition"
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-600 shadow-xs dark:text-amber-300"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <ArrowLeftRight className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="hidden sm:inline">Transposition Lab</span>
            </button>

            <button
              onClick={() => setActiveTab("violin")}
              aria-label="Violin Fingerboard"
              title="Violin Fingerboard"
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl p-2.5 whitespace-nowrap transition sm:gap-2 sm:px-3 sm:py-2 ${
                activeTab === "violin"
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-600 shadow-xs dark:text-amber-300"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Music className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Violin Fingerboard</span>
            </button>

            <button
              onClick={() => setActiveTab("sayr")}
              aria-label="Sayr, Modulation & Qafla"
              title="Sayr, Modulation & Qafla"
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl p-2.5 whitespace-nowrap transition sm:gap-2 sm:px-3 sm:py-2 ${
                activeTab === "sayr"
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-600 shadow-xs dark:text-amber-300"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Compass className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Sayr &amp; Qafla</span>
            </button>

            <button
              onClick={() => setActiveTab("score")}
              aria-label="Score & MusicXML 4.0"
              title="Score & MusicXML 4.0"
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl p-2.5 whitespace-nowrap transition sm:gap-2 sm:px-3 sm:py-2 ${
                activeTab === "score"
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-600 shadow-xs dark:text-amber-300"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <FileMusic className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Score &amp; MusicXML</span>
            </button>

            <button
              onClick={() => setActiveTab("tuning")}
              aria-label="24-EDO Tuning & Spine"
              title="24-EDO Tuning & Spine"
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl p-2.5 whitespace-nowrap transition sm:gap-2 sm:px-3 sm:py-2 ${
                activeTab === "tuning"
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-600 shadow-xs dark:text-amber-300"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Sliders className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">24-EDO Tuning</span>
            </button>

            <button
              onClick={() => setActiveTab("detector")}
              aria-label="Jins Phrase Classifier"
              title="Jins Phrase Classifier"
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl p-2.5 whitespace-nowrap transition sm:gap-2 sm:px-3 sm:py-2 ${
                activeTab === "detector"
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-600 shadow-xs dark:text-amber-300"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="hidden sm:inline">Jins Classifier</span>
            </button>

            <button
              onClick={() => setActiveTab("training")}
              aria-label="Practice & Training Mode"
              title="Practice & Training Mode: Scale memorization, sight-reading & recording"
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl p-2.5 whitespace-nowrap transition sm:gap-2 sm:px-3 sm:py-2 ${
                activeTab === "training"
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-600 shadow-xs dark:text-amber-300"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <GraduationCap className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="hidden sm:inline">Practice &amp; Training</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "training" && (
          <TrainingLab
            currentMaqam={currentMaqam}
            allMaqamat={allMaqamat}
            onSelectMaqam={handleSelectMaqam}
            timbre={timbre}
          />
        )}
        {activeTab === "explorer" && (
          <MaqamExplorer
            currentMaqam={currentMaqam}
            onSelectMaqam={handleSelectMaqam}
            timbre={timbre}
            isPlayingScale={isPlayingScale}
            onPlayScale={handlePlayScale}
            onStopScale={handleStopScale}
            isDroneActive={isDroneActive}
            onToggleDrone={handleToggleDrone}
          />
        )}

        {activeTab === "transposition" && (
          <TranspositionLab
            currentMaqam={currentMaqam}
            onSelectMaqam={handleSelectMaqam}
            timbre={timbre}
            isDroneActive={isDroneActive}
            onToggleDrone={handleToggleDrone}
          />
        )}

        {activeTab === "violin" && (
          <div className="space-y-6">
            <ViolinFingerboard
              scalePitches={scalePitches}
              activePitchIndex={activePitchIndex}
              timbre={timbre}
            />

            {/* Quick Context Summary */}
            <Card className="flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-slate-900/80 p-5">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Active Fingerboard Maqam: {currentMaqam.name}
                </h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  1st position stop ratios computed mathematically via{" "}
                  <code className="text-amber-300">L = 1 - 2^(-qt / 24)</code>{" "}
                  with quarter-tone finger displacement adjustments.
                </p>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  isPlayingScale
                    ? handleStopScale()
                    : handlePlayScale(scalePitches)
                }
              >
                {isPlayingScale
                  ? "Stop Playback"
                  : "Play & Trace on Fingerboard"}
              </Button>
            </Card>
          </div>
        )}

        {activeTab === "sayr" && (
          <SayrQaflaLab currentMaqam={currentMaqam} timbre={timbre} />
        )}

        {activeTab === "score" && (
          <ScoreViewer
            maqam={currentMaqam}
            activePitchIndex={activePitchIndex}
          />
        )}

        {activeTab === "tuning" && <TuningWheel24EDO timbre={timbre} />}

        {activeTab === "detector" && <JinsDetectorLab timbre={timbre} />}
      </main>

      {/* Footer Heritage & Credit */}
      <footer className="mt-12 border-t border-border/40 bg-card/40 py-6 text-center text-xs text-muted-foreground dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-arabic text-sm font-bold text-amber-400">
              مقام فلو
            </span>
            <span>
              • Foundations of Arabic Music Theory &amp; Violin Pedagogy (Levels
              1 &amp; 2)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span>Tone.js 24-EDO Microtonal Audio</span>
            <span>•</span>
            <span className="font-arabic font-medium text-amber-500/90">
              صُنِعَ بِسِحْرِك (8 Families)
            </span>
            <span>•</span>
            <span>MusicXML 4.0</span>
          </div>
        </div>
      </footer>

      {/* Tone.js Audio DSP Studio Modal */}
      {showAudioSettings && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/70 p-4 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-lg space-y-5 rounded-2xl border border-slate-700/80 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Settings2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-white">
                    Tone.js Audio DSP Engine
                    <Badge variant="secondary" className="text-[10px]">
                      v15.1
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Microtonal sound synthesis &amp; acoustic space simulation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAudioSettings(false)}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                title="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="space-y-4 text-xs">
              {/* Master Volume */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                    Master Volume
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {masterVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full cursor-pointer accent-amber-500"
                />
              </div>

              {/* Freeverb Reverb Wet */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">
                    Acoustic Chamber Reverb (Wet / Dry)
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {reverbWet}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={reverbWet}
                  onChange={(e) => handleReverbChange(Number(e.target.value))}
                  className="w-full cursor-pointer accent-amber-500"
                />
                <p className="text-[11px] text-muted-foreground">
                  Simulates sound reflections in historic Ottoman, Andalusian,
                  and court concert halls.
                </p>
              </div>

              {/* Reference Concert Pitch A4 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">
                    Concert Reference Pitch (A4 Tuning)
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {referenceA4} Hz
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { freq: 432, label: "432 Hz", desc: "Verdi / Acoustic" },
                    { freq: 440, label: "440 Hz", desc: "Modern ISO Standard" },
                    { freq: 442, label: "442 Hz", desc: "Concert Orchestral" },
                  ].map((item) => (
                    <button
                      key={item.freq}
                      onClick={() => handleA4Change(item.freq)}
                      className={`cursor-pointer rounded-xl border p-2 text-center transition ${
                        referenceA4 === item.freq
                          ? "border-amber-400 bg-amber-500/20 font-bold text-white"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="font-mono text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Timbre Model */}
              <div className="space-y-1.5">
                <span className="block font-semibold text-slate-300">
                  Instrument Acoustic Model
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTimbre("violin")}
                    className={`cursor-pointer rounded-xl border p-2 text-left transition ${
                      timbre === "violin"
                        ? "border-amber-400 bg-amber-500/20 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold">Violin (كمان)</div>
                    <div className="text-[10px] text-slate-400">
                      Bowed string + 5.2Hz LFO
                    </div>
                  </button>
                  <button
                    onClick={() => setTimbre("oud")}
                    className={`cursor-pointer rounded-xl border p-2 text-left transition ${
                      timbre === "oud"
                        ? "border-amber-400 bg-amber-500/20 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold">Oud (عود)</div>
                    <div className="text-[10px] text-slate-400">
                      Plucked lute + bowl body
                    </div>
                  </button>
                  <button
                    onClick={() => setTimbre("kanun")}
                    className={`cursor-pointer rounded-xl border p-2 text-left transition ${
                      timbre === "kanun"
                        ? "border-amber-400 bg-amber-500/20 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold">Kanun (قانون)</div>
                    <div className="text-[10px] text-slate-400">
                      Bright 78-string zither
                    </div>
                  </button>
                </div>
              </div>

              {/* Engine Specs Box */}
              <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Tone.js Audio Graph Active</span>
                </div>
                <p>
                  &bull; 24-EDO Quarter-Tone precision: exact mathematical
                  calculation via{" "}
                  <code className="text-amber-300">
                    f = A4 &times; 2^((qt - 114)/24)
                  </code>
                  .
                </p>
                <p>
                  &bull; Master brickwall limiter (-0.5 dB) prevents harmonic
                  clipping during dense polyphony or drone overlap.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Audition neutral third (D4 -> E𝄳4 -> A4)
                  const d4 = new ArabicPitch("D", "♮", 4)
                  const eHalfFlat4 = new ArabicPitch("E", "𝄳", 4)
                  const a4 = new ArabicPitch("A", "♮", 4)
                  MicrotonalAudioEngine.playPitch(d4, 0.4, timbre)
                  setTimeout(
                    () =>
                      MicrotonalAudioEngine.playPitch(eHalfFlat4, 0.4, timbre),
                    350
                  )
                  setTimeout(
                    () => MicrotonalAudioEngine.playPitch(a4, 0.6, timbre),
                    700
                  )
                }}
                className="gap-1.5"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Audition Tone (Dukah &bull; Sikah &bull; Husayni)
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAudioSettings(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
