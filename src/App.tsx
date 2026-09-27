import React, { useEffect, useState, useRef } from "react"
import { Maqam, MaqamatCatalogue } from "./theory/maqam"
import { ArabicPitch } from "./core/pitch"
import {
  MicrotonalAudioEngine,
  type TimbreType,
} from "./audio/microtonal-audio"
import { AudioTransport, type AudioTransportStatus } from "./audio/audio-transport"
import {
  getWorkspaceState,
  updateWorkspaceGlobal,
  parseNavigationFromUrl,
  syncNavigationToUrl,
  type ValidLab,
  VALID_LABS,
} from "./state/workspace-state"
import { PWAInstallButton } from "./components/PWAInstallButton"
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
import { SessionBar } from "./components/SessionBar"
import { AsyncFeedback } from "./components/AsyncFeedback"
import { useLanguage } from "./state/language"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Card } from "./components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./components/ui/dialog"
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
  CheckCircle2,
  GraduationCap,
  Square,
} from "lucide-react"

interface NavTabItem {
  id: ValidLab
  labelKey: Parameters<ReturnType<typeof useLanguage>["t"]>[0]
  icon: React.ComponentType<{ className?: string }>
}

const NAV_TABS: NavTabItem[] = [
  { id: "explorer", labelKey: "maqamFamilies", icon: Layers },
  { id: "transposition", labelKey: "transposition", icon: ArrowLeftRight },
  { id: "violin", labelKey: "violin", icon: Music },
  { id: "sayr", labelKey: "sayr", icon: Compass },
  { id: "score", labelKey: "notation", icon: FileMusic },
  { id: "tuning", labelKey: "tuning", icon: Sliders },
  { id: "detector", labelKey: "detector", icon: Sparkles },
  { id: "training", labelKey: "training", icon: GraduationCap },
]

