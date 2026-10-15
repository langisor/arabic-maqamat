// src/components/MainMenu.tsx
import React, { useState } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Menu,
  X,
  Music,
  Layers,
  ArrowLeftRight,
  Compass,
  FileMusic,
  Sliders,
  Sparkles,
  GraduationCap,
  Wand2,
  BookOpen,
  Settings2,
  Radio,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Globe,
  GitFork,
  Package,
} from "lucide-react"
import { ValidLab } from "../state/workspace-state"
import { ViolinTuningPreset } from "./ViolinFingerboard"
import { TimbreType } from "../audio/microtonal-audio"
import { useLanguage } from "../state/language"

interface MainMenuProps {
  activeLab: ValidLab
  onNavigateLab: (lab: ValidLab) => void
  violinTuning: ViolinTuningPreset
  onViolinTuningChange: (tuning: ViolinTuningPreset) => void
  timbre: TimbreType
  onTimbreChange: (timbre: TimbreType) => void
  isDroneActive: boolean
  onToggleDrone: () => void
  onOpenMaqamBuilder: () => void
  onOpenMaqamFacts: () => void
  onOpenSayrVisualization?: () => void
  onOpenModulationPathways?: () => void
  onOpenJinsAnalysis?: () => void
  onOpenAudioSettings: () => void
  systemTuningMode?: "24edo" | "12tet"
  onSystemTuningChange?: (mode: "24edo" | "12tet") => void
}

