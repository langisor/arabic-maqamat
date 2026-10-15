/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react"
import { Maqam, MaqamatCatalogue } from "./theory/maqam"
import { ArabicPitch } from "./core/pitch"
import { MicrotonalAudioEngine, TimbreType } from "./audio/microtonal-audio"
import { AudioTransport } from "./audio/audio-transport"
import { ValidLab } from "./state/workspace-state"
import { LanguageProvider, useLanguage } from "./state/language"
import { ThemeProvider } from "./components/theme-provider"

// UI & Components
import { MainMenu } from "./components/MainMenu"
import { SessionBar } from "./components/SessionBar"
import { MaqamExplorer } from "./components/MaqamExplorer"
import {
  ViolinFingerboard,
  ViolinTuningPreset,
} from "./components/ViolinFingerboard"
import { SayrQaflaLab } from "./components/SayrQaflaLab"
import { MaqamNetworkGraph } from "./components/MaqamNetworkGraph"
import { MicrotonalPitchTracker } from "./components/MicrotonalPitchTracker"
import { Metronome } from "./components/Metronome"
import { MaqamFacts } from "./components/MaqamFacts"
import { MaqamBuilderDrawer } from "./components/MaqamBuilderDrawer"
import { MaqamFactsDrawer } from "./components/MaqamFactsDrawer"
import { SayrVisualizationDialog } from "./components/SayrVisualizationDialog"
import { ModulationPathwaysDrawer } from "./components/ModulationPathwaysDrawer"
import { JinsAnalysisTool } from "./components/JinsAnalysisTool"
import { JinsAnalysisDrawer } from "./components/JinsAnalysisDrawer"
import { ThemeToggle } from "./components/ThemeToggle"
import { PWAInstallButton } from "./components/PWAInstallButton"
import { Button } from "./components/ui/button"

// Icons
import {
  Layers,
  Music,
  Compass,
  Network,
  Mic,
  BookOpen,
  GitFork,
  Package,
  Radio,
} from "lucide-react"

