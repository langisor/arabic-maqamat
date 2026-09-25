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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

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
  
  void className; // unused prop for now, but can be used for styling
  // Pendulum swing angle state (-28 to +28 degrees)
  const [pendulumAngle, setPendulumAngle] = useState<number>(0);

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);
  const tapTimeoutRef = useRef<number | null>(null);

  // Modal / popover wrapper ref
  // const panelRef = useRef<HTMLDivElement>(null);
  // const triggerRef = useRef<HTMLDivElement>(null);

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
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       isOpen &&
  //       panelRef.current &&
  //       !panelRef.current.contains(event.target as Node) &&
  //       triggerRef.current &&
  //       !triggerRef.current.contains(event.target as Node)
  //     ) {
  //       setIsOpen(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [isOpen]);

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
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* Header Compact Metronome Widget */}
      <div
      
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
        <PopoverTrigger
          type="button"
          className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/40 transition-colors"
          title="Click to open Metronome settings & Iqa' practice controls"
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
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="end"
        className="flex w-[min(calc(100vw-1rem),42rem)] max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border p-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold">
                Visual Metronome &amp; Iqa’
                <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[9px]">
                  Tone.js Sync
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Synchronized rhythm engine for Arabic Maqam practice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="cursor-pointer rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Close metronome panel"
            aria-label="Close metronome panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pt-0">
          <section className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 p-3.5 dark:bg-slate-900/80">
            <div className="relative mb-1 flex h-14 w-full items-center justify-center">
              <div className="absolute top-0 h-2 w-2 rounded-full bg-amber-500/80" />
              <div
                className="w-1 origin-top rounded-full bg-linear-to-b from-amber-400 to-amber-600 shadow-xs transition-transform duration-100 ease-out"
                style={{ height: '48px', transform: `rotate(${isPlaying ? pendulumAngle : 0}deg)` }}
              >
                <div className="absolute -bottom-1.5 -left-1.5 h-4 w-4 rounded-full border-2 border-slate-900 bg-amber-400 shadow-md" />
              </div>
              <div className="absolute bottom-1 h-0.5 w-32 border-b border-dashed border-muted-foreground/30" />
            </div>
            <div className="flex w-full flex-wrap items-center justify-center gap-2">
              {Array.from({ length: timeSignature.beatsPerBar }).map((_, idx) => {
                const active = isPlaying && currentBeat === idx;
                const isDown = timeSignature.downbeats.includes(idx);
                const isSecondary = timeSignature.secondaryAccents.includes(idx);
                const syllable = timeSignature.beatSyllables?.[idx] || (isDown ? 'Dum' : 'Tak');
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className={`relative flex h-9 w-9 items-center justify-center rounded-xl font-mono text-xs font-bold transition-all ${
                        active
                          ? 'scale-110 bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/50'
                          : isDown
                          ? 'border-2 border-amber-500/50 bg-muted/80 text-foreground dark:bg-slate-800'
                          : isSecondary
                          ? 'border border-amber-500/30 bg-muted/60 text-muted-foreground dark:bg-slate-800/80'
                          : 'border border-border bg-muted/40 text-muted-foreground dark:bg-slate-900'
                      }`}
                    >
                      {idx + 1}
                      {active && <span className="absolute -right-1 -top-1 h-2 w-2 animate-ping rounded-full bg-amber-400" />}
                    </div>
                    <span className={`font-mono text-[9px] ${active ? 'font-bold text-amber-400' : 'text-muted-foreground'}`}>
                      {syllable}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex items-center gap-3">
            <Button
              variant={isPlaying ? 'default' : 'outline'}
              size="lg"
              onClick={togglePlayback}
              className={`flex-1 gap-2 font-bold ${isPlaying ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : ''}`}
            >
              {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              {isPlaying ? 'Stop Metronome' : 'Start Practice'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleTapTempo}
              className={isTapping ? 'border-amber-400 bg-amber-500 text-slate-950' : ''}
              title="Tap rhythmically at desired tempo"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              TAP
            </Button>
          </div>

          <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-3 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-black text-foreground">{bpm}</span>
                  <span className="text-xs font-semibold text-muted-foreground">BPM</span>
                </div>
                <div className="text-[11px] font-medium text-amber-500 dark:text-amber-400">
                  {tempoInfo.term} · <span className="font-arabic">{tempoInfo.ar}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono">
                {[-5, -1, 1, 5].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleBpmChange(bpm + step)}
                    className="cursor-pointer rounded-lg bg-muted px-2 py-1 text-xs font-bold text-foreground hover:bg-muted/80"
                    aria-label={`${step < 0 ? 'Decrease' : 'Increase'} tempo by ${Math.abs(step)} BPM`}
                  >
                    {step > 0 ? `+${step}` : step}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="30"
              max="280"
              value={bpm}
              onChange={(event) => handleBpmChange(Number(event.target.value))}
              aria-label="Tempo in beats per minute"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-amber-500"
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              {[
                [60, '60 Thaqil'],
                [84, '84 Andante'],
                [108, '108 Moderato'],
                [132, '132 Darij'],
                [160, '160 Sari’'],
              ].map(([tempo, label]) => (
                <button
                  key={tempo}
                  type="button"
                  onClick={() => handleBpmChange(Number(tempo))}
                  className="cursor-pointer hover:text-amber-400"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Drum className="h-3.5 w-3.5 text-amber-500" />
                Time Signature &amp; Iqa’ Meter
              </span>
              <span className="font-mono text-[11px] font-bold text-amber-500">
                {timeSignature.name} ({timeSignature.arabicTransliteration})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {TIME_SIGNATURE_PRESETS.map((preset) => {
                const selected = timeSignature.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleTimeSignatureSelect(preset)}
                    aria-pressed={selected}
                    className={`flex cursor-pointer flex-col justify-between rounded-lg border p-2 text-left transition ${
                      selected
                        ? 'border-amber-500/70 bg-amber-500/15 font-bold text-foreground'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:bg-slate-900'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-1">
                      <span className="font-mono text-xs font-black text-amber-500">{preset.name}</span>
                      <span className="truncate font-arabic text-[10px] opacity-80" dir="rtl">
                        {preset.arabicName.split('/')[0]}
                      </span>
                    </span>
                    <span className="mt-0.5 truncate text-[10px] text-foreground/80">
                      {preset.arabicTransliteration.split('/')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">{timeSignature.description}</p>
          </section>

          <section className="space-y-3 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Sliders className="h-3.5 w-3.5 text-amber-500" />
                Audio Click Timbre
              </span>
              <span className="text-right text-[11px] text-muted-foreground">
                {soundType === 'dum-tak'
                  ? 'Dum-Tak (دوم / تك)'
                  : soundType === 'woodblock'
                  ? 'Woodblock (خشبي)'
                  : soundType === 'digital'
                  ? 'Digital Beep'
                  : 'Silent (Visual Only)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {([
                ['dum-tak', 'Dum-Tak'],
                ['woodblock', 'Woodblock'],
                ['digital', 'Digital'],
                ['silent', 'Visual Only'],
              ] as const).map(([sound, label]) => (
                <button
                  key={sound}
                  type="button"
                  onClick={() => handleSoundTypeChange(sound)}
                  aria-pressed={soundType === sound}
                  className={`cursor-pointer rounded-lg border px-2 py-1.5 text-center text-[11px] font-medium transition ${
                    soundType === sound
                      ? 'border-amber-400 bg-amber-500 font-bold text-slate-950'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground dark:bg-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {soundType !== 'silent' && (
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleVolumeChange(volume === 0 ? 75 : 0)}
                  className="cursor-pointer text-muted-foreground transition hover:text-foreground"
                  title={volume === 0 ? 'Unmute' : 'Mute'}
                  aria-label={volume === 0 ? 'Unmute metronome' : 'Mute metronome'}
                >
                  {volume === 0 ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-amber-500" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => handleVolumeChange(Number(event.target.value))}
                  aria-label="Metronome volume"
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-muted accent-amber-500"
                />
                <span className="w-8 text-right font-mono text-[11px] font-bold text-muted-foreground">
                  {volume}%
                </span>
              </div>
            )}
          </section>
        </div>
      </PopoverContent>
      </Popover>
    </div>
  );
};
