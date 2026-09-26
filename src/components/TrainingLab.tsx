// src/components/TrainingLab.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { Maqam } from '../theory/maqam';
import { ArabicPitch } from '../core/pitch';
import { MicrotonalAudioEngine, type TimbreType } from '../audio/microtonal-audio';
import { MetronomeAudioEngine, TIME_SIGNATURE_PRESETS } from '../audio/metronome-engine';
import { MusicXMLExporter } from '../score/musicxml-exporter';
import { ViolinErgonomicsEngine } from '../violin/ergonomics';
import {
  TrainingStorage,
  TrainingStats,
  INITIAL_BADGES,
  TrainingBadge
} from '../theory/training-progress';
import {
  MelodyGenerator,
  GeneratedMelody,
  MelodyDifficulty
} from '../theory/melody-generator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Play,
  Square,
  RotateCcw,
  Volume2,
  Mic,
  Flame,
  Trophy,
  Sparkles,
  Download,
  CheckCircle2,
  XCircle,
  Check,
  Music,
  Sliders,
  Dices,
  BookOpen,
  Award,
  Ear,
  X
} from 'lucide-react';

interface Props {
  currentMaqam: Maqam;
  allMaqamat: Maqam[];
  onSelectMaqam: (maqam: Maqam) => void;
  timbre: TimbreType;
}

type TrainingMode = 'memorization' | 'sightreading' | 'recording';
type MemorizationSubMode = 'builder' | 'quiz' | 'ear';

interface RecordedTake {
  id: string;
  blob: Blob;
  url: string;
  durationSeconds: number;
  timestamp: string;
  maqamName: string;
  title: string;
}

interface QuizQuestion {
  prompt: string;
  arabicPrompt: string;
  options: ArabicPitch[];
  correctIndex: number;
  explanation: string;
}

// Helper initializers
function createInitialSlots(maqam: Maqam): (ArabicPitch | null)[] {
  const scale = maqam.getScale();
  const initialSlots: (ArabicPitch | null)[] = new Array(scale.length).fill(null);
  if (scale.length > 0) {
    initialSlots[0] = scale[0];
  }
  return initialSlots;
}

function createInitialNotePool(maqam: Maqam): ArabicPitch[] {
  const scale = maqam.getScale();
  const candidates: ArabicPitch[] = [...scale];

  scale.forEach(p => {
    if (p.accidental === '𝄳') {
      candidates.push(new ArabicPitch(p.diatonic, '♭', p.octave));
      candidates.push(new ArabicPitch(p.diatonic, '♮', p.octave));
    } else if (p.accidental === '♮') {
      candidates.push(new ArabicPitch(p.diatonic, '𝄵', p.octave));
    } else if (p.accidental === '♭') {
      candidates.push(new ArabicPitch(p.diatonic, '𝄳', p.octave));
    }
  });

  const uniquePool: ArabicPitch[] = [];
  candidates.forEach(c => {
    if (!uniquePool.some(existing => existing.equals(c))) {
      uniquePool.push(c);
    }
  });

  uniquePool.sort(() => Math.random() - 0.5);
  return uniquePool.slice(0, 14);
}

function createQuizQuestion(maqam: Maqam): QuizQuestion | null {
  const scale = maqam.getScale();
  if (scale.length < 5) return null;

  const targetIdx = 1 + Math.floor(Math.random() * (scale.length - 2));
  const targetPitch = scale[targetIdx];

  const options = [
    targetPitch,
    new ArabicPitch(targetPitch.diatonic, targetPitch.accidental === '𝄳' ? '♭' : '𝄳', targetPitch.octave),
    new ArabicPitch(targetPitch.diatonic, targetPitch.accidental === '♮' ? '♯' : '♮', targetPitch.octave),
    new ArabicPitch(targetPitch.diatonic, targetPitch.accidental === '𝄵' ? '♯' : '𝄵', targetPitch.octave)
  ];

  const uniqueOptions: ArabicPitch[] = [];
  options.forEach(opt => {
    if (!uniqueOptions.some(u => u.equals(opt))) {
      uniqueOptions.push(opt);
    }
  });

  uniqueOptions.sort(() => Math.random() - 0.5);
  const correctIdx = uniqueOptions.findIndex(u => u.equals(targetPitch));

  const degreeNames = ['1st (Qarar)', '2nd', '3rd (Sikah)', '4th', '5th (Ghammaz)', '6th', '7th', '8th (Jawab)'];

  return {
    prompt: `What is the ${degreeNames[targetIdx]} scale degree of Maqam ${maqam.name}?`,
    arabicPrompt: `ما هي الدرجة (${degreeNames[targetIdx]}) لمقام ${maqam.name}؟`,
    options: uniqueOptions,
    correctIndex: correctIdx,
    explanation: `Degree ${targetIdx + 1} of ${maqam.name} is ${targetPitch.toString()} (${targetPitch.toScientificString()}). Accidental is '${targetPitch.accidental}'.`
  };
}

