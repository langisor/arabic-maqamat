// src/components/ViolinFingerboard.tsx
import React, { useEffect, useState, useMemo } from "react"
import { ArabicPitch } from "../core/pitch"
import { Maqam } from "../theory/maqam"
import {
  ViolinErgonomicsEngine,
  ViolinStringName,
  ViolinPositionNumber,
  ViolinPositionMode,
  ViolinFingerPlacement,
} from "../violin/ergonomics"
import { MicrotonalAudioEngine, TimbreType } from "../audio/microtonal-audio"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card"
import {
  Music,
  Play,
  Square,
  SlidersHorizontal,
  Info,
  Volume2,
  X,
  ArrowUpDown,
  Rows,
  Columns,
  BadgeCheck,
  CircleOff,
} from "lucide-react"
import { useLanguage } from "../state/language"
import {
  getWorkspaceState,
  updateWorkspaceDraft,
} from "../state/workspace-state"

export type ViolinTuningPreset = "standard" | "arabic" | "western"

interface ViolinFingerboardProps {
  currentMaqam: Maqam
  timbre?: TimbreType
  tuning?: ViolinTuningPreset
  onTuningChange?: (tuning: ViolinTuningPreset) => void
  onPitchSelect?: (pitch: ArabicPitch) => void
}

export const ViolinFingerboard: React.FC<ViolinFingerboardProps> = ({
  currentMaqam,
  timbre = "violin",
  tuning = "western",
  onTuningChange,
  onPitchSelect,
}) => {
  const { language, t } = useLanguage()
  const ui =
    language === "ar"
      ? {
          title: "لوحة أصابع الكمان",
          subtitle:
            "مواضع أصابع ميكروتونية بنظام ٢٤ درجة، وضبط الكمان العربي التقليدي (صول - ري - صول - ري).",
          tuning: "الضبط",
          arabicTuning: "عربي (صول-ري-صول-ري)",
          westernTuning: "غربي (صول-ري-لا-مي)",
          position: "الموضع",
          auto: "تلقائي",
          reverseStrings: "عكس ترتيب الأوتار",
          reversed: "معكوس",
          horizontal: "أفقي",
          vertical: "عمودي",
          hideTips: "إخفاء الإرشادات",
          showTips: "إرشادات العزف",
          mode: "الوضع",
          standard: "قياسي",
          reversedMode: "معكوس",
          tonic: "القرار",
          ghammaz: "الغمّاز",
          scale: "السلم",
          swipe: "اسحب أفقياً أو اختر العرض العمودي",
          nutOpen: "العظمة (مفتوح)",
          semitone: "نصف بُعد",
          wholeTone: "بُعد كامل (الموضع الأول)",
          neutralThird: "الثالثة المحايدة",
          majorThird: "الثالثة الكبيرة",
          perfectFourth: "الرابعة التامة",
          tritone: "ثلاثة أبعاد",
          perfectFifth: "الخامسة التامة",
          playPitch: "اعزف النغمة",
          finger: "الإصبع",
          string: "الوتر",
          maqamDegree: "درجة المقام",
          guidelines: "إرشادات أداء الكمان العربي",
          arabicTuningTip:
            "الضبط العربي (صول-ري-صول-ري): يوفّر خفض الوترين الثالث والرابع رنيناً متآلفاً لمقامي الراست والبياتي.",
          quarterToneTip:
            "موضع ربع الصوت المحايد: يوضع الإصبع بين علامة نصف البعد والبُعد الكامل، بفارق يقارب ٥٠ سنتاً.",
          activePosition: "الموضع والانتقالات",
          autoDescription:
            "الوضع التلقائي: يحسب أصابع الموضع الأول الأكثر ملاءمة مع الاستفادة من الأوتار المطلقة وتقليل الانتقالات.",
        }
      : {
          title: "Violin Fingerboard",
          subtitle:
            "24-EDO microtonal finger placements and traditional Arabic violin tuning (G-D-G-D)",
          tuning: "Tuning:",
          arabicTuning: "Arabic (G-D-G-D)",
          westernTuning: "Western (G-D-A-E)",
          position: "Position:",
          auto: "Auto",
          reverseStrings: "Reverse Strings",
          reversed: "Rev",
          horizontal: "Horizontal",
          vertical: "Vertical",
          hideTips: "Hide Tips",
          showTips: "Pedagogy Tips",
          mode: "Mode",
          standard: "Standard",
          reversedMode: "Reversed",
          tonic: "Tonic",
          ghammaz: "Ghammaz",
          scale: "Scale",
          swipe: "Swipe horizontally or select Vertical for upright view",
          nutOpen: "Nut (Open)",
          semitone: "½-tone",
          wholeTone: "Whole tone (1st)",
          neutralThird: "Neutral 3rd",
          majorThird: "Maj 3rd",
          perfectFourth: "Perf 4th",
          tritone: "Tritone",
          perfectFifth: "Perf 5th",
          playPitch: "Play Pitch",
          finger: "Finger",
          string: "String",
          maqamDegree: "Maqam Degree",
          guidelines: "Arabic Violin Pedagogical Guidelines",
          arabicTuningTip:
            "Arabic Tuning (G-D-G-D): Re-tuning the A string down to G4 and E string down to D5 provides rich sympathetic resonance for Rast and Bayati.",
          quarterToneTip:
            "Neutral Quarter-Tone Placement: Place the finger halfway between the semitone and whole-tone marks (approximately 50 cents sharp from the flat).",
          activePosition: "Active Position & Shifts",
          autoDescription:
            "Auto Mode: Computes ergonomic first-position fingering with useful open strings and minimal shifts.",
        }
  const [selectedPosition, setSelectedPosition] =
    useState<ViolinPositionMode>("auto")
  const [activePlayedPitch, setActivePlayedPitch] = useState<string | null>(
    null
  )
  const [isPlayingScale, setIsPlayingScale] = useState(false)
  const [selectedPlacement, setSelectedPlacement] =
    useState<ViolinFingerPlacement | null>(null)
  const [showPedagogicalTips, setShowPedagogicalTips] = useState(false)
  const [isReversedStrings, setIsReversedStrings] = useState<boolean>(true)
  const [orientation, setOrientationState] = useState<
    "horizontal" | "vertical"
  >(() => getWorkspaceState().drafts.violin.orientation)

  const setOrientation = (nextOrientation: "horizontal" | "vertical") => {
    setOrientationState(nextOrientation)
    updateWorkspaceDraft("violin", { orientation: nextOrientation })
  }

  // Strings according to tuning
  const tuningStrings: {
    name: ViolinStringName
    label: string
    arabicLabel: string
    rootPitch: ArabicPitch
  }[] = useMemo(() => {
    if (tuning === "arabic") {
      return [
        {
          name: "G",
          label: "G3",
          arabicLabel: "يكاه · صول",
          rootPitch: new ArabicPitch("G", "♮", 3),
        },
        {
          name: "D",
          label: "D4",
          arabicLabel: "دوكاه · ري",
          rootPitch: new ArabicPitch("D", "♮", 4),
        },
        {
          name: "A",
          label: "G4",
          arabicLabel: "نوى · صول",
          rootPitch: new ArabicPitch("G", "♮", 4),
        },
        {
          name: "E",
          label: "D5",
          arabicLabel: "محير · ري",
          rootPitch: new ArabicPitch("D", "♮", 5),
        },
      ]
    }
    return [
      {
        name: "G",
        label: "G3",
        arabicLabel: "يكاه · صول",
        rootPitch: new ArabicPitch("G", "♮", 3),
      },
      {
        name: "D",
        label: "D4",
        arabicLabel: "دوكاه · ري",
        rootPitch: new ArabicPitch("D", "♮", 4),
      },
      {
        name: "A",
        label: "A4",
        arabicLabel: "حسيني · لا",
        rootPitch: new ArabicPitch("A", "♮", 4),
      },
      {
        name: "E",
        label: "E5",
        arabicLabel: "جواب · مي",
        rootPitch: new ArabicPitch("E", "♮", 5),
      },
    ]
  }, [tuning])

  // Displayed strings (supports Reverse Strings toggle)
  const displayedStrings = useMemo(() => {
    return isReversedStrings ? [...tuningStrings].reverse() : tuningStrings
  }, [tuningStrings, isReversedStrings])

  // Acoustic line thickness based on string gauge
  const getStringThickness = (name: ViolinStringName) => {
    switch (name) {
      case "G":
        return 3.6
      case "D":
        return 2.8
      case "A":
        return 2.1
      case "E":
        return 1.5
      default:
        return 2.2
    }
  }

  // Ergonomic placements for the current maqam notes
  const scalePitches = useMemo(() => currentMaqam.getScale(), [currentMaqam])
  const tonic = useMemo(() => currentMaqam.getTonic(), [currentMaqam])
  const ghammaz = useMemo(() => currentMaqam.getGhammaz(), [currentMaqam])
  const positionTapes = useMemo(
    () =>
      ([4, 8, 10, 14] as const).map((quarterTones, index) => {
        const distanceRatio =
          ViolinErgonomicsEngine.calculateFingerStopRatio(quarterTones)
        return {
          label: String(index + 1),
          horizontalPercent: Math.min(
            92,
            Math.max(4, 4 + (distanceRatio / 0.4) * 88)
          ),
          verticalPercent: Math.min(
            92,
            Math.max(6, 6 + (distanceRatio / 0.4) * 86)
          ),
        }
      }),
    []
  )

  const placements = useMemo(() => {
    const posNum: ViolinPositionNumber =
      selectedPosition === "auto" ? 1 : selectedPosition
    return scalePitches.map((pitch) =>
      ViolinErgonomicsEngine.mapPitchToPosition(pitch, posNum)
    )
  }, [scalePitches, selectedPosition])

  const playScale = async () => {
    try {
      await MicrotonalAudioEngine.startAudioContext()
      MicrotonalAudioEngine.playSequence(
        scalePitches,
        500,
        timbre,
        (index) => {
          setActivePlayedPitch(
            index < 0 ? null : scalePitches[index].toString()
          )
        },
        () => setIsPlayingScale(false),
        undefined,
        "violin-fingerboard-sequence"
      )
      setIsPlayingScale(true)
    } catch {
      setIsPlayingScale(false)
      setActivePlayedPitch(null)
    }
  }

  const stopScale = () => {
    MicrotonalAudioEngine.stopSequence("violin-fingerboard-sequence")
    setIsPlayingScale(false)
    setActivePlayedPitch(null)
  }

  useEffect(
    () => () => {
      MicrotonalAudioEngine.stopSequence("violin-fingerboard-sequence")
    },
    []
  )

  const handlePlayPitch = async (
    pitch: ArabicPitch,
    placement?: ViolinFingerPlacement
  ) => {
    setActivePlayedPitch(pitch.toString())
    if (placement) {
      setSelectedPlacement(placement)
    }
    if (onPitchSelect) {
      onPitchSelect(pitch)
    }
    try {
      await MicrotonalAudioEngine.playPitch(pitch, 0.7, timbre)
    } catch {
      // Audio autoplay handled
    }
    setTimeout(() => {
      setActivePlayedPitch(null)
    }, 700)
  }

  return (
    <div
      className="space-y-4 sm:space-y-6"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Header & Controls - Fully Responsive */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 sm:gap-4 sm:p-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100 sm:text-xl">
            <Music className="h-4 w-4 shrink-0 text-amber-400 sm:h-5 sm:w-5" />
            <span>{ui.title}</span>
          </h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400 sm:mt-1 sm:text-xs">
            {ui.subtitle}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {/* Tuning Preset Selector */}
          <div className="flex w-full items-center justify-between gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs sm:w-auto sm:justify-start">
            <span className="px-1.5 text-[11px] font-medium text-slate-400 sm:px-2 sm:text-xs">
              {ui.tuning}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onTuningChange?.("arabic")}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all sm:px-3 sm:text-xs ${
                  tuning === "arabic"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ui.arabicTuning}
              </button>
              <button
                onClick={() => onTuningChange?.("western")}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all sm:px-3 sm:text-xs ${
                  tuning === "western" || tuning === "standard"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ui.westernTuning}
              </button>
            </div>
          </div>

          {/* Position Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
            <span className="px-1.5 text-[11px] font-medium text-slate-400 sm:px-2 sm:text-xs">
              {ui.position}
            </span>
            {(["auto", 1, 2, 3, 4] as ViolinPositionMode[]).map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-semibold transition-all sm:px-2.5 sm:text-xs ${
                  selectedPosition === pos
                    ? "border border-amber-500/40 bg-amber-500/20 text-amber-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {pos === "auto"
                  ? ui.auto
                  : language === "ar"
                    ? `${pos}`
                    : `${pos}st`}
              </button>
            ))}
          </div>

          {/* Reverse Strings Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReversedStrings(!isReversedStrings)}
            className={`h-8 cursor-pointer rounded-xl border px-2.5 text-xs font-semibold transition-all ${
              isReversedStrings
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-xs"
                : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
            title={ui.reverseStrings}
          >
            <ArrowUpDown className="mr-1 h-3.5 w-3.5 text-amber-400" />
            <span>{ui.reverseStrings}</span>
            {isReversedStrings && (
              <span className="py-0.2 ml-1 rounded bg-amber-500/30 px-1 font-mono text-[10px] text-amber-300">
                {ui.reversed}
              </span>
            )}
          </Button>

          {/* Orientation Toggle: Horizontal vs Vertical */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
            <button
              type="button"
              onClick={() => setOrientation("horizontal")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all sm:text-xs ${
                orientation === "horizontal"
                  ? "bg-amber-500 font-bold text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title={ui.horizontal}
            >
              <Rows className="h-3 w-3" />
              <span>{ui.horizontal}</span>
            </button>
            <button
              type="button"
              onClick={() => setOrientation("vertical")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all sm:text-xs ${
                orientation === "vertical"
                  ? "bg-amber-500 font-bold text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title={ui.vertical}
            >
              <Columns className="h-3 w-3" />
              <span>{ui.vertical}</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPedagogicalTips(!showPedagogicalTips)}
            className="ml-auto h-8 text-xs text-slate-400 hover:text-slate-200 lg:ml-0"
          >
            <Info className="mr-1 h-3.5 w-3.5" />
            {showPedagogicalTips ? ui.hideTips : ui.showTips}
          </Button>
        </div>
      </div>

      {/* Main Interactive Fingerboard Display */}
      <Card className="overflow-hidden border-slate-800 bg-slate-950 shadow-2xl">
        <CardHeader className="border-b border-slate-900 bg-slate-900/40 p-3.5 sm:p-5">
          <div className="flex flex-col items-start justify-between gap-2.5 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm text-slate-200 sm:text-base">
                <span>
                  {language === "ar"
                    ? currentMaqam.arabicName
                    : `Maqam ${currentMaqam.name}`}
                </span>
                <Badge
                  variant="secondary"
                  className="font-mono text-[10px] capitalize"
                >
                  {ui.mode}:{" "}
                  {orientation === "horizontal" ? ui.horizontal : ui.vertical} ·{" "}
                  {isReversedStrings ? ui.reversedMode : ui.standard}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                {ui.tonic}:{" "}
                <span className="font-semibold text-amber-300">
                  {tonic.toString()}
                </span>{" "}
                • {ui.ghammaz}:{" "}
                <span className="font-semibold text-emerald-300">
                  {ghammaz.toString()}
                </span>
              </CardDescription>
            </div>

            {/* Responsive Color Legend */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:gap-3 sm:text-xs">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-amber-200 bg-amber-500" />{" "}
                {ui.tonic}
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-emerald-200 bg-emerald-500" />{" "}
                {ui.ghammaz}
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-sky-200 bg-sky-500" />{" "}
                {ui.scale}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-6">
          <div
            className="mb-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5"
            aria-label={`${currentMaqam.name} ${ui.scale}`}
          >
            <span>
              {currentMaqam.verified ? (
                <BadgeCheck className="text-green-500" />
              ) : (
                <CircleOff className="text-red-500" />
              )}
            </span>
            {scalePitches.map((pitch, index) => (
              <span
                key={`${pitch.toQuarterToneIndex()}-${index}`}
                className={`rounded-lg px-2.5 py-1 font-mono text-sm font-bold transition-all sm:text-base ${
                  activePlayedPitch === pitch.toString()
                    ? "scale-110 bg-amber-300 text-slate-950 ring-2 ring-white"
                    : index === 0
                      ? "bg-amber-500 text-slate-950"
                      : "bg-sky-950 text-sky-100"
                }`}
              >
                {pitch.toString()}
              </span>
            ))}
            {isPlayingScale ? (
              <Button
                type="button"
                variant="amberOutline"
                size="sm"
                onClick={stopScale}
              >
                <Square className="h-3.5 w-3.5" />
                {t("stopMaqam")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="amber"
                size="sm"
                onClick={() => void playScale()}
              >
                <Play className="h-3.5 w-3.5" />
                {t("playMaqam")}
              </Button>
            )}
          </div>

          {/* Maqam Intervals */}
          <div className="w-full text-center">
            {currentMaqam.getTonic().toString()} - 
            {currentMaqam.getIntervals().join(" - ")}
          </div>
          {/* HORIZONTAL ORIENTATION VIEW */}
          {orientation === "horizontal" && (
            <>
              {/* Mobile Horizontal Scroll Hint */}
              <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-950/30 px-3 py-1.5 text-[11px] text-amber-300/90 md:hidden">
                <span className="flex items-center gap-1.5">
                  <span>↔</span>
                  <span>{ui.swipe}</span>
                </span>
              </div>

              {/* Fingerboard Neck Container with smooth touch scrolling */}
              <div className="relative touch-pan-x scrollbar-thin overflow-x-auto pb-3">
                <div className="relative min-w-[780px] rounded-2xl border-2 border-stone-800 bg-stone-900/90 p-4 shadow-inner select-none sm:min-w-[850px] sm:p-6">
                  {/* Wooden fingerboard texture simulation */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 opacity-80" />

                  {/* Nut indicator */}
                  <div className="absolute top-3 bottom-3 left-20 z-10 w-2 rounded-sm bg-stone-200 shadow-md sm:top-4 sm:bottom-4 sm:left-24">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-wider text-stone-400 sm:text-[10px]">
                      NUT
                    </div>
                  </div>

                  {/* Fret / Interval Position Guides */}
                  <div className="relative flex h-64 flex-col justify-between py-2 sm:h-68 sm:py-4">
                    <div className="pointer-events-none absolute inset-y-2 right-0 left-[5.5rem] z-[5] sm:inset-y-4 sm:left-[6.75rem]">
                      {positionTapes.map((tape) => (
                        <div
                          key={tape.label}
                          className="absolute inset-y-0 -translate-x-1/2"
                          style={{ left: `${tape.horizontalPercent}%` }}
                        >
                          <span className="block h-full w-1 rounded-full border-x border-amber-100/70 bg-amber-300/50 shadow-[0_0_6px_rgba(251,191,36,0.55)]" />
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-slate-950/90 px-1 text-[9px] font-bold text-amber-200">
                            {tape.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    {displayedStrings.map((str) => {
                      const stringPlacements = placements.filter(
                        (p) => p.string === str.name
                      )
                      const thickness = getStringThickness(str.name)

                      return (
                        <div
                          key={str.name}
                          className="relative flex h-12 items-center sm:h-13"
                        >
                          {/* String Header */}
                          <div className="z-20 flex w-20 shrink-0 flex-col items-start pr-1 sm:w-24 sm:pr-2">
                            <span className="w-full truncate text-[11px] font-bold text-amber-300 sm:text-xs">
                              {language === "ar" ? str.arabicLabel : str.label}
                            </span>
                          </div>

                          {/* String Line (physically accurate thickness based on string gauge) */}
                          <div className="relative ml-2 flex h-full flex-1 items-center sm:ml-3">
                            <div
                              className="w-full rounded-full bg-gradient-to-r from-amber-200 via-stone-300 to-amber-100 shadow-sm"
                              style={{
                                height: `${thickness}px`,
                                opacity: 0.85,
                              }}
                            />

                            {/* Open String Button with comfortable touch hitbox */}
                            <button
                              onClick={() => handlePlayPitch(str.rootPitch)}
                              className={`absolute left-0 z-20 flex h-7 w-7 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all sm:h-8 sm:w-8 ${
                                activePlayedPitch === str.rootPitch.toString()
                                  ? "scale-125 border-white bg-amber-400 text-slate-950 shadow-lg ring-2 ring-amber-300"
                                  : "border-stone-600 bg-stone-800 text-stone-300 hover:border-amber-400 active:scale-95"
                              }`}
                              title={`Open string 0: ${str.rootPitch.toString()}`}
                            >
                              0
                            </button>

                            {/* Finger Placements for this string */}
                            {stringPlacements.map((placement, pIdx) => {
                              const isTonic = tonic.equals(placement.pitch)
                              const isGhammaz = ghammaz.equals(placement.pitch)
                              const isPlayed =
                                activePlayedPitch === placement.pitch.toString()
                              const isSelected =
                                selectedPlacement?.pitch.equals(placement.pitch)

                              // Calculate distance along neck (scaled 0 to 100%)
                              const leftPercent = Math.min(
                                92,
                                Math.max(
                                  4,
                                  4 +
                                    (placement.distanceRatioFromNut / 0.4) * 88
                                )
                              )

                              // Colors based on role
                              let badgeBg =
                                "bg-sky-600 border-sky-300 text-white"
                              if (isTonic) {
                                badgeBg =
                                  "bg-amber-500 border-amber-200 text-slate-950 font-black ring-2 ring-amber-400/50"
                              } else if (isGhammaz) {
                                badgeBg =
                                  "bg-emerald-600 border-emerald-200 text-white font-bold ring-2 ring-emerald-400/50"
                              }

                              return (
                                <div
                                  key={`${placement.string}-${placement.pitch.toString()}-${pIdx}`}
                                  className="group absolute z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center"
                                  style={{ left: `${leftPercent}%` }}
                                  onClick={() =>
                                    handlePlayPitch(placement.pitch, placement)
                                  }
                                >
                                  {/* Invisible expanded touch hitbox for mobile fingertips */}
                                  <span className="absolute -inset-2.5 sm:-inset-1.5" />

                                  {/* Finger placement bead */}
                                  <div
                                    className={`flex h-7 w-7 transform items-center justify-center rounded-full border-2 text-[10px] shadow-md transition-all group-hover:scale-125 active:scale-95 sm:h-8 sm:w-8 sm:text-xs ${badgeBg} ${
                                      isPlayed
                                        ? "scale-125 animate-pulse ring-4 ring-white"
                                        : ""
                                    } ${isSelected ? "scale-110 ring-2 ring-white" : ""}`}
                                  >
                                    {placement.finger}
                                  </div>

                                  {/* Visible note name pill for mobile legibility */}
                                  <span className="py-0.2 mt-0.5 rounded border border-stone-700/60 bg-stone-950/85 px-1 font-mono text-[9px] leading-none font-semibold whitespace-nowrap text-slate-300 shadow-xs">
                                    {placement.pitch.toString()}
                                  </span>

                                  {/* Desktop hover tooltip */}
                                  <div className="pointer-events-none absolute -top-8 z-30 hidden rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] whitespace-nowrap text-slate-100 opacity-0 shadow transition-opacity group-hover:opacity-100 sm:block">
                                    {placement.pitch.toString()} •{" "}
                                    {placement.noteAnnotation} (Finger{" "}
                                    {placement.finger})
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Fret labels along bottom */}
                  <div className="mt-2 flex items-center justify-between overflow-hidden border-t border-stone-800 px-16 pt-2.5 text-[9px] text-stone-500 sm:px-20 sm:text-[10px]">
                    <span>{ui.nutOpen}</span>
                    <span>{ui.semitone}</span>
                    <span>{ui.wholeTone}</span>
                    <span>{ui.neutralThird}</span>
                    <span>{ui.majorThird}</span>
                    <span>{ui.perfectFourth}</span>
                    <span>{ui.tritone}</span>
                    <span>{ui.perfectFifth}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VERTICAL ORIENTATION VIEW (UPRIGHT VIOLIN FINGERBOARD) */}
          {orientation === "vertical" && (
            <div className="relative mx-auto w-full max-w-xl rounded-2xl border-2 border-stone-800 bg-stone-900/90 p-4 shadow-inner select-none sm:p-6">
              {/* Wooden fingerboard texture simulation */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 opacity-80" />

              {/* String Headers row above the Nut */}
              <div className="relative z-20 mb-2.5 grid grid-cols-4 gap-2 pr-12 text-center sm:gap-4 sm:pr-14">
                {displayedStrings.map((str) => (
                  <div key={str.name} className="flex flex-col items-center">
                    <span className="text-xs font-bold text-amber-300 sm:text-sm">
                      {language === "ar" ? str.arabicLabel : str.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Horizontal Nut indicator across the neck */}
              <div className="relative z-10 mb-4 w-full pr-12 sm:pr-14">
                <div className="relative h-2.5 w-full rounded-sm bg-stone-200 shadow-md">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-wider text-stone-400 sm:text-[10px]">
                    {language === "ar" ? "عظمة المشط" : "Nut"}
                  </div>
                </div>
              </div>

              {/* Main Vertical Fingerboard Playing Board with Fret Grid */}
              <div className="relative flex h-[560px] w-full sm:h-[620px]">
                {/* 4 Strings Area */}
                <div className="relative grid h-full flex-1 grid-cols-4 gap-2 sm:gap-4">
                  <div className="pointer-events-none absolute inset-0 z-[5]">
                    {positionTapes.map((tape) => (
                      <div
                        key={tape.label}
                        className="absolute inset-x-0 -translate-y-1/2"
                        style={{ top: `${tape.verticalPercent}%` }}
                      >
                        <span className="block h-1 w-full border-y border-amber-100/70 bg-amber-300/50 shadow-[0_0_6px_rgba(251,191,36,0.55)]" />
                        <span className="absolute top-1/2 right-0 -translate-y-1/2 rounded bg-slate-950/90 px-1 text-[9px] font-bold text-amber-200">
                          {tape.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Background subtle fret markers across strings */}
                  {[
                    { label: ui.semitone, top: 14 },
                    { label: ui.wholeTone, top: 26 },
                    { label: ui.neutralThird, top: 38 },
                    { label: ui.majorThird, top: 48 },
                    { label: ui.perfectFourth, top: 60 },
                    { label: ui.tritone, top: 72 },
                    { label: ui.perfectFifth, top: 84 },
                  ].map((guide) => (
                    <div
                      key={guide.label}
                      className="pointer-events-none absolute right-0 left-0 border-b border-stone-800/80"
                      style={{ top: `${guide.top}%` }}
                    />
                  ))}

                  {displayedStrings.map((str) => {
                    const stringPlacements = placements.filter(
                      (p) => p.string === str.name
                    )
                    const thickness = getStringThickness(str.name)

                    return (
                      <div
                        key={str.name}
                        className="relative flex h-full justify-center"
                      >
                        {/* Vertical String line */}
                        <div
                          className="h-full rounded-full bg-gradient-to-b from-amber-200 via-stone-300 to-amber-100 shadow-sm"
                          style={{
                            width: `${thickness}px`,
                            opacity: 0.85,
                          }}
                        />

                        {/* Open string button at the very top of the string */}
                        <button
                          onClick={() => handlePlayPitch(str.rootPitch)}
                          className={`absolute top-0 z-20 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all sm:h-8 sm:w-8 ${
                            activePlayedPitch === str.rootPitch.toString()
                              ? "scale-125 border-white bg-amber-400 text-slate-950 shadow-lg ring-2 ring-amber-300"
                              : "border-stone-600 bg-stone-800 text-stone-300 hover:border-amber-400 active:scale-95"
                          }`}
                          title={`Open string 0: ${str.rootPitch.toString()}`}
                        >
                          0
                        </button>

                        {/* Finger placements on this string */}
                        {stringPlacements.map((placement, pIdx) => {
                          const isTonic = tonic.equals(placement.pitch)
                          const isGhammaz = ghammaz.equals(placement.pitch)
                          const isPlayed =
                            activePlayedPitch === placement.pitch.toString()
                          const isSelected = selectedPlacement?.pitch.equals(
                            placement.pitch
                          )

                          // Calculate distance along neck vertically (scaled 0 to 100%)
                          const topPercent = Math.min(
                            92,
                            Math.max(
                              6,
                              6 + (placement.distanceRatioFromNut / 0.4) * 86
                            )
                          )

                          let badgeBg = "bg-sky-600 border-sky-300 text-white"
                          if (isTonic) {
                            badgeBg =
                              "bg-amber-500 border-amber-200 text-slate-950 font-black ring-2 ring-amber-400/50"
                          } else if (isGhammaz) {
                            badgeBg =
                              "bg-emerald-600 border-emerald-200 text-white font-bold ring-2 ring-emerald-400/50"
                          }

                          return (
                            <div
                              key={`${placement.string}-${placement.pitch.toString()}-${pIdx}`}
                              className="group absolute z-20 flex -translate-y-1/2 cursor-pointer flex-col items-center"
                              style={{ top: `${topPercent}%` }}
                              onClick={() =>
                                handlePlayPitch(placement.pitch, placement)
                              }
                            >
                              {/* Invisible expanded touch hitbox */}
                              <span className="absolute -inset-2.5 sm:-inset-1.5" />

                              {/* Finger placement bead */}
                              <div
                                className={`flex h-7 w-7 transform items-center justify-center rounded-full border-2 text-[10px] shadow-md transition-all group-hover:scale-125 active:scale-95 sm:h-8 sm:w-8 sm:text-xs ${badgeBg} ${
                                  isPlayed
                                    ? "scale-125 animate-pulse ring-4 ring-white"
                                    : ""
                                } ${isSelected ? "scale-110 ring-2 ring-white" : ""}`}
                              >
                                {placement.finger}
                              </div>

                              {/* Visible note name pill */}
                              <span className="py-0.2 mt-0.5 rounded border border-stone-700/60 bg-stone-950/90 px-1 font-mono text-[9px] leading-none font-semibold whitespace-nowrap text-slate-300 shadow-xs">
                                {placement.pitch.toString()}
                              </span>

                              {/* Desktop hover tooltip */}
                              <div className="pointer-events-none absolute -top-8 z-30 hidden rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] whitespace-nowrap text-slate-100 opacity-0 shadow transition-opacity group-hover:opacity-100 sm:block">
                                {placement.pitch.toString()} •{" "}
                                {placement.noteAnnotation} (Finger{" "}
                                {placement.finger})
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>

                {/* Right rail fret/interval markers for vertical orientation */}
                <div className="flex w-12 flex-col justify-between border-l border-stone-800 py-1 pl-1.5 text-[9px] text-stone-500 select-none sm:w-14 sm:pl-2 sm:text-[10px]">
                  <span className="font-semibold text-stone-400">
                    {ui.nutOpen}
                  </span>
                  <span>{ui.semitone}</span>
                  <span className="font-medium text-amber-400/80">
                    {ui.wholeTone}
                  </span>
                  <span>{ui.neutralThird}</span>
                  <span>{ui.majorThird}</span>
                  <span className="font-medium text-amber-400/80">
                    {ui.perfectFourth}
                  </span>
                  <span>{ui.tritone}</span>
                  <span className="font-medium text-amber-400/80">
                    {ui.perfectFifth}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Active Tapped Note Details Card (Crucial for Mobile/Touch UX) */}
          {selectedPlacement && (
            <div className="animate-in fade-in mt-3 flex flex-col items-start justify-between gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 font-mono font-bold text-slate-950">
                  {selectedPlacement.pitch.toString()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">
                      {ui.finger} {selectedPlacement.finger} · {ui.string}{" "}
                      {selectedPlacement.string}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-amber-400 text-[10px] text-amber-300"
                    >
                      {tonic.equals(selectedPlacement.pitch)
                        ? language === "ar"
                          ? "القرار"
                          : "Tonic"
                        : ghammaz.equals(selectedPlacement.pitch)
                          ? language === "ar"
                            ? "الغمّاز"
                            : "Ghammaz"
                          : ui.maqamDegree}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {language === "en"
                      ? `${selectedPlacement.noteAnnotation} · `
                      : ""}
                    {selectedPlacement.pitch.toFrequency().toFixed(1)} Hz
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePlayPitch(selectedPlacement.pitch, selectedPlacement)
                  }
                  className="h-7 border-amber-500/40 text-xs text-amber-300 hover:bg-amber-500/10"
                >
                  <Volume2 className="mr-1 h-3 w-3" />
                  {ui.playPitch}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlacement(null)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Pedagogical notes and finger explanation */}
          {showPedagogicalTips && (
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 sm:mt-6 sm:gap-4 sm:p-4 md:grid-cols-2">
              <div>
                <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-300 uppercase sm:mb-2 sm:text-xs">
                  <Info className="h-3.5 w-3.5" /> {ui.guidelines}
                </h4>
                <ul className="list-inside list-disc space-y-1 text-[11px] leading-relaxed text-slate-300 sm:space-y-1.5 sm:text-xs">
                  <li>{ui.arabicTuningTip}</li>
                  <li>{ui.quarterToneTip}</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-emerald-300 uppercase sm:mb-2 sm:text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" />{" "}
                  {ui.activePosition}
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-300 sm:text-xs">
                  {selectedPosition === "auto"
                    ? ui.autoDescription
                    : language === "ar"
                      ? `الموضع ${selectedPosition}: يوسّع مجال العزف على الرقبة مع الحفاظ على وضع اليد المناسب.`
                      : ViolinErgonomicsEngine.POSITION_INFO[
                          selectedPosition as ViolinPositionNumber
                        ]?.description}
                </p>
                <div className="mt-2 text-[10px] text-slate-400 sm:text-[11px]">
                  {selectedPosition !== "auto" && (
                    <span>
                      {language === "ar" ? "الأسلوب التقليدي: " : "Tradition: "}
                      {language === "ar"
                        ? `استخدم الموضع ${selectedPosition} بما يناسب مدى النغمة.`
                        : ViolinErgonomicsEngine.POSITION_INFO[
                            selectedPosition as ViolinPositionNumber
                          ]?.arabicTraditionRole}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
