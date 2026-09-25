// src/components/TranspositionLab.tsx
import React, { useState, useMemo } from 'react';
import { Maqam, MaqamatCatalogue } from '../theory/maqam';
import { ArabicPitch } from '../core/pitch';
import { ArabicNoteSpine } from '../core/note-spine';
import { MicrotonalAudioEngine, TimbreType } from '../audio/microtonal-audio';
import { ViolinErgonomicsEngine } from '../violin/ergonomics';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeftRight, 
  Play, 
  Square, 
  RotateCcw, 
  Radio, 
  Check, 
  Sparkles, 
  Volume2, 
  ChevronRight,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

interface TranspositionLabProps {
  currentMaqam: Maqam;
  onSelectMaqam: (m: Maqam) => void;
  timbre: TimbreType;
  isDroneActive?: boolean;
  onToggleDrone?: (pitch: ArabicPitch) => void;
}

// Curated 24-EDO candidate tonics across the violin/vocal register
const CANDIDATE_TONICS: ArabicPitch[] = [
  new ArabicPitch('G', '♮', 3), // 86 (Yakah - Open G)
  new ArabicPitch('A', '♭', 3), // 88
  new ArabicPitch('A', '♮', 3), // 90 (Ushayran)
  new ArabicPitch('B', '♭', 3), // 92 (Ajam Ushayran)
  new ArabicPitch('B', '𝄳', 3), // 93 ('Iraq)
  new ArabicPitch('B', '♮', 3), // 94
  new ArabicPitch('C', '♮', 4), // 96 (Rast)
  new ArabicPitch('C', '♯', 4), // 98
  new ArabicPitch('D', '♭', 4), // 98
  new ArabicPitch('D', '𝄳', 4), // 99
  new ArabicPitch('D', '♮', 4), // 100 (Dukah - Open D)
  new ArabicPitch('D', '𝄵', 4), // 101
  new ArabicPitch('E', '♭', 4), // 102
  new ArabicPitch('E', '𝄳', 4), // 103 (Sikah)
  new ArabicPitch('E', '♮', 4), // 104
  new ArabicPitch('F', '♮', 4), // 106 (Jaharkah)
  new ArabicPitch('F', '♯', 4), // 108
  new ArabicPitch('G', '𝄳', 4), // 109
  new ArabicPitch('G', '♮', 4), // 110 (Nawa - Open G4)
  new ArabicPitch('A', '♭', 4), // 112
  new ArabicPitch('A', '𝄳', 4), // 113
  new ArabicPitch('A', '♮', 4), // 114 (Husayni - Open A4)
  new ArabicPitch('B', '♭', 4), // 116
  new ArabicPitch('B', '𝄳', 4), // 117 (Awj)
  new ArabicPitch('B', '♮', 4), // 118
  new ArabicPitch('C', '♮', 5), // 120 (Kirdan)
  new ArabicPitch('D', '♮', 5), // 124 (Muhayyar)
];

