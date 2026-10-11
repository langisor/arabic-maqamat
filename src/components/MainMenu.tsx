// src/components/MainMenu.tsx
import React, { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "./ui/sheet"
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
  Mic,
  Settings2,
  Radio,
  CheckCircle2,
  Volume2,
  SlidersHorizontal,
  ChevronRight,
  Globe,
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
  onOpenAudioSettings,
  systemTuningMode = "24edo",
  onSystemTuningChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage } = useLanguage()

  const labsList: { id: ValidLab; title: string; arabic: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "explorer", title: "Maqam Families Explorer", arabic: "مستكشف الفصائل والمقامات", icon: Layers },
    { id: "transposition", title: "Transposition Lab (Tasweer)", arabic: "مختبر تصوير المقامات", icon: ArrowLeftRight },
    { id: "violin", title: "Violin Fingerboard Studio", arabic: "لوحة أصابع الكمان التعليمية", icon: Music },
    { id: "sayr", title: "Sayr & Qafla Lab", arabic: "مختبر السير والقفلات", icon: Compass },
    { id: "score", title: "Interactive Score & MusicXML", arabic: "التدوين والنوتة التفاعلية", icon: FileMusic },
    { id: "tuning", title: "24-EDO Tuning Wheel & Tracker", arabic: "عجلة الدوزان ومقياس التون", icon: Sliders },
    { id: "detector", title: "Jins Detector Lab", arabic: "مستكشف ومحلل الأجناس", icon: Sparkles },
    { id: "training", title: "Training Lab & Pedagogy Drills", arabic: "مختبر التمارين والتدريب", icon: GraduationCap },
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
        className="flex items-center gap-1.5 px-2.5 sm:px-3 text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer border border-border/60 rounded-xl"
        title="Main Menu & Tools"
      >
        <Menu className="h-4 w-4 text-amber-400" />
        <span className="hidden sm:inline text-xs font-semibold">
          Menu
        </span>
        <span className="hidden lg:inline font-arabic text-[11px] text-amber-400/90" dir="rtl">
          القائمة
        </span>
      </Button>

      {/* Slide-out Menu Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side={language === "ar" ? "right" : "left"}
          className="w-[min(30rem,92vw)] max-w-none max-h-dvh flex flex-col justify-between overflow-y-auto bg-slate-950 p-0 text-slate-100 border-r border-slate-800 shadow-2xl scrollbar-thin"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="border-b border-slate-800 p-5 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-amber-600 to-amber-400 p-0.5 shadow-md shadow-amber-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                  <Music className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-white flex items-center gap-2">
                  <span>Arabic Maqamat Studio</span>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    v2.5
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-400">
                  Main Navigation, Tools &amp; Tuning Presets
                </SheetDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu Sections Body */}
          <div className="p-5 space-y-6 flex-1">
            {/* Quick Drawers & Modals Actions */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Creative Tools &amp; Drawers
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Maqam Builder Drawer Button */}
                <button
                  type="button"
                  onClick={() => handleAction(onOpenMaqamBuilder)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/40 bg-linear-to-r from-amber-950/40 to-slate-900 text-left transition-all hover:border-amber-400 hover:shadow-md cursor-pointer group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                    <Wand2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-200">
                      Maqam Builder
                    </div>
                    <div className="text-[10px] text-slate-400 font-arabic">
                      مُركّب المقامات والأجناس
                    </div>
                  </div>
                </button>

                {/* Maqam Facts Drawer Button */}
                <button
                  type="button"
                  onClick={() => handleAction(onOpenMaqamFacts)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-indigo-500/40 bg-linear-to-r from-indigo-950/40 to-slate-900 text-left transition-all hover:border-indigo-400 hover:shadow-md cursor-pointer group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-200">
                      Maqam Facts
                    </div>
                    <div className="text-[10px] text-slate-400 font-arabic">
                      نظريات ومفاهيم المقام
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Western & Arabic Tuning Presets */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                  <span>Violin Tuning Presets (دوزان الكمان)</span>
                </span>
                <Badge
                  variant="outline"
                  className={violinTuning === "western" ? "border-indigo-500/60 text-indigo-300 font-mono text-[10px]" : "border-amber-500/60 text-amber-300 font-mono text-[10px]"}
                >
                  {violinTuning === "western" ? "Western (G-D-A-E)" : "Arabic (G-D-G-D)"}
                </Badge>
              </div>

              {/* Segmented Tuning Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onViolinTuningChange("arabic")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    violinTuning === "arabic"
                      ? "border-amber-500 bg-amber-950/50 text-amber-200 shadow-sm"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Arabic Tuning</span>
                    {violinTuning === "arabic" && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />}
                  </div>
                  <div className="text-[11px] font-mono text-amber-300/90 mt-0.5">
                    G3 • D4 • G4 • D5
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 font-arabic">
                    يكاه • دوكاه • نوى • محير
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onViolinTuningChange("western")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    violinTuning === "western"
                      ? "border-indigo-500 bg-indigo-950/50 text-indigo-200 shadow-sm"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Western Tuning</span>
                    {violinTuning === "western" && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-[11px] font-mono text-indigo-300/90 mt-0.5">
                    G3 • D4 • A4 • E5
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 font-arabic">
                    يكاه • دوكاه • حسيني • بوسليك
                  </div>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {violinTuning === "western"
                  ? "Western Standard Tuning (G-D-A-E) in perfect 5ths. Notes on the 1st (E5) and 2nd (A4) strings conform to European orchestral violins."
                  : "Classical Arabic Violin Tuning (G-D-G-D) drops strings I and II a whole tone, granting resonant sympathetics on Dukah (D) and Nawa (G)."}
              </p>

              {/* 24-EDO vs 12-TET System Toggle */}
              {onSystemTuningChange && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Tuning System:</span>
                  <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => onSystemTuningChange("24edo")}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        systemTuningMode === "24edo"
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      24-EDO (Quarter-Tones)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSystemTuningChange("12tet")}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        systemTuningMode === "12tet"
                          ? "bg-indigo-500 text-white font-bold"
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? "border border-amber-500/60 bg-amber-500/15 text-amber-300 font-bold shadow-xs"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        <div>
                          <div className="text-xs">{lab.title}</div>
                          <div className="text-[10px] text-muted-foreground font-arabic">
                            {lab.arabic}
                          </div>
                        </div>
                      </div>

                      {isActive ? (
                        <Badge variant="default" className="text-[9px] bg-amber-500 text-slate-950 font-bold">
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
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Audio DSP &amp; Instrument Timbre
              </span>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(onOpenAudioSettings)}
                  className="flex-1 text-xs gap-1.5 border-slate-700 bg-slate-900 text-slate-200 hover:text-white cursor-pointer"
                >
                  <Settings2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Tone.js DSP Audio Settings</span>
                </Button>

                <Button
                  variant={isDroneActive ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleDrone}
                  className="text-xs gap-1.5 border-slate-700 cursor-pointer"
                >
                  <Radio className={`h-3.5 w-3.5 ${isDroneActive ? "animate-pulse text-amber-300" : ""}`} />
                  <span>{isDroneActive ? "Drone On" : "Tonic Drone"}</span>
                </Button>
              </div>

              {/* Timbre Switcher */}
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400">Instrument Model:</span>
                <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
                  {(["violin", "oud", "kanun"] as TimbreType[]).map((tVal) => (
                    <button
                      key={tVal}
                      type="button"
                      onClick={() => onTimbreChange(tVal)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer capitalize ${
                        timbre === tVal
                          ? "bg-amber-500 text-slate-950 font-bold"
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
          <div className="border-t border-slate-800 p-4 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-amber-400" />
              <span>Language:</span>
              <div className="flex rounded-md border border-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    language === "en" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ar")}
                  className={`px-2 py-0.5 rounded text-[10px] font-arabic font-bold ${
                    language === "ar" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
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
