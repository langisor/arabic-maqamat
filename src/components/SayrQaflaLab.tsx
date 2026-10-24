// src/components/SayrQaflaLab.tsx
import React, { useState, useEffect } from "react"
import { Maqam, MaqamatCatalogue } from "../theory/maqam"
import { ArabicPitch } from "../core/pitch"
import { getPitchThemeClasses } from "../core/pitch-styling"
import { SayrEngine, SayrStep } from "../theory/sayr"
import { MicrotonalAudioEngine, TimbreType } from "../audio/microtonal-audio"
import {
  getWorkspaceState,
  updateWorkspaceDraft,
} from "../state/workspace-state"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import {
  Play,
  Square,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Zap,
  BookOpen,
  Compass,
  GitFork,
} from "lucide-react"
import { SayrVisualizationDialog } from "./SayrVisualizationDialog"
import { ModulationPathwaysDrawer } from "./ModulationPathwaysDrawer"
import { useLanguage } from "../state/language"

interface Props {
  currentMaqam: Maqam
  timbre: TimbreType
  maqamRevision?: number
  onOpenModulationPathways?: () => void
  onSelectMaqam?: (m: Maqam) => void
}

export const SayrQaflaLab: React.FC<Props> = ({
  currentMaqam,
  maqamRevision = 0,
  timbre,
  onOpenModulationPathways,
  onSelectMaqam,
}) => {
  const { t } = useLanguage()

  useEffect(
    () => () => {
      MicrotonalAudioEngine.stopSequence("sayr")
      MicrotonalAudioEngine.stopSequence("qafla")
    },
    []
  )

  // Sayr state
  const sayrData =
    SayrEngine.getSayrForMaqam(currentMaqam.id) ||
    SayrEngine.getSayrForMaqam("rast")!
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)
  const [isPlayingSayr, setIsPlayingSayr] = useState(false)
  const [showSayrDialog, setShowSayrDialog] = useState(false)
  const [showModulationDrawerLocal, setShowModulationDrawerLocal] =
    useState(false)

  const handleOpenModulation = () => {
    if (onOpenModulationPathways) {
      onOpenModulationPathways()
    } else {
      setShowModulationDrawerLocal(true)
    }
  }

  // Modulation analysis state
  const [targetMaqamId, setTargetMaqamIdState] = useState<string>(
    () => getWorkspaceState().drafts.sayr.targetMaqamId
  )
  const [measureDuration, setMeasureDurationState] = useState<number>(
    () => getWorkspaceState().drafts.sayr.measureDuration
  )

  const setTargetMaqamId = (id: string) => {
    setTargetMaqamIdState(id)
    updateWorkspaceDraft("sayr", { targetMaqamId: id })
  }

  const setMeasureDuration = (dur: number) => {
    setMeasureDurationState(dur)
    updateWorkspaceDraft("sayr", { measureDuration: dur })
  }

  // Qafla tester state
  const [qaflaPhrase, setQaflaPhrase] = useState<ArabicPitch[]>([
    new ArabicPitch("E", "𝄳", 4),
    new ArabicPitch("D", "♮", 4),
    currentMaqam.getTonic(),
  ])

  const [previousMaqamKey, setPreviousMaqamKey] = useState(
    `${currentMaqam.id}:${maqamRevision}`
  )
  const maqamKey = `${currentMaqam.id}:${maqamRevision}`
  if (maqamKey !== previousMaqamKey) {
    setPreviousMaqamKey(maqamKey)
    MicrotonalAudioEngine.stopSequence("sayr")
    MicrotonalAudioEngine.stopSequence("qafla")
    setActiveStepIndex(null)
    setIsPlayingSayr(false)
    setQaflaPhrase([
      currentMaqam.getGhammaz(),
      currentMaqam.getTonic().transpose(2),
      currentMaqam.getTonic(),
    ])
  }

  const targetMaqam =
    MaqamatCatalogue.findById(targetMaqamId) || MaqamatCatalogue.buildNahawand()
  const modulationAnalysis = SayrEngine.analyzeModulation(
    currentMaqam,
    targetMaqam,
    measureDuration
  )
  const qaflaResult = SayrEngine.isIdiomaticQafla(qaflaPhrase, currentMaqam)

  // Play whole Sayr sequence
  const handlePlaySayr = () => {
    if (isPlayingSayr) {
      MicrotonalAudioEngine.stopSequence("sayr")
      setIsPlayingSayr(false)
      setActiveStepIndex(null)
      return
    }
    setIsPlayingSayr(true)
    const pitches = sayrData.steps.map((s) => s.pitch)
    MicrotonalAudioEngine.playSequence(
      pitches,
      600,
      timbre,
      (idx) => {
        setActiveStepIndex(idx === -1 ? null : idx)
      },
      () => {
        setIsPlayingSayr(false)
        setActiveStepIndex(null)
      },
      undefined,
      "sayr"
    )
  }

  const handlePlayStep = (step: SayrStep, index: number) => {
    setActiveStepIndex(index)
    MicrotonalAudioEngine.playPitch(
      step.pitch,
      step.durationBeats * 0.5,
      timbre
    )
  }

  const handleTestQafla = () => {
    MicrotonalAudioEngine.playSequence(
      qaflaPhrase,
      500,
      timbre,
      undefined,
      undefined,
      undefined,
      "qafla"
    )
  }

  const setPresetPhrase = (
    type: "stepwise_tonic" | "stepwise_ghammaz" | "leap_invalid"
  ) => {
    const tonic = currentMaqam.getTonic()
    const ghammaz = currentMaqam.getGhammaz()
    if (type === "stepwise_tonic") {
      const pen = tonic.transpose(3)
      const prep = tonic.transpose(6)
      setQaflaPhrase([prep, pen, tonic])
    } else if (type === "stepwise_ghammaz") {
      const pen = ghammaz.transpose(4)
      setQaflaPhrase([pen, ghammaz])
    } else {
      const pen = tonic.transpose(9)
      setQaflaPhrase([pen, tonic])
    }
  }

  return (
    <div className="space-y-6">
      {/* 5-Phase Sayr Architecture */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
        <CardHeader className="border-border/60 border-b pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
                  {t("melodicProgressionScience")}
                </span>
                <Badge variant="purple" className="text-[10px]">
                  {t("canonicalSayrPhases")}
                </Badge>
              </div>
              <CardTitle className="mt-1 text-xl sm:text-2xl">
                {t("sayrTitle")}: {currentMaqam.name}
              </CardTitle>
              <CardDescription className="mt-1 max-w-2xl text-xs text-slate-300">
                {t("sayrDescription")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSayrDialog(true)}
                className="cursor-pointer gap-1.5 border-slate-700 bg-slate-950 text-sky-300 hover:bg-sky-950/40 hover:text-white"
                title="Open Sayr Trajectory Diagram"
              >
                <Compass className="h-4 w-4 text-sky-400" />
                <span>Sayr Diagram (مخطط السير)</span>
              </Button>
              <Button
                variant={isPlayingSayr ? "destructive" : "outline"}
                onClick={handlePlaySayr}
                className="cursor-pointer gap-2 font-bold"
              >
                {isPlayingSayr ? (
                  <Square className="fill-current" />
                ) : (
                  <Play className="fill-current" />
                )}
                {isPlayingSayr ? t("stopSayr") : t("playFullSayr")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* 5 Phase Progress Bar */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {[
              {
                phase: "1_EstablishTonic",
                num: "1",
                title: t("phase1Tonic"),
                arabic: "تأسيس القرار",
                badgeVariant: "emerald" as const,
              },
              {
                phase: "2_AscendToGhammaz",
                num: "2",
                title: t("phase2Ghammaz"),
                arabic: "الصعود للغماز",
                badgeVariant: "sky" as const,
              },
              {
                phase: "3_UpperExploration_Or_Modulation",
                num: "3",
                title: t("phase3Apex"),
                arabic: "أوج النغم والتحويل",
                badgeVariant: "purple" as const,
              },
              {
                phase: "4_DescentReturn",
                num: "4",
                title: t("phase4Descent"),
                arabic: "الهبوط والرجوع",
                badgeVariant: "amber" as const,
              },
              {
                phase: "5_Qafla",
                num: "5",
                title: t("phase5Qafla"),
                arabic: "القفلة الختامية",
                badgeVariant: "rose" as const,
              },
            ].map((item) => (
              <div
                key={item.phase}
                className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-3"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={item.badgeVariant}
                    className="font-mono text-[10px]"
                  >
                    Phase {item.num}
                  </Badge>
                  <span className="font-serif text-xs font-bold text-slate-400">
                    {item.arabic}
                  </span>
                </div>
                <span className="mt-2 text-xs font-bold text-white">
                  {item.title}
                </span>
              </div>
            ))}
          </div>

          {/* Step-by-Step Melodic Sequence */}
          <div>
            <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
              <span>{t("clickNodeToPlay")}</span>
              <span>
                {t("totalSteps")}: {sayrData.steps.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
              {sayrData.steps.map((step, idx) => {
                const isActive = activeStepIndex === idx
                const pitchTheme = getPitchThemeClasses(step.pitch, "card", {
                  isSounding: isActive,
                })
                return (
                  <button
                    key={idx}
                    onClick={() => handlePlayStep(step, idx)}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border px-3 py-2 transition-all ${pitchTheme.combined}`}
                  >
                    <span className="font-mono text-[10px] opacity-75">
                      #{idx + 1}
                    </span>
                    <span className="my-0.5 font-mono text-sm font-bold">
                      {step.pitch.toScientificString()}
                    </span>
                    <span className="font-serif text-[10px] opacity-90">
                      {step.noteName}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Active Step Annotation Callout */}
            {activeStepIndex !== null && sayrData.steps[activeStepIndex] && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-500/30 bg-slate-950/80 p-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">
                      {sayrData.steps[activeStepIndex].phaseLabel}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      · Note: {sayrData.steps[activeStepIndex].noteName} (
                      {sayrData.steps[
                        activeStepIndex
                      ].pitch.toScientificString()}
                      )
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-200">
                    {sayrData.steps[activeStepIndex].annotation}
                  </p>
                </div>
                <Badge variant="muted" className="font-mono text-xs">
                  {sayrData.steps[activeStepIndex].durationBeats} Beats
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Qafla (Cadence) Validator */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
        <CardHeader className="border-border/60 border-b pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-lg">{t("qaflaEngine")}</CardTitle>
          </div>
          <CardDescription className="mt-1">
            {t("qaflaDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {t("tryPresets")}:
            </span>
            <Button
              variant="default"
              size="sm"
              onClick={() => setPresetPhrase("stepwise_tonic")}
            >
              {t("presetFullCadence")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresetPhrase("stepwise_ghammaz")}
            >
              {t("presetHalfCadence")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPresetPhrase("leap_invalid")}
            >
              {t("presetInvalidLeap")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-semibold">
                  {t("currentCadenceSequence")}:
                </span>
                <div className="flex items-center gap-1.5 font-mono text-base font-bold">
                  {qaflaPhrase.map((p, i) => {
                    const theme = getPitchThemeClasses(p, "badge")
                    return (
                      <span
                        key={i}
                        className={`rounded border px-2 py-0.5 ${theme.combined}`}
                      >
                        {p.toScientificString()}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {qaflaResult.isQafla ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                )}
                <span
                  className={`text-xs font-semibold ${qaflaResult.isQafla ? "text-emerald-300" : "text-rose-300"}`}
                >
                  {qaflaResult.reason}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestQafla}
              className="cursor-pointer gap-2 font-bold"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {t("auditionQafla")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modulation Engine: Three-Tier Categories (Abu Shumays) */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
        <CardHeader className="border-border/60 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-lg">
                Three-Tier Modulation Classifier (تصنيف الانتقال المقامي)
              </CardTitle>
            </div>
            <CardDescription className="mt-1">
              Based on Sami Abu Shumays' "Maqam Analysis: A Primer".
              Distinguishes between Category 1 (passing ornamental accidentals),
              Category 2 (internal jins-to-jins network moves), and Category 3
              (full structural maqam change).
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenModulation}
            className="shrink-0 cursor-pointer gap-2 self-start border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400 hover:text-white sm:self-auto"
          >
            <GitFork className="h-4 w-4 text-emerald-400" />
            <span>Open Modulation Pathways Tool</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-semibold">
                  {t("targetModulationMaqam")}:
                </label>
                <select
                  value={targetMaqamId}
                  onChange={(e) => setTargetMaqamId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  {MaqamatCatalogue.getAllMaqamat().map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Family: {m.family})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
                  <span>Passage Duration (Length of Excursion):</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {measureDuration} {t("measures")}
                  </Badge>
                </div>
                <Slider
                  min={1}
                  max={8}
                  step={1}
                  value={[measureDuration]}
                  onValueChange={(val) =>
                    setMeasureDuration(
                      Array.isArray(val)
                        ? val[0]
                        : typeof val === "number"
                          ? val
                          : measureDuration
                    )
                  }
                  className="my-3"
                />
                <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                  <span>&lt;1m (Cat 1: Ornamental)</span>
                  <span>1-4m (Cat 2: Internal)</span>
                  <span>4+m (Cat 3: Full Shift)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Classification Tier
                  </span>
                  <Badge
                    variant={
                      modulationAnalysis.category === "1_Ornamental"
                        ? "sky"
                        : modulationAnalysis.category === "2_Internal"
                          ? "emerald"
                          : "purple"
                    }
                    className="text-xs font-bold"
                  >
                    {modulationAnalysis.category === "1_Ornamental"
                      ? "Category 1: Ornamental"
                      : modulationAnalysis.category === "2_Internal"
                        ? "Category 2: Internal Jins-to-Jins"
                        : "Category 3: Full Maqam Change"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-white">
                  <span>{currentMaqam.name}</span>
                  <ArrowRight className="h-4 w-4 text-amber-400" />
                  <span>{targetMaqam.name}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {modulationAnalysis.description}
                </p>
              </div>
              <div className="text-muted-foreground mt-3 flex items-center justify-between border-t border-slate-900 pt-3 text-[11px]">
                <span>Family Relationship:</span>
                <span
                  className={`font-semibold ${modulationAnalysis.isSameFamily ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {modulationAnalysis.isSameFamily
                    ? "Intra-Family (Same Root Jins)"
                    : "Cross-Family (Alters Lower Jins)"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Terminology Guide Card */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
        <CardHeader className="border-border/60 border-b pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-lg">{t("termsGlossary")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                term: t("qararTerm"),
                explanation: t("qararExplanation"),
                tag: "Tonic",
              },
              {
                term: t("ghammazTerm"),
                explanation: t("ghammazExplanation"),
                tag: "Dominant Pivot",
              },
              {
                term: t("sayrTerm"),
                explanation: t("sayrExplanation"),
                tag: "Trajectory",
              },
              {
                term: t("qaflaTerm"),
                explanation: t("qaflaExplanation"),
                tag: "Cadence",
              },
              {
                term: t("jinsTerm"),
                explanation: t("jinsExplanation"),
                tag: "Trichord/Tetrachord",
              },
              {
                term: t("tanjeesTerm"),
                explanation: t("tanjeesExplanation"),
                tag: "Transient Modulation",
              },
              {
                term: t("intiqalTerm"),
                explanation: t("intiqalExplanation"),
                tag: "Structural Modulation",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400">
                    {item.term}
                  </h4>
                  <Badge
                    variant="outline"
                    className="border-slate-700 font-mono text-[10px] text-slate-400"
                  >
                    {item.tag}
                  </Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sayr Visualization Dialog */}
      <SayrVisualizationDialog
        open={showSayrDialog}
        onOpenChange={setShowSayrDialog}
        maqam={currentMaqam}
        timbre={timbre}
      />

      {/* Standalone Modulation Pathways Drawer */}
      {showModulationDrawerLocal && (
        <ModulationPathwaysDrawer
          open={showModulationDrawerLocal}
          onOpenChange={setShowModulationDrawerLocal}
          currentMaqam={currentMaqam}
          onSelectMaqam={onSelectMaqam}
          timbre={timbre}
        />
      )}
    </div>
  )
}
