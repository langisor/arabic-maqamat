// src/components/ViolinFingerboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { ArabicPitch } from '../core/pitch';
import { Maqam } from '../theory/maqam';
import {
  ViolinErgonomicsEngine,
  ViolinStringName,
  ViolinPositionNumber,
  ViolinPositionMode,
  ViolinFingerPlacement,
} from '../violin/ergonomics';
import { MicrotonalAudioEngine, TimbreType } from '../audio/microtonal-audio';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
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
} from 'lucide-react';
import { useLanguage } from '../state/language';
import { getWorkspaceState, updateWorkspaceDraft } from '../state/workspace-state';

export type ViolinTuningPreset = 'standard' | 'arabic' | 'western';

interface ViolinFingerboardProps {
  currentMaqam: Maqam;
  timbre?: TimbreType;
  tuning?: ViolinTuningPreset;
  onTuningChange?: (tuning: ViolinTuningPreset) => void;
  onPitchSelect?: (pitch: ArabicPitch) => void;
}

export const ViolinFingerboard: React.FC<ViolinFingerboardProps> = ({
  currentMaqam,
  timbre = 'violin',
  tuning = 'western',
  onTuningChange,
  onPitchSelect,
}) => {
  const { language, t } = useLanguage();
  const ui = language === 'ar'
    ? {
        title: 'لوحة أصابع الكمان',
        subtitle: 'مواضع أصابع ميكروتونية بنظام ٢٤ درجة، وضبط الكمان العربي التقليدي (صول - ري - صول - ري).',
        tuning: 'الضبط',
        arabicTuning: 'عربي (صول-ري-صول-ري)',
        westernTuning: 'غربي (صول-ري-لا-مي)',
        position: 'الموضع',
        auto: 'تلقائي',
        reverseStrings: 'عكس ترتيب الأوتار',
        reversed: 'معكوس',
        horizontal: 'أفقي',
        vertical: 'عمودي',
        hideTips: 'إخفاء الإرشادات',
        showTips: 'إرشادات العزف',
        mode: 'الوضع',
        standard: 'قياسي',
        reversedMode: 'معكوس',
        tonic: 'القرار',
        ghammaz: 'الغمّاز',
        scale: 'السلم',
        swipe: 'اسحب أفقياً أو اختر العرض العمودي',
        nutOpen: 'العظمة (مفتوح)',
        semitone: 'نصف بُعد',
        wholeTone: 'بُعد كامل (الموضع الأول)',
        neutralThird: 'الثالثة المحايدة',
        majorThird: 'الثالثة الكبيرة',
        perfectFourth: 'الرابعة التامة',
        tritone: 'ثلاثة أبعاد',
        perfectFifth: 'الخامسة التامة',
        playPitch: 'اعزف النغمة',
        finger: 'الإصبع',
        string: 'الوتر',
        maqamDegree: 'درجة المقام',
        guidelines: 'إرشادات أداء الكمان العربي',
        arabicTuningTip: 'الضبط العربي (صول-ري-صول-ري): يوفّر خفض الوترين الثالث والرابع رنيناً متآلفاً لمقامي الراست والبياتي.',
        quarterToneTip: 'موضع ربع الصوت المحايد: يوضع الإصبع بين علامة نصف البعد والبُعد الكامل، بفارق يقارب ٥٠ سنتاً.',
        activePosition: 'الموضع والانتقالات',
        autoDescription: 'الوضع التلقائي: يحسب أصابع الموضع الأول الأكثر ملاءمة مع الاستفادة من الأوتار المطلقة وتقليل الانتقالات.',
      }
    : {
        title: 'Violin Fingerboard',
        subtitle: '24-EDO microtonal finger placements and traditional Arabic violin tuning (G-D-G-D)',
        tuning: 'Tuning:',
        arabicTuning: 'Arabic (G-D-G-D)',
        westernTuning: 'Western (G-D-A-E)',
        position: 'Position:',
        auto: 'Auto',
        reverseStrings: 'Reverse Strings',
        reversed: 'Rev',
        horizontal: 'Horizontal',
        vertical: 'Vertical',
        hideTips: 'Hide Tips',
        showTips: 'Pedagogy Tips',
        mode: 'Mode',
        standard: 'Standard',
        reversedMode: 'Reversed',
        tonic: 'Tonic',
        ghammaz: 'Ghammaz',
        scale: 'Scale',
        swipe: 'Swipe horizontally or select Vertical for upright view',
        nutOpen: 'Nut (Open)',
        semitone: '½-tone',
        wholeTone: 'Whole tone (1st)',
        neutralThird: 'Neutral 3rd',
        majorThird: 'Maj 3rd',
        perfectFourth: 'Perf 4th',
        tritone: 'Tritone',
        perfectFifth: 'Perf 5th',
        playPitch: 'Play Pitch',
        finger: 'Finger',
        string: 'String',
        maqamDegree: 'Maqam Degree',
        guidelines: 'Arabic Violin Pedagogical Guidelines',
        arabicTuningTip: 'Arabic Tuning (G-D-G-D): Re-tuning the A string down to G4 and E string down to D5 provides rich sympathetic resonance for Rast and Bayati.',
        quarterToneTip: 'Neutral Quarter-Tone Placement: Place the finger halfway between the semitone and whole-tone marks (approximately 50 cents sharp from the flat).',
        activePosition: 'Active Position & Shifts',
        autoDescription: 'Auto Mode: Computes ergonomic first-position fingering with useful open strings and minimal shifts.',
      };
  const [selectedPosition, setSelectedPosition] = useState<ViolinPositionMode>('auto');
  const [activePlayedPitch, setActivePlayedPitch] = useState<string | null>(null);
  const [isPlayingScale, setIsPlayingScale] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<ViolinFingerPlacement | null>(null);
  const [showPedagogicalTips, setShowPedagogicalTips] = useState(false);
  const [isReversedStrings, setIsReversedStrings] = useState<boolean>(true);
  const [orientation, setOrientationState] = useState<'horizontal' | 'vertical'>(
    () => getWorkspaceState().drafts.violin.orientation
  );

  const setOrientation = (nextOrientation: 'horizontal' | 'vertical') => {
    setOrientationState(nextOrientation);
    updateWorkspaceDraft('violin', { orientation: nextOrientation });
  };

  // Strings according to tuning
  const tuningStrings: { name: ViolinStringName; label: string; arabicLabel: string; rootPitch: ArabicPitch }[] = useMemo(() => {
    if (tuning === 'arabic') {
      return [
        { name: 'G', label: 'G3', arabicLabel: 'يكاه · صول', rootPitch: new ArabicPitch('G', '♮', 3) },
        { name: 'D', label: 'D4', arabicLabel: 'دوكاه · ري', rootPitch: new ArabicPitch('D', '♮', 4) },
        { name: 'A', label: 'G4', arabicLabel: 'نوى · صول', rootPitch: new ArabicPitch('G', '♮', 4) },
        { name: 'E', label: 'D5', arabicLabel: 'محير · ري', rootPitch: new ArabicPitch('D', '♮', 5) },
      ];
    }
    return [
      { name: 'G', label: 'G3', arabicLabel: 'يكاه · صول', rootPitch: new ArabicPitch('G', '♮', 3) },
      { name: 'D', label: 'D4', arabicLabel: 'دوكاه · ري', rootPitch: new ArabicPitch('D', '♮', 4) },
      { name: 'A', label: 'A4', arabicLabel: 'حسيني · لا', rootPitch: new ArabicPitch('A', '♮', 4) },
      { name: 'E', label: 'E5', arabicLabel: 'جواب · مي', rootPitch: new ArabicPitch('E', '♮', 5) },
    ];
  }, [tuning]);

  // Displayed strings (supports Reverse Strings toggle)
  const displayedStrings = useMemo(() => {
    return isReversedStrings ? [...tuningStrings].reverse() : tuningStrings;
  }, [tuningStrings, isReversedStrings]);

  // Acoustic line thickness based on string gauge
  const getStringThickness = (name: ViolinStringName) => {
    switch (name) {
      case 'G': return 3.6;
      case 'D': return 2.8;
      case 'A': return 2.1;
      case 'E': return 1.5;
      default: return 2.2;
    }
  };

  // Ergonomic placements for the current maqam notes
  const scalePitches = useMemo(() => currentMaqam.getScale(), [currentMaqam]);
  const tonic = useMemo(() => currentMaqam.getTonic(), [currentMaqam]);
  const ghammaz = useMemo(() => currentMaqam.getGhammaz(), [currentMaqam]);
  const positionTapes = useMemo(
    () =>
      ([4, 8, 10, 14] as const).map((quarterTones, index) => {
        const distanceRatio =
          ViolinErgonomicsEngine.calculateFingerStopRatio(quarterTones);
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
        };
      }),
    []
  );

  const placements = useMemo(() => {
    const posNum: ViolinPositionNumber = selectedPosition === 'auto' ? 1 : selectedPosition;
    return scalePitches.map((pitch) =>
      ViolinErgonomicsEngine.mapPitchToPosition(pitch, posNum)
    );
  }, [scalePitches, selectedPosition]);

  const playScale = async () => {
    try {
      await MicrotonalAudioEngine.startAudioContext();
      MicrotonalAudioEngine.playSequence(
        scalePitches,
        500,
        timbre,
        (index) => {
          setActivePlayedPitch(index < 0 ? null : scalePitches[index].toString());
        },
        () => setIsPlayingScale(false),
        undefined,
        'violin-fingerboard-sequence',
      );
      setIsPlayingScale(true);
    } catch {
      setIsPlayingScale(false);
      setActivePlayedPitch(null);
    }
  };

  const stopScale = () => {
    MicrotonalAudioEngine.stopSequence('violin-fingerboard-sequence');
    setIsPlayingScale(false);
    setActivePlayedPitch(null);
  };

  useEffect(() => () => {
    MicrotonalAudioEngine.stopSequence('violin-fingerboard-sequence');
  }, []);

  const handlePlayPitch = async (pitch: ArabicPitch, placement?: ViolinFingerPlacement) => {
    setActivePlayedPitch(pitch.toString());
    if (placement) {
      setSelectedPlacement(placement);
    }
    if (onPitchSelect) {
      onPitchSelect(pitch);
    }
    try {
      await MicrotonalAudioEngine.playPitch(pitch, 0.7, timbre);
    } catch {
      // Audio autoplay handled
    }
    setTimeout(() => {
      setActivePlayedPitch(null);
    }, 700);
  };

  return (
    <div
      className="space-y-4 sm:space-y-6"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header & Controls - Fully Responsive */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <span>{ui.title}</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 leading-relaxed">
            {ui.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Tuning Preset Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-slate-400 px-1.5 sm:px-2 font-medium text-[11px] sm:text-xs">{ui.tuning}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onTuningChange?.('arabic')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  tuning === 'arabic'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ui.arabicTuning}
              </button>
              <button
                onClick={() => onTuningChange?.('western')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  tuning === 'western' || tuning === 'standard'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ui.westernTuning}
              </button>
            </div>
          </div>

          {/* Position Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 px-1.5 sm:px-2 font-medium text-[11px] sm:text-xs">{ui.position}</span>
            {(['auto', 1, 2, 3, 4] as ViolinPositionMode[]).map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  selectedPosition === pos
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pos === 'auto' ? ui.auto : language === 'ar' ? `${pos}` : `${pos}st`}
              </button>
            ))}
          </div>

          {/* Reverse Strings Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReversedStrings(!isReversedStrings)}
            className={`h-8 text-xs font-semibold px-2.5 rounded-xl border transition-all cursor-pointer ${
              isReversedStrings
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                : 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
            title={ui.reverseStrings}
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-amber-400" />
            <span>{ui.reverseStrings}</span>
            {isReversedStrings && (
              <span className="font-mono text-[10px] text-amber-300 bg-amber-500/30 px-1 py-0.2 rounded ml-1">
                {ui.reversed}
              </span>
            )}
          </Button>

          {/* Orientation Toggle: Horizontal vs Vertical */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setOrientation('horizontal')}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                orientation === 'horizontal'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={ui.horizontal}
            >
              <Rows className="w-3 h-3" />
              <span>{ui.horizontal}</span>
            </button>
            <button
              type="button"
              onClick={() => setOrientation('vertical')}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                orientation === 'vertical'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={ui.vertical}
            >
              <Columns className="w-3 h-3" />
              <span>{ui.vertical}</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPedagogicalTips(!showPedagogicalTips)}
            className="text-xs text-slate-400 hover:text-slate-200 ml-auto lg:ml-0 h-8"
          >
            <Info className="w-3.5 h-3.5 mr-1" />
            {showPedagogicalTips ? ui.hideTips : ui.showTips}
          </Button>
        </div>
      </div>

      {/* Main Interactive Fingerboard Display */}
      <Card className="bg-slate-950 border-slate-800 overflow-hidden shadow-2xl">
        <CardHeader className="p-3.5 sm:p-5 border-b border-slate-900 bg-slate-900/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <CardTitle className="text-sm sm:text-base text-slate-200 flex items-center gap-2">
                <span>
                  {language === 'ar' ? currentMaqam.arabicName : `Maqam ${currentMaqam.name}`}
                </span>
                <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                  {ui.mode}: {orientation === 'horizontal' ? ui.horizontal : ui.vertical} · {isReversedStrings ? ui.reversedMode : ui.standard}
                </Badge>
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                {ui.tonic}: <span className="text-amber-300 font-semibold">{tonic.toString()}</span> • {ui.ghammaz}:{' '}
                <span className="text-emerald-300 font-semibold">{ghammaz.toString()}</span>
              </CardDescription>
            </div>

            {/* Responsive Color Legend */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-200 inline-block" /> {ui.tonic}
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-200 inline-block" /> {ui.ghammaz}
              </span>
              <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-200 inline-block" /> {ui.scale}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-6">
          <div
            className="mb-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5"
            aria-label={`${currentMaqam.name} ${ui.scale}`}
          >
            {scalePitches.map((pitch, index) => (
              <span
                key={`${pitch.toQuarterToneIndex()}-${index}`}
                className={`rounded-lg px-2.5 py-1 font-mono text-sm font-bold transition-all sm:text-base ${
                  activePlayedPitch === pitch.toString()
                    ? 'scale-110 bg-amber-300 text-slate-950 ring-2 ring-white'
                    : index === 0
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-sky-950 text-sky-100'
                }`}
              >
                {pitch.toString()}
              </span>
            ))}
            {isPlayingScale ? (
              <Button type="button" variant="amberOutline" size="sm" onClick={stopScale}>
                <Square className="h-3.5 w-3.5" />
                {t('stopMaqam')}
              </Button>
            ) : (
              <Button type="button" variant="amber" size="sm" onClick={() => void playScale()}>
                <Play className="h-3.5 w-3.5" />
                {t('playMaqam')}
              </Button>
            )}
          </div>
          {/* HORIZONTAL ORIENTATION VIEW */}
          {orientation === 'horizontal' && (
            <>
              {/* Mobile Horizontal Scroll Hint */}
              <div className="flex md:hidden items-center justify-between text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-500/25 px-3 py-1.5 rounded-xl mb-3">
                <span className="flex items-center gap-1.5">
                  <span>↔</span>
                  <span>{ui.swipe}</span>
                </span>
              </div>

              {/* Fingerboard Neck Container with smooth touch scrolling */}
              <div className="relative overflow-x-auto pb-3 touch-pan-x scrollbar-thin">
                <div className="min-w-[780px] sm:min-w-[850px] relative bg-stone-900/90 rounded-2xl p-4 sm:p-6 border-2 border-stone-800 shadow-inner select-none">
                  {/* Wooden fingerboard texture simulation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 opacity-80 pointer-events-none rounded-2xl" />

                  {/* Nut indicator */}
                  <div className="absolute left-20 sm:left-24 top-3 sm:top-4 bottom-3 sm:bottom-4 w-2 bg-stone-200 rounded-sm shadow-md z-10">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold text-stone-400 tracking-wider">
                      NUT
                    </div>
                  </div>

                  {/* Fret / Interval Position Guides */}
                  <div className="relative h-64 sm:h-68 flex flex-col justify-between py-2 sm:py-4">
                    <div className="pointer-events-none absolute inset-y-2 left-[5.5rem] right-0 z-[5] sm:inset-y-4 sm:left-[6.75rem]">
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
                      const stringPlacements = placements.filter((p) => p.string === str.name);
                      const thickness = getStringThickness(str.name);

                      return (
                        <div key={str.name} className="relative flex items-center h-12 sm:h-13">
                          {/* String Header */}
                          <div className="w-20 sm:w-24 shrink-0 flex flex-col items-start pr-1 sm:pr-2 z-20">
                            <span className="text-[11px] sm:text-xs font-bold text-amber-300 truncate w-full">
                              {language === 'ar' ? str.arabicLabel : str.label}
                            </span>
                          </div>

                          {/* String Line (physically accurate thickness based on string gauge) */}
                          <div className="relative flex-1 h-full flex items-center ml-2 sm:ml-3">
                            <div
                              className="w-full bg-gradient-to-r from-amber-200 via-stone-300 to-amber-100 rounded-full shadow-sm"
                              style={{
                                height: `${thickness}px`,
                                opacity: 0.85,
                              }}
                            />

                            {/* Open String Button with comfortable touch hitbox */}
                            <button
                              onClick={() => handlePlayPitch(str.rootPitch)}
                              className={`absolute left-0 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-20 transition-all cursor-pointer ${
                                activePlayedPitch === str.rootPitch.toString()
                                  ? 'bg-amber-400 text-slate-950 scale-125 shadow-lg border-white ring-2 ring-amber-300'
                                  : 'bg-stone-800 border-stone-600 text-stone-300 hover:border-amber-400 active:scale-95'
                              }`}
                              title={`Open string 0: ${str.rootPitch.toString()}`}
                            >
                              0
                            </button>

                            {/* Finger Placements for this string */}
                            {stringPlacements.map((placement, pIdx) => {
                              const isTonic = tonic.equals(placement.pitch);
                              const isGhammaz = ghammaz.equals(placement.pitch);
                              const isPlayed = activePlayedPitch === placement.pitch.toString();
                              const isSelected = selectedPlacement?.pitch.equals(placement.pitch);

                              // Calculate distance along neck (scaled 0 to 100%)
                              const leftPercent = Math.min(
                                92,
                                Math.max(4, 4 + (placement.distanceRatioFromNut / 0.4) * 88)
                              );

                              // Colors based on role
                              let badgeBg = 'bg-sky-600 border-sky-300 text-white';
                              if (isTonic) {
                                badgeBg = 'bg-amber-500 border-amber-200 text-slate-950 font-black ring-2 ring-amber-400/50';
                              } else if (isGhammaz) {
                                badgeBg = 'bg-emerald-600 border-emerald-200 text-white font-bold ring-2 ring-emerald-400/50';
                              }

                              return (
                                <div
                                  key={`${placement.string}-${placement.pitch.toString()}-${pIdx}`}
                                  className="absolute -translate-x-1/2 z-20 flex flex-col items-center group cursor-pointer"
                                  style={{ left: `${leftPercent}%` }}
                                  onClick={() => handlePlayPitch(placement.pitch, placement)}
                                >
                                  {/* Invisible expanded touch hitbox for mobile fingertips */}
                                  <span className="absolute -inset-2.5 sm:-inset-1.5" />

                                  {/* Finger placement bead */}
                                  <div
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs shadow-md transition-all transform group-hover:scale-125 active:scale-95 ${badgeBg} ${
                                      isPlayed ? 'scale-125 ring-4 ring-white animate-pulse' : ''
                                    } ${isSelected ? 'ring-2 ring-white scale-110' : ''}`}
                                  >
                                    {placement.finger}
                                  </div>

                                  {/* Visible note name pill for mobile legibility */}
                                  <span className="text-[9px] font-mono font-semibold text-slate-300 mt-0.5 whitespace-nowrap bg-stone-950/85 px-1 py-0.2 rounded border border-stone-700/60 leading-none shadow-xs">
                                    {placement.pitch.toString()}
                                  </span>

                                  {/* Desktop hover tooltip */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 border border-slate-700 text-slate-100 text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30 hidden sm:block">
                                    {placement.pitch.toString()} • {placement.noteAnnotation} (Finger {placement.finger})
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fret labels along bottom */}
                  <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-stone-500 border-t border-stone-800 pt-2.5 mt-2 px-16 sm:px-20 overflow-hidden">
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
          {orientation === 'vertical' && (
            <div className="relative max-w-xl mx-auto w-full bg-stone-900/90 rounded-2xl p-4 sm:p-6 border-2 border-stone-800 shadow-inner select-none">
              {/* Wooden fingerboard texture simulation */}
              <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 opacity-80 pointer-events-none rounded-2xl" />

              {/* String Headers row above the Nut */}
              <div className="relative z-20 grid grid-cols-4 gap-2 sm:gap-4 mb-2.5 text-center pr-12 sm:pr-14">
                {displayedStrings.map((str) => (
                  <div key={str.name} className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-bold text-amber-300">
                      {language === 'ar' ? str.arabicLabel : str.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Horizontal Nut indicator across the neck */}
              <div className="relative z-10 w-full pr-12 sm:pr-14 mb-4">
                <div className="h-2.5 bg-stone-200 rounded-sm shadow-md w-full relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold text-stone-400 tracking-wider">
                    {language === 'ar' ? 'عظمة المشط' : 'Nut'}
                  </div>
                </div>
              </div>

              {/* Main Vertical Fingerboard Playing Board with Fret Grid */}
              <div className="relative h-[560px] sm:h-[620px] w-full flex">
                {/* 4 Strings Area */}
                <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-4 relative h-full">
                  <div className="pointer-events-none absolute inset-0 z-[5]">
                    {positionTapes.map((tape) => (
                      <div
                        key={tape.label}
                        className="absolute inset-x-0 -translate-y-1/2"
                        style={{ top: `${tape.verticalPercent}%` }}
                      >
                        <span className="block h-1 w-full border-y border-amber-100/70 bg-amber-300/50 shadow-[0_0_6px_rgba(251,191,36,0.55)]" />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 rounded bg-slate-950/90 px-1 text-[9px] font-bold text-amber-200">
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
                      className="absolute left-0 right-0 border-b border-stone-800/80 pointer-events-none"
                      style={{ top: `${guide.top}%` }}
                    />
                  ))}

                  {displayedStrings.map((str) => {
                    const stringPlacements = placements.filter((p) => p.string === str.name);
                    const thickness = getStringThickness(str.name);

                    return (
                      <div key={str.name} className="relative h-full flex justify-center">
                        {/* Vertical String line */}
                        <div
                          className="h-full bg-gradient-to-b from-amber-200 via-stone-300 to-amber-100 rounded-full shadow-sm"
                          style={{
                            width: `${thickness}px`,
                            opacity: 0.85,
                          }}
                        />

                        {/* Open string button at the very top of the string */}
                        <button
                          onClick={() => handlePlayPitch(str.rootPitch)}
                          className={`absolute top-0 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-20 transition-all cursor-pointer ${
                            activePlayedPitch === str.rootPitch.toString()
                              ? 'bg-amber-400 text-slate-950 scale-125 shadow-lg border-white ring-2 ring-amber-300'
                              : 'bg-stone-800 border-stone-600 text-stone-300 hover:border-amber-400 active:scale-95'
                          }`}
                          title={`Open string 0: ${str.rootPitch.toString()}`}
                        >
                          0
                        </button>

                        {/* Finger placements on this string */}
                        {stringPlacements.map((placement, pIdx) => {
                          const isTonic = tonic.equals(placement.pitch);
                          const isGhammaz = ghammaz.equals(placement.pitch);
                          const isPlayed = activePlayedPitch === placement.pitch.toString();
                          const isSelected = selectedPlacement?.pitch.equals(placement.pitch);

                          // Calculate distance along neck vertically (scaled 0 to 100%)
                          const topPercent = Math.min(
                            92,
                            Math.max(6, 6 + (placement.distanceRatioFromNut / 0.4) * 86)
                          );

                          let badgeBg = 'bg-sky-600 border-sky-300 text-white';
                          if (isTonic) {
                            badgeBg = 'bg-amber-500 border-amber-200 text-slate-950 font-black ring-2 ring-amber-400/50';
                          } else if (isGhammaz) {
                            badgeBg = 'bg-emerald-600 border-emerald-200 text-white font-bold ring-2 ring-emerald-400/50';
                          }

                          return (
                            <div
                              key={`${placement.string}-${placement.pitch.toString()}-${pIdx}`}
                              className="absolute -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer"
                              style={{ top: `${topPercent}%` }}
                              onClick={() => handlePlayPitch(placement.pitch, placement)}
                            >
                              {/* Invisible expanded touch hitbox */}
                              <span className="absolute -inset-2.5 sm:-inset-1.5" />

                              {/* Finger placement bead */}
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs shadow-md transition-all transform group-hover:scale-125 active:scale-95 ${badgeBg} ${
                                  isPlayed ? 'scale-125 ring-4 ring-white animate-pulse' : ''
                                } ${isSelected ? 'ring-2 ring-white scale-110' : ''}`}
                              >
                                {placement.finger}
                              </div>

                              {/* Visible note name pill */}
                              <span className="text-[9px] font-mono font-semibold text-slate-300 mt-0.5 whitespace-nowrap bg-stone-950/90 px-1 py-0.2 rounded border border-stone-700/60 leading-none shadow-xs">
                                {placement.pitch.toString()}
                              </span>

                              {/* Desktop hover tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 border border-slate-700 text-slate-100 text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30 hidden sm:block">
                                {placement.pitch.toString()} • {placement.noteAnnotation} (Finger {placement.finger})
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Right rail fret/interval markers for vertical orientation */}
                <div className="w-12 sm:w-14 border-l border-stone-800 flex flex-col justify-between text-[9px] sm:text-[10px] text-stone-500 pl-1.5 sm:pl-2 select-none py-1">
                  <span className="text-stone-400 font-semibold">{ui.nutOpen}</span>
                  <span>{ui.semitone}</span>
                  <span className="text-amber-400/80 font-medium">{ui.wholeTone}</span>
                  <span>{ui.neutralThird}</span>
                  <span>{ui.majorThird}</span>
                  <span className="text-amber-400/80 font-medium">{ui.perfectFourth}</span>
                  <span>{ui.tritone}</span>
                  <span className="text-amber-400/80 font-medium">{ui.perfectFifth}</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Tapped Note Details Card (Crucial for Mobile/Touch UX) */}
          {selectedPlacement && (
            <div className="mt-3 p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center font-mono">
                  {selectedPlacement.pitch.toString()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">
                    {ui.finger} {selectedPlacement.finger} · {ui.string} {selectedPlacement.string}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-300">
                      {tonic.equals(selectedPlacement.pitch)
                        ? language === 'ar' ? 'القرار' : 'Tonic'
                        : ghammaz.equals(selectedPlacement.pitch)
                        ? language === 'ar' ? 'الغمّاز' : 'Ghammaz'
                        : ui.maqamDegree}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === 'en' ? `${selectedPlacement.noteAnnotation} · ` : ''}
                    {selectedPlacement.pitch.toFrequency().toFixed(1)} Hz
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlayPitch(selectedPlacement.pitch, selectedPlacement)}
                  className="h-7 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  {ui.playPitch}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlacement(null)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Pedagogical notes and finger explanation */}
          {showPedagogicalTips && (
            <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-slate-900/80 p-3.5 sm:p-4 rounded-xl border border-slate-800">
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> {ui.guidelines}
                </h4>
                <ul className="text-[11px] sm:text-xs text-slate-300 space-y-1 sm:space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>
                    {ui.arabicTuningTip}
                  </li>
                  <li>
                    {ui.quarterToneTip}
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> {ui.activePosition}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                  {selectedPosition === 'auto'
                    ? ui.autoDescription
                    : language === 'ar'
                      ? `الموضع ${selectedPosition}: يوسّع مجال العزف على الرقبة مع الحفاظ على وضع اليد المناسب.`
                      : ViolinErgonomicsEngine.POSITION_INFO[selectedPosition as ViolinPositionNumber]?.description}
                </p>
                <div className="mt-2 text-[10px] sm:text-[11px] text-slate-400">
                  {selectedPosition !== 'auto' && (
                    <span>
                      {language === 'ar' ? 'الأسلوب التقليدي: ' : 'Tradition: '}
                      {language === 'ar' ? `استخدم الموضع ${selectedPosition} بما يناسب مدى النغمة.` : ViolinErgonomicsEngine.POSITION_INFO[selectedPosition as ViolinPositionNumber]?.arabicTraditionRole}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