export const MainMenu: React.FC<MainMenuProps> = ({
  activeLab,
  onNavigateLab,
  violinTuning,
  onViolinTuningChange,
  timbre,
  onTimbreChange,
  isDroneActive,
  onToggleDrone,
  onOpenMaqamBuilder,
  onOpenMaqamFacts,
  onOpenSayrVisualization,
  onOpenModulationPathways,
  onOpenJinsAnalysis,
  onOpenAudioSettings,
  systemTuningMode = "24edo",
  onSystemTuningChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage } = useLanguage()

  const labsList: {
    id: ValidLab
    title: string
    arabic: string
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    {
      id: "explorer",
      title: "Maqam Families Explorer",
      arabic: "مستكشف المقامات والعائلات",
      icon: Layers,
    },
    {
      id: "transposition",
      title: "Transposition Lab (Tasweer)",
      arabic: "مختبر التصوير الموسيقي",
      icon: ArrowLeftRight,
    },
    {
      id: "violin",
      title: "Violin Fingerboard Studio",
      arabic: "لوحة أصابع الكمان",
      icon: Music,
    },
    {
      id: "oud",
      title: "Oud Studio",
      arabic: "استوديو العود",
      icon: Music,
    },
    {
      id: "sayr",
      title: "Sayr & Qafla Lab",
      arabic: "مختبر السير والقفلة",
      icon: Compass,
    },
    {
      id: "score",
      title: "Interactive Score & MusicXML",
      arabic: "النوتة والتدوين الموسيقي",
      icon: FileMusic,
    },
    {
      id: "tuning",
      title: "24-EDO Tuning Wheel & Tracker",
      arabic: "دوزان ٢٤ ربع صوت",
      icon: Sliders,
    },
    {
      id: "jins-analysis",
      title: "Jins Analysis Tool (Baggage)",
      arabic: "تحليل الأجناس وأمتعة النغم",
      icon: Package,
    },
    {
      id: "detector",
      title: "Jins Classifier",
      arabic: "محلل الأجناس الموسيقية",
      icon: Sparkles,
    },
    {
      id: "training",
      title: "Training Lab & Pedagogy Drills",
      arabic: "مختبر التدريب والتمرين",
      icon: GraduationCap,
    },
  ]

  const handleLabSelect = (lab: ValidLab) => {
    onNavigateLab(lab)
    setIsOpen(false)
  }

  const handleAction = (action: () => void) => {
    setIsOpen(false)
    action()
  }

  return (
    <>
      {/* Header Menu Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label="Open Studio Main Menu"
        className="border-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 text-slate-300 hover:bg-slate-800/80 hover:text-white sm:px-3"
        title="Main Menu & Tools"
      >
        <Menu className="h-4 w-4 text-amber-400" />
        <span className="hidden text-xs font-semibold sm:inline">Menu</span>
        <span
          className="font-arabic hidden text-[11px] text-amber-400/90 lg:inline"
          dir="rtl"
        >
          القائمة
        </span>
      </Button>

      {/* Slide-out Menu Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side={language === "ar" ? "right" : "left"}
          className="flex max-h-dvh w-[min(30rem,92vw)] max-w-none scrollbar-thin flex-col justify-between overflow-y-auto border-r border-slate-800 bg-slate-950 p-0 text-slate-100 shadow-2xl"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-amber-600 to-amber-400 p-0.5 shadow-md shadow-amber-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                  <Music className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div>
                <SheetTitle className="flex items-center gap-2 text-base font-bold text-white">
                  <span>Arabic Maqamat Studio</span>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    v2.6
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-400">
                  Main Navigation, Tools, Networks &amp; Tuning Presets
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 cursor-pointer p-0 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu Sections Body */}
          <div className="flex-1 space-y-6 p-5">
            {/* Quick Drawers & Modals Actions */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                Creative Tools &amp; Drawers
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {/* Maqam Builder Drawer Button */}
                <button
                  type="button"
                  onClick={() => handleAction(onOpenMaqamBuilder)}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-amber-500/40 bg-linear-to-r from-amber-950/40 to-slate-900 p-3 text-left transition-all hover:border-amber-400 hover:shadow-md"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 transition-transform group-hover:scale-110">
                    <Wand2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-200">
                      Maqam Builder
                    </div>
                    <div className="font-arabic text-[10px] text-slate-400">
                      معمارية المقامات
                    </div>
                  </div>
                </button>

                {/* Maqam Facts Drawer Button */}
                <button
                  type="button"
                  onClick={() => handleAction(onOpenMaqamFacts)}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-indigo-500/40 bg-linear-to-r from-indigo-950/40 to-slate-900 p-3 text-left transition-all hover:border-indigo-400 hover:shadow-md"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 transition-transform group-hover:scale-110">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-200">
                      Maqam Facts &amp; Theory
                    </div>
                    <div className="font-arabic text-[10px] text-slate-400">
                      حقائق ونظرية المقامات
                    </div>
                  </div>
                </button>

                {/* Sayr Visualization Dialog Button */}
                {onOpenSayrVisualization && (
                  <button
                    type="button"
                    onClick={() => handleAction(onOpenSayrVisualization)}
                    className="group flex cursor-pointer items-center gap-3 rounded-xl border border-sky-500/40 bg-linear-to-r from-sky-950/40 to-slate-900 p-3 text-left transition-all hover:border-sky-400 hover:shadow-md"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 transition-transform group-hover:scale-110">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-sky-200">
                        Sayr Trajectory
                      </div>
                      <div className="font-arabic text-[10px] text-slate-400">
                        المسار اللحني والسير
                      </div>
                    </div>
                  </button>
                )}

                {/* Modulation Pathway Tool Button */}
                {onOpenModulationPathways && (
                  <button
                    type="button"
                    onClick={() => handleAction(onOpenModulationPathways)}
                    className="group flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-500/40 bg-linear-to-r from-emerald-950/40 to-slate-900 p-3 text-left transition-all hover:border-emerald-400 hover:shadow-md"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 transition-transform group-hover:scale-110">
                      <GitFork className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-200">
                        Modulation Pathways
                      </div>
                      <div className="font-arabic text-[10px] text-slate-400">
                        مسارات التحويل والانتقال
                      </div>
                    </div>
                  </button>
                )}

                {/* Jins Analysis Tool Button */}
                {onOpenJinsAnalysis && (
                  <button
                    type="button"
                    onClick={() => handleAction(onOpenJinsAnalysis)}
                    className="group flex cursor-pointer items-center gap-3 rounded-xl border border-purple-500/40 bg-linear-to-r from-purple-950/40 to-slate-900 p-3 text-left transition-all hover:border-purple-400 hover:shadow-md"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 transition-transform group-hover:scale-110">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-200">
                        Jins Baggage Sidebar
                      </div>
                      <div className="font-arabic text-[10px] text-slate-400">
                        أمتعة الأجناس والنوتة الموسيقية
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Western & Arabic Tuning Presets */}
            <div className="space-y-3.5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                  <span>Violin Tuning Presets (دوزان الكمان)</span>
                </span>
                <Badge
                  variant="outline"
                  className={
                    violinTuning === "western"
                      ? "border-indigo-500/60 font-mono text-[10px] text-indigo-300"
                      : "border-amber-500/60 font-mono text-[10px] text-amber-300"
                  }
                >
                  {violinTuning === "western"
                    ? "Western (G-D-A-E)"
                    : "Arabic (G-D-G-D)"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onViolinTuningChange("arabic")}
                  className={`cursor-pointer rounded-xl border p-2.5 text-left transition-all ${
                    violinTuning === "arabic"
                      ? "border-amber-500 bg-amber-950/50 text-amber-200 shadow-sm"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Arabic Tuning</span>
                    {violinTuning === "arabic" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-amber-300/90">
                    G3 · D4 · G4 · D5
                  </div>
                  <div className="font-arabic mt-1 text-[9px] text-slate-400">
                    يكاه - دوكاه - نوى - محير
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onViolinTuningChange("western")}
                  className={`cursor-pointer rounded-xl border p-2.5 text-left transition-all ${
                    violinTuning === "western"
                      ? "border-indigo-500 bg-indigo-950/50 text-indigo-200 shadow-sm"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Western Tuning</span>
                    {violinTuning === "western" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-indigo-300/90">
                    G3 · D4 · A4 · E5
                  </div>
                  <div className="font-arabic mt-1 text-[9px] text-slate-400">
                    صل - ري - لا - مي
                  </div>
                </button>
              </div>

              {onSystemTuningChange && (
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                  <span className="font-medium text-slate-300">
                    Tuning System:
                  </span>
                  <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => onSystemTuningChange("24edo")}
                      className={`cursor-pointer rounded-md px-2 py-1 transition-all ${
                        systemTuningMode === "24edo"
                          ? "bg-amber-500 font-bold text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      24-EDO (Quarter-Tones)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSystemTuningChange("12tet")}
                      className={`cursor-pointer rounded-md px-2 py-1 transition-all ${
                        systemTuningMode === "12tet"
                          ? "bg-indigo-500 font-bold text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      12-TET (Western Only)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Studio Navigation Labs List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Studio Labs &amp; Modules
              </span>
              <div className="space-y-1">
                {labsList.map((lab) => {
                  const Icon = lab.icon
                  const isActive = activeLab === lab.id
                  return (
                    <button
                      key={lab.id}
                      type="button"
                      onClick={() => handleLabSelect(lab.id)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
                        isActive
                          ? "border border-amber-500/60 bg-amber-500/15 font-bold text-amber-300 shadow-xs"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`}
                        />
                        <div>
                          <div className="text-xs">{lab.title}</div>
                          <div className="text-muted-foreground font-arabic text-[10px]">
                            {lab.arabic}
                          </div>
                        </div>
                      </div>
                      {isActive ? (
                        <Badge
                          variant="default"
                          className="bg-amber-500 text-[9px] font-bold text-slate-950"
                        >
                          Active
                        </Badge>
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Audio Settings & Preferences Shortcuts */}
            <div className="space-y-2 border-t border-slate-800 pt-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Audio DSP &amp; Instrument Timbre
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(onOpenAudioSettings)}
                  className="flex-1 cursor-pointer gap-1.5 border-slate-700 bg-slate-900 text-xs text-slate-200 hover:text-white"
                >
                  <Settings2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Tone.js DSP Audio Settings</span>
                </Button>
                <Button
                  variant={isDroneActive ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleDrone}
                  className="cursor-pointer gap-1.5 border-slate-700 text-xs"
                >
                  <Radio
                    className={`h-3.5 w-3.5 ${isDroneActive ? "animate-pulse text-amber-300" : ""}`}
                  />
                  <span>{isDroneActive ? "Drone On" : "Tonic Drone"}</span>
                </Button>
              </div>

              {/* Timbre Switcher */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-400">Instrument Model:</span>
                <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
                  {(["violin", "oud", "kanun"] as TimbreType[]).map((tVal) => (
                    <button
                      key={tVal}
                      type="button"
                      onClick={() => onTimbreChange(tVal)}
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-all ${
                        timbre === tVal
                          ? "bg-amber-500 font-bold text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Language and System Info */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-amber-400" />
              <span>Language:</span>
              <div className="flex rounded-md border border-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    language === "en"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ar")}
                  className={`font-arabic rounded px-2 py-0.5 text-[10px] font-bold ${
                    language === "ar"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  عربي
                </button>
              </div>
            </div>
            <span className="font-mono text-[10px]">A4 = 440 Hz</span>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
