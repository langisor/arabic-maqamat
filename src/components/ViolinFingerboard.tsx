// src/components/ViolinFingerboard.tsx
import React, { useState, useMemo } from 'react';
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
  SlidersHorizontal,
  Info,
  Volume2,
  X,
  ArrowUpDown,
  Rows,
  Columns,
} from 'lucide-react';

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
  tuning = 'arabic',
  onTuningChange,
  onPitchSelect,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<ViolinPositionMode>('auto');
  const [activePlayedPitch, setActivePlayedPitch] = useState<string | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<ViolinFingerPlacement | null>(null);
  const [showPedagogicalTips, setShowPedagogicalTips] = useState(true);
  const [isReversedStrings, setIsReversedStrings] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Strings according to tuning
  const tuningStrings: { name: ViolinStringName; label: string; arabicLabel: string; rootPitch: ArabicPitch }[] = useMemo(() => {
    if (tuning === 'arabic') {
      return [
        { name: 'G', label: 'G3 (Sol)', arabicLabel: 'يكاه · صول', rootPitch: new ArabicPitch('G', '♮', 3) },
        { name: 'D', label: 'D4 (Re)', arabicLabel: 'دوكاه · ري', rootPitch: new ArabicPitch('D', '♮', 4) },
        { name: 'A', label: 'G4 (Nawa)', arabicLabel: 'نوى · صول', rootPitch: new ArabicPitch('G', '♮', 4) },
        { name: 'E', label: 'D5 (Muhayyar)', arabicLabel: 'محير · ري', rootPitch: new ArabicPitch('D', '♮', 5) },
      ];
    }
    return [
      { name: 'G', label: 'G3 (Sol)', arabicLabel: 'يكاه · صول', rootPitch: new ArabicPitch('G', '♮', 3) },
      { name: 'D', label: 'D4 (Re)', arabicLabel: 'دوكاه · ري', rootPitch: new ArabicPitch('D', '♮', 4) },
      { name: 'A', label: 'A4 (La)', arabicLabel: 'حسيني · لا', rootPitch: new ArabicPitch('A', '♮', 4) },
      { name: 'E', label: 'E5 (Mi)', arabicLabel: 'جواب · مي', rootPitch: new ArabicPitch('E', '♮', 5) },
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
  const baggageNotes = useMemo(() => currentMaqam.lowerJins.getBaggageNotes(), [currentMaqam]);
  const tonic = useMemo(() => currentMaqam.getTonic(), [currentMaqam]);
  const ghammaz = useMemo(() => currentMaqam.getGhammaz(), [currentMaqam]);

  const placements = useMemo(() => {
    const allPitches = [...baggageNotes, ...scalePitches];
    const posNum: ViolinPositionNumber = selectedPosition === 'auto' ? 1 : selectedPosition;
    return allPitches.map((pitch) =>
      ViolinErgonomicsEngine.mapPitchToPosition(pitch, posNum)
    );
  }, [scalePitches, baggageNotes, selectedPosition]);

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Controls - Fully Responsive */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <span>Violin Fingerboard Studio</span>
            <span className="font-arabic text-xs sm:text-sm text-amber-400/90 font-normal">
              لوحة أصابع الكمان
            </span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 leading-relaxed">
            24-EDO microtonal finger placements, jins baggage, and traditional Arabic violin tuning (G-D-G-D)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Tuning Preset Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-slate-400 px-1.5 sm:px-2 font-medium text-[11px] sm:text-xs">Tuning:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onTuningChange?.('arabic')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  tuning === 'arabic'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Arabic (G-D-G-D)
              </button>
              <button
                onClick={() => onTuningChange?.('western')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  tuning === 'western' || tuning === 'standard'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Western (G-D-A-E)
              </button>
            </div>
          </div>

          {/* Position Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 px-1.5 sm:px-2 font-medium text-[11px] sm:text-xs">Pos:</span>
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
                {pos === 'auto' ? 'Auto' : `${pos}st`}
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
            title="Reverse String Order (e.g. G-D-G-D vs D-G-D-G or G-D-A-E vs E-A-D-G)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-amber-400" />
            <span>Reverse Strings</span>
            {isReversedStrings && (
              <span className="font-mono text-[10px] text-amber-300 bg-amber-500/30 px-1 py-0.2 rounded ml-1">
                Rev
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
              title="Horizontal Fingerboard View"
            >
              <Rows className="w-3 h-3" />
              <span>Horizontal</span>
            </button>
            <button
              type="button"
              onClick={() => setOrientation('vertical')}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                orientation === 'vertical'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vertical Fingerboard View (Upright violin neck)"
            >
              <Columns className="w-3 h-3" />
              <span>Vertical</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPedagogicalTips(!showPedagogicalTips)}
            className="text-xs text-slate-400 hover:text-slate-200 ml-auto lg:ml-0 h-8"
          >
            <Info className="w-3.5 h-3.5 mr-1" />
            {showPedagogicalTips ? 'Hide Tips' : 'Pedagogy Tips'}
          </Button>
        </div>
      </div>

      {/* Main Interactive Fingerboard Display */}
      <Card className="bg-slate-950 border-slate-800 overflow-hidden shadow-2xl">
        <CardHeader className="p-3.5 sm:p-5 border-b border-slate-900 bg-slate-900/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <CardTitle className="text-sm sm:text-base text-slate-200 flex items-center gap-2">
                <span>Maqam {currentMaqam.name}</span>
                <span className="font-arabic text-amber-400 text-xs sm:text-sm">{currentMaqam.arabicName}</span>
                <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                  {orientation} Mode • {isReversedStrings ? 'Reversed' : 'Standard'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Tonic: <span className="text-amber-300 font-semibold">{tonic.toString()}</span> • Ghammaz:{' '}
                <span className="text-emerald-300 font-semibold">{ghammaz.toString()}</span> • Baggage:{' '}
                <span className="text-purple-300 font-semibold">
                  {baggageNotes.map((n) => n.toString()).join(', ') || 'None'}
                </span>
              </CardDescription>
            </div>

            {/* Responsive Color Legend */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-200 inline-block" /> Tonic
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-200 inline-block" /> Ghammaz
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-200 inline-block" /> Baggage
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-200 inline-block" /> Scale
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-6">
          {/* HORIZONTAL ORIENTATION VIEW */}
          {orientation === 'horizontal' && (
            <>
              {/* Mobile Horizontal Scroll Hint */}
              <div className="flex md:hidden items-center justify-between text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-500/25 px-3 py-1.5 rounded-xl mb-3">
                <span className="flex items-center gap-1.5">
                  <span>↔</span>
                  <span>Swipe horizontally or tap Vertical button for upright view</span>
                </span>
                <span className="font-arabic text-[10px] text-amber-400/80">اسحب للمسارات</span>
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
                    {displayedStrings.map((str) => {
                      const stringPlacements = placements.filter((p) => p.string === str.name);
                      const thickness = getStringThickness(str.name);

                      return (
                        <div key={str.name} className="relative flex items-center h-12 sm:h-13">
                          {/* String Header */}
                          <div className="w-20 sm:w-24 shrink-0 flex flex-col items-start pr-1 sm:pr-2 z-20">
                            <span className="text-[11px] sm:text-xs font-bold text-amber-300 truncate w-full">
                              {str.label}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-arabic">
                              {str.arabicLabel}
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
                              const isBaggage = baggageNotes.some((b) => b.equals(placement.pitch));
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
                              } else if (isBaggage) {
                                badgeBg = 'bg-purple-600 border-purple-200 text-white font-bold ring-2 ring-purple-400/50';
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
                    <span>Nut (Open)</span>
                    <span>½-tone</span>
                    <span>Whole tone (1st)</span>
                    <span>Neutral 3rd</span>
                    <span>Maj 3rd</span>
                    <span>Perf 4th</span>
                    <span>Tritone</span>
                    <span>Perf 5th</span>
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
                      {str.label}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-arabic">
                      {str.arabicLabel}
                    </span>
                  </div>
                ))}
              </div>

              {/* Horizontal Nut indicator across the neck */}
              <div className="relative z-10 w-full pr-12 sm:pr-14 mb-4">
                <div className="h-2.5 bg-stone-200 rounded-sm shadow-md w-full relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold text-stone-400 tracking-wider">
                    NUT (عظمة المشط)
                  </div>
                </div>
              </div>

              {/* Main Vertical Fingerboard Playing Board with Fret Grid */}
              <div className="relative h-[560px] sm:h-[620px] w-full flex">
                {/* 4 Strings Area */}
                <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-4 relative h-full">
                  {/* Background subtle fret markers across strings */}
                  {[
                    { label: '½-tone', top: 14 },
                    { label: '1st (Whole)', top: 26 },
                    { label: 'Neut 3rd', top: 38 },
                    { label: 'Maj 3rd', top: 48 },
                    { label: 'Perf 4th', top: 60 },
                    { label: 'Tritone', top: 72 },
                    { label: 'Perf 5th', top: 84 },
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
                          const isBaggage = baggageNotes.some((b) => b.equals(placement.pitch));
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
                          } else if (isBaggage) {
                            badgeBg = 'bg-purple-600 border-purple-200 text-white font-bold ring-2 ring-purple-400/50';
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
                  <span className="text-stone-400 font-semibold">Nut (0)</span>
                  <span>½-tone</span>
                  <span className="text-amber-400/80 font-medium">1st pos</span>
                  <span>Neut 3rd</span>
                  <span>Maj 3rd</span>
                  <span className="text-amber-400/80 font-medium">4th</span>
                  <span>Tritone</span>
                  <span className="text-amber-400/80 font-medium">5th</span>
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
                      Finger {selectedPlacement.finger} on String {selectedPlacement.string}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-300">
                      {tonic.equals(selectedPlacement.pitch)
                        ? 'Tonic (قرار)'
                        : ghammaz.equals(selectedPlacement.pitch)
                        ? 'Ghammaz (غمّاز)'
                        : baggageNotes.some((b) => b.equals(selectedPlacement.pitch))
                        ? 'Baggage (أمتعة)'
                        : 'Maqam Degree'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedPlacement.noteAnnotation} • {selectedPlacement.pitch.toFrequency().toFixed(1)} Hz
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
                  Play Pitch
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
                  <Info className="w-3.5 h-3.5" /> Arabic Violin Pedagogical Guidelines
                </h4>
                <ul className="text-[11px] sm:text-xs text-slate-300 space-y-1 sm:space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>
                    <strong className="text-amber-200">Arabic Tuning (G-D-G-D):</strong> Re-tuning the A string down to G4 and E string down to D5 provides rich sympathetic resonance for Rast and Bayati.
                  </li>
                  <li>
                    <strong className="text-amber-200">Neutral Quarter-Tone Placement:</strong> Finger is placed halfway between the semitone and whole-tone marks (approximately 50 cents sharp from the flat).
                  </li>
                  <li>
                    <strong className="text-amber-200">Baggage Fingerings:</strong> Baggage notes outside the core jins may fall below the tonic or above its top pitch; choose a string and position suited to the note&apos;s register.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Active Position &amp; Shifts
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                  {selectedPosition === 'auto'
                    ? 'Auto Mode: Computes the most ergonomic, standard 1st position fingering with optimal open strings and minimal shifts.'
                    : ViolinErgonomicsEngine.POSITION_INFO[selectedPosition as ViolinPositionNumber]?.description}
                </p>
                <div className="mt-2 text-[10px] sm:text-[11px] text-slate-400">
                  {selectedPosition !== 'auto' && (
                    <span>
                      Tradition: {ViolinErgonomicsEngine.POSITION_INFO[selectedPosition as ViolinPositionNumber]?.arabicTraditionRole}
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