export default function App() {
  const { language, setLanguage, t } = useLanguage()
  const allMaqamat = MaqamatCatalogue.getAllMaqamat()

  // Resolve initial state from URL parameters or stored workspace state
  const [initialNav] = useState(() => {
    const urlParams = parseNavigationFromUrl()
    const stored = getWorkspaceState()

    let resolvedLab: ValidLab = stored.global.activeLab
    if (urlParams.lab && VALID_LABS.includes(urlParams.lab)) {
      resolvedLab = urlParams.lab
    }

    let resolvedMaqamId = stored.global.selectedMaqamId
    if (urlParams.maqamId) {
      resolvedMaqamId = urlParams.maqamId
    }
    const baseId = resolvedMaqamId.split("-transposed-")[0]
    const initialMaqam = MaqamatCatalogue.findById(baseId) || MaqamatCatalogue.buildRast()

    return {
      lab: resolvedLab,
      maqam: initialMaqam,
      stored,
    }
  })

  const [currentMaqam, setCurrentMaqam] = useState<Maqam>(initialNav.maqam)
  const [maqamRevision, setMaqamRevision] = useState(0)
  const [activeTab, setActiveTab] = useState<ValidLab>(initialNav.lab)
  const [timbre, setTimbre] = useState<TimbreType>(initialNav.stored.global.timbre)
  const [isDroneActive, setIsDroneActive] = useState(false)
  const [isPlayingScale, setIsPlayingScale] = useState(false)
  const [activePitchIndex, setActivePitchIndex] = useState<number | null>(null)
  const [transportStatus, setTransportStatus] = useState<AudioTransportStatus>(
    () => AudioTransport.getStatus()
  )

  // Tone.js Audio DSP Studio Controls
  const [masterVolume, setMasterVolume] = useState<number>(initialNav.stored.global.audioSettings.masterVolume)
  const [reverbWet, setReverbWet] = useState<number>(initialNav.stored.global.audioSettings.reverbWet)
  const [referenceA4, setReferenceA4State] = useState<number>(initialNav.stored.global.audioSettings.referenceA4)
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false)

  const isPopNavigatingRef = useRef(false)

  const scalePitches = currentMaqam.getScale()
  const tonic = currentMaqam.getTonic()

  useEffect(() => {
    const unsubscribe = AudioTransport.subscribe(setTransportStatus)
    return () => {
      unsubscribe()
      AudioTransport.stopAll()
    }
  }, [])

  // Initialize engine with persisted settings and sync URL on mount
  useEffect(() => {
    MicrotonalAudioEngine.setMasterVolume(masterVolume / 100)
    MicrotonalAudioEngine.setReverbWet(reverbWet / 100)
    MicrotonalAudioEngine.setReferenceA4(referenceA4)
    syncNavigationToUrl(activeTab, currentMaqam.id, "replace")
  }, [])

  // Handle browser back/forward navigation without synchronization loops
  useEffect(() => {
    const handlePopState = () => {
      isPopNavigatingRef.current = true
      const { lab, maqamId } = parseNavigationFromUrl()
      if (lab && VALID_LABS.includes(lab) && lab !== activeTab) {
        AudioTransport.stopAll()
        setIsDroneActive(false)
        setIsPlayingScale(false)
        setActivePitchIndex(null)
        setActiveTab(lab)
        updateWorkspaceGlobal({ activeLab: lab })
      }
      if (maqamId && maqamId !== currentMaqam.id) {
        const baseId = maqamId.split("-transposed-")[0]
        const found = MaqamatCatalogue.findById(baseId)
        if (found) {
          AudioTransport.stopAll()
          setIsDroneActive(false)
          setIsPlayingScale(false)
          setActivePitchIndex(null)
          setCurrentMaqam(found)
          setMaqamRevision((revision) => revision + 1)
          updateWorkspaceGlobal({ selectedMaqamId: maqamId })
        }
      }
      setTimeout(() => {
        isPopNavigatingRef.current = false
      }, 50)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [activeTab, currentMaqam.id])

  const handleSelectTab = (tab: ValidLab) => {
    if (tab === activeTab) return
    AudioTransport.stopAll()
    setIsDroneActive(false)
    setIsPlayingScale(false)
    setActivePitchIndex(null)
    setActiveTab(tab)
    updateWorkspaceGlobal({ activeLab: tab })
    if (!isPopNavigatingRef.current) {
      syncNavigationToUrl(tab, currentMaqam.id, "push")
    }
  }

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const total = NAV_TABS.length
    let nextIndex: number
    if (e.key === (language === "ar" ? "ArrowLeft" : "ArrowRight")) {
      e.preventDefault()
      nextIndex = (index + 1) % total
    } else if (e.key === (language === "ar" ? "ArrowRight" : "ArrowLeft")) {
      e.preventDefault()
      nextIndex = (index - 1 + total) % total
    } else if (e.key === "Home") {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === "End") {
      e.preventDefault()
      nextIndex = total - 1
    } else {
      return
    }

    const nextTab = NAV_TABS[nextIndex]
    handleSelectTab(nextTab.id)
    const nextElem = document.getElementById(`tab-${nextTab.id}`)
    nextElem?.focus()
  }

  const handleTimbreChange = (t: TimbreType) => {
    setTimbre(t)
    updateWorkspaceGlobal({ timbre: t })
  }

  const handleVolumeChange = (val: number) => {
    setMasterVolume(val)
    MicrotonalAudioEngine.setMasterVolume(val / 100)
    updateWorkspaceGlobal({ audioSettings: { masterVolume: val, reverbWet, referenceA4 } })
  }

  const handleReverbChange = (val: number) => {
    setReverbWet(val)
    MicrotonalAudioEngine.setReverbWet(val / 100)
    updateWorkspaceGlobal({ audioSettings: { masterVolume, reverbWet: val, referenceA4 } })
  }

  const handleA4Change = (val: number) => {
    setReferenceA4State(val)
    MicrotonalAudioEngine.setReferenceA4(val)
    updateWorkspaceGlobal({ audioSettings: { masterVolume, reverbWet, referenceA4: val } })
  }

  const handleSelectMaqam = (m: Maqam) => {
    AudioTransport.stopAll()
    setIsDroneActive(false)
    setIsPlayingScale(false)
    setActivePitchIndex(null)
    setCurrentMaqam(m)
    setMaqamRevision((revision) => revision + 1)
    updateWorkspaceGlobal({ selectedMaqamId: m.id })
    if (!isPopNavigatingRef.current) {
      syncNavigationToUrl(activeTab, m.id, "push")
    }
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
      },
      undefined,
      "app-scale"
    )
  }

  const handleStopScale = () => {
    MicrotonalAudioEngine.stopSequence("app-scale")
    setIsPlayingScale(false)
    setActivePitchIndex(null)
  }

  const handleRecoverAudio = () => {
    void MicrotonalAudioEngine.startAudioContext().catch(() => {})
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Heritage Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 shadow-xs backdrop-blur-xl dark:bg-slate-950/90">
        <div className="mx-auto flex min-h-18 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:gap-4 sm:px-6 lg:px-8">
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
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <div className="relative">
              <select
                value={currentMaqam.id}
                onChange={(e) => {
                  const found = allMaqamat.find((m) => m.id === e.target.value)
                  if (found) handleSelectMaqam(found)
                }}
                aria-label={t("selectMaqam")}
                className="xs:max-w-[160px] max-w-28 cursor-pointer appearance-none truncate rounded-xl border border-border bg-muted/60 py-1.5 pe-7 ps-2.5 text-xs font-semibold text-foreground shadow-xs transition hover:border-amber-500/60 focus:ring-2 focus:ring-amber-500/40 focus:outline-none sm:max-w-none sm:py-2 dark:bg-slate-900"
                title={t("selectMaqam")}
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
              <ChevronDown className="pointer-events-none absolute top-1/2 inset-e-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
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
              aria-label={t("audioSettings")}
              className="gap-1.5 px-2.5 text-muted-foreground hover:text-foreground sm:px-3"
              title="Tone.js DSP Audio Settings"
            >
              <Settings2 className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden text-xs font-medium lg:inline">
                {t("audioDsp")}
              </span>
            </Button>

            {/* PWA Install & Offline Status */}
            <PWAInstallButton />

            {/* Theme Toggler (Light / Dark / Auto) */}
              <div className="flex items-center rounded-lg border border-border p-0.5" role="group" aria-label={t("language")}>
                <Button type="button" variant={language === "en" ? "secondary" : "ghost"} size="sm" aria-pressed={language === "en"} onClick={() => setLanguage("en")} className="h-7 px-2 text-[10px]">EN</Button>
                <Button type="button" variant={language === "ar" ? "secondary" : "ghost"} size="sm" aria-pressed={language === "ar"} onClick={() => setLanguage("ar")} className="h-7 px-2 font-arabic text-[10px]">عربي</Button>
              </div>
            <ThemeToggle />
          </div>
        </div>
        {/* Timbre Toggle (Violin / Oud / Kanun) */}
        <div className="mx-auto flex max-w-7xl border-t border-border/60 px-2 sm:px-6 lg:px-8">
          <div className="flex rounded-xl border border-border bg-muted/60 p-0.5 text-[11px] sm:p-1 sm:text-xs dark:bg-slate-900">
            <Button
              variant={timbre === "violin" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleTimbreChange("violin")}
              aria-pressed={timbre === "violin"}
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
              onClick={() => handleTimbreChange("oud")}
              aria-pressed={timbre === "oud"}

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
              onClick={() => handleTimbreChange("kanun")}
              aria-pressed={timbre === "kanun"}
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
            aria-pressed={isDroneActive}
            aria-label={isDroneActive ? t("droneOn") : t("drone")}
            className="gap-1.5 px-2.5 sm:px-3"
            title="Continuous Tonic Qarar Drone"
          >
            <Radio
              className={`h-3.5 w-3.5 ${isDroneActive ? "animate-pulse text-amber-400" : ""}`}
            />
            <span className="hidden md:inline">
              {isDroneActive ? t("droneOn") : t("drone")}
            </span>
          </Button>

          {/* Synchronized Visual Metronome */}
          <Metronome />
          <Badge
            variant={transportStatus.activeSessions.length > 0 ? "default" : "secondary"}
            role="status"
            aria-live="polite"
            title={transportStatus.activeSessions.map(({ activity }) => activity).join(", ") || (transportStatus.audioContextReady ? t("audioReady") : t("audioIdle"))}
            className="hidden sm:inline-flex"
          >
            {transportStatus.audioStarting
              ? t("audioStarting")
              : transportStatus.activeSessions.length > 0
                ? `${t("audioActive")}: ${transportStatus.activeSessions.length}`
                : transportStatus.audioContextReady
                  ? t("audioReady")
                  : t("audioIdle")}
          </Badge>
          {transportStatus.activeSessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              aria-label={`${t("stopAudio")} (${transportStatus.activeSessions.length})`}
              onClick={() => {
                AudioTransport.stopAll()
                setIsDroneActive(false)
                setIsPlayingScale(false)
                setActivePitchIndex(null)
              }}
              className="gap-1.5 px-2.5 sm:px-3"
              title="Stop all audio playback"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span className="hidden md:inline">
                {t("stopAudio")} ({transportStatus.activeSessions.length})
              </span>
            </Button>
          )}
        </div>
        {/* Studio Navigation Tabs (Responsive scrollable tablist with active semantics & keyboard navigation) */}
        <div className="mx-auto max-w-7xl border-t border-border/60 px-2 sm:px-6 lg:px-8">
          <nav
            role="tablist"
            aria-label={t("studioNavigation")}
            className="flex items-center gap-1 overflow-x-auto py-2.5 text-xs font-semibold scrollbar-none sm:gap-1.5 md:flex-wrap"
          >
            {NAV_TABS.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  onClick={() => handleSelectTab(tab.id)}
                  aria-label={t(tab.labelKey)}
                  title={t(tab.labelKey)}
                  className={`flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 whitespace-nowrap transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 active:scale-95 ${
                    isActive
                      ? "border border-amber-500/50 bg-amber-500/15 font-bold text-amber-500 shadow-xs dark:bg-amber-500/20 dark:text-amber-300"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="inline text-[11px] sm:text-xs">
                    {t(tab.labelKey)}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {transportStatus.audioStartupError && (
        <AsyncFeedback
          kind="error"
          title={t("audioStartupFailed")}
          action={{ label: transportStatus.audioStarting ? t("audioStarting") : t("retryAudio"), onClick: handleRecoverAudio, disabled: transportStatus.audioStarting }}
          className="mx-auto w-full max-w-7xl border-x-0 border-t-0 px-4 sm:px-6 lg:px-8"
        />
      )}
      <SessionBar
        maqam={currentMaqam}
        isDroneActive={isDroneActive}
        transportStatus={transportStatus}
        onNavigate={handleSelectTab}
      />

      {/* Main Studio Viewport */}
      <main
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8"
      >
        {activeTab === "training" && (
          <TrainingLab
            currentMaqam={currentMaqam}
            maqamRevision={maqamRevision}
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
          <SayrQaflaLab currentMaqam={currentMaqam} maqamRevision={maqamRevision} timbre={timbre} />
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
            مقامات عربية
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
      <Dialog open={showAudioSettings} onOpenChange={setShowAudioSettings}>
          <DialogContent className="relative flex! w-full max-w-lg flex-col space-y-5  rounded-2xl border border-slate-700/80 bg-slate-900 p-6 text-slate-100 shadow-2xl" showCloseButton>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Settings2 className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
                    {t("dspTitle")}
                    <Badge variant="secondary" className="text-[10px]">
                      v15.1
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    {t("dspDescription")}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 text-xs">
              {/* Master Volume */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="master-volume" className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                    {t("masterVolume")}
                  </label>
                  <span className="font-mono font-bold text-amber-300">
                    {masterVolume}%
                  </span>
                </div>
                <input
                  id="master-volume"
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
                  <label htmlFor="reverb-wet" className="font-semibold text-slate-300">
                    {t("chamberReverb")} ({t("wetDry")})
                  </label>
                  <span className="font-mono font-bold text-amber-300">
                    {reverbWet}%
                  </span>
                </div>
                <input
                  id="reverb-wet"
                  type="range"
                  min="0"
                  max="60"
                  value={reverbWet}
                  onChange={(e) => handleReverbChange(Number(e.target.value))}
                  className="w-full cursor-pointer accent-amber-500"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("reverbHelp")}
                </p>
              </div>

              {/* Reference Concert Pitch A4 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">
                    {t("concertPitch")}
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {referenceA4} Hz
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("concertPitch")}>
                  {[
                    { freq: 432, label: "432 Hz", desc: "Verdi / Acoustic" },
                    { freq: 440, label: "440 Hz", desc: "Modern ISO Standard" },
                    { freq: 442, label: "442 Hz", desc: "Concert Orchestral" },
                  ].map((item) => (
                    <button
                      key={item.freq}
                      onClick={() => handleA4Change(item.freq)}
                      aria-pressed={referenceA4 === item.freq}
                      aria-label={`Set reference pitch to ${item.label}, ${item.desc}`}
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
                  {t("instrumentModel")}
                </span>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("instrumentModel")}>
                  <button
                    onClick={() => handleTimbreChange("violin")}
                    aria-pressed={timbre === "violin"}
                    className={`cursor-pointer rounded-xl border p-2 text-left transition ${
                      timbre === "violin"
                        ? "border-amber-400 bg-amber-500/20 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold">{t("instrumentViolin")}</div>
                    <div className="text-[10px] text-slate-400">
                      Bowed string + 5.2Hz LFO
                    </div>
                  </button>
                  <button
                    onClick={() => handleTimbreChange("oud")}
                    aria-pressed={timbre === "oud"}
                    className={`cursor-pointer rounded-xl border p-2 text-left transition ${
                      timbre === "oud"
                        ? "border-amber-400 bg-amber-500/20 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold">{t("instrumentOud")}</div>
                    <div className="text-[10px] text-slate-400">
                      Plucked lute + bowl body
                    </div>
                  </button>
                  <button
                    onClick={() => handleTimbreChange("kanun")}
                    aria-pressed={timbre === "kanun"}
                    className={`cursor-pointer rounded-xl border p-2 text-left transition ${
                      timbre === "kanun"
                        ? "border-amber-400 bg-amber-500/20 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold">{t("instrumentKanun")}</div>
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
                  MicrotonalAudioEngine.playSequence(
                    [d4, eHalfFlat4, a4],
                    350,
                    timbre,
                    undefined,
                    undefined,
                    undefined,
                    "audio-settings-audition"
                  )
                }}
                className="gap-1.5"
              >
                <Volume2 className="h-3.5 w-3.5" />
                {t("auditionPhrase")}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAudioSettings(false)}
              >
                {t("done")}
              </Button>
            </div>
          </DialogContent>
      </Dialog>
    </div>
  )
}
