// src/components/ViolinFingerboard.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArabicPitch, DiatonicBase, MicrotonalAccidental } from '../core/pitch';
import {
  ViolinErgonomicsEngine,
  ViolinFingerPlacement,
  ViolinStringName,
  ViolinPositionNumber,
  ViolinPositionMode,
  FingerMicroOffset
} from '../violin/ergonomics';
import { MicrotonalAudioEngine, TimbreType } from '../audio/microtonal-audio';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import {
  Volume2,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Info,
  ChevronRight,
  ListMusic,
  ArrowUpDown,
  MoveHorizontal,
  Compass
} from 'lucide-react';

interface Props {
  scalePitches: ArabicPitch[];
  activePitchIndex: number | null;
  timbre: TimbreType;
}

interface MelodicPreset {
  name: string;
  arabicName: string;
  description: string;
  pitches: ArabicPitch[];
}

export const ViolinFingerboard: React.FC<Props> = ({ scalePitches, activePitchIndex, timbre }) => {
  // Orientation: 'vertical' (natural violin player POV) vs 'horizontal' (studio/pedagogical layout)
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');

  // Position control: 1, 2, 3, 4, or 'auto'
  const [selectedPosition, setSelectedPosition] = useState<ViolinPositionMode>(1);

  // Inspector state: selected placement for deep dive
  const [selectedPlacement, setSelectedPlacement] = useState<ViolinFingerPlacement | null>(null);

  // Custom Sequence Builder state (Max 2 octaves) - starts empty so user selects notes one by one
  const [customSequence, setCustomSequence] = useState<ArabicPitch[]>([]);

  // Sequence playback state
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [seqActiveIndex, setSeqActiveIndex] = useState<number | null>(null);
  const [seqBpm, setSeqBpm] = useState<number>(100);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'maqam' | 'sequence'>('maqam');

  const strings: ViolinStringName[] = ['G', 'D', 'A', 'E'];
  const stringOpenNotes: Record<ViolinStringName, string> = {
    G: 'G3 (196 Hz)',
    D: 'D4 (293.7 Hz)',
    A: 'A4 (440 Hz)',
    E: 'E5 (659.3 Hz)'
  };

  // Expand active maqam scale pitches across full violin range (G3 to A5)
  // so all 4 strings have realistic finger positions to click and select in sequence mode
  const fullViolinScalePitches = useMemo(() => {
    const pcs: { diatonic: DiatonicBase; accidental: MicrotonalAccidental }[] = [];
    for (const sp of scalePitches) {
      if (!pcs.some(pc => pc.diatonic === sp.diatonic && pc.accidental === sp.accidental)) {
        pcs.push({ diatonic: sp.diatonic, accidental: sp.accidental });
      }
    }

    const expanded: ArabicPitch[] = [];
    // Ensure open strings (G3, D4, A4, E5) are available
    const openStrings: ArabicPitch[] = [
      new ArabicPitch('G', '♮', 3),
      new ArabicPitch('D', '♮', 4),
      new ArabicPitch('A', '♮', 4),
      new ArabicPitch('E', '♮', 5)
    ];
    for (const op of openStrings) {
      expanded.push(op);
    }

    for (const oct of [3, 4, 5]) {
      for (const pc of pcs) {
        const p = new ArabicPitch(pc.diatonic, pc.accidental, oct);
        const qt = p.toQuarterToneIndex();
        if (qt >= 86 && qt <= 138) { // Range: G3 to A5
          if (!expanded.some(ep => ep.equals(p))) {
            expanded.push(p);
          }
        }
      }
    }

    return expanded.sort((a, b) => a.toQuarterToneIndex() - b.toQuarterToneIndex());
  }, [scalePitches]);

  // In maqam mode, display the active scale notes.
  // In sequence mode, display candidate violin positions across all 4 strings
  // so the user can select notes one by one, where unselected notes are cleared/unhighlighted.
  const currentPitches = viewMode === 'maqam' ? scalePitches : fullViolinScalePitches;
  const placements = useMemo(() => {
    return ViolinErgonomicsEngine.generateFingeringChart(currentPitches, selectedPosition);
  }, [currentPitches, selectedPosition]);

  // Range validation for custom sequence (Max 2 octaves)
  const rangeValidation = useMemo(() => {
    return ViolinErgonomicsEngine.validateSequenceRange(customSequence);
  }, [customSequence]);

  // Alternative placements for currently selected note
  const alternativePlacements = useMemo(() => {
    if (!selectedPlacement) return [];
    return ViolinErgonomicsEngine.findAlternativePlacements(selectedPlacement.pitch).filter(
      alt => !(alt.string === selectedPlacement.string && alt.position === selectedPlacement.position && alt.finger === selectedPlacement.finger)
    );
  }, [selectedPlacement]);

  // Clean up sequence audio on unmount
  useEffect(() => {
    return () => {
      MicrotonalAudioEngine.stopSequence();
    };
  }, []);

  // Set default orientation based on screen size on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setOrientation('vertical');
    }
  }, []);

  // Classical violin phrase presets (all ≤ 2 octaves)
  const classicalPresets: MelodicPreset[] = [
    {
      name: 'Rast Opening Dulab',
      arabicName: 'دولاب راست',
      description: 'The foundation of Arabic violin: G3 pickup rising through Sikah E𝄳4 to Kardan C5',
      pitches: [
        new ArabicPitch('G', '♮', 3),
        new ArabicPitch('C', '♮', 4),
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('A', '♮', 4),
        new ArabicPitch('B', '𝄳', 4),
        new ArabicPitch('C', '♮', 5)
      ]
    },
    {
      name: 'Bayati Tahmila Theme',
      arabicName: 'تحميلة بياتي',
      description: 'Lyrical folk theme: D4 Dukah to neutral 2nd E𝄳4, arching to Husayni and back',
      pitches: [
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('A', '♮', 4),
        new ArabicPitch('B', '♭', 4),
        new ArabicPitch('A', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('D', '♮', 4)
      ]
    },
    {
      name: 'Hijaz Passionate Taqsim',
      arabicName: 'تقسيم حجاز',
      description: 'Augmented 2nd stretch between E♭4 and F♯4 with soaring climax on Muhayyar D5',
      pitches: [
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '♭', 4),
        new ArabicPitch('F', '♯', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('A', '♮', 4),
        new ArabicPitch('B', '♭', 4),
        new ArabicPitch('C', '♮', 5),
        new ArabicPitch('D', '♮', 5)
      ]
    },
    {
      name: 'Sikah Ascending Qafla',
      arabicName: 'قفلة سيكاه',
      description: 'Starts on Iraq B𝄳3 on G string, stepping up to Sikah E𝄳4 and Awj B𝄳4',
      pitches: [
        new ArabicPitch('B', '𝄳', 3),
        new ArabicPitch('C', '♮', 4),
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('E', '𝄳', 4)
      ]
    },
    {
      name: 'Full 2-Octave Master Scale (G3 to G5)',
      arabicName: 'ديوانان كاملان',
      description: 'Complete 2-octave span utilizing all 4 strings from open G3 to high G5 on E string',
      pitches: [
        new ArabicPitch('G', '♮', 3),
        new ArabicPitch('A', '♮', 3),
        new ArabicPitch('B', '𝄳', 3),
        new ArabicPitch('C', '♮', 4),
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('A', '♮', 4),
        new ArabicPitch('B', '𝄳', 4),
        new ArabicPitch('C', '♮', 5),
        new ArabicPitch('D', '♮', 5),
        new ArabicPitch('E', '𝄳', 5),
        new ArabicPitch('F', '♮', 5),
        new ArabicPitch('G', '♮', 5)
      ]
    }
  ];

  // Helper color mapping for micro-offsets
  const getMicroOffsetBadge = (offset: FingerMicroOffset) => {
    switch (offset) {
      case 'open':
        return { label: 'Open String', variant: 'emerald' as const };
      case 'quarter_low':
        return { label: 'Quarter-Low (-50¢)', variant: 'sky' as const };
      case 'half_low':
        return { label: 'Low Finger (♭)', variant: 'secondary' as const };
      case 'standard':
        return { label: 'Standard Position', variant: 'muted' as const };
      case 'quarter_high':
        return { label: 'Quarter-High (+50¢ Neutral)', variant: 'amber' as const };
      case 'stretched_high':
        return { label: 'Augmented Stretch (+100¢)', variant: 'rose' as const };
    }
  };

  const getFingerColor = (finger: number, isQuarterTone: boolean) => {
    if (finger === 0) return 'bg-emerald-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/40';
    if (isQuarterTone) return 'bg-amber-500 text-slate-950 border-amber-200 ring-4 ring-amber-400/60 font-black shadow-lg';
    switch (finger) {
      case 1: return 'bg-sky-500 text-slate-950 border-sky-300 ring-2 ring-sky-400/30';
      case 2: return 'bg-indigo-500 text-slate-100 border-indigo-300 ring-2 ring-indigo-400/30';
      case 3: return 'bg-fuchsia-500 text-slate-100 border-fuchsia-300 ring-2 ring-fuchsia-400/30';
      case 4: return 'bg-purple-500 text-slate-100 border-purple-300 ring-2 ring-purple-400/30';
      default: return 'bg-slate-600 text-slate-100';
    }
  };

  const handleSwitchToCustomSequence = () => {
    setViewMode('sequence');
    MicrotonalAudioEngine.stopSequence();
    setIsPlayingSeq(false);
    setSeqActiveIndex(null);
    setSelectedPlacement(null);
    // When user clicks Custom Sequence, all current highlighted notes are cleared
    setCustomSequence([]);
  };

  const handleSwitchToMaqamMode = () => {
    setViewMode('maqam');
    MicrotonalAudioEngine.stopSequence();
    setIsPlayingSeq(false);
    setSeqActiveIndex(null);
    setSelectedPlacement(null);
  };

  const handleNoteClick = (placement: ViolinFingerPlacement) => {
    setSelectedPlacement(placement);
    MicrotonalAudioEngine.playPitch(placement.pitch, 0.8, timbre);

    // In sequence mode, clicking any note on the fingerboard directly selects and appends it!
    if (viewMode === 'sequence') {
      handleAddToSequence(placement.pitch, false);
    }
  };

  const handleAddToSequence = (pitch: ArabicPitch, playSound: boolean = true) => {
    // Check if adding this pitch would exceed 2 octaves
    const candidateSequence = [...customSequence, pitch];
    const validation = ViolinErgonomicsEngine.validateSequenceRange(candidateSequence);
    if (!validation.valid) {
      alert(`Cannot add note: ${validation.message}`);
      return;
    }
    setCustomSequence(candidateSequence);
    if (playSound) {
      MicrotonalAudioEngine.playPitch(pitch, 0.5, timbre);
    }
  };

  const handleRemoveFromSequence = (index: number) => {
    setCustomSequence(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearSequence = () => {
    MicrotonalAudioEngine.stopSequence();
    setIsPlayingSeq(false);
    setSeqActiveIndex(null);
    setSelectedPlacement(null);
    setCustomSequence([]);
  };

  const handlePlayCustomSequence = () => {
    if (customSequence.length === 0) return;

    if (isPlayingSeq) {
      MicrotonalAudioEngine.stopSequence();
      setIsPlayingSeq(false);
      setSeqActiveIndex(null);
      return;
    }

    setIsPlayingSeq(true);
    const intervalMs = Math.round((60 / seqBpm) * 1000);

    const playLoop = () => {
      MicrotonalAudioEngine.playSequence(
        customSequence,
        intervalMs,
        timbre,
        (idx) => {
          setSeqActiveIndex(idx === -1 ? null : idx);
        },
        () => {
          if (isLooping) {
            setTimeout(playLoop, 200);
          } else {
            setIsPlayingSeq(false);
            setSeqActiveIndex(null);
          }
        }
      );
    };

    playLoop();
  };

  // Determine which pitch is actively sounding right now
  const currentActiveSoundPitch = useMemo(() => {
    if (isPlayingSeq && seqActiveIndex !== null && customSequence[seqActiveIndex]) {
      return customSequence[seqActiveIndex];
    }
    if (activePitchIndex !== null && scalePitches[activePitchIndex]) {
      return scalePitches[activePitchIndex];
    }
    return null;
  }, [isPlayingSeq, seqActiveIndex, customSequence, activePitchIndex, scalePitches]);

  return (
    <div className="space-y-6">
      {/* Main Card with Studio Controls */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                  Acoustic Violin Simulator
                </span>
                <Badge variant="amber" className="text-[10px]">
                  24-EDO Micro-Positions
                </Badge>
                <Badge variant="sky" className="text-[10px] hidden sm:inline-flex">
                  G3 - D4 - A4 - E5
                </Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl mt-1">
                Violin Fingerboard &amp; Left-Hand Ergonomics
              </CardTitle>
              <CardDescription className="mt-0.5">
                Authentic violin model with tapered ebony fingerboard, hand-carved maple bridge, G-D-A-E gauges, and position shifting.
              </CardDescription>
            </div>

            {/* Top Toolbar Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Orientation Switcher */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setOrientation('vertical')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer font-medium ${
                    orientation === 'vertical'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vertical View: Natural Violinist Perspective (Nut at top, Bridge at bottom)"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vertical (POV)</span>
                </button>
                <button
                  onClick={() => setOrientation('horizontal')}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer font-medium ${
                    orientation === 'horizontal'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Horizontal View: Studio / Score Alignment"
                >
                  <MoveHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Horizontal</span>
                </button>
              </div>

              {/* View Mode Switcher: Maqam Scale vs Custom Sequence */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={handleSwitchToMaqamMode}
                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                    viewMode === 'maqam'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Maqam Scale
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToCustomSequence}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer font-medium ${
                    viewMode === 'sequence'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Click Custom Sequence: clears all highlighted notes to select one by one"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>Custom Sequence</span>
                </button>
              </div>
            </div>
          </div>

          {/* Position Selector Bar */}
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-semibold text-xs">Left-Hand Position:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {([1, 2, 3, 4] as ViolinPositionNumber[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSelectedPosition(pos)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold transition cursor-pointer ${
                      selectedPosition === pos
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos}{pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'} Pos
                  </button>
                ))}
                <button
                  onClick={() => setSelectedPosition('auto')}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition cursor-pointer ${
                    selectedPosition === 'auto'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Smart Auto Shifting based on register"
                >
                  Auto
                </button>
              </div>
            </div>

            {/* Position pedagogical descriptor */}
            <div className="text-[11px] text-slate-400 max-w-md hidden md:block text-right">
              {selectedPosition === 'auto'
                ? 'Smart Auto: shifts automatically between 1st and 3rd position according to register.'
                : ViolinErgonomicsEngine.POSITION_INFO[selectedPosition as ViolinPositionNumber]?.arabicTraditionRole}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Finger legend / Custom Sequence Mode Banner */}
          {viewMode === 'sequence' ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-4 px-3.5 py-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="font-bold text-amber-300">Custom Sequence Active:</span>
                <span className="text-slate-300 text-[11px] sm:text-xs">
                  All highlights cleared. Click notes one by one on the fingerboard below to compose your melody (max 2 octaves).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={customSequence.length > 0 ? 'amber' : 'secondary'} className="text-[11px] font-mono">
                  {customSequence.length} Notes Selected
                </Badge>
                {customSequence.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSequence}
                    className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] border border-rose-500/40 transition cursor-pointer"
                  >
                    Clear All Notes
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-4 px-3 py-2 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow"></span>
                  <span className="text-slate-300 text-[11px]">0 Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-500 inline-block shadow"></span>
                  <span className="text-slate-300 text-[11px]">1 Index</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block shadow"></span>
                  <span className="text-slate-300 text-[11px]">2 Middle</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-fuchsia-500 inline-block shadow"></span>
                  <span className="text-slate-300 text-[11px]">3 Ring</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-500 inline-block shadow"></span>
                  <span className="text-slate-300 text-[11px]">4 Little</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block ring-2 ring-amber-300 shadow"></span>
                  <span className="text-amber-300 font-bold text-[11px]">Neutral (𝄳/𝄵)</span>
                </div>
              </div>

              <span className="text-[11px] text-muted-foreground">
                Click any note to audition &bull; Click &quot;Custom Sequence&quot; to build melodies
              </span>
            </div>
          )}

          {/* REALISTIC VIOLIN RENDERING */}
          {orientation === 'vertical' ? (
            /* ========================================================================= */
            /* VERTICAL VIEW: NATURAL VIOLINIST PERSPECTIVE (NUT AT TOP, BRIDGE AT BOTTOM) */
            /* ========================================================================= */
            <div className="flex justify-center p-2 sm:p-4 bg-gradient-to-b from-stone-950 via-slate-950 to-stone-950 rounded-2xl border border-amber-900/30 overflow-hidden shadow-2xl relative">
              {/* Violin Silhouette Container */}
              <div className="relative w-full max-w-[460px] min-h-[640px] flex flex-col items-center">
                
                {/* 1. SCROLL & PEGBOX HINT (TOP) */}
                <div className="w-24 h-12 bg-gradient-to-b from-amber-950 via-amber-900 to-stone-900 rounded-t-2xl border-t-2 border-x-2 border-amber-800/60 shadow-lg flex items-center justify-around px-2 relative">
                  <div className="w-3 h-8 bg-amber-900 rounded-full border border-amber-700/80 shadow-inner" />
                  <span className="text-[9px] font-serif font-bold text-amber-400 tracking-wider">الـرأس</span>
                  <div className="w-3 h-8 bg-amber-900 rounded-full border border-amber-700/80 shadow-inner" />
                </div>

                {/* 2. BONE/IVORY NUT */}
                <div className="w-[180px] sm:w-[200px] h-4 bg-gradient-to-r from-amber-100 via-stone-200 to-amber-100 rounded-sm shadow-md border-y border-amber-900/60 flex items-center justify-between px-6 z-20">
                  <span className="text-[8px] font-mono font-bold text-stone-800 tracking-wider">NUT (الأنف)</span>
                  <div className="flex gap-8 sm:gap-10">
                    <div className="w-1 h-2 bg-stone-500 rounded" />
                    <div className="w-1 h-2 bg-stone-500 rounded" />
                    <div className="w-1 h-2 bg-stone-500 rounded" />
                    <div className="w-1 h-2 bg-stone-500 rounded" />
                  </div>
                </div>

                {/* 3. TAPERED EBONY FINGERBOARD & VIOLIN BOUTS (MAIN BODY) */}
                <div className="relative w-full flex justify-center py-2">
                  
                  {/* Flamed Maple Violin Body Silhouette Background (Behind Fingerboard) */}
                  <div className="absolute inset-0 flex justify-center pointer-events-none">
                    <svg viewBox="0 0 400 560" className="w-full h-full max-h-[560px] opacity-90 drop-shadow-2xl">
                      <defs>
                        {/* Rich warm violin varnish gradient */}
                        <linearGradient id="violinVarnish" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#451a03" />
                          <stop offset="30%" stopColor="#78350f" />
                          <stop offset="50%" stopColor="#92400e" />
                          <stop offset="70%" stopColor="#78350f" />
                          <stop offset="100%" stopColor="#351403" />
                        </linearGradient>
                        <radialGradient id="highlight" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      {/* Violin Body Silhouette (Upper Bout, C-Bouts, Lower Bout) */}
                      <path
                        d="M 120 40 
                           C 70 60, 40 130, 70 200 
                           C 90 240, 110 250, 100 270 
                           C 80 290, 30 340, 40 440 
                           C 50 510, 130 550, 200 550 
                           C 270 550, 350 510, 360 440 
                           C 370 340, 320 290, 300 270 
                           C 290 250, 310 240, 330 200 
                           C 360 130, 330 60, 280 40 
                           Z"
                        fill="url(#violinVarnish)"
                        stroke="#b45309"
                        strokeWidth="3"
                      />

                      {/* Purfling Inlay Line */}
                      <path
                        d="M 124 46 
                           C 78 65, 48 132, 76 198 
                           C 95 238, 112 248, 104 268 
                           C 84 288, 38 338, 48 434 
                           C 58 502, 134 542, 200 542 
                           C 266 542, 342 502, 352 434 
                           C 362 338, 316 288, 296 268 
                           C 288 248, 305 238, 324 198 
                           C 352 132, 322 65, 276 46 
                           Z"
                        fill="none"
                        stroke="#1c1917"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />

                      {/* Violin Center Glow */}
                      <ellipse cx="200" cy="340" rx="140" ry="170" fill="url(#highlight)" />

                      {/* F-Holes (Stylized authentic Arabic/Italian sound holes) */}
                      {/* Left F-Hole */}
                      <path
                        d="M 105 280 C 95 320, 115 370, 95 410 C 92 416, 85 410, 90 400 C 105 370, 85 330, 98 290 C 101 282, 108 274, 105 280 Z"
                        fill="#0c0a09"
                        stroke="#78350f"
                        strokeWidth="1"
                      />
                      {/* Right F-Hole */}
                      <path
                        d="M 295 280 C 305 320, 285 370, 305 410 C 308 416, 315 410, 310 400 C 295 370, 315 330, 302 290 C 299 282, 292 274, 295 280 Z"
                        fill="#0c0a09"
                        stroke="#78350f"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>

                  {/* Tapered Ebony Fingerboard Itself */}
                  <div
                    className="relative bg-gradient-to-b from-stone-900 via-neutral-950 to-stone-950 rounded-b-xl border-x-2 border-b-2 border-stone-800 shadow-2xl z-10 flex justify-between px-3 sm:px-6 py-4"
                    style={{
                      width: '240px',
                      minHeight: '480px',
                      clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)'
                    }}
                  >
                    {/* Position Markers (Mother-of-pearl dots along the center) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-between py-16 pointer-events-none opacity-40">
                      <div className="w-2.5 h-2.5 rounded-full bg-stone-300 shadow" title="3rd Position marker" />
                      <div className="w-2.5 h-2.5 rounded-full bg-stone-300 shadow" title="5th Position marker" />
                      <div className="w-2.5 h-2.5 rounded-full bg-stone-300 shadow" title="7th Position marker" />
                    </div>

                    {/* Left-Hand Active Position Bracket / Guide */}
                    {selectedPosition !== 'auto' && (
                      <div
                        className="absolute left-1 right-1 border-2 border-dashed border-amber-400/40 rounded-lg pointer-events-none transition-all duration-300"
                        style={{
                          top: selectedPosition === 1 ? '10%' : selectedPosition === 2 ? '24%' : selectedPosition === 3 ? '40%' : '55%',
                          height: '24%'
                        }}
                      >
                        <span className="absolute right-2 top-1 text-[8px] font-mono text-amber-300 font-bold bg-slate-950/80 px-1 rounded">
                          {selectedPosition}{selectedPosition === 1 ? 'st' : selectedPosition === 2 ? 'nd' : selectedPosition === 3 ? 'rd' : 'th'} Pos Reach
                        </span>
                      </div>
                    )}

                    {/* 4 STRINGS (G - D - A - E running vertically) */}
                    {strings.map((strName, strIdx) => {
                      const stringPlacements = placements.filter(p => p.string === strName);

                      return (
                        <div key={strName} className="relative flex-1 flex flex-col items-center h-full">
                          {/* Top String Header */}
                          <div className="text-center mb-2 z-20">
                            <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                              {strName}
                            </span>
                          </div>

                          {/* The physical vertical string line */}
                          <div className="relative w-full h-[400px] flex justify-center">
                            {/* Realistic metallic string wire */}
                            <div
                              className={`h-full shadow-md rounded-full ${
                                strName === 'G'
                                  ? 'w-[3.5px] bg-gradient-to-b from-amber-700 via-amber-500 to-amber-600'
                                  : strName === 'D'
                                  ? 'w-[2.8px] bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400'
                                  : strName === 'A'
                                  ? 'w-[2.0px] bg-gradient-to-b from-slate-300 via-slate-100 to-slate-300'
                                  : 'w-[1.2px] bg-gradient-to-b from-yellow-200 via-yellow-100 to-yellow-300'
                              }`}
                            />

                            {/* Placed notes on this string */}
                            {stringPlacements.map((p, idx) => {
                              const isSounding = currentActiveSoundPitch && currentActiveSoundPitch.equals(p.pitch);
                              const isSelected = selectedPlacement && selectedPlacement.pitch.equals(p.pitch);
                              const isQuarter = p.pitch.accidental === '𝄳' || p.pitch.accidental === '𝄵';

                              // In sequence mode, track sequence step numbers
                              const seqStepIndices = viewMode === 'sequence'
                                ? customSequence
                                    .map((cp, sIdx) => (cp.equals(p.pitch) ? sIdx + 1 : null))
                                    .filter((x): x is number => x !== null)
                                : [];
                              const isInSequence = seqStepIndices.length > 0;

                              // Vertical physical placement: from nut (0%) down the neck (~85%)
                              const topPercent = p.finger === 0 ? 0 : Math.min(Math.max((p.distanceRatioFromNut / 0.32) * 82 + 8, 8), 92);

                              // Visual styling: In sequence mode, unselected notes are cleared/unhighlighted!
                              const noteScaleClass = isSounding
                                ? 'scale-135 ring-4 ring-amber-300 z-35 shadow-2xl animate-pulse'
                                : isInSequence
                                ? 'scale-115 ring-2 ring-amber-400 z-30 shadow-xl'
                                : isSelected
                                ? 'scale-120 ring-2 ring-white z-25'
                                : 'hover:scale-115 z-20';

                              const circleColorClass = viewMode === 'sequence'
                                ? isInSequence
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-200 ring-2 ring-amber-400/60 shadow-amber-500/40 font-black'
                                  : 'bg-slate-900/95 text-slate-300 border-slate-700/80 hover:border-amber-400 hover:text-white hover:bg-slate-800'
                                : getFingerColor(p.finger, isQuarter);

                              const circleLabel = viewMode === 'sequence'
                                ? isInSequence
                                  ? `#${seqStepIndices.join(',')}`
                                  : p.pitch.toScientificString()
                                : p.finger === 0 ? '0' : p.finger;

                              return (
                                <div
                                  key={idx}
                                  style={{ top: `${topPercent}%` }}
                                  className="absolute transform -translate-y-1/2 flex items-center z-20 group"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleNoteClick(p)}
                                    className={`relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${noteScaleClass}`}
                                    title={viewMode === 'sequence' ? `Click to select ${p.pitch.toScientificString()} into sequence` : `Play ${p.pitch.toScientificString()}`}
                                  >
                                    <div
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex flex-col items-center justify-center font-bold text-[11px] sm:text-xs shadow-xl border-2 transition-all ${circleColorClass}`}
                                    >
                                      <span>{circleLabel}</span>
                                    </div>
                                  </button>

                                  {/* Quick + Add to Sequence hover button in Maqam mode */}
                                  {viewMode === 'maqam' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToSequence(p.pitch);
                                      }}
                                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow z-30 cursor-pointer hover:bg-amber-300 hover:scale-110"
                                      title={`Append ${p.pitch.toScientificString()} to sequence`}
                                    >
                                      +
                                    </button>
                                  )}

                                  {/* Note label overlay */}
                                  <div className="absolute left-full ml-1.5 hidden group-hover:flex flex-col bg-slate-950/95 border border-slate-700 px-2 py-1 rounded shadow-xl pointer-events-none z-30 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-white font-mono">
                                        {p.pitch.toScientificString()} ({p.pitch.octave})
                                      </span>
                                      {viewMode === 'sequence' && (
                                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                                          isInSequence ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-300'
                                        }`}>
                                          {isInSequence ? `Step #${seqStepIndices.join(', #')}` : `Click to select (#${customSequence.length + 1})`}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-amber-300 font-mono">
                                      {p.centsAboveOpenString}¢ above {p.string}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      {p.pitch.toFrequency().toFixed(1)} Hz &bull; Pos {p.position}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. REALISTIC MAPLE VIOLIN BRIDGE (BOTTOM) */}
                <div className="w-[190px] sm:w-[220px] h-14 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 rounded-t-xl border-t-2 border-x-2 border-amber-600/80 shadow-2xl flex flex-col items-center justify-between px-4 py-1 z-20">
                  {/* Arched top string grooves */}
                  <div className="w-full flex justify-between px-3 text-[10px] font-black text-amber-950">
                    <span>G</span>
                    <span className="-translate-y-0.5">D</span>
                    <span className="-translate-y-0.5">A</span>
                    <span>E</span>
                  </div>
                  {/* Traditional bridge heart cutout */}
                  <div className="w-4 h-3 bg-stone-900 rounded-full shadow-inner opacity-80" />
                  <span className="text-[8px] font-serif font-black text-amber-950 tracking-widest uppercase">
                    VIOLIN BRIDGE (الفرس)
                  </span>
                </div>

                {/* 5. TAILPIECE HINT */}
                <div className="w-20 h-8 bg-neutral-950 rounded-b-xl border-b border-x border-neutral-800 flex items-center justify-around px-2 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Fine Tuner G" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Fine Tuner D" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Fine Tuner A" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Fine Tuner E" />
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* HORIZONTAL VIEW: STUDIO / PEDAGOGICAL LAYOUT                              */
            /* ========================================================================= */
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[720px] relative bg-gradient-to-r from-amber-950/60 via-stone-950 to-amber-950/40 rounded-2xl p-6 border-2 border-amber-900/40 shadow-2xl">
                {/* Wood grain pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none rounded-2xl" />

                {/* Nut (Left border) */}
                <div className="absolute left-16 top-6 bottom-6 w-4 bg-gradient-to-b from-amber-100 via-stone-200 to-amber-200 rounded-sm shadow-md border-r-2 border-amber-900/60 flex flex-col justify-center items-center z-20">
                  <span className="text-[9px] font-bold text-stone-900 -rotate-90 tracking-widest uppercase font-mono">
                    NUT
                  </span>
                </div>

                {/* Position Guide Markers (Top of fingerboard) */}
                <div className="relative pl-22 pr-8 flex justify-between text-[11px] font-mono text-slate-400 mb-2 border-b border-slate-800/80 pb-1">
                  <span>Open String (0¢)</span>
                  <span>1st Finger (~200¢)</span>
                  <span>2nd Finger (~350¢ Sikah)</span>
                  <span>3rd Finger (~500¢)</span>
                  <span>4th Finger (~700¢)</span>
                  <span className="text-amber-400 font-bold">Bridge End</span>
                </div>

                {/* Strings List */}
                <div className="space-y-6 pt-2 pb-2 pl-4">
                  {strings.map((strName) => {
                    const stringPlacements = placements.filter(p => p.string === strName);

                    return (
                      <div key={strName} className="relative flex items-center h-12">
                        {/* String Peg/Label */}
                        <div className="w-12 text-left z-10 flex flex-col">
                          <span className="text-base font-black text-amber-300 font-mono">{strName}</span>
                          <span className="text-[10px] text-slate-400">{stringOpenNotes[strName].split(' ')[0]}</span>
                        </div>

                        {/* Physical string line */}
                        <div className="relative flex-1 h-12 flex items-center ml-2">
                          {/* Metal string render with realistic thickness */}
                          <div
                            className={`w-full absolute left-0 right-0 shadow-sm ${
                              strName === 'G' ? 'h-[3.5px] bg-gradient-to-r from-amber-700 via-amber-500 to-amber-600' :
                              strName === 'D' ? 'h-[2.8px] bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400' :
                              strName === 'A' ? 'h-[2.0px] bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300' :
                              'h-[1.2px] bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-300'
                            }`}
                          />

                          {/* Placed notes on this string */}
                          <div className="absolute inset-0 flex items-center">
                            {stringPlacements.map((p, idx) => {
                              const isSounding = currentActiveSoundPitch && currentActiveSoundPitch.equals(p.pitch);
                              const isSelected = selectedPlacement && selectedPlacement.pitch.equals(p.pitch);
                              const isQuarter = p.pitch.accidental === '𝄳' || p.pitch.accidental === '𝄵';

                              // In sequence mode, track sequence step numbers
                              const seqStepIndices = viewMode === 'sequence'
                                ? customSequence
                                    .map((cp, sIdx) => (cp.equals(p.pitch) ? sIdx + 1 : null))
                                    .filter((x): x is number => x !== null)
                                : [];
                              const isInSequence = seqStepIndices.length > 0;

                              // Calculate physical position percentage
                              const leftPercent = p.finger === 0 ? 0 : Math.min(Math.max((p.distanceRatioFromNut / 0.28) * 85 + 6, 8), 94);

                              const noteScaleClass = isSounding
                                ? 'scale-125 z-30'
                                : isInSequence
                                ? 'scale-115 z-25'
                                : isSelected
                                ? 'scale-115 z-20'
                                : 'hover:scale-110 z-10';

                              const circleColorClass = viewMode === 'sequence'
                                ? isInSequence
                                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-200 ring-2 ring-amber-400/60 shadow-lg font-black'
                                  : 'bg-slate-900/95 text-slate-300 border-slate-700/80 hover:border-amber-400 hover:text-white hover:bg-slate-800'
                                : `${getFingerColor(p.finger, isQuarter)} ${isSounding ? 'ring-4 ring-amber-300 animate-pulse' : ''} ${isSelected ? 'ring-2 ring-white' : ''}`;

                              const circleLabel = viewMode === 'sequence'
                                ? isInSequence
                                  ? `#${seqStepIndices.join(',')}`
                                  : p.pitch.toScientificString()
                                : p.finger === 0 ? '0' : p.finger;

                              return (
                                <div
                                  key={idx}
                                  style={{ left: `${leftPercent}%` }}
                                  className="absolute transform -translate-x-1/2 flex flex-col items-center group z-20"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleNoteClick(p)}
                                    className={`relative flex flex-col items-center transition-all duration-200 cursor-pointer ${noteScaleClass}`}
                                    title={viewMode === 'sequence' ? `Click to select ${p.pitch.toScientificString()} into sequence` : `Play ${p.pitch.toScientificString()}`}
                                  >
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 transition-all ${circleColorClass}`}
                                    >
                                      {circleLabel}
                                    </div>

                                    <div className="mt-1 flex flex-col items-center">
                                      <span className="text-[11px] font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded shadow">
                                        {p.pitch.toScientificString()}
                                      </span>
                                      <span className="text-[9px] text-amber-300/80 font-mono">
                                        {viewMode === 'sequence' && isInSequence
                                          ? `Step #${seqStepIndices.join(',')}`
                                          : `+${p.centsAboveOpenString}¢`}
                                      </span>
                                    </div>
                                  </button>

                                  {/* Quick + Add to Sequence hover button in Maqam mode */}
                                  {viewMode === 'maqam' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToSequence(p.pitch);
                                      }}
                                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-bold text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow z-30 cursor-pointer hover:bg-amber-300 hover:scale-110"
                                      title={`Append ${p.pitch.toScientificString()} to sequence`}
                                    >
                                      +
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Selected Note Ergonomics & Alternative Fingerings Inspector */}
          {selectedPlacement ? (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex flex-col items-center justify-center text-amber-300">
                    <span className="text-xl font-black font-mono">{selectedPlacement.pitch.toScientificString()}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Oct {selectedPlacement.pitch.octave}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {selectedPlacement.string} String &bull; Finger {selectedPlacement.finger === 0 ? 'Open (0)' : selectedPlacement.finger}
                      </span>
                      <Badge variant="amber" className="text-xs">
                        {selectedPlacement.position}{selectedPlacement.position === 1 ? 'st' : selectedPlacement.position === 2 ? 'nd' : selectedPlacement.position === 3 ? 'rd' : 'th'} Position
                      </Badge>
                      {(() => {
                        const badge = getMicroOffsetBadge(selectedPlacement.microOffset);
                        return (
                          <Badge variant={badge.variant} className="text-xs">
                            {badge.label}
                          </Badge>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Acoustic Frequency: <strong className="text-amber-300 font-mono">{selectedPlacement.pitch.toFrequency().toFixed(2)} Hz</strong> &bull; +{selectedPlacement.centsAboveOpenString} cents from open {selectedPlacement.string} string
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="amber"
                    size="sm"
                    onClick={() => MicrotonalAudioEngine.playPitch(selectedPlacement.pitch, 0.8, timbre)}
                    className="gap-1.5"
                  >
                    <Volume2 className="w-4 h-4" />
                    Audition
                  </Button>
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => handleAddToSequence(selectedPlacement.pitch)}
                    className="gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Sequence
                  </Button>
                </div>
              </div>

              {/* Pedagogical insight tip */}
              {selectedPlacement.pedagogicalTip && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Arabic Violin Tradition Insight: </strong>
                    {selectedPlacement.pedagogicalTip}
                  </div>
                </div>
              )}

              {/* Alternative Fingerings Suggestion Row */}
              {alternativePlacements.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">
                    Alternative Fingering &amp; Shifting Options:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {alternativePlacements.map((alt, altIdx) => (
                      <button
                        key={altIdx}
                        onClick={() => {
                          setSelectedPlacement(alt);
                          MicrotonalAudioEngine.playPitch(alt.pitch, 0.7, timbre);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 hover:bg-slate-850 text-xs text-left transition cursor-pointer flex items-center gap-2 group"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="font-semibold text-white group-hover:text-amber-300">
                          {alt.string} String, Finger {alt.finger} ({alt.position}{alt.position === 1 ? 'st' : alt.position === 2 ? 'nd' : alt.position === 3 ? 'rd' : 'th'} Pos)
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Click any note marker on the violin neck to inspect its left-hand stop position, microtonal tuning cents, and alternative positions.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* CUSTOM MELODIC SEQUENCE BUILDER & PLAYER (UP TO 2 OCTAVES MAXIMUM)         */}
      {/* ========================================================================= */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                  Custom Sequence Engine
                </span>
                <Badge variant={rangeValidation.valid ? 'emerald' : 'rose'} className="text-[10px]">
                  {rangeValidation.valid ? 'Max 2 Octaves Valid' : 'Range Exceeded'}
                </Badge>
                <Badge variant="amber" className="text-[10px] font-mono">
                  {customSequence.length} Notes
                </Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl mt-1">
                Custom Melodic Sequence Studio
              </CardTitle>
              <CardDescription className="mt-0.5">
                Construct and audition any series of consecutive notes spanning up to 2 octaves. Watch notes trace in real-time across the violin neck.
              </CardDescription>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={isPlayingSeq ? "destructive" : "amber"}
                onClick={handlePlayCustomSequence}
                disabled={customSequence.length === 0}
                className="gap-2 shadow-lg"
              >
                {isPlayingSeq ? <Square className="fill-current w-4 h-4" /> : <Play className="fill-current w-4 h-4" />}
                {isPlayingSeq ? 'Stop Playing' : 'Play Sequence'}
              </Button>

              <Button
                variant={isLooping ? "emerald" : "dark"}
                size="sm"
                onClick={() => setIsLooping(!isLooping)}
                className="gap-1.5"
                title="Continuous Loop"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Loop</span>
              </Button>

              <Button
                variant="dark"
                size="sm"
                onClick={handleClearSequence}
                disabled={customSequence.length === 0}
                className="gap-1.5 hover:text-rose-400"
                title="Clear Sequence"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Sequence Range & Tempo Controller Bar */}
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
            {/* 2-Octave Range Span Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-semibold">Sequence Span:</span>
              <div className="w-36 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    rangeValidation.valid ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min((rangeValidation.spanOctaves / 2) * 100, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono font-bold ${rangeValidation.valid ? 'text-amber-300' : 'text-rose-400'}`}>
                {rangeValidation.spanOctaves} / 2.0 Octaves
              </span>
              {rangeValidation.lowestPitch && rangeValidation.highestPitch && (
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  ({rangeValidation.lowestPitch.toScientificString()}{rangeValidation.lowestPitch.octave} &rarr; {rangeValidation.highestPitch.toScientificString()}{rangeValidation.highestPitch.octave})
                </span>
              )}
            </div>

            {/* Tempo Slider */}
            <div className="flex items-center gap-3 min-w-[200px]">
              <span className="text-xs text-muted-foreground font-semibold">Tempo:</span>
              <Slider
                value={[seqBpm]}
                min={40}
                max={180}
                step={5}
                onValueChange={(val) => setSeqBpm(val[0])}
                className="w-28"
              />
              <span className="text-xs font-mono font-bold text-amber-300 min-w-[55px]">
                {seqBpm} BPM
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Classical Violin Phrase Presets Grid */}
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-slate-300">Load Classical Arabic Violin Presets:</span>
              <span>{classicalPresets.length} Canonical Phrases</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {classicalPresets.map((preset) => {
                const isSelected =
                  customSequence.length === preset.pitches.length &&
                  customSequence.every((p, i) => p.equals(preset.pitches[i]));

                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      MicrotonalAudioEngine.stopSequence();
                      setIsPlayingSeq(false);
                      setSeqActiveIndex(null);
                      setCustomSequence(preset.pitches);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-md ring-1 ring-amber-400/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                        {preset.name}
                      </span>
                      <span className="text-xs font-serif font-bold text-amber-400">
                        {preset.arabicName}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      {preset.description}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-500 truncate">
                      {preset.pitches.map(p => p.toScientificString()).join(' ')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sequence Timeline Note Stream */}
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-slate-300">Active Sequence Notes:</span>
              <span>Click a note to audition &bull; Click &times; to delete</span>
            </div>

            {customSequence.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl text-muted-foreground text-xs">
                Sequence is currently empty. Click any note on the violin fingerboard above or choose a preset above.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 items-center p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 min-h-[76px]">
                {customSequence.map((pitch, idx) => {
                  const isActive = seqActiveIndex === idx;
                  const isQuarter = pitch.accidental === '𝄳' || pitch.accidental === '𝄵';

                  return (
                    <div
                      key={idx}
                      className={`relative group flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/50 scale-110 shadow-xl z-20'
                          : isQuarter
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:border-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                      onClick={() => MicrotonalAudioEngine.playPitch(pitch, 0.5, timbre)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-slate-500 font-bold">#{idx + 1}</span>
                        <span className="text-sm font-bold font-mono">
                          {pitch.toScientificString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {pitch.octave}
                        </span>
                      </div>

                      <span className="text-[9px] text-muted-foreground font-mono mt-0.5">
                        {pitch.toFrequency().toFixed(1)}Hz
                      </span>

                      {/* Remove note button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromSequence(idx);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                        title="Remove note"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick-Append 2-Octave Violin Palette */}
          <div className="pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-slate-300">Quick-Append from Full 2-Octave Violin Palette (G3 to G5):</span>
              <span className="text-amber-400 text-[11px]">Click to append</span>
            </div>

            <div className="space-y-2">
              {/* Grouped by Violin Strings */}
              {[
                { name: 'G String (G3 - C4)', pitches: [
                  new ArabicPitch('G', '♮', 3),
                  new ArabicPitch('A', '♭', 3),
                  new ArabicPitch('A', '𝄳', 3),
                  new ArabicPitch('A', '♮', 3),
                  new ArabicPitch('B', '♭', 3),
                  new ArabicPitch('B', '𝄳', 3),
                  new ArabicPitch('B', '♮', 3),
                  new ArabicPitch('C', '♮', 4)
                ]},
                { name: 'D String (D4 - G4)', pitches: [
                  new ArabicPitch('D', '♮', 4),
                  new ArabicPitch('E', '♭', 4),
                  new ArabicPitch('E', '𝄳', 4),
                  new ArabicPitch('E', '♮', 4),
                  new ArabicPitch('F', '♮', 4),
                  new ArabicPitch('F', '♯', 4),
                  new ArabicPitch('G', '♭', 4),
                  new ArabicPitch('G', '♮', 4)
                ]},
                { name: 'A String (A4 - D5)', pitches: [
                  new ArabicPitch('A', '♮', 4),
                  new ArabicPitch('B', '♭', 4),
                  new ArabicPitch('B', '𝄳', 4),
                  new ArabicPitch('B', '♮', 4),
                  new ArabicPitch('C', '♮', 5),
                  new ArabicPitch('C', '♯', 5),
                  new ArabicPitch('D', '♮', 5)
                ]},
                { name: 'E String (E5 - G5)', pitches: [
                  new ArabicPitch('E', '♮', 5),
                  new ArabicPitch('F', '♮', 5),
                  new ArabicPitch('F', '♯', 5),
                  new ArabicPitch('G', '♮', 5),
                  new ArabicPitch('A', '♮', 5)
                ]}
              ].map((grp, grpIdx) => (
                <div key={grpIdx} className="flex flex-wrap items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] font-bold text-amber-300 min-w-[120px]">
                    {grp.name}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {grp.pitches.map((p, pIdx) => {
                      const isQuarter = p.accidental === '𝄳' || p.accidental === '𝄵';
                      return (
                        <button
                          key={pIdx}
                          onClick={() => handleAddToSequence(p)}
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold border transition cursor-pointer hover:scale-105 ${
                            isQuarter
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
                          }`}
                        >
                          {p.toScientificString()}{p.octave}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
