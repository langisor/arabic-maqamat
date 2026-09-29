// src/components/SayrQaflaLab.tsx
import React, { useState, useEffect } from 'react';
import { Maqam, MaqamatCatalogue } from '../theory/maqam';
import { ArabicPitch } from '../core/pitch';
import { getPitchThemeClasses } from '../core/pitch-styling';
import { SayrEngine, SayrStep } from '../theory/sayr';
import { MicrotonalAudioEngine, TimbreType } from '../audio/microtonal-audio';
import { getWorkspaceState, updateWorkspaceDraft } from '../state/workspace-state';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Square, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Zap, BookOpen } from 'lucide-react';
import { useLanguage } from '../state/language';

interface Props {
  currentMaqam: Maqam;
  timbre: TimbreType;
  maqamRevision?: number;
}

export const SayrQaflaLab: React.FC<Props> = ({ currentMaqam, maqamRevision = 0, timbre }) => {
  const { t } = useLanguage();
  useEffect(() => () => {
    MicrotonalAudioEngine.stopSequence('sayr');
    MicrotonalAudioEngine.stopSequence('qafla');
  }, []);

  // Sayr state
  const sayrData = SayrEngine.getSayrForMaqam(currentMaqam.id) || SayrEngine.getSayrForMaqam('rast')!;
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isPlayingSayr, setIsPlayingSayr] = useState(false);
  // Modulation analysis state
  const [targetMaqamId, setTargetMaqamIdState] = useState<string>(
    () => getWorkspaceState().drafts.sayr.targetMaqamId
  );
  const [measureDuration, setMeasureDurationState] = useState<number>(
    () => getWorkspaceState().drafts.sayr.measureDuration
  );

  const setTargetMaqamId = (id: string) => {
    setTargetMaqamIdState(id);
    updateWorkspaceDraft('sayr', { targetMaqamId: id });
  };

  const setMeasureDuration = (dur: number) => {
    setMeasureDurationState(dur);
    updateWorkspaceDraft('sayr', { measureDuration: dur });
  };

  // Qafla tester state
  const [qaflaPhrase, setQaflaPhrase] = useState<ArabicPitch[]>([
    new ArabicPitch('E', '𝄳', 4),
    new ArabicPitch('D', '♮', 4),
    currentMaqam.getTonic()
  ]);

  const [previousMaqamKey, setPreviousMaqamKey] = useState(`${currentMaqam.id}:${maqamRevision}`);
  const maqamKey = `${currentMaqam.id}:${maqamRevision}`;
  if (maqamKey !== previousMaqamKey) {
    setPreviousMaqamKey(maqamKey);
    MicrotonalAudioEngine.stopSequence('sayr');
    MicrotonalAudioEngine.stopSequence('qafla');
    setActiveStepIndex(null);
    setIsPlayingSayr(false);
    setQaflaPhrase([currentMaqam.getGhammaz(), currentMaqam.getTonic().transpose(2), currentMaqam.getTonic()]);
  }


  const targetMaqam = MaqamatCatalogue.findById(targetMaqamId) || MaqamatCatalogue.buildNahawand();
  const modulationAnalysis = SayrEngine.analyzeModulation(currentMaqam, targetMaqam, measureDuration);
  const qaflaResult = SayrEngine.isIdiomaticQafla(qaflaPhrase, currentMaqam);

  // Play whole Sayr sequence
  const handlePlaySayr = () => {
    if (isPlayingSayr) {
      MicrotonalAudioEngine.stopSequence('sayr');
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
      },
      undefined,
      'sayr'
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
      undefined,
      undefined,
      'qafla'
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
                  {t('melodicProgressionScience')}
                </span>
                <Badge variant="purple" className="text-[10px]">
                  {t('canonicalSayrPhases')}
                </Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl mt-1">
                {t('sayrTitle')}: {currentMaqam.name}
              </CardTitle>
              <CardDescription className="text-xs text-slate-300 mt-1 max-w-2xl">
                {t('sayrDescription')}
              </CardDescription>
            </div>

            <Button
              variant={isPlayingSayr ? "destructive" : "amber"}
              onClick={handlePlaySayr}
              className="gap-2"
            >
              {isPlayingSayr ? <Square className="fill-current" /> : <Play className="fill-current" />}
              {isPlayingSayr ? t('stopSayr') : t('playFullSayr')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 5 Phase Progress Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {[
              { phase: '1_EstablishTonic', num: '1', title: t('phase1Tonic'), arabic: 'تثبيت القرار', badgeVariant: 'emerald' as const },
              { phase: '2_AscendToGhammaz', num: '2', title: t('phase2Ghammaz'), arabic: 'الصعود للغمّاز', badgeVariant: 'sky' as const },
              { phase: '3_UpperExploration_Or_Modulation', num: '3', title: t('phase3Apex'), arabic: 'الذروة والتحويل', badgeVariant: 'purple' as const },
              { phase: '4_DescentReturn', num: '4', title: t('phase4Descent'), arabic: 'الهبوط والعودة', badgeVariant: 'amber' as const },
              { phase: '5_Qafla', num: '5', title: t('phase5Qafla'), arabic: 'القَفْلَة الختامية', badgeVariant: 'rose' as const }
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
              <span>{t('clickNodeToPlay')}</span>
              <span>{t('totalSteps')}: {sayrData.steps.length}</span>
            </div>

            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
              {sayrData.steps.map((step, idx) => {
                const isActive = activeStepIndex === idx;
                const pitchTheme = getPitchThemeClasses(step.pitch, 'card', { isSounding: isActive });

                return (
                  <button
                    key={idx}
                    onClick={() => handlePlayStep(step, idx)}
                    className={`px-3 py-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${pitchTheme.combined}`}
                  >
                    <span className="text-[10px] font-mono opacity-75">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold font-mono my-0.5">
                      {step.pitch.toScientificString()}
                    </span>
                    <span className="text-[10px] font-serif opacity-90">
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
              {t('qaflaEngine')}
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            {t('qaflaDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Preset Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{t('tryPresets')}:</span>
            <Button
              variant="emeraldOutline"
              size="sm"
              onClick={() => setPresetPhrase('stepwise_tonic')}
            >
              ✓ {t('presetFullCadence')}
            </Button>
            <Button
              variant="skyOutline"
              size="sm"
              onClick={() => setPresetPhrase('stepwise_ghammaz')}
            >
              ✓ {t('presetHalfCadence')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPresetPhrase('leap_invalid')}
            >
              ✕ {t('presetInvalidLeap')}
            </Button>
          </div>

          {/* Phrase Display & Evaluation Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">{t('currentCadenceSequence')}:</span>
                <div className="flex items-center gap-1.5 font-mono text-base font-bold">
                  {qaflaPhrase.map((p, i) => {
                    const theme = getPitchThemeClasses(p, 'badge');
                    return (
                      <span key={i} className={`px-2 py-0.5 rounded border ${theme.combined}`}>
                        {p.toScientificString()}
                      </span>
                    );
                  })}
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
              {t('auditionQafla')}
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
              {t('modulationEngine')}
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            {t('modulationDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Controls */}
            <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t('targetModulationMaqam')}:
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
                  <span>{t('passageDuration')}:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {measureDuration} {t('measures')}
                  </Badge>
                </div>
                <Slider
                  min={1}
                  max={8}
                  step={1}
                  value={[measureDuration]}
                  onValueChange={(val) => setMeasureDuration(Array.isArray(val) ? val[0] : (typeof val === 'number' ? val : measureDuration))}
                  className="my-3"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>{t('transientTanjees')}</span>
                  <span>{t('structuralIntiqal')}</span>
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

      {/* Modal Terminology Guide Card */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <CardTitle className="text-lg">
              {t('termsGlossary')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { term: t('qararTerm'), explanation: t('qararExplanation'), tag: 'Tonic' },
              { term: t('ghammazTerm'), explanation: t('ghammazExplanation'), tag: 'Dominant Pivot' },
              { term: t('sayrTerm'), explanation: t('sayrExplanation'), tag: 'Trajectory' },
              { term: t('qaflaTerm'), explanation: t('qaflaExplanation'), tag: 'Cadence' },
              { term: t('jinsTerm'), explanation: t('jinsExplanation'), tag: 'Trichord/Tetrachord' },
              { term: t('tanjeesTerm'), explanation: t('tanjeesExplanation'), tag: 'Transient Modulation' },
              { term: t('intiqalTerm'), explanation: t('intiqalExplanation'), tag: 'Structural Modulation' }
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400">{item.term}</h4>
                  <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-400">
                    {item.tag}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
