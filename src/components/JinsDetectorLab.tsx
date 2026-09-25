// src/components/JinsDetectorLab.tsx
import React, { useState, useMemo } from 'react';
import { ArabicPitch, DiatonicBase, MicrotonalAccidental } from '../core/pitch';
import { identifyJins } from '../theory/jins-detector';
import { MicrotonalAudioEngine, TimbreType } from '../audio/microtonal-audio';
import { ArabicNoteSpine } from '../core/note-spine';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Play,
  Square,
  Sparkles,
  CheckCircle,
  Plus,
  Trash2,
  Info
} from 'lucide-react';

interface Props {
  timbre: TimbreType;
}

interface PhrasePreset {
  name: string;
  arabicName: string;
  category: string;
  description: string;
  pitches: ArabicPitch[];
}

export const JinsDetectorLab: React.FC<Props> = ({ timbre }) => {
  // Preset catalog of authentic melodic phrases
  const presets: PhrasePreset[] = useMemo(() => [
    {
      name: 'Rast Opening Phrase',
      arabicName: 'مستهل راست',
      category: 'Rast (Mother Scale)',
      description: 'Stately opening ascending through neutral 3rd (E𝄳) and cadencing on Rast (C4)',
      pitches: [
        new ArabicPitch('C', '♮', 4),
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('C', '♮', 4)
      ]
    },
    {
      name: 'Bayati Dulab Theme',
      arabicName: 'دولاب بياتي',
      category: 'Bayati',
      description: 'Intimate folk motif featuring the signature neutral 2nd (E𝄳) above D4',
      pitches: [
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('D', '♮', 4)
      ]
    },
    {
      name: 'Hijaz Dramatic Motive',
      arabicName: 'جملة حجاز',
      category: 'Hijaz',
      description: 'Theatrical phrase featuring the 300¢ augmented 2nd stretch between E♭4 and F♯4',
      pitches: [
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '♭', 4),
        new ArabicPitch('F', '♯', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('F', '♯', 4),
        new ArabicPitch('E', '♭', 4),
        new ArabicPitch('D', '♮', 4)
      ]
    },
    {
      name: 'Transposed Hijaz on Nawa (G4)',
      arabicName: 'حجاز مصوّر على النوى',
      category: 'Transposition',
      description: 'Hijaz tetrachord transposed up to G4: G - A♭ - B♮ - C',
      pitches: [
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('A', '♭', 4),
        new ArabicPitch('B', '♮', 4),
        new ArabicPitch('C', '♮', 5),
        new ArabicPitch('B', '♮', 4),
        new ArabicPitch('A', '♭', 4),
        new ArabicPitch('G', '♮', 4)
      ]
    },
    {
      name: 'Nahawand Classical Cadence',
      arabicName: 'قفلة نهاوند',
      category: 'Nahawand',
      description: 'Minor-sounding melodic line over C4 with natural 2nd and minor 3rd',
      pitches: [
        new ArabicPitch('C', '♮', 4),
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '♭', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('E', '♭', 4),
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('C', '♮', 4)
      ]
    },
    {
      name: 'Sikah Ascending Qafla',
      arabicName: 'قفلة سيكاه',
      category: 'Sikah',
      description: 'Signature neutral tonic on E𝄳4 rising to G4 and cadencing on Sikah',
      pitches: [
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('E', '𝄳', 4)
      ]
    },
    {
      name: 'Saba Sorrowful Sigh',
      arabicName: 'آهات صبا',
      category: 'Saba',
      description: 'Features the ultra-narrow diminished 4th and minor 2nd (D - E𝄳 - F - G♭)',
      pitches: [
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♭', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('E', '𝄳', 4),
        new ArabicPitch('D', '♮', 4)
      ]
    },
    {
      name: 'Kurd Modern Theme',
      arabicName: 'لحن كرد',
      category: 'Kurd',
      description: 'Phrygian-like character starting with semitone step (D - E♭ - F - G)',
      pitches: [
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '♭', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('F', '♮', 4),
        new ArabicPitch('E', '♭', 4),
        new ArabicPitch('D', '♮', 4)
      ]
    },
    {
      name: 'Nikriz Exotic Flourish',
      arabicName: 'زخرفة نكريز',
      category: 'Nikriz',
      description: 'Altered 4th degree creating a vibrant raised step (C - D - E♭ - F♯ - G)',
      pitches: [
        new ArabicPitch('C', '♮', 4),
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('E', '♭', 4),
        new ArabicPitch('F', '♯', 4),
        new ArabicPitch('G', '♮', 4),
        new ArabicPitch('F', '♯', 4),
        new ArabicPitch('E', '♭', 4),
        new ArabicPitch('D', '♮', 4),
        new ArabicPitch('C', '♮', 4)
      ]
    }
  ], []);

  // Phrase under active analysis
  const [phrase, setPhrase] = useState<ArabicPitch[]>(presets[0].pitches);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);

  // Interactive Note Builder state
  const [builderDiatonic, setBuilderDiatonic] = useState<DiatonicBase>('C');
  const [builderAccidental, setBuilderAccidental] = useState<MicrotonalAccidental>('♮');
  const [builderOctave, setBuilderOctave] = useState<number>(4);

  // Run the Jins recognition algorithm whenever phrase changes
  const detectionResult = useMemo(() => {
    if (phrase.length === 0) return null;
    return identifyJins(phrase);
  }, [phrase]);

  const handlePlayPhrase = () => {
    if (phrase.length === 0) return;

    if (isPlaying) {
      MicrotonalAudioEngine.stopSequence();
      setIsPlaying(false);
      setActiveNoteIdx(null);
      return;
    }

    setIsPlaying(true);
    MicrotonalAudioEngine.playSequence(
      phrase,
      480,
      timbre,
      (idx) => {
        setActiveNoteIdx(idx === -1 ? null : idx);
      },
      () => {
        setIsPlaying(false);
        setActiveNoteIdx(null);
      }
    );
  };

  const handleAddNote = () => {
    const newPitch = new ArabicPitch(builderDiatonic, builderAccidental, builderOctave);
    setPhrase(prev => [...prev, newPitch]);
    MicrotonalAudioEngine.playPitch(newPitch, 0.5, timbre);
  };

  const handleRemoveNote = (index: number) => {
    setPhrase(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearPhrase = () => {
    MicrotonalAudioEngine.stopSequence();
    setIsPlaying(false);
    setActiveNoteIdx(null);
    setPhrase([]);
  };

  const handleQuickAdd = (p: ArabicPitch) => {
    setPhrase(prev => [...prev, p]);
    MicrotonalAudioEngine.playPitch(p, 0.45, timbre);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="bg-linear-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border-amber-800/40">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                  Modal Analysis Engine
                </span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Jins &amp; Root Identifier
                </Badge>
              </div>
              <CardTitle className="text-2xl sm:text-3xl mt-1">
                Melodic Phrase Jins Classifier
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Analyzes any sequence of <code className="text-amber-300 font-mono">ArabicPitch</code> objects in 24-EDO. The algorithm evaluates pitch inventory, characteristic interval fingerprints (e.g. augmented 2nd, neutral 2nd, neutral 3rd), cadential resolution anchors, and degree completeness to identify the underlying Jins (e.g., Rast, Bayati, Hijaz, Saba, Sikah) and its root pitch.
              </CardDescription>
            </div>

            <Button
              variant={phrase.length === 0 ? "outline" : isPlaying ? "destructive" : "default"}
              onClick={handlePlayPhrase}
              disabled={phrase.length === 0}
              className="gap-2"
            >
              {isPlaying ? <Square className="fill-current" /> : <Play className="fill-current" />}
              {isPlaying ? 'Stop Phrase' : 'Audition Phrase'}
            </Button>
          </div>
        </CardHeader>

        {/* Preset Phrase Selector Grid */}
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold text-slate-300">Load Classical Phrase Presets:</span>
            <span>{presets.length} Authentic Test Phrases</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {presets.map((preset) => {
              const isSelected =
                phrase.length === preset.pitches.length &&
                phrase.every((p, i) => p.equals(preset.pitches[i]));

              return (
                <button
                  key={preset.name}
                  onClick={() => {
                    MicrotonalAudioEngine.stopSequence();
                    setIsPlaying(false);
                    setActiveNoteIdx(null);
                    setPhrase(preset.pitches);
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
        </CardContent>
      </Card>

      {/* Main Phrase Viewer & Note Editor */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Current Input Phrase</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {phrase.length} Notes
                </Badge>
              </div>
              <CardDescription className="mt-0.5">
                Click any note to play. Use the builder below to add quarter-tones or drag/delete.
              </CardDescription>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearPhrase}
              disabled={phrase.length === 0}
              className="gap-1.5 hover:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Phrase
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Phrase Note Stream Visualizer */}
          {phrase.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl text-muted-foreground text-xs">
              Phrase is empty. Select a preset above or add notes below using the Interactive Note Builder.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-center p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 min-h-18">
              {phrase.map((p, idx) => {
                const isActive = activeNoteIdx === idx;
                const isFirst = idx === 0;
                const isLast = idx === phrase.length - 1;
                const isQuarter = p.accidental === '𝄳' || p.accidental === '𝄵';

                return (
                  <div
                    key={idx}
                    className={`relative group flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/40 scale-110 shadow-xl z-20'
                        : isLast
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : isFirst
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : isQuarter
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                    onClick={() => MicrotonalAudioEngine.playPitch(p, 0.6, timbre)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold font-mono">
                        {p.toScientificString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {p.octave}
                      </span>
                    </div>

                    <span className="text-[9px] text-muted-foreground font-mono mt-0.5">
                      {p.toFrequency().toFixed(1)}Hz
                    </span>

                    {/* Badge for Cadence or Opening */}
                    {isLast && (
                      <span className="absolute -top-2 px-1 rounded text-[8px] font-bold bg-emerald-500 text-slate-950 shadow">
                        Cadence
                      </span>
                    )}
                    {isFirst && !isLast && (
                      <span className="absolute -top-2 px-1 rounded text-[8px] font-bold bg-sky-500 text-slate-950 shadow">
                        Start
                      </span>
                    )}

                    {/* Delete button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveNote(idx);
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

          {/* Quick Click-to-Append Note Spine Helper */}
          <div className="pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Quick-Append Traditional Arabic Notes (Spine Octave 4):</span>
              <span className="text-amber-400 text-[11px]">Click to append to phrase</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                new ArabicPitch('C', '♮', 4), // Rast
                new ArabicPitch('D', '♮', 4), // Dukah
                new ArabicPitch('E', '𝄳', 4), // Sikah
                new ArabicPitch('E', '♭', 4), // Bushalik / Kurd
                new ArabicPitch('F', '♮', 4), // Jaharkah
                new ArabicPitch('F', '♯', 4), // Hijaz
                new ArabicPitch('G', '♭', 4), // Saba
                new ArabicPitch('G', '♮', 4), // Nawa
                new ArabicPitch('A', '♭', 4), // Hisar
                new ArabicPitch('A', '♮', 4), // Husayni
                new ArabicPitch('B', '𝄳', 4), // Awj
                new ArabicPitch('B', '♭', 4), // Ajam
                new ArabicPitch('C', '♮', 5), // Kardan
                new ArabicPitch('D', '♮', 5)  // Muhayyar
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAdd(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition cursor-pointer hover:scale-105 ${
                    p.accidental === '𝄳' || p.accidental === '𝄵'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {p.toScientificString()}{p.octave}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Note Builder */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Note Builder:</span>

              {/* Diatonic */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as DiatonicBase[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setBuilderDiatonic(d)}
                    className={`px-2 py-1 rounded text-xs font-mono font-bold cursor-pointer transition ${
                      builderDiatonic === d
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Accidental */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {([
                  { acc: '♭', label: '♭ Flat' },
                  { acc: '𝄳', label: '𝄳 Quarter-Flat' },
                  { acc: '♮', label: '♮ Natural' },
                  { acc: '𝄵', label: '𝄵 Quarter-Sharp' },
                  { acc: '♯', label: '♯ Sharp' }
                ] as { acc: MicrotonalAccidental; label: string }[]).map((item) => (
                  <button
                    key={item.acc}
                    onClick={() => setBuilderAccidental(item.acc)}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition ${
                      builderAccidental === item.acc
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.acc}
                  </button>
                ))}
              </div>

              {/* Octave */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {[3, 4, 5].map((oct) => (
                  <button
                    key={oct}
                    onClick={() => setBuilderOctave(oct)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer transition ${
                      builderOctave === oct
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Oct {oct}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleAddNote}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Append Note ({builderDiatonic}{builderAccidental}{builderOctave})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detection Result Card */}
      {detectionResult ? (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="pb-4 border-b border-border/60">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                    Algorithm Identification Result
                  </span>
                </div>
                <CardTitle className="text-xl sm:text-2xl mt-0.5">
                  Primary Classified Jins &amp; Root
                </CardTitle>
              </div>

              {/* Confidence Score Pill */}
              <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        detectionResult.confidence > 70
                          ? 'bg-emerald-400'
                          : detectionResult.confidence > 50
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${detectionResult.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-amber-300 font-mono">
                    {detectionResult.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Primary Winner Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Jins Identity */}
              <div className="p-5 rounded-2xl bg-linear-to-br from-amber-500/10 via-slate-950 to-amber-950/20 border-2 border-amber-500/40 flex flex-col justify-between shadow-lg">
                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Identified Jins</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <h4 className="text-3xl font-black text-white tracking-tight">
                      Jins {detectionResult.definition.name}
                    </h4>
                    <span className="text-2xl font-serif font-bold text-amber-300">
                      {detectionResult.definition.arabicName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    {detectionResult.definition.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Structure:</span>
                  <span className="font-semibold text-white">
                    {detectionResult.definition.type} [{detectionResult.definition.intervals.join(' - ')}]
                  </span>
                </div>
              </div>

              {/* Root Pitch & Frequency */}
              <div className="p-5 rounded-2xl bg-linear-to-br from-sky-500/10 via-slate-950 to-indigo-950/20 border-2 border-sky-500/40 flex flex-col justify-between shadow-lg">
                <div>
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Identified Root Pitch</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h4 className="text-3xl font-black text-white font-mono">
                      {detectionResult.root.toScientificString()}{detectionResult.root.octave}
                    </h4>
                    <span className="text-xs font-serif text-sky-300 font-bold">
                      ({ArabicNoteSpine.findByPitch(detectionResult.root)?.transliteration || 'Transposed'})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    Acoustic Frequency: <strong className="text-amber-300 font-mono">{detectionResult.root.toFrequency().toFixed(2)} Hz</strong> (24-EDO relative to A440)
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Cell Span:</span>
                  <span className="font-semibold text-sky-300">
                    {detectionResult.jins.getTotalSpanCents()} Cents ({detectionResult.jins.getTopPitch().toScientificString()} Top)
                  </span>
                </div>
              </div>

              {/* Theoretical Scale Degrees of this Jins */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Theoretical Jins Degrees</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {detectionResult.jins.getPitches().map((tp, idx) => {
                      const isPresentInPhrase = detectionResult.matchedPitches.some(mp => mp.equals(tp));
                      return (
                        <div
                          key={idx}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1 ${
                            isPresentInPhrase
                              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                        >
                          <span>{tp.toScientificString()}</span>
                          {isPresentInPhrase && <CheckCircle className="w-3 h-3 text-slate-950" />}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Highlighted notes are present in the analyzed phrase.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Raw Alignment Score:</span>
                  <span className="font-mono font-bold text-amber-300">{detectionResult.score} pts</span>
                </div>
              </div>
            </div>

            {/* Theoretical Reasoning & Proofs */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Info className="w-4 h-4 text-amber-400" />
                Algorithmic Detection Proofs &amp; Signature Indicators:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {detectionResult.tonicCandidateReasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ranked Alternatives Section */}
            {detectionResult.rankedAlternatives.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-slate-300">Ranked Alternative Hypotheses:</span>
                  <span>Evaluated against 24 chromatic roots</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {detectionResult.rankedAlternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            #{idx + 2} {alt.definition.name}
                          </span>
                          <span className="text-xs font-mono font-semibold text-amber-400">
                            {alt.confidence}%
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                          Root: {alt.root.toScientificString()}{alt.root.octave} ({alt.root.toFrequency().toFixed(1)}Hz)
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                          {alt.reasons[0] || 'Lower alignment score'}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Score: {alt.score}</span>
                        <span>Span: {alt.jins.getTotalSpanCents()}¢</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8 text-center bg-slate-900/40 border-slate-800 text-muted-foreground text-xs">
          Input at least 1 note to identify the Jins and root pitch.
        </Card>
      )}
    </div>
  );
};
