// src/components/TuningWheel24EDO.tsx
import React, { useState } from 'react';
import { ArabicPitch } from '../core/pitch';
import { ArabicNoteSpine } from '../core/note-spine';
import { MicrotonalAudioEngine, TimbreType } from '../audio/microtonal-audio';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Volume2, Play, GitCompare } from 'lucide-react';

interface Props {
  timbre: TimbreType;
}

export const TuningWheel24EDO: React.FC<Props> = ({ timbre }) => {
  const [selectedQtIndex, setSelectedQtIndex] = useState<number>(0); // 0 = C4
  const [intervalBase] = useState<ArabicPitch>(new ArabicPitch('C', '♮', 4));

  // Generate 24 quarter-tone pitches for octave 4
  const quarterToneSteps = Array.from({ length: 24 }, (_, i) => {
    // Octave 4 starts at C4 index = 4 * 24 + 0 = 96
    const absQt = 4 * 24 + i;
    const pitch = ArabicPitch.fromQuarterToneIndex(absQt);
    const spineMatch = ArabicNoteSpine.findByPitch(pitch);
    const isWesternSemitone = i % 2 === 0;
    const cents = i * 50;
    return {
      index: i,
      pitch,
      cents,
      spineMatch,
      isWesternSemitone,
      freq: pitch.toFrequency()
    };
  });

  const selectedStep = quarterToneSteps[selectedQtIndex];

  const handlePlayQuarterTone = (step: typeof quarterToneSteps[0]) => {
    setSelectedQtIndex(step.index);
    MicrotonalAudioEngine.playPitch(step.pitch, 0.7, timbre);
  };

  const handleCompareInterval = (cents: 300 | 350 | 400) => {
    const base = intervalBase;
    let target: ArabicPitch;

    if (cents === 300) {
      // Minor 3rd (E♭4) = 6 qt
      target = base.transpose(6);
    } else if (cents === 350) {
      // Neutral 3rd (E𝄳4 / Sikah) = 7 qt
      target = base.transpose(7);
    } else {
      // Major 3rd (E4) = 8 qt
      target = base.transpose(8);
    }

    // Play base then target
    MicrotonalAudioEngine.playPitch(base, 0.5, timbre);
    setTimeout(() => {
      MicrotonalAudioEngine.playPitch(target, 0.8, timbre);
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Circular / Grid Matrix */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-5 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                  Microtonal Foundation
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  24 Equal Divisions of Octave (24-EDO)
                </Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl mt-1">
                24-EDO Microtonal Tuning Matrix
              </CardTitle>
              <CardDescription className="mt-0.5 max-w-2xl">
                1 Octave = 1200 Cents divided into 24 Quarter-Tones of exactly 50 Cents each. Odd divisions represent authentic quarter-tones (𝄳, 𝄵).
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="text-xs">
                Quarter-Tones (50¢, 150¢, 350¢...)
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Western Semitones (100¢, 200¢...)
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 24-EDO Interactive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {quarterToneSteps.map((step) => {
              const isSelected = selectedQtIndex === step.index;
              const isNeutral = !step.isWesternSemitone;
              const hasSpine = !!step.spineMatch;

              return (
                <button
                  key={step.index}
                  onClick={() => handlePlayQuarterTone(step)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-xl ring-2 ring-amber-400/50 scale-105 z-10'
                      : isNeutral
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200 hover:bg-amber-900/30 hover:border-amber-600'
                      : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-slate-950' : 'text-slate-500'}`}>
                      #{step.index}
                    </span>
                    <span className={`text-[9px] font-mono ${isSelected ? 'text-slate-900 font-bold' : isNeutral ? 'text-amber-400' : 'text-slate-400'}`}>
                      {step.cents}¢
                    </span>
                  </div>

                  <div className="my-1.5 flex flex-col items-center">
                    <span className="text-base font-bold font-mono">
                      {step.pitch.toScientificString()}
                    </span>
                    {hasSpine && (
                      <span className={`text-[9px] font-serif font-bold truncate max-w-full px-1 rounded ${
                        isSelected ? 'bg-slate-950 text-amber-300' : 'text-amber-400'
                      }`}>
                        {step.spineMatch?.transliteration}
                      </span>
                    )}
                  </div>

                  <span className={`text-[9px] font-mono ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                    {step.freq.toFixed(1)}Hz
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Pitch Acoustic Deep Dive */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center text-amber-300">
                <span className="text-xl font-bold font-mono">{selectedStep.pitch.toScientificString()}</span>
                <span className="text-[10px] font-serif">{selectedStep.spineMatch?.arabicName || ''}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">
                    Quarter-Tone #{selectedStep.index} • {selectedStep.cents} Cents
                  </span>
                  {selectedStep.spineMatch && (
                    <Badge variant="emerald" className="text-xs">
                      Spine Note: {selectedStep.spineMatch.transliteration}
                    </Badge>
                  )}
                  {!selectedStep.isWesternSemitone && (
                    <Badge variant="secondary" className="text-xs">
                      Microtonal (Quarter-Tone)
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Acoustic Frequency: <strong className="text-amber-300">{selectedStep.freq.toFixed(2)} Hz</strong> • Relative to A4 (440.0 Hz) • {selectedStep.spineMatch?.roleDescription || 'Microtonal intermediate scale degree'}
                </p>
              </div>
            </div>

            <Button
              variant="amber"
              onClick={() => handlePlayQuarterTone(selectedStep)}
              className="gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Audition 24-EDO Frequency
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* The Crucial Neutral 3rd (Sikah) Acoustic Comparator */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-amber-400" />
            <CardTitle className="text-lg">
              The Neutral 3rd (ثلث محايد) Acoustic Comparator
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            Western equal temperament only recognizes Minor 3rd (300¢) and Major 3rd (400¢). Arabic music’s most signature emotional flavor is the <strong className="text-amber-300">Neutral 3rd (350¢ / Sikah)</strong>, sitting exactly between minor and major. Listen and compare below starting from Rast (C4):
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Western Minor 3rd */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Western Minor 3rd</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-white">C4 → E♭4</span>
                  <span className="text-sm font-mono text-slate-400">300 Cents</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Standard 12-TET minor third (Nahawand / Kurd color). Sad, melancholic, contracted.
                </p>
              </div>
              <Button
                variant="dark"
                size="sm"
                onClick={() => handleCompareInterval(300)}
                className="mt-4 gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                Listen to Minor 3rd (300¢)
              </Button>
            </div>

            {/* Arabic Neutral 3rd (Sikah) */}
            <div className="bg-amber-950/20 border-2 border-amber-500/50 rounded-xl p-4 flex flex-col justify-between shadow-lg ring-1 ring-amber-500/30">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Arabic Neutral 3rd (Sikah)</span>
                  <Badge variant="secondary" className="text-[10px]">
                    AUTHENTIC
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-amber-200">C4 → E𝄳4</span>
                  <span className="text-sm font-mono text-amber-400 font-bold">350 Cents</span>
                </div>
                <p className="text-xs text-amber-200/80 mt-2">
                  The essence of Maqam Rast and Sikah. Neither happy nor sad — deeply soulful, reflective, and majestic.
                </p>
              </div>
              <Button
                variant="amber"
                size="sm"
                onClick={() => handleCompareInterval(350)}
                className="mt-4 gap-2 font-bold shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Listen to Neutral 3rd (350¢)
              </Button>
            </div>

            {/* Western Major 3rd */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Western Major 3rd</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-white">C4 → E♮4</span>
                  <span className="text-sm font-mono text-slate-400">400 Cents</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Standard 12-TET major third (Ajam color). Bright, triumphant, Western diatonic clarity.
                </p>
              </div>
              <Button
                variant="dark"
                size="sm"
                onClick={() => handleCompareInterval(400)}
                className="mt-4 gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                Listen to Major 3rd (400¢)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Traditional Note Spine Reference Table */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-lg">
            The Traditional Arabic Note "Spine" (سلسلة النغمات)
          </CardTitle>
          <CardDescription>
            Historical reference centered around Rast = C4 (Level 2, Module 6)
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="py-2.5 px-3 font-semibold">Arabic</th>
                <th className="py-2.5 px-3 font-semibold">Transliteration</th>
                <th className="py-2.5 px-3 font-semibold">Pitch</th>
                <th className="py-2.5 px-3 font-semibold">Frequency (A440)</th>
                <th className="py-2.5 px-3 font-semibold">Musical Role</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono text-slate-300">
              {ArabicNoteSpine.getSpine().map((item) => (
                <tr key={item.transliteration} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-serif font-bold text-amber-300 text-sm">{item.arabicName}</td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-white">{item.transliteration}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-400">{item.pitch.toScientificString()}{item.pitch.octave}</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.pitch.toFrequency().toFixed(2)} Hz</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">{item.roleDescription}</td>
                  <td className="py-2.5 px-3 text-right">
                    <Button
                      variant="dark"
                      size="sm"
                      onClick={() => MicrotonalAudioEngine.playPitch(item.pitch, 0.7, timbre)}
                      className="font-sans text-[11px]"
                    >
                      Audition
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
