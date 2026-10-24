/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react"
import { Maqam, MaqamatCatalogue } from "./theory/maqam"
import { ArabicPitch } from "./core/pitch"
import { MicrotonalAudioEngine, TimbreType } from "./audio/microtonal-audio"
import { AudioTransport } from "./audio/audio-transport"
import { useIsMobile } from "./hooks/use-mobile"
import {
  ValidLab,
  deserializePitch,
  getWorkspaceState,
  serializePitch,
  updateWorkspaceDraft,
  updateWorkspaceGlobal,
} from "./state/workspace-state"
import { LanguageProvider, useLanguage } from "./state/language"
import { ThemeProvider } from "./components/theme-provider"

// UI & Components
import { MainMenu } from "./components/MainMenu"
import { SessionBar } from "./components/SessionBar"
import { MaqamExplorer } from "./components/MaqamExplorer"
import { ViolinTuningPreset } from "./components/ViolinFingerboard"
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
import { InstrumentStudio } from "./features/instruments/InstrumentStudio"
import { EarnPractice } from "./components/EarnPractice"
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
  GraduationCap,
} from "lucide-react"

function StudioContent() {
  const { language, setLanguage, t } = useLanguage()

  // State
  const [currentMaqam, setCurrentMaqam] = useState<Maqam>(() => {
    const workspace = getWorkspaceState()
    const savedId = workspace.global.selectedMaqamId
    const baseId = savedId.split("-transposed-")[0]
    const baseMaqam =
      MaqamatCatalogue.getById(baseId) ||
      MaqamatCatalogue.getById("rast") ||
      MaqamatCatalogue.getAll()[0]
    const savedTonic = deserializePitch(
      workspace.drafts.transposition.targetTonic
    )
    return savedId.includes("-transposed-") && savedTonic
      ? baseMaqam.transpose(savedTonic)
      : baseMaqam
  })
  const [activeLab, setActiveLab] = useState<ValidLab>(
    () => getWorkspaceState().global.activeLab
  )
  const [timbre, setTimbre] = useState<TimbreType>(
    () => getWorkspaceState().global.timbre
  )
  const [selectedInstrument, setSelectedInstrument] = useState<TimbreType>(
    () => getWorkspaceState().global.selectedInstrument
  )
  const [violinTuning, setViolinTuning] = useState<ViolinTuningPreset>(
    () => getWorkspaceState().drafts.violin.tuning
  )
  const [isDroneActive, setIsDroneActive] = useState<boolean>(false)
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(false)
  const [systemTuningMode, setSystemTuningMode] = useState<"24edo" | "12tet">(
    () => getWorkspaceState().global.systemTuningMode
  )

  // Modals & Drawers state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isFactsOpen, setIsFactsOpen] = useState(false)
  const [isSayrDialogOpen, setIsSayrDialogOpen] = useState(false)
  const [isModulationOpen, setIsModulationOpen] = useState(false)
  const [isJinsAnalysisDrawerOpen, setIsJinsAnalysisDrawerOpen] =
    useState(false)
  const isMobile = useIsMobile()
  // Audio Transport state
  const [transportStatus, setTransportStatus] = useState(() =>
    AudioTransport.getStatus()
  )

  useEffect(() => {
    updateWorkspaceGlobal({
      selectedMaqamId: currentMaqam.id,
      activeLab,
      timbre,
      selectedInstrument,
      systemTuningMode,
    })
    const isTransposed = currentMaqam.id.includes("-transposed-")
    updateWorkspaceDraft("transposition", {
      targetTonic: isTransposed
        ? serializePitch(currentMaqam.getTonic())
        : null,
    })
  }, [activeLab, currentMaqam, selectedInstrument, systemTuningMode, timbre])

  useEffect(() => {
    updateWorkspaceDraft("violin", { tuning: violinTuning })
  }, [violinTuning])

  const handleSelectInstrument = useCallback((instrument: TimbreType) => {
    setSelectedInstrument(instrument)
    setTimbre(instrument)
  }, [])

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
      arabic: "زخرفة الأجناس",
      icon: Package,
    },
    {
      id: "instrument",
      label: "Instrument Studio",
      arabic: "استوديو الآلات",
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
      arabic: "النظرية وزخرفة الأجناس",
      icon: BookOpen,
    },
    {
      id: "earn-practice",
      label: "Earn Practice",
      arabic: "تدريب المقامات",
      icon: GraduationCap,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-amber-500/30">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 px-3 py-2 backdrop-blur-md sm:px-6 sm:py-2.5">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {/* Brand & Menu */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <MainMenu
              activeLab={activeLab}
              onNavigateLab={setActiveLab}
              violinTuning={violinTuning}
              onViolinTuningChange={setViolinTuning}
              timbre={timbre}
              onTimbreChange={handleSelectInstrument}
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
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-tr from-amber-600 to-amber-400 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 sm:h-8 sm:w-8 sm:rounded-xl sm:text-sm">
                م
              </div>
              <div className="min-w-0">
                <h1 className="flex items-center gap-1.5 truncate text-xs font-bold tracking-tight text-foreground sm:text-base">
                  <span>{t("brandName")}</span>
                  <span className="hidden text-xs font-normal text-amber-400/90 md:inline">
                    {t("brandTagline")}
                  </span>
                </h1>
                <p className="hidden truncate text-[10px] text-slate-400 sm:block">
                  {t("brandDescription")}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Controls & Tools - Responsive */}
          <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:w-auto sm:flex-nowrap sm:gap-2">
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
                  ? `${t("stopAudio")} · ${t("drone")}`
                  : `${t("drone")} · ${currentMaqam.getTonic().toString()}`
              }
            >
              <Radio
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isDroneActive ? "text-slate-950" : "text-amber-400"}`}
              />
              <span className="xs:inline hidden">{t("drone")}:</span>
              <span className="font-mono font-bold">
                {currentMaqam.getTonic().toString()}
              </span>
            </Button>

            {/* Timbre Switcher (large screens) */}
            <div className="hidden items-center rounded-xl border border-slate-800 bg-slate-900 p-0.5 text-xs lg:flex">
              {(["violin", "oud"] as TimbreType[]).map((tVal) => (
                <button
                  key={tVal}
                  onClick={() => handleSelectInstrument(tVal)}
                  className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-all ${
                    timbre === tVal
                      ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tVal === "violin"
                    ? t("instrumentViolin")
                    : t("instrumentOud")}
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
              title={t("language")}
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
      <div className="relative border-b border-border/80 bg-muted/60">
        {/* Subtle mobile edge fade indicators */}
        {isMobile && (
          <>
            <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-3 bg-linear-to-r from-background/80 to-transparent" />
            <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-3 bg-linear-to-l from-background/80 to-transparent" />
          </>
        )}

        <nav
          className="touch-pan-x scrollbar-none overflow-x-auto scroll-smooth px-2.5 sm:px-6"
          aria-label="Studio labs tabs"
        >
          <div className="mx-auto flex max-w-7xl min-w-max items-center justify-start gap-1 py-2 sm:justify-center sm:gap-2 sm:py-2.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeLab === tab.id
              const primaryLabel = language === "ar" ? tab.arabic : tab.label
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveLab(tab.id)}
                  className={`flex min-h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-all select-none sm:min-w-0 sm:justify-start sm:px-3.5 sm:py-2 sm:text-xs ${
                    isActive
                      ? "bg-amber-500 font-bold text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 active:scale-95"
                  }`}
                  title={primaryLabel}
                  aria-label={primaryLabel}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-slate-950" : "text-amber-400"}`}
                  />
                  {!isMobile && (
                    <span
                      className={language === "ar" ? "font-arabic text-xs" : ""}
                    >
                      {primaryLabel}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main Workspace Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-3 sm:p-6 lg:p-8">
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

        {activeLab === "instrument" && (
          <InstrumentStudio
            currentMaqam={currentMaqam}
            instrument={selectedInstrument}
            onInstrumentChange={handleSelectInstrument}
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

        {activeLab === "earn-practice" && <EarnPractice timbre={timbre} />}
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
      <footer className="border-t border-border/80 bg-background px-6 py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
          <span>
            {t("instrumentStudioFooter")} -{" "}
            {language === "en"
              ? "Implemented and organized by Faris Alhodlai"
              : "تم التجميع بواسطة فارس الهذلي"}
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