function StudioContent() {
  const { language, setLanguage } = useLanguage()

  // State
  const [currentMaqam, setCurrentMaqam] = useState<Maqam>(() => {
    return MaqamatCatalogue.getById("rast") || MaqamatCatalogue.getAll()[0]
  })
  const [activeLab, setActiveLab] = useState<ValidLab>("explorer")
  const [timbre, setTimbre] = useState<TimbreType>("violin")
  const [violinTuning, setViolinTuning] = useState<ViolinTuningPreset>("arabic")
  const [isDroneActive, setIsDroneActive] = useState<boolean>(false)
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(false)
  const [systemTuningMode, setSystemTuningMode] = useState<"24edo" | "12tet">(
    "24edo"
  )

  // Modals & Drawers state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isFactsOpen, setIsFactsOpen] = useState(false)
  const [isSayrDialogOpen, setIsSayrDialogOpen] = useState(false)
  const [isModulationOpen, setIsModulationOpen] = useState(false)
  const [isJinsAnalysisDrawerOpen, setIsJinsAnalysisDrawerOpen] =
    useState(false)

  // Audio Transport state
  const [transportStatus, setTransportStatus] = useState(() =>
    AudioTransport.getStatus()
  )

  useEffect(() => {
    const unsubscribe = AudioTransport.subscribe((status) => {
      setTransportStatus(status)
    })
    return () => unsubscribe()
  }, [])

  // Drone Toggle
  const handleToggleDrone = useCallback(
    async (pitch?: ArabicPitch) => {
      const dronePitch = pitch || currentMaqam.getTonic()
      if (isDroneActive) {
        MicrotonalAudioEngine.toggleDrone(dronePitch, false)
        setIsDroneActive(false)
      } else {
        MicrotonalAudioEngine.toggleDrone(dronePitch, true)
        setIsDroneActive(true)
      }
    },
    [currentMaqam, isDroneActive]
  )

  // Play Full Scale Sequence
  const handlePlayScale = useCallback(
    async (pitches: ArabicPitch[]) => {
      setIsPlayingScale(true)
      try {
        MicrotonalAudioEngine.playSequence(
          pitches,
          450,
          timbre,
          undefined,
          () => {
            setIsPlayingScale(false)
          },
          undefined,
          "scale"
        )
      } catch {
        setIsPlayingScale(false)
      }
    },
    [timbre]
  )

  const handleStopScale = useCallback(() => {
    MicrotonalAudioEngine.stopSequence("scale")
    setIsPlayingScale(false)
  }, [])

  // Select a Maqam
  const handleSelectMaqam = useCallback(
    (maqam: Maqam) => {
      setCurrentMaqam(maqam)
      // If drone was active, re-pitch drone to the new maqam tonic
      if (isDroneActive) {
        MicrotonalAudioEngine.toggleDrone(currentMaqam.getTonic(), false)
        MicrotonalAudioEngine.toggleDrone(maqam.getTonic(), true)
      }
    },
    [isDroneActive, currentMaqam]
  )

  // Select a Maqam Family from the drop list
  const handleSelectFamily = useCallback(
    (familyKey: string) => {
      const target = MaqamatCatalogue.getRepresentativeMaqamForFamily(familyKey)
      if (target) {
        handleSelectMaqam(target)
      }
    },
    [handleSelectMaqam]
  )

  // Navigation tabs
  const navTabs: {
    id: ValidLab
    label: string
    arabic: string
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    {
      id: "explorer",
      label: "Maqam Explorer",
      arabic: "مستكشف المقامات",
      icon: Layers,
    },
    {
      id: "jins-analysis",
      label: "Jins Analysis",
      arabic: "أمتعة الأجناس",
      icon: Package,
    },
    {
      id: "violin",
      label: "Violin Studio",
      arabic: "لوحة أصابع الكمان",
      icon: Music,
    },
    {
      id: "sayr",
      label: "Sayr & Qafla Lab",
      arabic: "السير والقفلات",
      icon: Compass,
    },
    {
      id: "detector",
      label: "Network Pathways",
      arabic: "شبكة المقامات والمسارات",
      icon: Network,
    },
    {
      id: "tuning",
      label: "Microtonal Tuner",
      arabic: "الدوزان والترددات",
      icon: Mic,
    },
    {
      id: "training",
      label: "Theory & Baggage",
      arabic: "النظرية وأمتعة الأجناس",
      icon: BookOpen,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100 selection:bg-amber-500/30">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Brand & Menu */}
          <div className="flex items-center gap-3">
            <MainMenu
              activeLab={activeLab}
              onNavigateLab={setActiveLab}
              violinTuning={violinTuning}
              onViolinTuningChange={setViolinTuning}
              timbre={timbre}
              onTimbreChange={setTimbre}
              isDroneActive={isDroneActive}
              onToggleDrone={() => handleToggleDrone()}
              onOpenMaqamBuilder={() => setIsBuilderOpen(true)}
              onOpenMaqamFacts={() => setIsFactsOpen(true)}
              onOpenSayrVisualization={() => setIsSayrDialogOpen(true)}
              onOpenModulationPathways={() => setIsModulationOpen(true)}
              onOpenJinsAnalysis={() => setIsJinsAnalysisDrawerOpen(true)}
              onOpenAudioSettings={() => {}}
              systemTuningMode={systemTuningMode}
              onSystemTuningChange={setSystemTuningMode}
            />

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 sm:h-8 sm:w-8 sm:rounded-xl sm:text-sm">
                م
              </div>
              <div className="min-w-0">
                <h1 className="flex items-center gap-1.5 truncate text-xs font-bold tracking-tight text-white sm:text-base">
                  <span>Arabic Maqamat</span>
                  <span className="font-arabic hidden text-xs font-normal text-amber-400/90 md:inline">
                    الاستوديو المقامي الشامل
                  </span>
                </h1>
                <p className="hidden truncate text-[10px] text-slate-400 sm:block">
                  24-EDO Microtonal Theory • Jins Baggage • Network Pathways
                </p>
              </div>
            </div>
          </div>

          {/* Quick Controls & Tools - Responsive */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">


            {/* Drone Toggle Button */}
            <Button
              variant={isDroneActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggleDrone()}
              className={`h-7 cursor-pointer gap-1 rounded-xl px-2 text-[11px] transition-all sm:h-8 sm:gap-1.5 sm:px-2.5 sm:text-xs ${
                isDroneActive
                  ? "animate-pulse bg-amber-500 font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400"
                  : "border-slate-700 text-slate-300 hover:border-slate-600"
              }`}
              title={
                isDroneActive
                  ? "Stop drone on tonic"
                  : `Start tonic drone (${currentMaqam.getTonic().toString()})`
              }
            >
              <Radio
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isDroneActive ? "text-slate-950" : "text-amber-400"}`}
              />
              <span className="xs:inline hidden">Drone:</span>
              <span className="font-mono font-bold">
                {currentMaqam.getTonic().toString()}
              </span>
            </Button>

            {/* Timbre Switcher (large screens) */}
            <div className="hidden items-center rounded-xl border border-slate-800 bg-slate-900 p-0.5 text-xs lg:flex">
              {(["violin", "oud", "kanun"] as TimbreType[]).map((tVal) => (
                <button
                  key={tVal}
                  onClick={() => setTimbre(tVal)}
                  className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-all ${
                    timbre === tVal
                      ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tVal}
                </button>
              ))}
            </div>

            {/* Metronome Popover */}
            <Metronome />

            {/* PWA Install */}
            <PWAInstallButton />

            {/* Theme & Language */}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="h-7 px-1.5 text-[11px] text-slate-400 hover:text-white sm:h-8 sm:px-2 sm:text-xs"
              title="Toggle English / العربية"
            >
              {language === "en" ? "عربي" : "EN"}
            </Button>
          </div>
        </div>
      </header>

      {/* Session Status Ribbon */}
      <SessionBar
        maqam={currentMaqam}
        isDroneActive={isDroneActive}
        transportStatus={transportStatus}
        onNavigate={setActiveLab}
        onSelectFamily={handleSelectFamily}
        onSelectMaqam={handleSelectMaqam}
      />

      {/* Navigation Sub-header / Main Tabs Switcher - Responsive with Touch Momentum */}
      <div className="relative border-b border-slate-800/80 bg-slate-900/60">
        {/* Subtle mobile edge fade indicators */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-3 bg-gradient-to-r from-slate-950/80 to-transparent sm:hidden" />
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-3 bg-gradient-to-l from-slate-950/80 to-transparent sm:hidden" />

        <nav
          className="touch-pan-x scrollbar-none overflow-x-auto scroll-smooth px-2.5 sm:px-6"
          aria-label="Studio labs tabs"
        >
          <div className="mx-auto flex max-w-7xl min-w-max items-center justify-start gap-1.5 py-2 sm:justify-center sm:gap-2 sm:py-2.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeLab === tab.id
              const primaryLabel = language === "ar" ? tab.arabic : tab.label
              const secondaryLabel = language === "ar" ? tab.label : tab.arabic
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveLab(tab.id)}
                  className={`flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all select-none sm:gap-2 sm:px-3.5 sm:py-2 sm:text-xs ${
                    isActive
                      ? "bg-amber-500 font-bold text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 active:scale-95"
                  }`}
                  title={`${tab.label} (${tab.arabic})`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-slate-950" : "text-amber-400"}`}
                  />
                  <span
                    className={language === "ar" ? "font-arabic text-xs" : ""}
                  >
                    {primaryLabel}
                  </span>
                  <span
                    className={`font-arabic hidden text-[10px] lg:inline ${isActive ? "text-slate-900/80" : "text-slate-500"}`}
                  >
                    {secondaryLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main Workspace Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
        {activeLab === "explorer" && (
          <MaqamExplorer
            currentMaqam={currentMaqam}
            onSelectMaqam={handleSelectMaqam}
            timbre={timbre}
            isPlayingScale={isPlayingScale}
            onPlayScale={handlePlayScale}
            onStopScale={handleStopScale}
            isDroneActive={isDroneActive}
            onToggleDrone={handleToggleDrone}
            onOpenMaqamFacts={() => setIsFactsOpen(true)}
            onOpenMaqamBuilder={() => setIsBuilderOpen(true)}
            onOpenSayrVisualization={() => setIsSayrDialogOpen(true)}
            onOpenModulationPathways={() => setIsModulationOpen(true)}
            onOpenJinsAnalysis={() => setIsJinsAnalysisDrawerOpen(true)}
          />
        )}

        {activeLab === "jins-analysis" && (
          <JinsAnalysisTool
            initialJinsId={currentMaqam.lowerJins.definition.id}
            initialRoot={currentMaqam.getTonic()}
            timbre={timbre}
            onTimbreChange={setTimbre}
          />
        )}

        {activeLab === "violin" && (
          <ViolinFingerboard
            currentMaqam={currentMaqam}
            timbre={timbre}
            tuning={violinTuning}
            onTuningChange={setViolinTuning}
          />
        )}

        {activeLab === "sayr" && (
          <SayrQaflaLab
            currentMaqam={currentMaqam}
            timbre={timbre}
            onOpenModulationPathways={() => setIsModulationOpen(true)}
            onSelectMaqam={handleSelectMaqam}
          />
        )}

        {activeLab === "detector" && (
          <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Network className="h-5 w-5 text-amber-400" />
                  Maqam Network Explorer (Sami Abu Shumays Model)
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Maqamat structured as small-world networks of ajnas with
                  three-tier modulation pathways &amp; transition probabilities
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModulationOpen(true)}
                  className="border-amber-500/40 text-xs text-amber-300 hover:bg-amber-500/10"
                >
                  <GitFork className="mr-1 h-3.5 w-3.5 text-amber-400" />
                  Modulation Drawer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSayrDialogOpen(true)}
                  className="border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  <Compass className="mr-1 h-3.5 w-3.5 text-emerald-400" />
                  Sayr Visualizer
                </Button>
              </div>
            </div>

            <MaqamNetworkGraph maqam={currentMaqam} timbre={timbre} />
          </div>
        )}

        {activeLab === "tuning" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <Mic className="h-5 w-5 text-amber-400" />
                24-EDO Real-Time Microtonal Pitch Tracker
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Sing or play your violin into the microphone to measure
                quarter-tone intonation against Maqam {currentMaqam.name}
              </p>
            </div>
            <MicrotonalPitchTracker
              currentMaqam={currentMaqam}
              timbre={timbre}
            />
          </div>
        )}

        {activeLab === "training" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <BookOpen className="h-5 w-5 text-amber-400" />
                Maqamat Theory &amp; Jins Baggage Compendium
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Theoretical foundations grounded in Sami Abu Shumays&apos;
                &quot;Maqam Analysis: A Primer&quot;
              </p>
            </div>
            <MaqamFacts />
          </div>
        )}
      </main>

      {/* Global Interactive Drawers */}
      <MaqamBuilderDrawer
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        onSelectMaqam={handleSelectMaqam}
        timbre={timbre}
      />

      <MaqamFactsDrawer
        open={isFactsOpen}
        onOpenChange={setIsFactsOpen}
        timbre={timbre}
        currentMaqam={currentMaqam}
        onSelectMaqam={handleSelectMaqam}
      />

      <SayrVisualizationDialog
        open={isSayrDialogOpen}
        onOpenChange={setIsSayrDialogOpen}
        maqam={currentMaqam}
        timbre={timbre}
      />

      <ModulationPathwaysDrawer
        open={isModulationOpen}
        onOpenChange={setIsModulationOpen}
        currentMaqam={currentMaqam}
        timbre={timbre}
        onSelectMaqam={handleSelectMaqam}
      />

      <JinsAnalysisDrawer
        open={isJinsAnalysisDrawerOpen}
        onOpenChange={setIsJinsAnalysisDrawerOpen}
        timbre={timbre}
        onTimbreChange={setTimbre}
        initialJinsId={currentMaqam.lowerJins.definition.id}
        initialRoot={currentMaqam.getTonic()}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
          <span>
            Arabic Maqamat &amp; 24-EDO Microtonal Violin Studio • Grounded in
            Sami Abu Shumays&apos; theoretical research
          </span>
          <span className="font-arabic text-amber-500/80">
            صنع بسحرك — راست · بياتي · سيكاه · حجاز · نهاوند · كرد · عجم · صبا
          </span>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="arabic-maqamat-theme">
      <LanguageProvider>
        <StudioContent />
      </LanguageProvider>
    </ThemeProvider>
  )
}
