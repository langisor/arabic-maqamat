// src/components/MaqamExplorer.tsx
import React, { useState } from 'react';
import { Maqam, MaqamatCatalogue, MaqamFamilyMnemonic } from '../theory/maqam';
import { ArabicPitch, DiatonicBase, MicrotonalAccidental } from '../core/pitch';
import { ArabicNoteSpine } from '../core/note-spine';
import { MicrotonalAudioEngine, TimbreType } from '../audio/microtonal-audio';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { 
  Play, 
  Square, 
  Radio, 
  RotateCcw, 
  Sparkles, 
  SlidersHorizontal,
  Music,
  ArrowRight,
  Layers,
  Volume2
} from 'lucide-react';

interface Props {
  currentMaqam: Maqam;
  onSelectMaqam: (maqam: Maqam) => void;
  timbre: TimbreType;
  isPlayingScale: boolean;
  onPlayScale: (pitches: ArabicPitch[]) => void;
  onStopScale: () => void;
  isDroneActive: boolean;
  onToggleDrone: (pitch: ArabicPitch) => void;
}

export const MaqamExplorer: React.FC<Props> = ({
  currentMaqam,
  onSelectMaqam,
  timbre,
  isPlayingScale,
  onPlayScale,
  onStopScale,
  isDroneActive,
  onToggleDrone
}) => {
  // Transposition tab mode: 'classical' | 'spine' | 'custom'
  const [transpositionTab, setTranspositionTab] = useState<string>('classical');

  // Custom tonic note builder state
  const [customDiatonic, setCustomDiatonic] = useState<DiatonicBase>('G');
  const [customAccidental, setCustomAccidental] = useState<MicrotonalAccidental>('♮');
  const [customOctave, setCustomOctave] = useState<number>(4);

  const allMaqamat = MaqamatCatalogue.getAllMaqamat();
  const families = Object.values(MaqamatCatalogue.FAMILIES);
  const spineNotes = ArabicNoteSpine.getSpine();

  // Determine base original template for current maqam id
  const baseId = currentMaqam.id.split('-transposed-')[0];
  const baseMaqam = MaqamatCatalogue.findById(baseId) || currentMaqam;
  const originalTonic = baseMaqam.getTonic();
  const currentTonic = currentMaqam.getTonic();
  const isTransposed = !currentTonic.equals(originalTonic);

  // Compute delta quarter tones and cents from original tonic
  const deltaQt = originalTonic.diffQuarterTones(currentTonic);
  const centsOffset = deltaQt * 50;

  // Custom candidate pitch
  const candidatePitch = new ArabicPitch(customDiatonic, customAccidental, customOctave);
  const candidateDeltaQt = originalTonic.diffQuarterTones(candidatePitch);
  const candidateCents = candidateDeltaQt * 50;

  const handleFamilyClick = (mnemonic: MaqamFamilyMnemonic) => {
    const found = allMaqamat.find(m => m.family === mnemonic);
    if (found) {
      onSelectMaqam(found);
    }
  };

  const handleTransposeToPitch = (targetPitch: ArabicPitch) => {
    const transposed = baseMaqam.transpose(targetPitch);
    onSelectMaqam(transposed);
  };

  const handleResetTransposition = () => {
    onSelectMaqam(baseMaqam);
  };

  // Classical popular transpositions for the current base Maqam
  const getClassicalTranspositionsForMaqam = (): { pitch: ArabicPitch; title: string; arabicTitle: string; noteName: string }[] => {
    switch (baseMaqam.id) {
      case 'rast':
        return [
          { pitch: new ArabicPitch('G', '♮', 3), title: 'Maqam Yakah', arabicTitle: 'يكاه', noteName: 'Yakah (G3)' },
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Maqam Rast (Original)', arabicTitle: 'راست', noteName: 'Rast (C4)' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Maqam Nirz', arabicTitle: 'نيرز', noteName: 'Dukah (D4)' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Maqam Mahur / Nawa', arabicTitle: 'ماهور (راست نوى)', noteName: 'Nawa (G4)' },
          { pitch: new ArabicPitch('C', '♮', 5), title: 'Maqam Kirdan', arabicTitle: 'كردان', noteName: 'Kirdan (C5)' }
        ];
      case 'bayati':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Bayati ‘ala al-Rast', arabicTitle: 'بياتي راست', noteName: 'Rast (C4)' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Maqam Bayati (Original)', arabicTitle: 'بياتي', noteName: 'Dukah (D4)' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Maqam Shuri (Bayati Nawa)', arabicTitle: 'شوري (بياتي نوى)', noteName: 'Nawa (G4)' },
          { pitch: new ArabicPitch('A', '♮', 4), title: 'Maqam Husayni', arabicTitle: 'حسيني', noteName: 'Husayni (A4)' }
        ];
      case 'hijaz':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Maqam Hijaz Kar', arabicTitle: 'حجاز كار', noteName: 'Rast (C4)' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Maqam Hijaz (Original)', arabicTitle: 'حجاز', noteName: 'Dukah (D4)' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Maqam Shahnaz', arabicTitle: 'شهناز', noteName: 'Nawa (G4)' },
          { pitch: new ArabicPitch('A', '♮', 4), title: 'Maqam Suzidil', arabicTitle: 'سوزدل', noteName: 'Husayni (A4)' }
        ];
      case 'nahawand':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Maqam Nahawand (Original)', arabicTitle: 'نهاوند', noteName: 'Rast (C4)' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Nahawand Murassah', arabicTitle: 'نهاوند مرصع', noteName: 'Dukah (D4)' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Maqam Farahfaza', arabicTitle: 'فرحفزا', noteName: 'Nawa (G4)' }
        ];
      case 'sikah':
        return [
          { pitch: new ArabicPitch('B', '𝄳', 3), title: 'Maqam ‘Iraq', arabicTitle: 'عراق', noteName: '‘Iraq (B𝄳3)' },
          { pitch: new ArabicPitch('E', '𝄳', 4), title: 'Maqam Sikah (Original)', arabicTitle: 'سيكاه', noteName: 'Sikah (E𝄳4)' },
          { pitch: new ArabicPitch('B', '𝄳', 4), title: 'Maqam Awj', arabicTitle: 'أوج', noteName: 'Awj (B𝄳4)' }
        ];
      case 'kurd':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Kurd ‘ala al-Rast', arabicTitle: 'كرد راست', noteName: 'Rast (C4)' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Maqam Kurd (Original)', arabicTitle: 'كرد', noteName: 'Dukah (D4)' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Maqam Kurd Nawa', arabicTitle: 'كرد نوى', noteName: 'Nawa (G4)' },
          { pitch: new ArabicPitch('A', '♮', 4), title: 'Maqam Hijazkar Kurd', arabicTitle: 'حجاز كار كرد', noteName: 'Husayni (A4)' }
        ];
      case 'ajam':
        return [
          { pitch: new ArabicPitch('B', '♭', 3), title: 'Maqam ‘Ajam ‘Ushayran (Original)', arabicTitle: 'عجم عشيران', noteName: '‘Ajam (B♭3)' },
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Maqam Jaharkah / ‘Ajam', arabicTitle: 'جهاركاه / عجم', noteName: 'Rast (C4)' },
          { pitch: new ArabicPitch('F', '♮', 4), title: 'Maqam ‘Ajam Nawa', arabicTitle: 'عجم نوى', noteName: 'Jiharkah (F4)' }
        ];
      case 'saba':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Saba ‘ala al-Rast', arabicTitle: 'صبا راست', noteName: 'Rast (C4)' },
          { pitch: new ArabicPitch('D', '♮', 4), title: 'Maqam Saba (Original)', arabicTitle: 'صبا', noteName: 'Dukah (D4)' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Maqam Saba Zamzam / Nawa', arabicTitle: 'صبا زمزم', noteName: 'Nawa (G4)' }
        ];
      case 'nikriz':
        return [
          { pitch: new ArabicPitch('C', '♮', 4), title: 'Maqam Nikriz (Original)', arabicTitle: 'نكريز', noteName: 'Rast (C4)' },
          { pitch: new ArabicPitch('G', '♮', 4), title: 'Maqam Nawa Athar', arabicTitle: 'نوى أثر', noteName: 'Nawa (G4)' }
        ];
      default:
        return [
          { pitch: baseMaqam.getTonic(), title: `${baseMaqam.name} (Original)`, arabicTitle: 'الأصل', noteName: baseMaqam.getTonic().toScientificString() }
        ];
    }
  };

  const classicalTranspositions = getClassicalTranspositionsForMaqam();
  const scalePitches = currentMaqam.getScale();
  const tonic = currentMaqam.getTonic();
  const ghammaz = currentMaqam.getGhammaz();

  return (
    <div className="space-y-6">
      {/* 8 Families Mnemonic Banner (صُنِعَ بِسِحْرِك) */}
      <Card className="bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-indigo-950/40 border-amber-800/30">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                  The 8 Fundamental Families
                </span>
                <Badge variant="amber" className="font-mono text-[10px]">
                  صُـنِـعَ بِـسِـحْـرِكَ
                </Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl mt-1">
                Maqam Family Taxonomy
              </CardTitle>
            </div>
            <CardDescription className="max-w-sm">
              The classical mnemonic <span className="text-amber-300 font-serif font-bold text-sm">"صُنع بسحرك"</span> categorizes modal systems by their root lower Jins.
            </CardDescription>
          </div>
        </CardHeader>

        {/* 8 Family Interactive Grid */}
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {families.map((fam) => {
              const isSelected = currentMaqam.family === fam.mnemonic;
              return (
                <button
                  key={fam.mnemonic}
                  onClick={() => handleFamilyClick(fam.mnemonic)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between group ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg scale-102 ring-2 ring-amber-400/40'
                      : 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:bg-slate-800/80 hover:border-amber-500/40'
                  }`}
                >
                  <span className={`text-2xl font-bold font-serif ${isSelected ? 'text-slate-950' : 'text-amber-400 group-hover:scale-110 transition-transform'}`}>
                    {fam.arabicLetter}
                  </span>
                  <span className="text-xs font-bold mt-1">{fam.mnemonic}</span>
                  <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                    {fam.rootJinsDef.name}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Maqam Inspector & Playback Controls */}
      <Card className="bg-slate-900/90 border-slate-800/90">
        <CardHeader className="pb-5 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-2xl sm:text-3xl font-black">
                  {currentMaqam.name}
                </CardTitle>
                {currentMaqam.arabicName && (
                  <span className="text-xl font-serif text-amber-400/90 font-bold hidden sm:inline">
                    {currentMaqam.arabicName}
                  </span>
                )}
                <Badge variant="amber">
                  Family: {currentMaqam.family}
                </Badge>

                {isTransposed && (
                  <Badge variant="sky" className="animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    Transposed ({deltaQt > 0 ? '+' : ''}{centsOffset}¢ from {originalTonic.toScientificString()})
                  </Badge>
                )}
              </div>

              <CardDescription className="text-sm text-slate-300 mt-1 max-w-2xl">
                {currentMaqam.description}
              </CardDescription>
            </div>

            {/* Scale Audio Playback & Tonic Drone */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isPlayingScale ? "destructive" : "amber"}
                onClick={() => isPlayingScale ? onStopScale() : onPlayScale(scalePitches)}
                className="gap-2"
              >
                {isPlayingScale ? <Square className="fill-current" /> : <Play className="fill-current" />}
                {isPlayingScale ? 'Stop Scale' : 'Play Full Scale'}
              </Button>

              <Button
                variant={isDroneActive ? "emerald" : "dark"}
                onClick={() => onToggleDrone(tonic)}
                className="gap-2"
              >
                <Radio className={isDroneActive ? 'animate-pulse' : ''} />
                {isDroneActive ? 'Drone Active' : 'Qarar Drone'}
              </Button>

              {isTransposed && (
                <Button
                  variant="dark"
                  size="default"
                  onClick={handleResetTransposition}
                  className="gap-1.5"
                  title={`Reset to original ${baseMaqam.name}`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Tonic
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Structural Architecture: Lower Jins, Connection, Upper Jins */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lower Jins */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Jins al-Asl (جنس الأصل)</span>
                  <Badge variant="muted" className="text-[10px]">
                    {currentMaqam.lowerJins.definition.type}
                  </Badge>
                </div>
                <h4 className="text-lg font-bold text-white mt-1">
                  Jins {currentMaqam.lowerJins.definition.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Root: <strong className="text-amber-300">{currentMaqam.lowerJins.root.toScientificString()}{currentMaqam.lowerJins.root.octave}</strong> ({ArabicNoteSpine.resolveDegreeName(currentMaqam.lowerJins.root)})
                </p>
                <div className="flex items-center gap-1.5 mt-2 font-mono text-xs text-slate-300">
                  <span className="text-slate-500">Steps (qt):</span>
                  <span className="font-semibold text-amber-300">
                    [{currentMaqam.lowerJins.definition.intervals.join(' - ')}]
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({currentMaqam.lowerJins.getTotalSpanCents()}¢)
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-slate-400">Tonic (قرار):</span>
                <span className="font-bold text-emerald-400">{tonic.toScientificString()}{tonic.octave}</span>
              </div>
            </div>

            {/* Connection Type & Ghammaz */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Connection &amp; Pivot</span>
                  <Badge 
                    variant={currentMaqam.connection === 'Ittisal' ? 'sky' : currentMaqam.connection === 'Infisal' ? 'purple' : 'amber'}
                    className="text-[10px]"
                  >
                    {currentMaqam.connection} ({currentMaqam.connection === 'Ittisal' ? 'اتصال' : currentMaqam.connection === 'Infisal' ? 'انفصال' : 'تداخل'})
                  </Badge>
                </div>
                <h4 className="text-lg font-bold text-white mt-1">
                  Ghammaz (غمّاز): {ghammaz.toScientificString()}{ghammaz.octave}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {currentMaqam.connection === 'Ittisal'
                    ? 'Conjunct: Lower Jins top merges into Upper Jins root (Pivot Note).'
                    : currentMaqam.connection === 'Infisal'
                    ? 'Disjunct: 1 whole tone (4 quarter-tones / 200¢) gap between cells.'
                    : 'Overlapping / Interlocking cell structure.'}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-slate-400">Ghammaz Frequency:</span>
                <span className="font-bold text-sky-400">{ghammaz.toFrequency().toFixed(1)} Hz</span>
              </div>
            </div>

            {/* Upper Jins */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Jins al-Far' (جنس الفرع)</span>
                  <Badge variant="muted" className="text-[10px]">
                    {currentMaqam.upperJins.definition.type}
                  </Badge>
                </div>
                <h4 className="text-lg font-bold text-white mt-1">
                  Jins {currentMaqam.upperJins.definition.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Root: <strong className="text-purple-300">{currentMaqam.upperJins.root.toScientificString()}{currentMaqam.upperJins.root.octave}</strong> ({ArabicNoteSpine.resolveDegreeName(currentMaqam.upperJins.root)})
                </p>
                <div className="flex items-center gap-1.5 mt-2 font-mono text-xs text-slate-300">
                  <span className="text-slate-500">Steps (qt):</span>
                  <span className="font-semibold text-purple-300">
                    [{currentMaqam.upperJins.definition.intervals.join(' - ')}]
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({currentMaqam.upperJins.getTotalSpanCents()}¢)
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-slate-400">Upper Octave Apex:</span>
                <span className="font-bold text-purple-400">
                  {currentMaqam.extraPitches[currentMaqam.extraPitches.length - 1]?.toScientificString() || currentMaqam.upperJins.getTopPitch().toScientificString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Scale Degree Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Scale Degrees &amp; Frequencies (24-EDO)</span>
              <span className="text-[11px] text-amber-400">Click note to audition</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {scalePitches.map((pitch, idx) => {
                const isTonic = pitch.equals(tonic);
                const isGhammaz = pitch.equals(ghammaz);
                const isQuarter = pitch.accidental === '𝄳' || pitch.accidental === '𝄵';

                return (
                  <button
                    key={idx}
                    onClick={() => MicrotonalAudioEngine.playPitch(pitch, 0.7, timbre)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer hover:scale-105 ${
                      isTonic
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                        : isGhammaz
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 ring-1 ring-sky-500/30'
                        : isQuarter
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-base font-bold font-mono">{pitch.toScientificString()}</span>
                      {isTonic && <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1 rounded">1</span>}
                      {isGhammaz && <span className="text-[9px] bg-sky-500 text-slate-950 font-bold px-1 rounded">G</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{pitch.toFrequency().toFixed(1)} Hz</span>
                    <span className="text-[9px] text-slate-500">{ArabicNoteSpine.findByPitch(pitch)?.transliteration || ''}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Transposition Hub (الـتـصـويـر) */}
          <div className="pt-6 border-t border-border/60">
            <Tabs value={transpositionTab} onValueChange={setTranspositionTab} className="w-full">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-widest font-bold text-amber-400">
                      Maqam Transposition Hub (تـصـويـر الـمـقـامـات)
                    </span>
                    {isTransposed && (
                      <Badge variant="sky" className="font-mono text-[10px]">
                        Shift: {deltaQt > 0 ? '+' : ''}{centsOffset}¢ ({deltaQt > 0 ? '+' : ''}{deltaQt} qt)
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Transpose {baseMaqam.name} to Any Target Tonic
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Preserves exact microtonal interval architecture, Ghammaz pivot relationship, and violin ergonomics.
                  </p>
                </div>

                <TabsList>
                  <TabsTrigger value="classical">
                    Classical Targets
                  </TabsTrigger>
                  <TabsTrigger value="spine">
                    12-Note Spine
                  </TabsTrigger>
                  <TabsTrigger value="custom">
                    Custom 24-EDO Tonic
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Mode 1: Classical Transpositions */}
              <TabsContent value="classical" className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Standard Historical Transpositions for {baseMaqam.name}:</span>
                  <span className="text-amber-400 text-[11px]">Click to apply transposition</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {classicalTranspositions.map((item) => {
                    const isCurrent = tonic.equals(item.pitch);
                    const stepDeltaQt = originalTonic.diffQuarterTones(item.pitch);
                    const stepCents = stepDeltaQt * 50;

                    return (
                      <button
                        key={item.title}
                        onClick={() => handleTransposeToPitch(item.pitch)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between group ${
                          isCurrent
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-md ring-2 ring-amber-400/40'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-amber-500/40 hover:text-white'
                        }`}
                      >
                        <div className="flex items-baseline justify-between w-full">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                            {item.title}
                          </span>
                          <span className="text-xs font-serif font-bold text-amber-400">
                            {item.arabicTitle}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[11px]">
                          <span className="font-mono text-amber-300 font-semibold">
                            Target: {item.noteName}
                          </span>
                          <span className="font-mono text-slate-400 text-[10px]">
                            {stepDeltaQt === 0 ? 'Original' : `${stepDeltaQt > 0 ? '+' : ''}${stepCents}¢`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Mode 2: Traditional Arabic Note Spine (12 degrees) */}
              <TabsContent value="spine" className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>12 Traditional Arabic Spinal Degrees:</span>
                  <span className="text-amber-400 text-[11px]">Yakah to Muhayyar</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
                  {spineNotes.map((note) => {
                    const isCurrent = tonic.equals(note.pitch);
                    const stepDelta = originalTonic.diffQuarterTones(note.pitch);
                    return (
                      <button
                        key={note.transliteration}
                        onClick={() => handleTransposeToPitch(note.pitch)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer text-xs ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md ring-2 ring-amber-400/40'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:text-white hover:border-amber-500/40'
                        }`}
                      >
                        <div className="font-serif font-bold text-xs">{note.arabicName}</div>
                        <div className="font-semibold text-[11px] truncate">{note.transliteration}</div>
                        <div className="font-mono text-[10px] text-amber-300/80">
                          {note.pitch.toScientificString()}{note.pitch.octave}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {stepDelta === 0 ? '0¢' : `${stepDelta > 0 ? '+' : ''}${stepDelta * 50}¢`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Mode 3: Custom 24-EDO Tonic Pitch Builder */}
              <TabsContent value="custom" className="mt-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Diatonic Base */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Diatonic Base:
                        </span>
                        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                          {(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as DiatonicBase[]).map((d) => (
                            <button
                              key={d}
                              onClick={() => setCustomDiatonic(d)}
                              className={`w-8 h-8 rounded text-xs font-mono font-bold cursor-pointer transition flex items-center justify-center ${
                                customDiatonic === d
                                  ? 'bg-amber-500 text-slate-950 shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Microtonal Accidental */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Accidental (24-EDO):
                        </span>
                        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                          {([
                            { acc: '♭', label: '♭ Flat (-100¢)' },
                            { acc: '𝄳', label: '𝄳 Quarter-Flat (-50¢)' },
                            { acc: '♮', label: '♮ Natural (0¢)' },
                            { acc: '𝄵', label: '𝄵 Quarter-Sharp (+50¢)' },
                            { acc: '♯', label: '♯ Sharp (+100¢)' }
                          ] as { acc: MicrotonalAccidental; label: string }[]).map((item) => (
                            <button
                              key={item.acc}
                              onClick={() => setCustomAccidental(item.acc)}
                              title={item.label}
                              className={`px-2.5 h-8 rounded text-xs font-bold cursor-pointer transition flex items-center justify-center ${
                                customAccidental === item.acc
                                  ? 'bg-amber-500 text-slate-950 shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {item.acc}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Octave */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Octave:
                        </span>
                        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                          {[3, 4, 5].map((oct) => (
                            <button
                              key={oct}
                              onClick={() => setCustomOctave(oct)}
                              className={`px-3 h-8 rounded text-xs font-mono font-bold cursor-pointer transition flex items-center justify-center ${
                                customOctave === oct
                                  ? 'bg-amber-500 text-slate-950 shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Oct {oct}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Candidate Pitch Summary & Apply Action */}
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-right">
                        <span className="text-[10px] text-slate-400 block">Selected Target Note:</span>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-lg font-bold font-mono text-white">
                            {candidatePitch.toScientificString()}{candidatePitch.octave}
                          </span>
                          <span className="text-xs text-amber-300 font-mono">
                            ({candidatePitch.toFrequency().toFixed(1)} Hz)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Shift: {candidateDeltaQt === 0 ? '0¢ (Original)' : `${candidateDeltaQt > 0 ? '+' : ''}${candidateCents}¢`}
                        </span>
                      </div>

                      <Button
                        variant="amber"
                        onClick={() => handleTransposeToPitch(candidatePitch)}
                        className="gap-2"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        Transpose {baseMaqam.name} to {candidatePitch.toScientificString()}{candidatePitch.octave}
                      </Button>
                    </div>
                  </div>

                  {/* Quick suggestion helper chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-900 text-xs">
                    <span className="text-[11px] text-slate-500 mr-1">Popular Quick Tonics:</span>
                    {[
                      new ArabicPitch('G', '♮', 3), // Yakah
                      new ArabicPitch('C', '♮', 4), // Rast
                      new ArabicPitch('D', '♮', 4), // Dukah
                      new ArabicPitch('E', '𝄳', 4), // Sikah
                      new ArabicPitch('F', '♮', 4), // Jaharkah
                      new ArabicPitch('G', '♮', 4), // Nawa
                      new ArabicPitch('A', '♮', 4), // Husayni
                      new ArabicPitch('B', '♭', 4), // Ajam
                      new ArabicPitch('C', '♮', 5)  // Kirdan
                    ].map((qp, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCustomDiatonic(qp.diatonic);
                          setCustomAccidental(qp.accidental);
                          setCustomOctave(qp.octave);
                          handleTransposeToPitch(qp);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition cursor-pointer ${
                          tonic.equals(qp)
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {qp.toScientificString()}{qp.octave}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
