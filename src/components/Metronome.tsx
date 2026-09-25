// src/components/Metronome.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Square,
  Timer,
  Volume2,
  VolumeX,
  ChevronDown,
  X,
  Sparkles,
  Drum,
  Sliders
} from 'lucide-react';
import {
  MetronomeAudioEngine,
  TIME_SIGNATURE_PRESETS,
  TimeSignatureOption,
  MetronomeSoundType
} from '../audio/metronome-engine';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface MetronomeProps {
  className?: string;
}

export const Metronome: React.FC<MetronomeProps> = ({ className = '' }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(96);
  const [timeSignature, setTimeSignature] = useState<TimeSignatureOption>(TIME_SIGNATURE_PRESETS[0]);
  const [soundType, setSoundType] = useState<MetronomeSoundType>('dum-tak');
  const [volume, setVolume] = useState<number>(75);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [isDownbeat, setIsDownbeat] = useState<boolean>(false);
  const [isAccent, setIsAccent] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isTapping, setIsTapping] = useState<boolean>(false);

  // Pendulum swing angle state (-28 to +28 degrees)
  const [pendulumAngle, setPendulumAngle] = useState<number>(0);

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);
  const tapTimeoutRef = useRef<number | null>(null);

  // Modal / popover wrapper ref
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Subscribe to MetronomeAudioEngine events
  useEffect(() => {
    const unsubBeat = MetronomeAudioEngine.subscribeBeat((info) => {
      setCurrentBeat(info.beatIndex);
      setIsDownbeat(info.isDownbeat);
      setIsAccent(info.isAccent);

      // Calculate pendulum swing: alternate left (-26 deg) and right (+26 deg)
      setPendulumAngle((prev) => (prev <= 0 ? 26 : -26));
    });

    const unsubState = MetronomeAudioEngine.subscribeState((playing) => {
      setIsPlaying(playing);
      if (!playing) {
        setCurrentBeat(0);
        setIsDownbeat(false);
        setIsAccent(false);
        setPendulumAngle(0);
      }
    });

    return () => {
      unsubBeat();
      unsubState();
    };
  }, []);

  // Sync settings when changed
  const handleBpmChange = useCallback((newBpm: number) => {
    const clamped = Math.max(30, Math.min(280, Math.round(newBpm)));
    setBpm(clamped);
    MetronomeAudioEngine.setBpm(clamped);
  }, []);

  const handleTimeSignatureSelect = (preset: TimeSignatureOption) => {
    setTimeSignature(preset);
    MetronomeAudioEngine.setTimeSignature(preset);
  };

  const handleSoundTypeChange = (sound: MetronomeSoundType) => {
    setSoundType(sound);
    MetronomeAudioEngine.setSoundType(sound);
  };

  const handleVolumeChange = (volPercent: number) => {
    setVolume(volPercent);
    MetronomeAudioEngine.setVolume(volPercent / 100);
  };

  const togglePlayback = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    await MetronomeAudioEngine.toggle();
  }, []);

  // Tap Tempo Handler
  const handleTapTempo = () => {
    const now = Date.now();
    setIsTapping(true);
    if (tapTimeoutRef.current !== null) {
      window.clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = window.setTimeout(() => setIsTapping(false), 200);

    const recentTaps = tapTimesRef.current.filter((t) => now - t < 2500);
    recentTaps.push(now);
    tapTimesRef.current = recentTaps;

    if (recentTaps.length >= 2) {
      const deltas: number[] = [];
      for (let i = 1; i < recentTaps.length; i++) {
        deltas.push(recentTaps[i] - recentTaps[i - 1]);
      }
      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      if (avgDelta > 0) {
        const calculatedBpm = Math.round(60000 / avgDelta);
        handleBpmChange(calculatedBpm);
      }
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard shortcut listener ('m' to toggle metronome)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        void togglePlayback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayback]);
  // Tempo markings helper
  const getTempoDescription = (tempo: number) => {
    if (tempo < 60) return { term: 'Largo / Thaqil Jiddan', ar: 'ثقيل جداً' };
    if (tempo < 76) return { term: 'Adagio / Thaqil', ar: 'ثقيل' };
    if (tempo < 108) return { term: 'Andante / Mutawassit', ar: 'متوسط' };
    if (tempo < 132) return { term: 'Moderato / Darij', ar: 'دارج' };
    if (tempo < 168) return { term: 'Allegro / Sari’', ar: 'سريع' };
    return { term: 'Presto / Sari’ Jiddan', ar: 'سريع جداً' };
  };

  const tempoInfo = getTempoDescription(bpm);

  return (
    <div className={`relative ${className}`}>
      {/* Header Compact Metronome Widget */}
      <div
        ref={triggerRef}
        className={`flex items-center rounded-xl border transition-all duration-200 select-none shadow-xs ${
          isPlaying
            ? 'bg-amber-500/10 border-amber-500/60 shadow-amber-500/10'
            : 'bg-muted/60 dark:bg-slate-900 border-border hover:border-amber-500/50'
        }`}
      >
        {/* Play / Stop Direct Toggle Button */}
        <button
          type="button"
          onClick={togglePlayback}
          className={`px-2 py-1.5 rounded-l-xl transition-all flex items-center justify-center cursor-pointer ${
            isPlaying
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
          }`}
          title={isPlaying ? 'Stop Metronome (Space/Click)' : 'Start Metronome'}
          aria-label={isPlaying ? 'Stop Metronome' : 'Start Metronome'}
        >
          {isPlaying ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Metronome Information & Visual Pulse Bar */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/40 transition-colors"
          title="Click to open Metronome settings & Iqa' practice controls"
          aria-expanded={isOpen}
          aria-label="Metronome controls"
        >
          {/* Animated Metronome Icon */}
          <Timer
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isPlaying
                ? isDownbeat
                  ? 'text-amber-400 scale-125'
                  : isAccent
                  ? 'text-amber-500 scale-115'
                  : 'text-amber-600 scale-105'
                : 'text-muted-foreground'
            }`}
          />

          {/* BPM & Meter Label */}
          <div className="flex items-center gap-1 font-mono font-bold text-foreground">
            <span className="text-[11px] text-amber-500">♩</span>
            <span>{bpm}</span>
            <span className="text-muted-foreground text-[10px] hidden xs:inline">
              {timeSignature.name}
            </span>
          </div>

          {/* Live Beat Dots (Mini in Header) */}
          <div className="hidden md:flex items-center gap-1 ml-0.5">
            {Array.from({ length: Math.min(timeSignature.beatsPerBar, 8) }).map((_, idx) => {
              const active = isPlaying && currentBeat === idx;
              const isDown = timeSignature.downbeats.includes(idx);
              return (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${
                    active
                      ? isDown
                        ? 'bg-amber-400 scale-140 shadow-xs shadow-amber-400 ring-2 ring-amber-400/60'
                        : 'bg-amber-500 scale-125'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              );
            })}
          </div>

          <ChevronDown
            className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-foreground' : ''
            }`}
          />
        </button>
      </div>

      {/* Metronome Studio Popover / Control Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 w-auto sm:w-[410px] max-w-full bg-card/95 dark:bg-slate-950/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 sm:p-5 z-50 text-foreground animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                  Visual Metronome &amp; Iqa’
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono">
                    Tone.js Sync
                  </Badge>
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Synchronized rhythm engine for Arabic Maqam practice
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              title="Close metronome panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Visual Pendulum & Dynamic Beat Display */}
          <div className="my-4 p-3.5 rounded-xl bg-muted/40 dark:bg-slate-900/80 border border-border flex flex-col items-center justify-center relative overflow-hidden">
            {/* Visual Pendulum Arm */}
            <div className="h-14 w-full relative flex items-center justify-center mb-1">
              <div className="absolute top-0 w-2 h-2 rounded-full bg-amber-500/80 shadow-xs" />
              <div
                className="w-1 bg-linear-to-b from-amber-400 to-amber-600 rounded-full origin-top transition-transform duration-100 ease-out shadow-xs"
                style={{
                  height: '48px',
                  transform: `rotate(${isPlaying ? pendulumAngle : 0}deg)`
                }}
              >
                <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 shadow-md" />
              </div>

              {/* Pendulum arc guides */}
              <div className="absolute bottom-1 w-32 h-0.5 border-b border-dashed border-muted-foreground/30 pointer-events-none" />
            </div>

            {/* Glowing Beat Visualizer Beads */}
            <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mt-1">
              {Array.from({ length: timeSignature.beatsPerBar }).map((_, idx) => {
                const active = isPlaying && currentBeat === idx;
                const isDown = timeSignature.downbeats.includes(idx);
                const isSec = timeSignature.secondaryAccents.includes(idx);
                const syllable = timeSignature.beatSyllables?.[idx] || (isDown ? 'Dum' : 'Tak');

                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className={`relative flex items-center justify-center rounded-xl font-bold font-mono text-xs transition-all duration-75 select-none ${
                        timeSignature.beatsPerBar > 8
                          ? 'w-7 h-7 text-[10px]'
                          : 'w-8 h-8 sm:w-9 sm:h-9 text-xs'
                      } ${
                        active
                          ? isDown
                            ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg shadow-amber-400/50 ring-3 ring-amber-400/70 font-black'
                            : isSec
                            ? 'bg-amber-500 text-slate-950 scale-105 shadow-md shadow-amber-500/40 ring-2 ring-amber-500/60 font-bold'
                            : 'bg-amber-300 text-slate-950 scale-105 font-bold shadow-xs'
                          : isDown
                          ? 'bg-muted/80 dark:bg-slate-800 border-2 border-amber-500/50 text-foreground font-semibold'
                          : isSec
                          ? 'bg-muted/60 dark:bg-slate-800/80 border border-amber-500/30 text-muted-foreground'
                          : 'bg-muted/40 dark:bg-slate-900 border border-border text-muted-foreground'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {active && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                    {/* Syllable Label (Dum / Tak / Tik) */}
                    <span
                      className={`text-[9px] font-mono tracking-tight transition-colors ${
                        active
                          ? 'text-amber-400 font-bold'
                          : isDown
                          ? 'text-amber-500/80 font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {syllable}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Play / Stop & BPM Readout */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <Button
              variant={isPlaying ? 'default' : 'outline'}
              size="lg"
              onClick={togglePlayback}
              className={`flex-1 gap-2 font-bold cursor-pointer transition-all shadow-xs ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 ring-2 ring-amber-400/40'
                  : 'hover:border-amber-500/60'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Metronome</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Start Practice (Space)</span>
                </>
              )}
            </Button>

            {/* Tap Tempo Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleTapTempo}
              className={`px-4 gap-1.5 font-bold cursor-pointer transition-transform active:scale-95 ${
                isTapping ? 'bg-amber-500 text-slate-950 border-amber-400' : 'hover:border-amber-500/60'
              }`}
              title="Tap rhythmically at desired tempo"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>TAP</span>
            </Button>
          </div>

          {/* BPM Numerical Display & Fine Tune Buttons */}
          <div className="space-y-3 mb-4 p-3 rounded-xl bg-muted/30 dark:bg-slate-900/60 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-foreground tracking-tight">
                    {bpm}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">BPM</span>
                </div>
                <div className="text-[11px] text-amber-500 dark:text-amber-400 font-medium">
                  {tempoInfo.term} • <span className="font-arabic">{tempoInfo.ar}</span>
                </div>
              </div>

              {/* Increments / Decrements */}
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => handleBpmChange(bpm - 5)}
                  className="px-2 py-1 rounded-lg text-xs bg-muted hover:bg-muted/80 text-foreground transition cursor-pointer font-bold"
                  title="Decrease 5 BPM"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleBpmChange(bpm - 1)}
                  className="px-2 py-1 rounded-lg text-xs bg-muted hover:bg-muted/80 text-foreground transition cursor-pointer font-bold"
                  title="Decrease 1 BPM"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => handleBpmChange(bpm + 1)}
                  className="px-2 py-1 rounded-lg text-xs bg-muted hover:bg-muted/80 text-foreground transition cursor-pointer font-bold"
                  title="Increase 1 BPM"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleBpmChange(bpm + 5)}
                  className="px-2 py-1 rounded-lg text-xs bg-muted hover:bg-muted/80 text-foreground transition cursor-pointer font-bold"
                  title="Increase 5 BPM"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="30"
              max="280"
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />

            {/* Quick Tempo Presets */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
              <button
                type="button"
                onClick={() => handleBpmChange(60)}
                className="hover:text-amber-400 transition cursor-pointer"
              >
                60 Thaqil
              </button>
              <button
                type="button"
                onClick={() => handleBpmChange(84)}
                className="hover:text-amber-400 transition cursor-pointer"
              >
                84 Andante
              </button>
              <button
                type="button"
                onClick={() => handleBpmChange(108)}
                className="hover:text-amber-400 transition cursor-pointer"
              >
                108 Moderato
              </button>
              <button
                type="button"
                onClick={() => handleBpmChange(132)}
                className="hover:text-amber-400 transition cursor-pointer"
              >
                132 Darij
              </button>
              <button
                type="button"
                onClick={() => handleBpmChange(160)}
                className="hover:text-amber-400 transition cursor-pointer"
              >
                160 Sari’
              </button>
            </div>
          </div>

          {/* Time Signature & Classical Arabic Iqa' Selector */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Drum className="w-3.5 h-3.5 text-amber-500" />
                Time Signature &amp; Iqa’ Meter
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-500">
                {timeSignature.name} ({timeSignature.arabicTransliteration})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {TIME_SIGNATURE_PRESETS.map((preset) => {
                const isSelected = timeSignature.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleTimeSignatureSelect(preset)}
                    className={`p-2 rounded-xl text-left transition cursor-pointer flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/70 text-foreground font-bold shadow-xs'
                        : 'bg-muted/40 dark:bg-slate-900 border-border text-muted-foreground hover:text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs font-black text-amber-500">
                        {preset.name}
                      </span>
                      <span className="text-[10px] font-arabic truncate ml-1 opacity-80" dir="rtl">
                        {preset.arabicName.split('/')[0]}
                      </span>
                    </div>
                    <span className="text-[10px] truncate text-foreground/80 mt-0.5">
                      {preset.arabicTransliteration.split('/')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
              {timeSignature.description}
            </p>
          </div>

          {/* Sound Timbre & Volume Controls */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                Audio Click Timbre
              </span>
              <span className="text-[11px] text-muted-foreground capitalize">
                {soundType === 'dum-tak'
                  ? 'Dum-Tak (دوم / تك)'
                  : soundType === 'woodblock'
                  ? 'Woodblock (خشبي)'
                  : soundType === 'digital'
                  ? 'Digital Beep'
                  : 'Silent (Visual Only)'}
              </span>
            </div>

            {/* Sound Selection Buttons */}
            <div className="grid grid-cols-4 gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => handleSoundTypeChange('dum-tak')}
                className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer font-medium border ${
                  soundType === 'dum-tak'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-muted/40 dark:bg-slate-900 border-border text-muted-foreground hover:text-foreground'
                }`}
                title="Synthesized Dum (bass) and Tak (rimshot)"
              >
                Dum-Tak
              </button>
              <button
                type="button"
                onClick={() => handleSoundTypeChange('woodblock')}
                className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer font-medium border ${
                  soundType === 'woodblock'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-muted/40 dark:bg-slate-900 border-border text-muted-foreground hover:text-foreground'
                }`}
                title="Natural acoustic woodblock tick"
              >
                Woodblock
              </button>
              <button
                type="button"
                onClick={() => handleSoundTypeChange('digital')}
                className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer font-medium border ${
                  soundType === 'digital'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-muted/40 dark:bg-slate-900 border-border text-muted-foreground hover:text-foreground'
                }`}
                title="Electronic high-pitch metronome beep"
              >
                Digital
              </button>
              <button
                type="button"
                onClick={() => handleSoundTypeChange('silent')}
                className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer font-medium border ${
                  soundType === 'silent'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-muted/40 dark:bg-slate-900 border-border text-muted-foreground hover:text-foreground'
                }`}
                title="Silent visual-only metronome"
              >
                Visual Only
              </button>
            </div>

            {/* Click Volume Slider */}
            {soundType !== 'silent' && (
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleVolumeChange(volume === 0 ? 75 : 0)}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                  title={volume === 0 ? 'Unmute' : 'Mute'}
                >
                  {volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="flex-1 accent-amber-500 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[11px] font-mono font-bold text-muted-foreground w-8 text-right">
                  {volume}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