function createEarData(maqam: Maqam): { target: ArabicPitch | null; options: ArabicPitch[] } {
  const scale = maqam.getScale();
  if (scale.length === 0) return { target: null, options: [] };

  const target = scale[Math.floor(Math.random() * scale.length)];
  const shuffled = [...scale].sort(() => Math.random() - 0.5);
  if (!shuffled.some(s => s.equals(target))) {
    shuffled[0] = target;
  }
  const finalChoices = shuffled.slice(0, 4);
  if (!finalChoices.some(s => s.equals(target))) {
    finalChoices[0] = target;
  }
  finalChoices.sort((a, b) => a.toQuarterToneIndex() - b.toQuarterToneIndex());

  return { target, options: finalChoices };
}

export const TrainingLab: React.FC<Props> = ({
  currentMaqam,
  allMaqamat,
  onSelectMaqam,
  timbre
}) => {
  // Main Navigation Mode
  const [activeMode, setActiveMode] = useState<TrainingMode>('memorization');
  const [memSubMode, setMemSubMode] = useState<MemorizationSubMode>('builder');

  // User Stats & Gamification
  const [stats, setStats] = useState<TrainingStats>(() => TrainingStorage.getStats());
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);
  const [recentXpGain, setRecentXpGain] = useState<number | null>(null);

  // Derive badges from stats without cascading render
  const badges: TrainingBadge[] = INITIAL_BADGES.map(b => ({
    ...b,
    unlocked: stats.unlockedBadgeIds.includes(b.id)
  }));

  const triggerXpGain = useCallback((amount: number) => {
    setStats(prev => TrainingStorage.addXp(amount, prev));
    setRecentXpGain(amount);
    setTimeout(() => setRecentXpGain(null), 1800);
  }, []);

  // -------------------------------------------------------------
  // 1. SCALE MEMORIZATION GAME STATE & LOGIC
  // -------------------------------------------------------------
  const scalePitches = currentMaqam.getScale();
  const [builderSlots, setBuilderSlots] = useState<(ArabicPitch | null)[]>(() => createInitialSlots(currentMaqam));
  const [builderValidated, setBuilderValidated] = useState<boolean>(false);
  const [builderSuccess, setBuilderSuccess] = useState<boolean>(false);
  const [notePool, setNotePool] = useState<ArabicPitch[]>(() => createInitialNotePool(currentMaqam));

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(() => createQuizQuestion(currentMaqam));
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);

  // Ear training state
  const initialEar = createEarData(currentMaqam);
  const [mysteryPitch, setMysteryPitch] = useState<ArabicPitch | null>(initialEar.target);
  const [earOptions, setEarOptions] = useState<ArabicPitch[]>(initialEar.options);
  const [selectedEarIdx, setSelectedEarIdx] = useState<number | null>(null);
  const [earAnswered, setEarAnswered] = useState<boolean>(false);

  // Sight-Reading state
  const [difficulty, setDifficulty] = useState<MelodyDifficulty>('level1');
  const [melodyLength, setMelodyLength] = useState<number>(8);
  const [melodyMeter, setMelodyMeter] = useState<'4/4' | '3/4' | '2/4'>('4/4');
  const [melodyTempo, setMelodyTempo] = useState<number>(90);
  const [generatedMelody, setGeneratedMelody] = useState<GeneratedMelody | null>(() =>
    MelodyGenerator.generateMelody(currentMaqam, 'level1', 8, '4/4', 90)
  );
  const [activeMelodyStep, setActiveMelodyStep] = useState<number>(-1);
  const [isMelodyPlaying, setIsMelodyPlaying] = useState<boolean>(false);
  const [melodyCountIn, setMelodyCountIn] = useState<number | null>(null);
  const countInTimeoutRef = useRef<number | null>(null);
  const countInRunRef = useRef<number>(0);

  // Synchronize state when selected Maqam changes (React 19 pattern avoiding cascading renders)
  const [prevMaqamId, setPrevMaqamId] = useState(currentMaqam.id);
  if (currentMaqam.id !== prevMaqamId) {
    setPrevMaqamId(currentMaqam.id);
    setBuilderSlots(createInitialSlots(currentMaqam));
    setNotePool(createInitialNotePool(currentMaqam));
    setBuilderValidated(false);
    setBuilderSuccess(false);
    setCurrentQuestion(createQuizQuestion(currentMaqam));
    const newEar = createEarData(currentMaqam);
    setMysteryPitch(newEar.target);
    setEarOptions(newEar.options);
    setGeneratedMelody(MelodyGenerator.generateMelody(currentMaqam, difficulty, melodyLength, melodyMeter, melodyTempo));
  }

  // Handle clicking a note in the candidate pool
  const handleSelectPoolNote = (pitch: ArabicPitch) => {
    MicrotonalAudioEngine.playPitch(pitch, 0.6, timbre);

    const firstEmptyIndex = builderSlots.findIndex(s => s === null);
    if (firstEmptyIndex !== -1) {
      const nextSlots = [...builderSlots];
      nextSlots[firstEmptyIndex] = pitch;
      setBuilderSlots(nextSlots);
    }
  };

  // Handle removing a placed note
  const handleRemoveSlot = (index: number) => {
    if (index === 0) return; // Keep root note
    const nextSlots = [...builderSlots];
    nextSlots[index] = null;
    setBuilderSlots(nextSlots);
    setBuilderValidated(false);
  };

  // Check scale builder accuracy
  const handleCheckBuilder = () => {
    const scale = currentMaqam.getScale();
    let allCorrect = true;

    for (let i = 0; i < scale.length; i++) {
      const placed = builderSlots[i];
      if (!placed || !placed.equals(scale[i])) {
        allCorrect = false;
        break;
      }
    }

    setBuilderValidated(true);
    setBuilderSuccess(allCorrect);

    if (allCorrect) {
      triggerXpGain(30);
      setStats(prev => TrainingStorage.updateStreak(true, prev));
      MicrotonalAudioEngine.playSequence(scale, 250, timbre);
    } else {
      setStats(prev => TrainingStorage.updateStreak(false, prev));
    }
  };

  const handleNextQuizQuestion = () => {
    setCurrentQuestion(createQuizQuestion(currentMaqam));
    setSelectedQuizOption(null);
    setQuizAnswered(false);
  };

  const handleSelectQuizOption = (idx: number) => {
    if (quizAnswered || !currentQuestion) return;
    setSelectedQuizOption(idx);
    setQuizAnswered(true);

    const isCorrect = idx === currentQuestion.correctIndex;
    const chosenPitch = currentQuestion.options[idx];
    MicrotonalAudioEngine.playPitch(chosenPitch, 0.7, timbre);

    if (isCorrect) {
      triggerXpGain(20);
      setStats(prev => TrainingStorage.updateStreak(true, prev));
    } else {
      setStats(prev => TrainingStorage.updateStreak(false, prev));
    }
  };

  const handleNextEarTraining = () => {
    const earData = createEarData(currentMaqam);
    setMysteryPitch(earData.target);
    setEarOptions(earData.options);
    setSelectedEarIdx(null);
    setEarAnswered(false);

    if (earData.target) {
      MicrotonalAudioEngine.playPitch(earData.target, 0.9, timbre);
    }
  };

  const playMysteryTone = () => {
    if (mysteryPitch) {
      MicrotonalAudioEngine.playPitch(mysteryPitch, 0.9, timbre);
    }
  };

  const playReferenceTonic = () => {
    const scale = currentMaqam.getScale();
    if (scale.length > 0) {
      MicrotonalAudioEngine.playPitch(scale[0], 0.9, timbre);
    }
  };

  const handleSelectEarOption = (idx: number) => {
    if (earAnswered || !mysteryPitch) return;
    setSelectedEarIdx(idx);
    setEarAnswered(true);

    const isCorrect = earOptions[idx].equals(mysteryPitch);
    if (isCorrect) {
      triggerXpGain(25);
      setStats(prev => TrainingStorage.updateStreak(true, prev));
    } else {
      setStats(prev => TrainingStorage.updateStreak(false, prev));
    }
  };

  // -------------------------------------------------------------
  // 2. SIGHT-READING STUDIO LOGIC
  // -------------------------------------------------------------
  const osmdContainerRef = useRef<HTMLDivElement>(null);
  const osmdInstanceRef = useRef<OpenSheetMusicDisplay | null>(null);

  const handleGenerateMelody = useCallback(() => {
    try {
      const melody = MelodyGenerator.generateMelody(
        currentMaqam,
        difficulty,
        melodyLength,
        melodyMeter,
        melodyTempo
      );
      setGeneratedMelody(melody);
      setActiveMelodyStep(-1);
      setIsMelodyPlaying(false);
      countInRunRef.current += 1;
      if (countInTimeoutRef.current !== null) {
        window.clearInterval(countInTimeoutRef.current);
        countInTimeoutRef.current = null;
      }
      setMelodyCountIn(null);
      MetronomeAudioEngine.stop();
      MicrotonalAudioEngine.stopSequence();
    } catch {
      // safe
    }
  }, [currentMaqam, difficulty, melodyLength, melodyMeter, melodyTempo]);

  // Render OSMD MusicXML for Sight-Reading
  useEffect(() => {
    if (activeMode !== 'sightreading' || !generatedMelody || !osmdContainerRef.current) {
      return;
    }

    let isMounted = true;
    const container = osmdContainerRef.current;
    container.innerHTML = '';

    const xml = MusicXMLExporter.generatePhraseMusicXML(
      generatedMelody.title,
      generatedMelody.pitches
    );

    try {
      const osmd = new OpenSheetMusicDisplay(container, {
        autoResize: true,
        backend: 'svg',
        drawTitle: true,
        drawSubtitle: false,
        drawPartNames: false,
        drawComposer: false,
        drawCredits: false,
        drawingParameters: 'compacttight'
      });

      osmdInstanceRef.current = osmd;

      osmd.load(xml).then(() => {
        if (isMounted) {
          osmd.render();
        }
      });
    } catch {
      // safe
    }

    return () => {
      isMounted = false;
      osmdInstanceRef.current = null;
    };
  }, [activeMode, generatedMelody]);

  // Count in before starting the metronome and melody on the same audio timestamp.
  const handlePlayMelody = async () => {
    if (!generatedMelody) return;

    if (isMelodyPlaying) {
      countInRunRef.current += 1;
      if (countInTimeoutRef.current !== null) {
        window.clearInterval(countInTimeoutRef.current);
        countInTimeoutRef.current = null;
      }
      setMelodyCountIn(null);
      MicrotonalAudioEngine.stopSequence();
      MetronomeAudioEngine.stop();
      setIsMelodyPlaying(false);
      setActiveMelodyStep(-1);
      return;
    }

    const countInRun = ++countInRunRef.current;
    setIsMelodyPlaying(true);
    setMelodyCountIn(4);
    MicrotonalAudioEngine.stopSequence();
    MetronomeAudioEngine.stop();
    MetronomeAudioEngine.setBpm(melodyTempo);
    MetronomeAudioEngine.setTimeSignature(
      TIME_SIGNATURE_PRESETS.find((preset) => preset.name === melodyMeter) ?? TIME_SIGNATURE_PRESETS[0]
    );
    await MetronomeAudioEngine.startAudioContext();
    if (countInRunRef.current !== countInRun) return;

    let remainingCount = 4;
    countInTimeoutRef.current = window.setInterval(() => {
      if (countInRunRef.current !== countInRun) return;
      remainingCount -= 1;
      if (remainingCount > 0) {
        setMelodyCountIn(remainingCount);
        return;
      }

      if (countInTimeoutRef.current !== null) {
        window.clearInterval(countInTimeoutRef.current);
        countInTimeoutRef.current = null;
      }
      setMelodyCountIn(null);

      const startTime = MetronomeAudioEngine.getAudioTime() + 0.1;
      void MetronomeAudioEngine.start(startTime);
      const intervalMs = (60 / melodyTempo) * 1000;

      MicrotonalAudioEngine.playSequence(
        generatedMelody.pitches,
        intervalMs,
        timbre,
        (idx) => {
          setActiveMelodyStep(idx);
        },
        () => {
          MetronomeAudioEngine.stop();
          setIsMelodyPlaying(false);
          setActiveMelodyStep(-1);
          triggerXpGain(15);
        },
        startTime
      );
    }, 1000);
  };

  const handleExportMelodyXml = () => {
    if (!generatedMelody) return;
    const xml = MusicXMLExporter.generatePhraseMusicXML(
      generatedMelody.title,
      generatedMelody.pitches
    );
    const blob = new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMaqam.name}-SightReading.musicxml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // 3. PERFORMANCE RECORDING & COMPARE LOGIC
  // -------------------------------------------------------------
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedTakes, setRecordedTakes] = useState<RecordedTake[]>([]);
  const [selectedTakeId, setSelectedTakeId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const takeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingTake, setIsPlayingTake] = useState<boolean>(false);
  const [isComparingSimultaneously, setIsComparingSimultaneously] = useState<boolean>(false);

  // Waveform loop using stable ref
  const drawWaveformRef = useRef<() => void>(() => {});
  useEffect(() => {
    drawWaveformRef.current = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(() => drawWaveformRef.current());
    };
  });

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const audioCtx = MicrotonalAudioEngine.getAudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      drawWaveformRef.current();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newTake: RecordedTake = {
          id: `take-${Date.now()}`,
          blob: audioBlob,
          url: audioUrl,
          durationSeconds: recordingSeconds,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          maqamName: currentMaqam.name,
          title: `Take ${recordedTakes.length + 1} - ${currentMaqam.name}`
        };

        setRecordedTakes(prev => [newTake, ...prev]);
        setSelectedTakeId(newTake.id);
        triggerXpGain(25);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch {
      setMicError('Microphone access was denied or is unavailable on this device.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (recordTimerRef.current !== null) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsRecording(false);
  };

  const selectedTake = recordedTakes.find(t => t.id === selectedTakeId);

  const handleTogglePlayTake = () => {
    if (!selectedTake) return;

    if (!takeAudioRef.current) {
      takeAudioRef.current = new Audio(selectedTake.url);
      takeAudioRef.current.onended = () => setIsPlayingTake(false);
    } else if (takeAudioRef.current.src !== selectedTake.url) {
      takeAudioRef.current.src = selectedTake.url;
    }

    if (isPlayingTake) {
      takeAudioRef.current.pause();
      setIsPlayingTake(false);
    } else {
      takeAudioRef.current.play();
      setIsPlayingTake(true);
    }
  };

  const handlePlayReferenceScale = () => {
    const scale = currentMaqam.getScale();
    MicrotonalAudioEngine.playSequence(scale, 400, timbre);
  };

  const handleToggleDuet = () => {
    if (isComparingSimultaneously) {
      if (takeAudioRef.current) takeAudioRef.current.pause();
      MicrotonalAudioEngine.stopSequence();
      setIsComparingSimultaneously(false);
      setIsPlayingTake(false);
    } else {
      setIsComparingSimultaneously(true);
      handleTogglePlayTake();
      handlePlayReferenceScale();
      setTimeout(() => {
        setIsComparingSimultaneously(false);
      }, 5000);
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Gamification Score Header */}
      <div className="rounded-2xl p-5 sm:p-6 bg-linear-to-r from-amber-500/15 via-card to-card border border-border shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-arabic text-amber-500 font-bold text-lg" dir="rtl">
                استوديو التدريب والتمرين
              </span>
              <Badge variant="secondary" className="text-xs font-bold text-amber-500 border-amber-500/40">
                Level {stats.level}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              Practice &amp; Training Studio
              <Badge variant="outline" className="text-xs">
                {currentMaqam.name} ({currentMaqam.family})
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gamified scale memorization, automatic sight-reading phrase generation, and performance take recording.
            </p>
          </div>

          {/* Gamified Stat Counters */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* XP Points */}
            <div className="px-3.5 py-2 rounded-xl bg-muted/60 dark:bg-slate-900 border border-border flex items-center gap-2 relative">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Total XP</div>
                <div className="text-sm font-black font-mono text-foreground">{stats.xp}</div>
              </div>
              {recentXpGain && (
                <span className="absolute -top-3 right-1 text-xs font-black text-amber-400 animate-bounce">
                  +{recentXpGain} XP!
                </span>
              )}
            </div>

            {/* Streak */}
            <div className="px-3.5 py-2 rounded-xl bg-muted/60 dark:bg-slate-900 border border-border flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Streak</div>
                <div className="text-sm font-black font-mono text-orange-400">{stats.streak}🔥</div>
              </div>
            </div>

            {/* Badges Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBadgesModal(true)}
              className="gap-1.5 h-10 px-3 cursor-pointer hover:border-amber-500/60"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Badges ({stats.unlockedBadgeIds.length}/{badges.length})</span>
            </Button>
          </div>
        </div>

        {/* 3 Main Mode Selectors */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={() => setActiveMode('memorization')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMode === 'memorization'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Scale Memorization Game</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('sightreading')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMode === 'sightreading'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>2. Sight-Reading Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('recording')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMode === 'recording'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>3. Performance Recording &amp; Compare</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODE 1: SCALE MEMORIZATION GAME                               */}
      {/* ============================================================= */}
      {activeMode === 'memorization' && (
        <div className="space-y-6">
          {/* Sub-mode selector */}
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <button
              onClick={() => setMemSubMode('builder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                memSubMode === 'builder'
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🧩 Scale Ladder Recall
            </button>
            <button
              onClick={() => setMemSubMode('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                memSubMode === 'quiz'
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ❓ Missing Note &amp; Accidental Quiz
            </button>
            <button
              onClick={() => setMemSubMode('ear')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                memSubMode === 'ear'
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              👂 Microtonal Ear Training
            </button>
          </div>

          {/* Sub-mode A: Scale Builder */}
          {memSubMode === 'builder' && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <span>Construct Scale: {currentMaqam.name}</span>
                      <span className="font-arabic text-amber-500 text-sm" dir="rtl">{currentMaqam.arabicName}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Build the 8 scale degrees in ascending pitch order. Click notes from the candidate pool below.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBuilderSlots(createInitialSlots(currentMaqam));
                      setNotePool(createInitialNotePool(currentMaqam));
                      setBuilderValidated(false);
                      setBuilderSuccess(false);
                    }}
                    className="gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Ladder</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 8 Degree Slots Ladder */}
                <div className="p-4 rounded-xl bg-muted/30 dark:bg-slate-900 border border-border">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                    {builderSlots.map((slotPitch, idx) => {
                      const isRoot = idx === 0;
                      const correctTarget = scalePitches[idx];
                      const isCorrect = builderValidated && slotPitch && correctTarget && slotPitch.equals(correctTarget);
                      const isWrong = builderValidated && (!slotPitch || (correctTarget && !slotPitch.equals(correctTarget)));

                      return (
                        <div
                          key={idx}
                          onClick={() => handleRemoveSlot(idx)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center min-h-[90px] transition-all cursor-pointer select-none relative ${
                            isCorrect
                              ? 'bg-emerald-500/15 border-emerald-500/70 text-emerald-400 shadow-sm'
                              : isWrong
                              ? 'bg-red-500/15 border-red-500/70 text-red-400'
                              : slotPitch
                              ? 'bg-amber-500/10 border-amber-500/50 text-foreground'
                              : 'bg-muted/50 border-dashed border-border text-muted-foreground hover:border-amber-500/40'
                          }`}
                        >
                          <span className="text-[10px] text-muted-foreground uppercase font-mono font-bold mb-1">
                            Degree {idx + 1}
                          </span>

                          {slotPitch ? (
                            <>
                              <span className="text-lg font-black font-mono">
                                {slotPitch.toDisplayString()}
                              </span>
                              <span className="text-[10px] font-mono opacity-80">
                                {slotPitch.octave} ({slotPitch.accidental})
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">
                              Empty Slot
                            </span>
                          )}

                          {isRoot && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-1">
                              Qarar (Root)
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Validation Banner */}
                {builderValidated && (
                  <div
                    className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold ${
                      builderSuccess
                        ? 'bg-emerald-500/15 border border-emerald-500/50 text-emerald-300'
                        : 'bg-red-500/15 border border-red-500/50 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {builderSuccess ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>Mabrouk! You correctly reconstructed {currentMaqam.name}. (+30 XP)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                          <span>Some notes or quarter-tone accidentals are misplaced. Inspect red slots and adjust!</span>
                        </>
                      )}
                    </div>
                    {builderSuccess && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const otherMaqam = allMaqamat[Math.floor(Math.random() * allMaqamat.length)];
                          onSelectMaqam(otherMaqam);
                        }}
                      >
                        Next Maqam Challenge
                      </Button>
                    )}
                  </div>
                )}

                {/* Candidate Pitch Choices Pool */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Available Notes Pool (Includes quarter-tone subtleties):</span>
                    <span>Click note to audition &amp; add</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {notePool.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPoolNote(p)}
                        className="p-2.5 rounded-xl bg-card border border-border hover:border-amber-500 hover:bg-amber-500/10 text-foreground transition flex flex-col items-center justify-center cursor-pointer shadow-xs active:scale-95"
                      >
                        <span className="font-mono text-base font-black text-amber-500">
                          {p.toDisplayString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Octave {p.octave}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => MicrotonalAudioEngine.playSequence(scalePitches, 300, timbre)}
                    className="gap-2"
                  >
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>Audition Target Scale</span>
                  </Button>

                  <Button
                    onClick={handleCheckBuilder}
                    className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 px-6 cursor-pointer"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    <span>Check Answer</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-mode B: Quiz Mode */}
          {memSubMode === 'quiz' && currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    Maqam Theory Quiz
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={handleNextQuizQuestion} className="gap-1 text-xs">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Next Question</span>
                  </Button>
                </div>
                <CardTitle className="text-lg font-bold mt-2">
                  {currentQuestion.prompt}
                </CardTitle>
                <CardDescription className="font-arabic text-amber-500/90 text-sm" dir="rtl">
                  {currentQuestion.arabicPrompt}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedQuizOption === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;
                    let style = 'bg-card border-border hover:border-amber-500 hover:bg-amber-500/10 text-foreground';

                    if (quizAnswered) {
                      if (isCorrect) {
                        style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                      } else if (isSelected) {
                        style = 'bg-red-500/20 border-red-500 text-red-300';
                      } else {
                        style = 'bg-muted/40 border-border opacity-50';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectQuizOption(idx)}
                        disabled={quizAnswered}
                        className={`p-4 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${style}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center font-mono font-bold text-xs">
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <div>
                            <div className="font-mono text-base font-bold">
                              {opt.toDisplayString()}{opt.octave}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Accidental: {opt.accidental} ({opt.toOctaveCents()}¢)
                            </div>
                          </div>
                        </div>
                        {quizAnswered && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        )}
                        {quizAnswered && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {quizAnswered && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2 animate-in fade-in">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Explanation:</span>
                    </div>
                    <p className="text-muted-foreground">{currentQuestion.explanation}</p>
                    <Button size="sm" onClick={handleNextQuizQuestion} className="mt-2 bg-amber-500 text-slate-950 font-bold">
                      Continue to Next Question
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sub-mode C: Ear Training */}
          {memSubMode === 'ear' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    Microtonal Ear Training (24-EDO)
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={handleNextEarTraining} className="gap-1 text-xs">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>New Tone</span>
                  </Button>
                </div>
                <CardTitle className="text-base font-bold mt-1">
                  Listen &amp; Identify the Microtonal Scale Degree
                </CardTitle>
                <CardDescription className="text-xs">
                  A random pitch from Maqam {currentMaqam.name} was played. Train your ear to distinguish quarter-tones from equal-tempered notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio Triggers */}
                <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-muted/30 dark:bg-slate-900 border border-border">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={playReferenceTonic}
                    className="gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <span>1. Play Tonic Root (Qarar)</span>
                  </Button>

                  <Button
                    size="lg"
                    onClick={playMysteryTone}
                    className="gap-2 bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold cursor-pointer shadow-md"
                  >
                    <Ear className="w-4 h-4" />
                    <span>2. Replay Mystery Tone</span>
                  </Button>
                </div>

                {/* Multiple choice options */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">Select the pitch you heard:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {earOptions.map((opt, idx) => {
                      const isSelected = selectedEarIdx === idx;
                      const isCorrect = mysteryPitch && opt.equals(mysteryPitch);
                      let style = 'bg-card border-border hover:border-amber-500 text-foreground';

                      if (earAnswered) {
                        if (isCorrect) {
                          style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                        } else if (isSelected) {
                          style = 'bg-red-500/20 border-red-500 text-red-300';
                        } else {
                          style = 'bg-muted/40 border-border opacity-50';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectEarOption(idx)}
                          disabled={earAnswered}
                          className={`p-4 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${style}`}
                        >
                          <span className="font-mono text-xl font-black text-amber-500">
                            {opt.toDisplayString()}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            {opt.toOctaveCents()}¢
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {earAnswered && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                    <div>
                      {selectedEarIdx !== null && earOptions[selectedEarIdx]?.equals(mysteryPitch!) ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Exact pitch match! (+25 XP)</span>
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" />
                          <span>The played pitch was {mysteryPitch?.toString()}. Keep training!</span>
                        </span>
                      )}
                    </div>
                    <Button size="sm" onClick={handleNextEarTraining} className="bg-amber-500 text-slate-950 font-bold">
                      Next Tone
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* MODE 2: SIGHT-READING STUDIO                                  */}
      {/* ============================================================= */}
      {activeMode === 'sightreading' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs font-bold text-amber-500">
                      Algorithmic Sight-Reading Engine
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Random Maqam Melodic Generator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Generate authentic practice phrases with microtonal accidentals, staff notation, and violin fingerings.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleGenerateMelody}
                    className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold gap-2 cursor-pointer shadow-xs"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Generate New Melody</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generator Controls Toolbar */}
              <div className="p-3.5 rounded-xl bg-muted/30 dark:bg-slate-900 border border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as MelodyDifficulty)}
                    className="w-full bg-card border border-border rounded-lg p-1.5 font-medium cursor-pointer"
                  >
                    <option value="level1">Level 1: Stepwise (Grade 1)</option>
                    <option value="level2">Level 2: Steps &amp; 3rds</option>
                    <option value="level3">Level 3: Ornaments &amp; Leaps</option>
                  </select>
                </div>

                {/* Length */}
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Phrase Length</label>
                  <select
                    value={melodyLength}
                    onChange={(e) => setMelodyLength(Number(e.target.value))}
                    className="w-full bg-card border border-border rounded-lg p-1.5 font-medium cursor-pointer"
                  >
                    <option value={8}>8 Notes (2 Bars)</option>
                    <option value={12}>12 Notes (3 Bars)</option>
                    <option value={16}>16 Notes (4 Bars)</option>
                  </select>
                </div>

                {/* Meter */}
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Meter / Iqa’</label>
                  <select
                    value={melodyMeter}
                    onChange={(e) => setMelodyMeter(e.target.value as '4/4' | '3/4' | '2/4')}
                    className="w-full bg-card border border-border rounded-lg p-1.5 font-medium cursor-pointer"
                  >
                    <option value="4/4">4/4 (Maqsum / Wahda)</option>
                    <option value="3/4">3/4 (Darj)</option>
                    <option value="2/4">2/4 (Malfuf)</option>
                  </select>
                </div>

                {/* Tempo */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-muted-foreground font-semibold">
                    <span>Tempo</span>
                    <span className="font-mono text-amber-500 font-bold">{melodyTempo} BPM</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="140"
                    value={melodyTempo}
                    onChange={(e) => setMelodyTempo(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer mt-2"
                  />
                </div>
              </div>

              {/* Sheet Music Notation Display (OpenSheetMusicDisplay) */}
              <div className="p-4 sm:p-6 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm relative min-h-[160px] flex items-center justify-center overflow-x-auto">
                <div ref={osmdContainerRef} className="w-full flex justify-center" />
              </div>

              {/* Note-by-Note Interactive Guided Practice Strip */}
              {generatedMelody && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      Interactive Note-by-Note Fingering Guide
                    </span>
                    <span className="text-[11px] font-mono">
                      Target: {currentMaqam.name} • Tonic: {currentMaqam.getScale()[0]?.toString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {generatedMelody.notes.map((n, idx) => {
                      const isActive = activeMelodyStep === idx;
                      const violinHint = ViolinErgonomicsEngine.mapPitchToPosition(n.pitch, 1);

                      return (
                        <div
                          key={idx}
                          onClick={() => MicrotonalAudioEngine.playPitch(n.pitch, 0.6, timbre)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-400 scale-105 shadow-md'
                              : 'bg-muted/40 hover:bg-muted border-border text-foreground hover:border-amber-500/50'
                          }`}
                        >
                          <div className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</div>
                          <div className="font-mono text-base font-black text-amber-500 dark:text-amber-400">
                            {n.pitch.toDisplayString()}
                          </div>
                          <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                            {violinHint.string}-Str, F{violinHint.finger}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Playback & Export Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePlayMelody}
                    size="lg"
                    className={`gap-2 font-bold cursor-pointer ${
                      isMelodyPlaying
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {isMelodyPlaying ? (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>{melodyCountIn !== null ? 'Cancel Count-in' : 'Stop Melody'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                        <span>Play Reference Audio</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      MetronomeAudioEngine.setBpm(melodyTempo);
                      void MetronomeAudioEngine.start();
                    }}
                    disabled={isMelodyPlaying}
                    className="gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isMelodyPlaying ? 'Metronome Synced' : `Start Metronome (${melodyTempo} BPM)`}</span>
                  </Button>
                </div>

                {melodyCountIn !== null && (
                  <div
                    role="status"
                    aria-live="assertive"
                    className="flex items-center gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    <span className="font-mono text-2xl font-black text-amber-500">{melodyCountIn}</span>
                    <span>Melody starts in {melodyCountIn}...</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleExportMelodyXml}
                  className="gap-2 cursor-pointer hover:border-amber-500"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download MusicXML 4.0</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODE 3: PERFORMANCE RECORDING & COMPARE                       */}
      {/* ============================================================= */}
      {activeMode === 'recording' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="text-xs font-bold text-amber-500 mb-1">
                    Microphone Input &amp; Audio Compare
                  </Badge>
                  <CardTitle className="text-lg font-bold">
                    Record Performance &amp; Compare with 24-EDO Reference
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Record your violin, oud, or vocal practice, then evaluate quarter-tone intonation side-by-side with pure acoustic reference models.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mic error notice */}
              {micError && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{micError}</span>
                </div>
              )}

              {/* Live Recording Console */}
              <div className="p-6 rounded-2xl bg-muted/40 dark:bg-slate-900 border border-border flex flex-col items-center justify-center space-y-4">
                {/* Waveform Canvas */}
                <div className="w-full max-w-lg h-24 bg-card rounded-xl border border-border overflow-hidden flex items-center justify-center relative">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={96}
                    className="w-full h-full"
                  />
                  {!isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/60 font-mono">
                      Waveform Visualizer Ready
                    </div>
                  )}
                </div>

                {/* Live Timer */}
                <div className="font-mono text-3xl font-black text-foreground flex items-center gap-2">
                  {isRecording && <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />}
                  <span>{formatTime(recordingSeconds)}</span>
                </div>

                {/* Primary Record Button */}
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <Button
                      size="lg"
                      onClick={startRecording}
                      className="gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-6 rounded-2xl cursor-pointer shadow-lg shadow-red-600/20"
                    >
                      <Mic className="w-5 h-5" />
                      <span>Start Recording Take</span>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={stopRecording}
                      className="gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-6 rounded-2xl cursor-pointer ring-2 ring-red-500 animate-pulse"
                    >
                      <Square className="w-5 h-5 fill-current text-red-500" />
                      <span>Stop &amp; Save Take</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Recorded Takes List & A/B Comparison Player */}
              {recordedTakes.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Music className="w-4 h-4 text-amber-500" />
                      <span>Saved Practice Takes ({recordedTakes.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Takes selector */}
                    <div className="space-y-2">
                      {recordedTakes.map((take) => (
                        <div
                          key={take.id}
                          onClick={() => setSelectedTakeId(take.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            selectedTakeId === take.id
                              ? 'bg-amber-500/15 border-amber-500/70 text-foreground font-semibold shadow-xs'
                              : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTakeId(take.id);
                                handleTogglePlayTake();
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer"
                            >
                              {selectedTakeId === take.id && isPlayingTake ? (
                                <Square className="w-3.5 h-3.5 fill-current text-amber-500" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              )}
                            </Button>
                            <div>
                              <div className="text-xs font-bold text-foreground">{take.title}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {take.timestamp} • Duration: {formatTime(take.durationSeconds)}
                              </div>
                            </div>
                          </div>

                          <a
                            href={take.url}
                            download={`${take.title}.webm`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="Download audio recording"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* A/B Side-by-Side Comparison Console */}
                    {selectedTake && (
                      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">A / B Compare Console</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {selectedTake.title}
                          </Badge>
                        </div>

                        {/* Player buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Option A: Reference Scale */}
                          <button
                            type="button"
                            onClick={handlePlayReferenceScale}
                            className="p-3 rounded-xl bg-muted/60 hover:bg-muted border border-border text-left transition cursor-pointer flex flex-col justify-between"
                          >
                            <span className="text-[10px] text-amber-500 uppercase font-mono font-bold">Channel A</span>
                            <span className="text-xs font-bold text-foreground mt-1">
                              24-EDO Reference Scale
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              Pure microtonal tuning
                            </span>
                          </button>

                          {/* Option B: User Recording */}
                          <button
                            type="button"
                            onClick={handleTogglePlayTake}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              isPlayingTake
                                ? 'bg-amber-500/20 border-amber-500 text-foreground'
                                : 'bg-muted/60 hover:bg-muted border-border text-foreground'
                            }`}
                          >
                            <span className="text-[10px] text-amber-500 uppercase font-mono font-bold">Channel B</span>
                            <span className="text-xs font-bold text-foreground mt-1">
                              My Recorded Take
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {isPlayingTake ? 'Playing take...' : 'Click to audition'}
                            </span>
                          </button>
                        </div>

                        {/* Duet Mode Trigger */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleDuet}
                          className={`w-full gap-2 font-bold cursor-pointer ${
                            isComparingSimultaneously ? 'bg-amber-500 text-slate-950 border-amber-400' : ''
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {isComparingSimultaneously
                              ? 'Stop Simultaneous Duet'
                              : 'Play Both Together (Intonation Check)'}
                          </span>
                        </Button>

                        {/* Self-Assessment Intonation Checklist */}
                        <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground border-t border-border">
                          <span className="font-semibold text-foreground">Self-Assessment Checklist:</span>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Quarter-tone (Sikah) note pitch neutral intonation (-50 cents)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Smooth bowing / plectrum consistency across string shifts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Satisfying Qafla cadence landing firmly on Qarar</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================= */}
      {/* BADGES & ACHIEVEMENTS MODAL                                   */}
      {/* ============================================================= */}
      {showBadgesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Maqam Mastery Badges</h3>
                  <p className="text-xs text-muted-foreground">
                    Progress tracking across memorization, ear training, and performance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBadgesModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                    b.unlocked
                      ? 'bg-amber-500/15 border-amber-500/50 text-foreground'
                      : 'bg-muted/20 border-border/60 opacity-60'
                  }`}
                >
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>{b.title}</span>
                      {b.unlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <Button onClick={() => setShowBadgesModal(false)} className="bg-amber-500 text-slate-950 font-bold">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