export const TranspositionLab: React.FC<TranspositionLabProps> = ({
  currentMaqam,
  onSelectMaqam,
  timbre,
  isDroneActive = false,
  onToggleDrone
}) => {
  const allMaqamat = useMemo(() => MaqamatCatalogue.getAllMaqamat(), []);

  // Determine base original Maqam if currentMaqam is already transposed
  const baseId = currentMaqam.id.split('-transposed-')[0];
  const initialBase = MaqamatCatalogue.findById(baseId) || currentMaqam;

  const [selectedBaseId, setSelectedBaseId] = useState<string>(initialBase.id);
  const selectedBaseMaqam = useMemo(() => {
    return MaqamatCatalogue.findById(selectedBaseId) || initialBase;
  }, [selectedBaseId, initialBase]);

  // Target tonic pitch state
  const originalTonic = selectedBaseMaqam.getTonic();
  const [targetTonic, setTargetTonic] = useState<ArabicPitch>(currentMaqam.getTonic());

  // Playback state
  const [isPlayingScale, setIsPlayingScale] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [appliedNotification, setAppliedNotification] = useState(false);

  // CORE TRANSPOSITION: Apply maqam.transpose()
  const transposedMaqam = useMemo(() => {
    return selectedBaseMaqam.transpose(targetTonic);
  }, [selectedBaseMaqam, targetTonic]);

  // Transposition metadata & historical classification
  const transInfo = useMemo(() => {
    return MaqamatCatalogue.getTranspositionInfo(selectedBaseMaqam, targetTonic);
  }, [selectedBaseMaqam, targetTonic]);

  const deltaQt = originalTonic.diffQuarterTones(targetTonic);
  const centsOffset = deltaQt * 50;
  const isOriginalTonic = deltaQt === 0;
  const isTransposed = !isOriginalTonic;

  // Scales
  const originalScale = useMemo(() => selectedBaseMaqam.getScale(), [selectedBaseMaqam]);
  const transposedScale = useMemo(() => transposedMaqam.getScale(), [transposedMaqam]);

  // Classical preset options for the selected base Maqam
  const classicalPresets = useMemo(() => {
    switch (selectedBaseMaqam.id) {
      case 'rast':
        return [
          { pitch: new ArabicPitch('G', '♮', 3), title: 'Yakah', note: 'G3 (-500¢)', desc: 'Rast on Yakah' },
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Rast', note: 'C4 (0¢)', desc: 'Original tonic' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Nirz', note: 'D4 (+200¢)', desc: 'Rast on Dukah' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Mahur', note: 'G4 (+700¢)', desc: 'Rast on Nawa' },
          { pitch: new ArabicPitch('C', '♮', 5), title: 'Kirdan', note: 'C5 (+1200¢)', desc: 'Rast 8ve up' },
        ];
      case 'bayati':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Bayati Rast', note: 'C4 (-200¢)', desc: 'Bayati on C4' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Bayati', note: 'D4 (0¢)', desc: 'Original Dukah' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Shuri / Nawa', note: 'G4 (+500¢)', desc: 'Bayati on Nawa' },
          { pitch: new ArabicPitch('A', '♮', 4), title: 'Husayni', note: 'A4 (+700¢)', desc: 'Bayati on Husayni' },
        ];
      case 'hijaz':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Hijaz Kar', note: 'C4 (-200¢)', desc: 'Hijaz on Rast C4' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Hijaz', note: 'D4 (0¢)', desc: 'Original Dukah' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Shahnaz', note: 'G4 (+500¢)', desc: 'Hijaz on Nawa' },
          { pitch: new ArabicPitch('A', '♮', 4), title: 'Suzidil', note: 'A4 (+700¢)', desc: 'Hijaz on Husayni' },
        ];
      case 'nahawand':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Nahawand', note: 'C4 (0¢)', desc: 'Original C4' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Murassah', note: 'D4 (+200¢)', desc: 'Nahawand on D4' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Farahfaza', note: 'G4 (+700¢)', desc: 'Nahawand on Nawa' },
        ];
      case 'sikah':
        return [
          { pitch: new ArabicPitch('B', '𝄳', 3), title: '‘Iraq', note: 'B𝄳3 (-500¢)', desc: 'Sikah on Iraq' },
          { pitch: new ArabicPitch('E', '𝄳', 4), title: 'Sikah', note: 'E𝄳4 (0¢)', desc: 'Original E𝄳4' },
          { pitch: new ArabicPitch('B', '𝄳', 4), title: 'Awj', note: 'B𝄳4 (+700¢)', desc: 'Sikah on Awj' },
        ];
      case 'kurd':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Kurd Rast', note: 'C4 (-200¢)', desc: 'Kurd on C4' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Kurd', note: 'D4 (0¢)', desc: 'Original Dukah' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Kurd Nawa', note: 'G4 (+500¢)', desc: 'Kurd on G4' },
          { pitch: new ArabicPitch('A', '♮', 4), title: 'Hijazkar Kurd', note: 'A4 (+700¢)', desc: 'Kurd on A4' },
        ];
      case 'saba':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Saba Rast', note: 'C4 (-200¢)', desc: 'Saba on C4' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Saba', note: 'D4 (0¢)', desc: 'Original Dukah' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Saba Zamzam', note: 'G4 (+500¢)', desc: 'Saba on Nawa' },
        ];
      case 'ajam':
        return [
          { pitch: new ArabicPitch('B', '♭', 3), title: '‘Ajam ‘Ushayran', note: 'B♭3 (0¢)', desc: 'Original B♭3' },
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Jaharkah', note: 'C4 (+200¢)', desc: '‘Ajam on C4' },
          { pitch: new ArabicPitch('F', '♮', 4), title: '‘Ajam Nawa', note: 'F4 (+700¢)', desc: '‘Ajam on F4' },
        ];
      case 'nikriz':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Nikriz', note: 'C4 (0¢)', desc: 'Original C4' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Nawa Athar', note: 'G4 (+700¢)', desc: 'Nikriz on G4' },
        ];
      default:
        return [];
    }
  }, [selectedBaseMaqam]);

  // Violin Ergonomics analysis for the transposed tonic
  const primaryPlacement = useMemo(() => {
    return ViolinErgonomicsEngine.mapPitchToPosition(targetTonic, 1);
  }, [targetTonic]);

  // Handlers
  const handleMaqamChange = (newId: string) => {
    setSelectedBaseId(newId);
    const found = MaqamatCatalogue.findById(newId);
    if (found) {
      setTargetTonic(found.getTonic());
    }
    stopPlayback();
  };

  const handleTonicSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const qtIndex = Number(e.target.value);
    const candidate = CANDIDATE_TONICS.find(p => p.toQuarterToneIndex() === qtIndex);
    if (candidate) {
      setTargetTonic(candidate);
      stopPlayback();
    }
  };

  const handleQuickPreset = (pitch: ArabicPitch) => {
    setTargetTonic(pitch);
    stopPlayback();
    MicrotonalAudioEngine.playPitch(pitch, 0.6, timbre);
  };

  const handleShiftQuarterTones = (shiftQt: number) => {
    const newPitch = targetTonic.transpose(shiftQt);
    setTargetTonic(newPitch);
    stopPlayback();
    MicrotonalAudioEngine.playPitch(newPitch, 0.5, timbre);
  };

  const handleResetToNatural = () => {
    setTargetTonic(originalTonic);
    stopPlayback();
    MicrotonalAudioEngine.playPitch(originalTonic, 0.6, timbre);
  };

  const handleApplyToStudio = () => {
    onSelectMaqam(transposedMaqam);
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 2600);
  };

  const stopPlayback = () => {
    MicrotonalAudioEngine.stopSequence();
    setIsPlayingScale(false);
    setActiveStepIndex(null);
  };

  const playTransposedScale = () => {
    stopPlayback();
    setIsPlayingScale(true);
    setPlayingOriginal(false);
    MicrotonalAudioEngine.playSequence(
      transposedScale,
      500,
      timbre,
      (idx) => setActiveStepIndex(idx === -1 ? null : idx),
      () => {
        setIsPlayingScale(false);
        setActiveStepIndex(null);
      }
    );
  };

  const playOriginalScale = () => {
    stopPlayback();
    setIsPlayingScale(true);
    setPlayingOriginal(true);
    MicrotonalAudioEngine.playSequence(
      originalScale,
      500,
      timbre,
      (idx) => setActiveStepIndex(idx === -1 ? null : idx),
      () => {
        setIsPlayingScale(false);
        setActiveStepIndex(null);
      }
    );
  };

  const compareTonicsAB = () => {
    stopPlayback();
    // Play original tonic then transposed tonic
    MicrotonalAudioEngine.playPitch(originalTonic, 0.7, timbre);
    setTimeout(() => {
      MicrotonalAudioEngine.playPitch(targetTonic, 0.9, timbre);
    }, 750);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Taswīr Studio (مختبر التصوير)
              </Badge>
              <Badge variant="secondary" className="text-xs">
                maqam.transpose() Engine
              </Badge>
              {isTransposed && (
                <Badge variant="emerald" className="text-xs font-mono font-bold animate-pulse">
                  {centsOffset > 0 ? `+${centsOffset}¢` : `${centsOffset}¢`} Shift
                </Badge>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Transposition Lab</span>
              <span className="text-amber-400 font-naskh text-2xl sm:text-3xl font-normal">
                مختبر التصوير الموسيقي
              </span>
            </h2>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore modal transpositions across the 24-EDO microtonal spine. Preserves internal
              tetrachord symmetry, neutral third proportions, and Ghammaz pivots while adapting the
              tessitura to violin fingerboard positions or vocal tessituras.
            </p>
          </div>

          {/* Quick Apply Action Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Button
              variant="amber"
              size="lg"
              onClick={handleApplyToStudio}
              className="gap-2 shadow-lg shadow-amber-500/20 font-bold"
            >
              {appliedNotification ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Applied to Studio!</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Set as Active Studio Maqam</span>
                </>
              )}
            </Button>

            <p className="text-[11px] text-center text-slate-400">
              Propagates to Violin Fingerboard, Score &amp; Sayr
            </p>
          </div>
        </div>

        {/* Primary Selection Controls Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Base Maqam Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>1. Base Maqam (الأصل)</span>
            </label>
            <div className="relative">
              <select
                value={selectedBaseId}
                onChange={(e) => handleMaqamChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer shadow-inner"
              >
                {allMaqamat.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.family}) — {m.arabicName}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Natural Tonic: <strong className="text-amber-400">{originalTonic.toString()}</strong></span>
              <span>{ArabicNoteSpine.findByPitch(originalTonic)?.transliteration || ''}</span>
            </div>
          </div>

          {/* 2. Target Tonic Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>2. Target Tonic Note (قرار التصوير)</span>
              <span className="text-amber-400 font-normal">24-EDO</span>
            </label>
            <div className="relative">
              <select
                value={targetTonic.toQuarterToneIndex()}
                onChange={handleTonicSelect}
                className="w-full bg-slate-950 border border-amber-500/50 hover:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer shadow-inner"
              >
                {CANDIDATE_TONICS.map((p) => {
                  const spine = ArabicNoteSpine.findByPitch(p);
                  const isCurrentOriginal = p.equals(originalTonic);
                  const diff = originalTonic.diffCents(p);
                  const diffText = diff === 0 ? ' [Natural]' : ` [${diff > 0 ? '+' : ''}${diff}¢]`;
                  const spineName = spine ? ` (${spine.transliteration} / ${spine.arabicName})` : '';
                  const freq = p.toFrequency().toFixed(1);

                  return (
                    <option key={p.toQuarterToneIndex()} value={p.toQuarterToneIndex()}>
                      {p.toScientificString()}{p.octave} {spineName} — {freq} Hz{diffText}{isCurrentOriginal ? ' ★' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Frequency: <strong className="text-white font-mono">{targetTonic.toFrequency().toFixed(1)} Hz</strong></span>
              <span>Interval: <strong className="text-amber-300 font-mono">{transInfo?.intervalName || `${deltaQt * 50}¢`}</strong></span>
            </div>
          </div>

          {/* 3. Microtonal Shift Stepper */}
          <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>3. Fine Microtonal Stepper</span>
              <button
                onClick={handleResetToNatural}
                disabled={isOriginalTonic}
                className="text-amber-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-amber-400 text-[11px] flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset (0¢)
              </button>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <Button
                variant="dark"
                size="sm"
                onClick={() => handleShiftQuarterTones(-1)}
                className="text-xs py-2 px-1 hover:text-amber-300 font-mono"
                title="Shift down 1 quarter-tone (-50¢)"
              >
                -¼T (-50¢)
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => handleShiftQuarterTones(1)}
                className="text-xs py-2 px-1 hover:text-amber-300 font-mono"
                title="Shift up 1 quarter-tone (+50¢)"
              >
                +¼T (+50¢)
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => handleShiftQuarterTones(-2)}
                className="text-xs py-2 px-1 hover:text-amber-300 font-mono"
                title="Shift down 1 semitone (-100¢)"
              >
                -½T (-100¢)
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => handleShiftQuarterTones(2)}
                className="text-xs py-2 px-1 hover:text-amber-300 font-mono"
                title="Shift up 1 semitone (+100¢)"
              >
                +½T (+100¢)
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <Button
                variant="dark"
                size="sm"
                onClick={() => handleShiftQuarterTones(-4)}
                className="text-[11px] py-1 px-1 text-slate-300 font-mono"
              >
                -Whole (-200¢)
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => handleShiftQuarterTones(10)}
                className="text-[11px] py-1 px-1 text-slate-300 font-mono"
              >
                +4th (+500¢)
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => handleShiftQuarterTones(14)}
                className="text-[11px] py-1 px-1 text-slate-300 font-mono"
              >
                +5th (+700¢)
              </Button>
            </div>
          </div>
        </div>

        {/* Classical Presets Toolbar for Selected Base Maqam */}
        {classicalPresets.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Classical Presets (تصاوير تراثية):
              </span>
              {classicalPresets.map((preset) => {
                const isActive = targetTonic.equals(preset.pitch);
                return (
                  <button
                    key={preset.title}
                    onClick={() => handleQuickPreset(preset.pitch)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'border-amber-400 bg-amber-500/25 text-amber-200 shadow-sm font-bold'
                        : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>{preset.title}</span>
                    <span className="font-mono text-[10px] text-amber-400/80">{preset.note}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Transposition Context & Naming Card */}
      <Card className="bg-slate-900 border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {transInfo?.name || transposedMaqam.name}
              </h3>
              {transInfo?.traditionalTitle && (
                <Badge variant="secondary" className="text-xs font-bold">
                  {transInfo.traditionalTitle}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {transInfo?.description || transposedMaqam.description}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-naskh text-amber-300 font-bold">
              {transInfo?.arabicName || transposedMaqam.arabicName || 'مقام مصوّر'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              عائلة {selectedBaseMaqam.family} &bull; {transInfo?.intervalName || `${deltaQt * 50}¢`}
            </div>
          </div>
        </div>

        {/* Audio Audition Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={isPlayingScale && !playingOriginal ? "amber" : "amberOutline"}
              size="sm"
              onClick={isPlayingScale && !playingOriginal ? stopPlayback : playTransposedScale}
              className="gap-2 font-bold"
            >
              {isPlayingScale && !playingOriginal ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Playback</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Transposed Scale ({timbre})</span>
                </>
              )}
            </Button>

            <Button
              variant={isPlayingScale && playingOriginal ? "default" : "dark"}
              size="sm"
              onClick={isPlayingScale && playingOriginal ? stopPlayback : playOriginalScale}
              className="gap-2 text-xs"
            >
              {isPlayingScale && playingOriginal ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop Original</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Play Original ({originalTonic.toString()})</span>
                </>
              )}
            </Button>

            <Button
              variant="dark"
              size="sm"
              onClick={compareTonicsAB}
              className="gap-1.5 text-xs text-slate-300 hover:text-white"
              title="Hear original root then new root back-to-back"
            >
              <ArrowLeftRight className="w-3 h-3 text-amber-400" />
              <span>A/B Compare Tonics</span>
            </Button>
          </div>

          {/* Drone Button */}
          {onToggleDrone && (
            <Button
              variant={isDroneActive ? "emerald" : "dark"}
              size="sm"
              onClick={() => onToggleDrone(targetTonic)}
              className="gap-1.5"
            >
              <Radio className={`w-3.5 h-3.5 ${isDroneActive ? 'animate-pulse' : ''}`} />
              <span>{isDroneActive ? `Drone on ${targetTonic.toString()}: ON` : `Start Drone (${targetTonic.toString()})`}</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Side-by-Side / Interactive Scale Degree Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Transposed Scale (المصوّر) */}
        <Card className="bg-slate-900/90 border-amber-500/40 p-5 space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h4 className="text-sm font-bold text-white">
                Transposed Scale Pitches (المقام المصوّر)
              </h4>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">
              Root: {targetTonic.toScientificString()}{targetTonic.octave} ({targetTonic.toFrequency().toFixed(1)} Hz)
            </Badge>
          </div>

          <p className="text-xs text-slate-400">
            Click any note card to audition with the active {timbre} tone model:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {transposedScale.map((pitch, idx) => {
              const isTonic = idx === 0 || idx === transposedScale.length - 1;
              const isGhammaz = pitch.equals(transposedMaqam.getGhammaz());
              const spine = ArabicNoteSpine.findByPitch(pitch);
              const isActivePlaying = isPlayingScale && !playingOriginal && activeStepIndex === idx;

              return (
                <button
                  key={`${pitch.toString()}-${idx}`}
                  onClick={() => MicrotonalAudioEngine.playPitch(pitch, 0.7, timbre)}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer group flex flex-col justify-between ${
                    isActivePlaying
                      ? 'border-amber-400 bg-amber-500/30 scale-105 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                      : isTonic
                      ? 'border-amber-500/50 bg-amber-500/10 hover:border-amber-400'
                      : isGhammaz
                      ? 'border-purple-500/50 bg-purple-500/10 hover:border-purple-400'
                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    {isTonic && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                        Tonic
                      </Badge>
                    )}
                    {isGhammaz && (
                      <Badge variant="purple" className="text-[9px] px-1.5 py-0 h-4">
                        Ghammaz
                      </Badge>
                    )}
                  </div>

                  <div className="my-1.5 text-center">
                    <div className="text-lg font-black text-white group-hover:text-amber-300 transition">
                      {pitch.toScientificString()}
                      <span className="text-xs font-normal text-slate-400 ml-0.5">{pitch.octave}</span>
                    </div>
                    {spine && (
                      <div className="text-[10px] text-amber-300 font-naskh">
                        {spine.transliteration} ({spine.arabicName})
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-center text-slate-400 pt-1 border-t border-slate-800/80">
                    {pitch.toFrequency().toFixed(1)} Hz
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 2. Original Natural Scale (الأصل) */}
        <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <h4 className="text-sm font-bold text-slate-300">
                Original Natural Scale (الأصل الطبيعي)
              </h4>
            </div>
            <Badge variant="muted" className="text-[10px] font-mono">
              Root: {originalTonic.toScientificString()}{originalTonic.octave} ({originalTonic.toFrequency().toFixed(1)} Hz)
            </Badge>
          </div>

          <p className="text-xs text-slate-400">
            Reference natural pitch set for {selectedBaseMaqam.name}:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {originalScale.map((pitch, idx) => {
              const isTonic = idx === 0 || idx === originalScale.length - 1;
              const isGhammaz = pitch.equals(selectedBaseMaqam.getGhammaz());
              const spine = ArabicNoteSpine.findByPitch(pitch);
              const isActivePlaying = isPlayingScale && playingOriginal && activeStepIndex === idx;

              return (
                <button
                  key={`orig-${pitch.toString()}-${idx}`}
                  onClick={() => MicrotonalAudioEngine.playPitch(pitch, 0.7, timbre)}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer group flex flex-col justify-between ${
                    isActivePlaying
                      ? 'border-sky-400 bg-sky-500/30 scale-105 shadow-lg shadow-sky-500/30 ring-2 ring-sky-400'
                      : isTonic
                      ? 'border-slate-700 bg-slate-800/60'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    {isTonic && (
                      <span className="text-[9px] text-slate-400">Root</span>
                    )}
                    {isGhammaz && (
                      <span className="text-[9px] text-purple-300">Ghammaz</span>
                    )}
                  </div>

                  <div className="my-1.5 text-center">
                    <div className="text-lg font-bold text-slate-200 group-hover:text-sky-300 transition">
                      {pitch.toScientificString()}
                      <span className="text-xs font-normal text-slate-400 ml-0.5">{pitch.octave}</span>
                    </div>
                    {spine && (
                      <div className="text-[10px] text-slate-400 font-naskh">
                        {spine.transliteration} ({spine.arabicName})
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-center text-slate-400 pt-1 border-t border-slate-800/80">
                    {pitch.toFrequency().toFixed(1)} Hz
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Structural Jins Anatomy Transformation & Violin Ergonomics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jins Anatomy Transformations */}
        <Card className="bg-slate-900 border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">
              Jins Structural Transformation
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            {/* Lower Jins */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-400">
                  Lower Jins: {transposedMaqam.lowerJins.definition.name}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  Tonic Jins
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span>Original Root: <strong className="font-mono text-slate-200">{selectedBaseMaqam.lowerJins.root.toString()}</strong></span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Transposed Root: <strong className="font-mono text-amber-300">{transposedMaqam.lowerJins.root.toString()}</strong></span>
              </div>
              <div className="text-[11px] text-slate-400">
                Preserved interval step vector: <code className="text-slate-300 font-mono">[{transposedMaqam.lowerJins.definition.intervals.join(', ')}]</code> quarter-tones.
              </div>
            </div>

            {/* Upper Jins */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-400">
                  Upper Jins: {transposedMaqam.upperJins.definition.name}
                </span>
                <Badge variant="purple" className="text-[10px]">
                  Secondary Jins
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span>Original Root: <strong className="font-mono text-slate-200">{selectedBaseMaqam.upperJins.root.toString()}</strong></span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Transposed Root: <strong className="font-mono text-purple-300">{transposedMaqam.upperJins.root.toString()}</strong></span>
              </div>
              <div className="text-[11px] text-slate-400">
                Connection type: <strong className="text-slate-200">{transposedMaqam.connection}</strong> ({transposedMaqam.connection === 'Infisal' ? 'Disjunct whole-tone gap' : transposedMaqam.connection === 'Ittisal' ? 'Conjunct shared pivot note' : 'Overlapping tetrachords'}).
              </div>
            </div>

            {/* Ghammaz (Pivot Note) */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-400">
                  Dominant Ghammaz (غمّاز)
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  {transposedMaqam.getGhammaz().toFrequency().toFixed(1)} Hz
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span>Original Ghammaz: <strong className="font-mono text-slate-200">{selectedBaseMaqam.getGhammaz().toString()}</strong></span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Transposed Ghammaz: <strong className="font-mono text-emerald-300">{transposedMaqam.getGhammaz().toString()}</strong></span>
              </div>
            </div>
          </div>
        </Card>

        {/* Violin Pedagogical Left-Hand Insights */}
        <Card className="bg-slate-900 border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Info className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">
              Violin Left-Hand Pedagogical Impact
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            {primaryPlacement && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">
                    Transposed Tonic Stop:
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {primaryPlacement.string} String &bull; Position {primaryPlacement.position}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Recommended Finger:</span>
                    <strong className="text-white text-sm">
                      {primaryPlacement.finger === 0 ? 'Open String (0)' : `Finger ${primaryPlacement.finger}`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Micro-Displacement:</span>
                    <strong className="text-amber-400 capitalize">
                      {primaryPlacement.microOffset.replace('_', ' ')}
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground pt-1 border-t border-slate-800/80">
                  Nut distance ratio: <code className="text-slate-300">{(primaryPlacement.distanceRatioFromNut * 100).toFixed(1)}%</code> of string vibrating length ({primaryPlacement.centsAboveOpenString}¢ above open string).
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Performance Tip for Violinists:
              </div>
              <p>
                When transposing from {originalTonic.toString()} to {targetTonic.toString()} ({centsOffset > 0 ? `+${centsOffset}¢` : `${centsOffset}¢`}), pay close attention to the neutral intervals (such as Sikah or neutral 2nds). Left-hand finger tapes shift forward by precisely 1 quarter-tone (+50 cents) rather than standard Western half-steps.
              </p>
              <p>
                Use the <strong>Violin Fingerboard</strong> tab to visually trace the exact physical stop positions on all four strings (G, D, A, E).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
