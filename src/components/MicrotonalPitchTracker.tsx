// src/components/MicrotonalPitchTracker.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArabicPitch } from '../core/pitch';
import { getPitchThemeClasses } from '../core/pitch-styling';
import { Maqam } from '../theory/maqam';
import { MicrotonalAudioEngine, type TimbreType } from '../audio/microtonal-audio';
import {
  MicrotonalPitchDetector,
  type PitchDetectionResult,
} from '../audio/pitch-detector';
import { TrainingStorage } from '../theory/training-progress';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AsyncFeedback } from './AsyncFeedback';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
  Sliders,
  Target,
  RefreshCw,
  Compass,
  Music,
} from 'lucide-react';

interface Props {
  currentMaqam: Maqam;
  timbre: TimbreType;
  onXpGain?: (amount: number) => void;
  className?: string;
}

export const MicrotonalPitchTracker: React.FC<Props> = ({
  currentMaqam,
  timbre,
  onXpGain,
  className = '',
}) => {
  // Mic & Audio Engine state
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [referenceA4, setReferenceA4] = useState<number>(440);
  const [noiseThreshold, setNoiseThreshold] = useState<number>(0.015);
  const [inputLevelDb, setInputLevelDb] = useState<number>(-100);

  // Pitch tracking results
  const [currentDetection, setCurrentDetection] = useState<PitchDetectionResult | null>(null);
  const [pitchHistory, setPitchHistory] = useState<{ note: string; cents: number; inTune: boolean }[]>([]);

  // Target Lock & Training Mode
  const [trackingMode, setTrackingMode] = useState<'free' | 'target'>('free');
  const [targetPitch, setTargetPitch] = useState<ArabicPitch>(() => currentMaqam.getScale()[0]);
  const [inTuneStreakSeconds, setInTuneStreakSeconds] = useState<number>(0);
  const [bestStreakSeconds, setBestStreakSeconds] = useState<number>(0);
  const [dronePlaying, setDronePlaying] = useState<boolean>(false);

  // Audio nodes and refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectorRef = useRef<MicrotonalPitchDetector | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastInTuneTimeRef = useRef<number>(0);
  const streakTimerRef = useRef<number | null>(null);

  // Initialize or update detector reference
  useEffect(() => {
    detectorRef.current = new MicrotonalPitchDetector(44100, 2048, {
      referenceA4,
      volumeThresholdRms: noiseThreshold,
      inTuneCentsTolerance: 7.0,
    });
  }, [referenceA4, noiseThreshold]);

  // Update target pitch when Maqam changes
  useEffect(() => {
    const scale = currentMaqam.getScale();
    if (scale.length > 0) {
      setTargetPitch(scale[0]);
    }
  }, [currentMaqam]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  const stopMicrophone = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streakTimerRef.current !== null) {
      window.clearInterval(streakTimerRef.current);
      streakTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (dronePlaying) {
      MicrotonalAudioEngine.stopSequence('intonation-drone');
      setDronePlaying(false);
    }
    setIsListening(false);
    setCurrentDetection(null);
    setInputLevelDb(-100);
  }, [dronePlaying]);

  const startMicrophone = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access is not supported by this browser context. Ensure HTTPS or localhost is active.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      mediaStreamRef.current = stream;

      await MicrotonalAudioEngine.startAudioContext();
      const audioCtx = MicrotonalAudioEngine.getAudioContext();
      audioContextRef.current = audioCtx;

      // Update detector with actual sample rate
      detectorRef.current = new MicrotonalPitchDetector(audioCtx.sampleRate, 2048, {
        referenceA4,
        volumeThresholdRms: noiseThreshold,
        inTuneCentsTolerance: 7.0,
      });

      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.1;
      sourceNode.connect(analyserNode);
      analyserRef.current = analyserNode;

      setIsListening(true);
      startTrackingLoop();
    } catch (err) {
      setMicError(err instanceof Error ? err.message : 'Could not access microphone.');
      stopMicrophone();
    }
  };

  const startTrackingLoop = () => {
    const analyser = analyserRef.current;
    const detector = detectorRef.current;
    if (!analyser || !detector) return;

    const timeDomainBuffer = new Float32Array(analyser.fftSize);

    let streakCounter = 0;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      analyser.getFloatTimeDomainData(timeDomainBuffer);
      const detection = detector.detectPitch(timeDomainBuffer, currentMaqam);

      if (detection) {
        setCurrentDetection(detection);
        setInputLevelDb(detection.volumeDb);

        // Check in-tune streak
        const matchesTarget = trackingMode === 'free' || detection.closestPitch.equals(targetPitch);
        if (detection.inTune && matchesTarget) {
          streakCounter += dt;
          setInTuneStreakSeconds(Math.round(streakCounter * 10) / 10);
          setBestStreakSeconds((prev) => Math.max(prev, Math.round(streakCounter * 10) / 10));

          // Award XP milestone & unlock intonation badge
          if (streakCounter >= 3.0 && Math.floor(streakCounter) !== Math.floor(streakCounter - dt)) {
            if (onXpGain) onXpGain(15);
            const currentStats = TrainingStorage.getStats();
            const withStreak = TrainingStorage.updateStreak(true, currentStats);
            TrainingStorage.unlockBadge('intonation_master', withStreak);
          }
        } else {
          streakCounter = Math.max(0, streakCounter - dt * 2);
          setInTuneStreakSeconds(Math.round(streakCounter * 10) / 10);
        }

        // Draw waveform
        drawWaveform(timeDomainBuffer, detection.inTune);
      } else {
        setInputLevelDb(-100);
        streakCounter = Math.max(0, streakCounter - dt * 2);
        setInTuneStreakSeconds(Math.round(streakCounter * 10) / 10);
        drawWaveform(timeDomainBuffer, false);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const drawWaveform = (buffer: Float32Array, inTune: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = inTune ? 2.5 : 1.5;
    ctx.strokeStyle = inTune ? '#10b981' : isListening ? '#f59e0b' : '#64748b';
    ctx.beginPath();

    const sliceWidth = width / buffer.length;
    let x = 0;

    for (let i = 0; i < buffer.length; i += 4) {
      const v = buffer[i] * 0.9;
      const y = (height / 2) + (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth * 4;
    }

    ctx.stroke();
  };

  const toggleDrone = () => {
    if (dronePlaying) {
      MicrotonalAudioEngine.stopSequence('intonation-drone');
      setDronePlaying(false);
    } else {
      const pitchToPlay = trackingMode === 'target' ? targetPitch : currentDetection?.closestPitch ?? targetPitch;
      MicrotonalAudioEngine.playPitch(pitchToPlay, 60.0, timbre, 0.7);
      setDronePlaying(true);
    }
  };

  const playPitchOnce = (pitch: ArabicPitch) => {
    MicrotonalAudioEngine.playPitch(pitch, 1.2, timbre, 0.75);
  };

  const scalePitches = currentMaqam.getScale();
  const detectionPitch = currentDetection?.closestPitch;
  const pitchTheme = detectionPitch ? getPitchThemeClasses(detectionPitch, 'card') : null;

  // Cents needle position: -25 to +25 mapped to 0% to 100%
  const cents = currentDetection ? currentDetection.centsDeviation : 0;
  const needlePercent = Math.max(0, Math.min(100, ((cents + 25) / 50) * 100));

  return (
    <Card className={`border-border ${className}`}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="secondary" className="text-xs font-bold text-amber-500 bg-amber-500/10 border-amber-500/30">
                Acoustic Microphone Sensor
              </Badge>
              <Badge variant="outline" className="text-xs font-mono border-emerald-500/30 text-emerald-400">
                24-EDO Quarter-Tone Precision (±25¢)
              </Badge>
              <span className="text-xs text-muted-foreground font-arabic">
                مقياس دقة ربع التون عبر المايكروفون
              </span>
            </div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>Real-Time Pitch &amp; Intonation Tracker</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Sing or play your violin, oud, or nay into the microphone. Instantly tracks your acoustic frequency, identifies quarter-tones, and verifies intonation within Maqam {currentMaqam.name}.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={isListening ? stopMicrophone : startMicrophone}
              className={`gap-2 font-bold cursor-pointer transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop Microphone</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start Microphone</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {micError && (
          <div className="mt-3">
            <AsyncFeedback
              kind="error"
              title="Microphone Access Required"
              description={micError}
              action={{ label: 'Retry Access', onClick: startMicrophone }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Main Intonation Meter & Hero Pitch Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Hero Detected Pitch Display */}
          <div className={`lg:col-span-5 p-5 rounded-2xl bg-muted/30 dark:bg-slate-900 border transition-all flex flex-col justify-between relative overflow-hidden ${
            pitchTheme ? pitchTheme.border : 'border-border'
          }`}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Detected Note
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span className="font-mono text-[11px]">
                  {isListening ? `${inputLevelDb > -90 ? `${inputLevelDb} dB` : 'Listening...'}` : 'Mic Off'}
                </span>
              </div>
            </div>

            <div className="my-4 text-center">
              {currentDetection ? (
                <div className="space-y-1">
                  <div
                    className={`inline-block font-mono text-5xl sm:text-6xl font-black transition-all ${
                      currentDetection.inTune
                        ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                        : currentDetection.status === 'sharp'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {currentDetection.closestPitch.toDisplayString()}
                    <span className="text-2xl text-muted-foreground font-normal ml-1">
                      {currentDetection.closestPitch.octave}
                    </span>
                  </div>

                  <div className="text-sm font-arabic font-bold text-foreground">
                    {currentDetection.closestPitch.toScientificString()} • {currentDetection.closestPitch.accidental === '𝄳' ? 'نصف بيمول (سيكاه)' : currentDetection.closestPitch.accidental === '𝄵' ? 'نصف دييز' : 'طبيعي'}
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1 font-mono text-xs">
                    <span className="text-muted-foreground">{currentDetection.frequency} Hz</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Target: {currentDetection.targetFrequency} Hz</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-muted-foreground space-y-2">
                  <Mic className="w-10 h-10 mx-auto text-muted-foreground/40 stroke-1" />
                  <div className="text-sm font-medium">
                    {isListening ? 'Play or sing a note into your mic...' : 'Click "Start Microphone" above to begin'}
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    Supports violin, oud, vocal, and woodwind acoustic sources
                  </div>
                </div>
              )}
            </div>

            {/* Status & Maqam Role Pill */}
            <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Scale Membership:</span>
              {currentDetection ? (
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    currentDetection.isMaqamNote
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {currentDetection.isMaqamNote
                    ? `✓ ${currentDetection.maqamRole} in ${currentMaqam.name}`
                    : 'Non-Maqam Accidental'}
                </span>
              ) : (
                <span className="text-muted-foreground font-mono">--</span>
              )}
            </div>
          </div>

          {/* Right Column: Intonation Dial & Gauge */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-muted/20 dark:bg-slate-900/60 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  24-EDO Microtonal Cents Gauge
                </span>
                <span className="font-mono text-xs">
                  {currentDetection ? (
                    <span
                      className={`font-bold ${
                        currentDetection.inTune
                          ? 'text-emerald-400'
                          : currentDetection.status === 'sharp'
                          ? 'text-amber-400'
                          : 'text-sky-400'
                      }`}
                    >
                      {currentDetection.centsDeviation > 0 ? `+${currentDetection.centsDeviation}` : currentDetection.centsDeviation} ¢
                    </span>
                  ) : (
                    '0.0 ¢'
                  )}
                </span>
              </div>

              {/* Linear Precision Cents Gauge */}
              <div className="relative pt-6 pb-2">
                {/* Safe zone highlight (±7 cents) */}
                <div className="h-4 bg-muted/60 dark:bg-slate-950 rounded-full relative overflow-hidden border border-border/80">
                  {/* Central in-tune zone (centered at 50%, width 28% for ±7 cents) */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-500/40"
                    style={{ left: `${((25 - 7) / 50) * 100}%`, width: `${(14 / 50) * 100}%` }}
                    title="In-tune tolerance zone (±7 cents)"
                  />

                  {/* Dynamic Needle Indicator */}
                  {currentDetection && (
                    <div
                      className={`absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full transition-all duration-75 shadow-md ${
                        currentDetection.inTune
                          ? 'bg-emerald-400 shadow-emerald-500/50'
                          : currentDetection.status === 'sharp'
                          ? 'bg-amber-400 shadow-amber-500/50'
                          : 'bg-sky-400 shadow-sky-500/50'
                      }`}
                      style={{ left: `${needlePercent}%` }}
                    />
                  )}
                </div>

                {/* Center marker line */}
                <div className="absolute top-4 bottom-2 left-1/2 -ml-px w-0.5 bg-foreground/30 pointer-events-none" />

                {/* Tick marks and labels */}
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-2 px-1">
                  <span>-25¢ (Flat)</span>
                  <span>-15¢</span>
                  <span className="text-emerald-400 font-bold">0¢ (Perfect)</span>
                  <span>+15¢</span>
                  <span>+25¢ (Sharp)</span>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`mt-4 p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                  currentDetection
                    ? currentDetection.inTune
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : currentDetection.status === 'sharp'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                    : 'bg-muted/40 border-border text-muted-foreground'
                }`}
              >
                {currentDetection ? (
                  currentDetection.inTune ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-sm">مضبوط تماماً • In Tune ({currentDetection.centsDeviation} ¢)</span>
                    </>
                  ) : currentDetection.status === 'sharp' ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-sm">مرتفع قليلاً (Sharp) • انزل بالأصبع قليلاً (+{currentDetection.centsDeviation} ¢)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-sm">منخفض قليلاً (Flat) • ارفع بالأصبع قليلاً ({currentDetection.centsDeviation} ¢)</span>
                    </>
                  )
                ) : (
                  <span className="text-xs">Waiting for audio input...</span>
                )}
              </div>
            </div>

            {/* Waveform Canvas & Calibration */}
            <div className="mt-4 pt-3 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-1/2">
                <div className="text-[10px] text-muted-foreground font-semibold mb-1 flex items-center justify-between">
                  <span>Input Waveform</span>
                  <span className="font-mono text-[9px]">2048 FFT</span>
                </div>
                <canvas
                  ref={canvasRef}
                  width={240}
                  height={34}
                  className="w-full h-8 rounded-lg bg-slate-950 border border-border/80"
                />
              </div>

              {/* Reference Tone & Drone Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleDrone}
                  className={`text-xs gap-1.5 cursor-pointer ${
                    dronePlaying ? 'bg-amber-500/20 border-amber-500 text-amber-300' : ''
                  }`}
                  title="Play reference continuous tone to tune by ear"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{dronePlaying ? 'Stop Drone' : 'Reference Drone'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Maqam Scale Intonation Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Maqam {currentMaqam.name} Scale Degree Tracker</span>
            </span>
            <span className="text-[11px] font-mono">
              Sing or play each degree across the scale
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {scalePitches.map((p, idx) => {
              const isDetected = currentDetection?.closestPitch.equals(p);
              const isInTuneMatch = isDetected && currentDetection?.inTune;
              const isTarget = trackingMode === 'target' && targetPitch.equals(p);
              const theme = getPitchThemeClasses(p, 'card', { isSounding: isDetected });

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setTargetPitch(p);
                    setTrackingMode('target');
                    playPitchOnce(p);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none relative flex flex-col justify-between ${
                    isDetected
                      ? isInTuneMatch
                        ? 'ring-2 ring-emerald-400 scale-105 shadow-lg bg-emerald-500/20 border-emerald-400'
                        : 'ring-2 ring-amber-400 scale-105 shadow-md bg-amber-500/20 border-amber-400'
                      : isTarget
                      ? 'border-indigo-400 bg-indigo-500/10'
                      : theme.combined + ' hover:border-amber-500/50'
                  }`}
                  title={`Click to set as intonation practice target and hear reference pitch`}
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono w-full">
                    <span>Deg {idx + 1}</span>
                    {idx === 0 ? (
                      <span className="text-[9px] font-bold text-amber-400">قرار</span>
                    ) : p.equals(currentMaqam.getGhammaz()) ? (
                      <span className="text-[9px] font-bold text-indigo-400">غمّاز</span>
                    ) : null}
                  </div>

                  <div className="my-1">
                    <div className="font-mono text-base font-black text-foreground">
                      {p.toDisplayString()}
                    </div>
                    <div className="text-[10px] font-arabic font-semibold text-muted-foreground">
                      {p.toScientificString()}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-muted-foreground/80 border-t border-border/40 pt-1 w-full">
                    {Math.round(p.toFrequency(referenceA4))} Hz
                  </div>

                  {isDetected && currentDetection && (
                    <div
                      className={`absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full font-bold text-[9px] ${
                        isInTuneMatch
                          ? 'bg-emerald-500 text-slate-950 animate-bounce'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {currentDetection.centsDeviation > 0 ? `+${currentDetection.centsDeviation}¢` : `${currentDetection.centsDeviation}¢`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Intonation Practice & Calibration Bar */}
        <div className="p-4 rounded-xl bg-muted/30 dark:bg-slate-900 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* Practice Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground">Tracker Mode:</span>
            <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setTrackingMode('free')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                  trackingMode === 'free' ? 'bg-amber-500 text-slate-950' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Free Tracking (حر)
              </button>
              <button
                type="button"
                onClick={() => setTrackingMode('target')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                  trackingMode === 'target' ? 'bg-amber-500 text-slate-950' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Target Hold (تثبيت النغمة)
              </button>
            </div>
          </div>

          {/* Intonation Hold Counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>In-Tune Hold:</span>
              <span className="font-bold text-emerald-400 text-sm">{inTuneStreakSeconds}s</span>
              <span className="text-muted-foreground text-[10px]">(Best: {bestStreakSeconds}s)</span>
            </div>
          </div>

          {/* Calibration Selector */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground">Calibration A4:</span>
            <div className="flex items-center gap-1">
              {[432, 440, 442].map((freq) => (
                <button
                  type="button"
                  key={freq}
                  onClick={() => setReferenceA4(freq)}
                  className={`px-2 py-1 rounded font-mono text-[11px] cursor-pointer transition ${
                    referenceA4 === freq
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {freq}Hz
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
