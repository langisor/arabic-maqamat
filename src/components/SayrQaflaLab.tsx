// src/components/SayrQaflaLab.tsx
import React, { useState } from 'react';
import { Maqam, MaqamatCatalogue } from '../theory/maqam';
import { ArabicPitch } from '../core/pitch';
import { SayrEngine, SayrStep } from '../theory/sayr';
import { MicrotonalAudioEngine, TimbreType } from '../audio/microtonal-audio';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Square, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Zap } from 'lucide-react';

interface Props {
  currentMaqam: Maqam;
  timbre: TimbreType;
}

export const SayrQaflaLab: React.FC<Props> = ({ currentMaqam, timbre }) => {
  // Sayr state
  const sayrData = SayrEngine.getSayrForMaqam(currentMaqam.id) || SayrEngine.getSayrForMaqam('rast')!;
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isPlayingSayr, setIsPlayingSayr] = useState(false);

  // Modulation analysis state
  const [targetMaqamId, setTargetMaqamId] = useState<string>('nahawand');
  const [measureDuration, setMeasureDuration] = useState<number>(2);

  // Qafla tester state
  const [qaflaPhrase, setQaflaPhrase] = useState<ArabicPitch[]>([
    new ArabicPitch('E', '𝄳', 4),
    new ArabicPitch('D', '♮', 4),
    currentMaqam.getTonic()
  ]);

  const targetMaqam = MaqamatCatalogue.findById(targetMaqamId) || MaqamatCatalogue.buildNahawand();
  const modulationAnalysis = SayrEngine.analyzeModulation(currentMaqam, targetMaqam, measureDuration);
  const qaflaResult = SayrEngine.isIdiomaticQafla(qaflaPhrase, currentMaqam);

  // Play whole Sayr sequence
  const handlePlaySayr = () => {
    if (isPlayingSayr) {
      MicrotonalAudioEngine.stopSequence();
      setIsPlayingSayr(false);
      setActiveStepIndex(null);
      return;
    }

    setIsPlayingSayr(true);
    const pitches = sayrData.steps.map(s => s.pitch);

    MicrotonalAudioEngine.playSequence(
      pitches,
      600,
      timbre,
      (idx) => {
        setActiveStepIndex(idx === -1 ? null : idx);
      },
      () => {
        setIsPlayingSayr(false);
        setActiveStepIndex(null);
      }
    );
  };

  const handlePlayStep = (step: SayrStep, index: number) => {
    setActiveStepIndex(index);
    MicrotonalAudioEngine.playPitch(step.pitch, step.durationBeats * 0.5, timbre);
  };

  const handleTestQafla = () => {
    MicrotonalAudioEngine.playSequence(
      qaflaPhrase,
      500,
      timbre,
      undefined,
      undefined
    );
  };

  const setPresetPhrase = (type: 'stepwise_tonic' | 'stepwise_ghammaz' | 'leap_invalid') => {
    const tonic = currentMaqam.getTonic();
    const ghammaz = currentMaqam.getGhammaz();

    if (type === 'stepwise_tonic') {
      const pen = tonic.transpose(3);
      const prep = tonic.transpose(6);
      setQaflaPhrase([prep, pen, tonic]);
    } else if (type === 'stepwise_ghammaz') {
      const pen = ghammaz.transpose(4);
      setQaflaPhrase([pen, ghammaz]);
    } else {
      const pen = tonic.transpose(9);
      setQaflaPhrase([pen, tonic]);
    }
  };

  return (
    <div className="space-y-6">
      {/* 5-Phase Sayr Architecture */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-5 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                  Melodic Progression Science
                </span>
                <Badge variant="purple" className="text-[10px]">
                  5 Canonical Sayr Phases
                </Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl mt-1">
                Sayr (السير) Melodic Trajectory: {currentMaqam.name}
              </CardTitle>
              <CardDescription className="text-xs text-slate-300 mt-1 max-w-2xl">
                Unlike a static Western scale, a Maqam is defined by its <em>Sayr</em> — the directional path, order of pitch exploration, pivot arrivals, and resolution formula.
              </CardDescription>
            </div>

            <Button
              variant={isPlayingSayr ? "destructive" : "amber"}
              onClick={handlePlaySayr}
              className="gap-2"
            >
              {isPlayingSayr ? <Square className="fill-current" /> : <Play className="fill-current" />}
              {isPlayingSayr ? 'Stop Sayr' : 'Play Full Sayr Path'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 5 Phase Progress Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {[
              { phase: '1_EstablishTonic', num: '1', title: 'Establish Tonic', arabic: 'تثبيت القرار', badgeVariant: 'emerald' as const },
              { phase: '2_AscendToGhammaz', num: '2', title: 'Ascent to Pivot', arabic: 'الصعود للغمّاز', badgeVariant: 'sky' as const },
              { phase: '3_UpperExploration_Or_Modulation', num: '3', title: 'Upper Apex / Mod.', arabic: 'الذروة والتحويل', badgeVariant: 'purple' as const },
              { phase: '4_DescentReturn', num: '4', title: 'Descent Return', arabic: 'الهبوط والعودة', badgeVariant: 'amber' as const },
              { phase: '5_Qafla', num: '5', title: 'Cadential Qafla', arabic: 'القَفْلَة الختامية', badgeVariant: 'rose' as const }
            ].map((item) => (
              <div key={item.phase} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Badge variant={item.badgeVariant} className="text-[10px] font-mono">
                    Phase {item.num}
                  </Badge>
                  <span className="text-xs font-serif font-bold text-slate-400">{item.arabic}</span>
                </div>
                <span className="text-xs font-bold text-white mt-2">{item.title}</span>
              </div>
            ))}
          </div>

          {/* Step-by-Step Melodic Sequence */}
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
              <span>Melodic Trajectory (Click any node to play &amp; inspect note annotation)</span>
              <span>Total Steps: {sayrData.steps.length}</span>
            </div>

            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
              {sayrData.steps.map((step, idx) => {
                const isActive = activeStepIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handlePlayStep(step, idx)}
                    className={`px-3 py-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 scale-110 shadow-lg z-10'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span className={`text-[10px] font-mono ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold font-mono my-0.5">
                      {step.pitch.toScientificString()}
                    </span>
                    <span className={`text-[10px] font-serif ${isActive ? 'text-slate-900 font-semibold' : 'text-amber-400'}`}>
                      {step.noteName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Step Annotation Callout */}
            {activeStepIndex !== null && sayrData.steps[activeStepIndex] && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">{sayrData.steps[activeStepIndex].phaseLabel}</span>
                    <span className="text-xs text-muted-foreground">• Note: {sayrData.steps[activeStepIndex].noteName} ({sayrData.steps[activeStepIndex].pitch.toScientificString()})</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1 font-medium">
                    {sayrData.steps[activeStepIndex].annotation}
                  </p>
                </div>
                <Badge variant="muted" className="text-xs font-mono">
                  {sayrData.steps[activeStepIndex].durationBeats} Beats
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Qafla (Cadence) Validator */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <CardTitle className="text-lg">
              Qafla (القَفْلَة) Cadence Validation Engine
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            In Arabic music, a <strong className="text-amber-300">Qafla</strong> is the distinctive cadential phrase that punctuates musical sentences. Authentic Qaflas require an idiomatic stepwise descent landing securely on the tonic (قرار) for a full cadence or the Ghammaz (غمّاز) for a half cadence.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Preset Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Try Presets:</span>
            <Button
              variant="emeraldOutline"
              size="sm"
              onClick={() => setPresetPhrase('stepwise_tonic')}
            >
              ✓ Authentic Full Cadence (Tonic)
            </Button>
            <Button
              variant="skyOutline"
              size="sm"
              onClick={() => setPresetPhrase('stepwise_ghammaz')}
            >
              ✓ Authentic Half Cadence (Ghammaz)
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPresetPhrase('leap_invalid')}
            >
              ✕ Invalid Leap Cadence
            </Button>
          </div>

          {/* Phrase Display & Evaluation Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Current Cadence Sequence:</span>
                <div className="flex items-center gap-1.5 font-mono text-base font-bold text-amber-300">
                  {qaflaPhrase.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {p.toScientificString()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {qaflaResult.isQafla ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className={`text-xs font-semibold ${qaflaResult.isQafla ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {qaflaResult.reason}
                </span>
              </div>
            </div>

            <Button
              variant="amber"
              size="sm"
              onClick={handleTestQafla}
              className="gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Audition Qafla Cadence
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modulation Engine: Tanjees vs Intiqal */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <CardTitle className="text-lg">
              Modulation Engine: Tanjees (تنجيس) vs. Intiqal (انتقال)
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            Evaluate transitions between the current active Maqam (<strong className="text-amber-300">{currentMaqam.name}</strong>) and any target destination. Short borrowings (&le; 2 measures) are analyzed as <strong className="text-cyan-300">Tanjees</strong> (flavor infusion), while longer shifts are structural <strong className="text-purple-300">Intiqal</strong>.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Controls */}
            <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Target Modulation Maqam:
                </label>
                <select
                  value={targetMaqamId}
                  onChange={(e) => setTargetMaqamId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {MaqamatCatalogue.getAllMaqamat().map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Family: {m.family})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Passage Duration:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {measureDuration} Measures
                  </Badge>
                </div>
                <Slider
                  min={1}
                  max={8}
                  step={1}
                  value={[measureDuration]}
                  onValueChange={(val) => setMeasureDuration(val[0])}
                  className="my-3"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>1-2 Meas. (Transient / Tanjees)</span>
                  <span>3+ Meas. (Structural / Intiqal)</span>
                </div>
              </div>
            </div>

            {/* Analysis Result */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Modulation Classification
                  </span>
                  <Badge
                    variant={
                      modulationAnalysis.type === 'Tanjees'
                        ? 'sky'
                        : modulationAnalysis.type === 'Intiqal'
                        ? 'purple'
                        : 'muted'
                    }
                  >
                    {modulationAnalysis.type}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-white">
                  <span>{currentMaqam.name}</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                  <span>{targetMaqam.name}</span>
                </div>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {modulationAnalysis.description}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Family Relationship:</span>
                <span className={`font-semibold ${modulationAnalysis.isSameFamily ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {modulationAnalysis.isSameFamily ? 'Intra-Family (Same Root Jins)' : 'Cross-Family (Alters Lower Jins)'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
