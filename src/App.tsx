// src/App.tsx
import React, { useState } from 'react';
import { Maqam, MaqamatCatalogue } from './theory/maqam';
import { ArabicPitch } from './core/pitch';
import { MicrotonalAudioEngine, TimbreType } from './audio/microtonal-audio';
import { MaqamExplorer } from './components/MaqamExplorer';
import { ViolinFingerboard } from './components/ViolinFingerboard';
import { ScoreViewer } from './components/ScoreViewer';
import { SayrQaflaLab } from './components/SayrQaflaLab';
import { TuningWheel24EDO } from './components/TuningWheel24EDO';
import { JinsDetectorLab } from './components/JinsDetectorLab';
import { TranspositionLab } from './components/TranspositionLab';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card } from './components/ui/card';
import { Slider } from './components/ui/slider';
import {
  Music,
  Radio,
  Layers,
  Compass,
  Sliders,
  FileMusic,
  Sparkles,
  ArrowLeftRight,
  ChevronDown,
  Volume2,
  Settings2,
  X,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const allMaqamat = MaqamatCatalogue.getAllMaqamat();
  const [currentMaqam, setCurrentMaqam] = useState<Maqam>(MaqamatCatalogue.buildRast());
  const [activeTab, setActiveTab] = useState<'explorer' | 'transposition' | 'violin' | 'sayr' | 'score' | 'tuning' | 'detector'>('explorer');
  const [timbre, setTimbre] = useState<TimbreType>('violin');
  const [isDroneActive, setIsDroneActive] = useState(false);
  const [isPlayingScale, setIsPlayingScale] = useState(false);
  const [activePitchIndex, setActivePitchIndex] = useState<number | null>(null);

  // Tone.js Audio DSP Studio Controls
  const [masterVolume, setMasterVolume] = useState<number>(85);
  const [reverbWet, setReverbWet] = useState<number>(20);
  const [referenceA4, setReferenceA4State] = useState<number>(440);
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);

  const scalePitches = currentMaqam.getScale();
  const tonic = currentMaqam.getTonic();

  const handleVolumeChange = (val: number) => {
    setMasterVolume(val);
    MicrotonalAudioEngine.setMasterVolume(val / 100);
  };

  const handleReverbChange = (val: number) => {
    setReverbWet(val);
    MicrotonalAudioEngine.setReverbWet(val / 100);
  };

  const handleA4Change = (val: number) => {
    setReferenceA4State(val);
    MicrotonalAudioEngine.setReferenceA4(val);
  };

  const handleSelectMaqam = (m: Maqam) => {
    // If drone is active, adjust drone to new tonic
    if (isDroneActive) {
      MicrotonalAudioEngine.toggleDrone(m.getTonic(), true);
    }
    if (isPlayingScale) {
      MicrotonalAudioEngine.stopSequence();
      setIsPlayingScale(false);
      setActivePitchIndex(null);
    }
    setCurrentMaqam(m);
  };

  const handleToggleDrone = (pitch: ArabicPitch) => {
    const newState = !isDroneActive;
    setIsDroneActive(newState);
    MicrotonalAudioEngine.toggleDrone(pitch, newState);
  };

  const handlePlayScale = (pitches: ArabicPitch[]) => {
    setIsPlayingScale(true);
    MicrotonalAudioEngine.playSequence(
      pitches,
      500,
      timbre,
      (idx) => {
        setActivePitchIndex(idx === -1 ? null : idx);
      },
      () => {
        setIsPlayingScale(false);
        setActivePitchIndex(null);
      }
    );
  };

  const handleStopScale = () => {
    MicrotonalAudioEngine.stopSequence();
    setIsPlayingScale(false);
    setActivePitchIndex(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Heritage Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-border shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Music className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">Arabic Maqamat</span>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  24-EDO Studio
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground -mt-0.5 hidden sm:block">
                Arabic Music Theory &amp; Violin Pedagogy Engine
              </p>
            </div>
          </div>

          {/* Quick Maqam Selector Dropdown & Sound Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <select
                value={currentMaqam.id}
                onChange={(e) => {
                  const found = allMaqamat.find(m => m.id === e.target.value);
                  if (found) handleSelectMaqam(found);
                }}
                className="appearance-none bg-slate-900 border border-slate-700/80 hover:border-amber-500/60 rounded-xl pl-2.5 pr-7 py-1.5 sm:py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer transition shadow-sm max-w-[130px] xs:max-w-[170px] sm:max-w-none truncate"
                title="Select Maqam"
              >
                {currentMaqam.id.includes('-transposed-') && (
                  <option value={currentMaqam.id}>
                    ⚡ {currentMaqam.name}
                  </option>
                )}
                {allMaqamat.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.family})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {currentMaqam.id.includes('-transposed-') && (
              <Button
                variant="amberOutline"
                size="sm"
                onClick={() => {
                  const baseId = currentMaqam.id.split('-transposed-')[0];
                  const base = MaqamatCatalogue.findById(baseId);
                  if (base) handleSelectMaqam(base);
                }}
                className="hidden xl:inline-flex gap-1"
                title="Reset to natural tonic"
              >
                <span>Tonic: {tonic.toScientificString()}{tonic.octave}</span>
                <span className="text-slate-400 hover:text-white">✕</span>
              </Button>
            )}

            {/* Timbre Toggle (Violin / Oud / Kanun) */}
            <div className="flex bg-slate-900 p-0.5 sm:p-1 rounded-xl border border-slate-800 text-[11px] sm:text-xs">
              <button
                onClick={() => setTimbre('violin')}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition cursor-pointer font-medium ${timbre === 'violin' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                title="Violin Bowed Sound (Tone.js Model)"
              >
                Violin
              </button>
              <button
                onClick={() => setTimbre('oud')}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition cursor-pointer font-medium ${timbre === 'oud' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                title="Oud Plucked Sound (Tone.js Model)"
              >
                Oud
              </button>
              <button
                onClick={() => setTimbre('kanun')}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition cursor-pointer font-medium ${timbre === 'kanun' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                title="Kanun Zither Sound (Tone.js Model)"
              >
                Kanun
              </button>
            </div>

            {/* Continuous Drone Shortcut */}
            <Button
              variant={isDroneActive ? "default" : "ghost"}
              size="sm"
              onClick={() => handleToggleDrone(tonic)}
              className="gap-1.5 px-2.5 sm:px-3"
              title="Continuous Tonic Qarar Drone"
            >
              <Radio className={`w-3.5 h-3.5 ${isDroneActive ? 'animate-pulse' : ''}`} />
              <span className="hidden md:inline">{isDroneActive ? 'Drone: ON' : 'Drone'}</span>
            </Button>

            {/* Audio Settings / Tone.js DSP Controls */}
            <Button
              variant="dark"
              size="sm"
              onClick={() => setShowAudioSettings(true)}
              className="gap-1.5 px-2.5 sm:px-3 text-slate-300 hover:text-white"
              title="Tone.js DSP Audio Settings"
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline text-xs font-medium">Audio DSP</span>
            </Button>
          </div>
        </div>

        {/* Studio Navigation Tabs (Mobile: Icons Only, Tablet/Desktop: Wrapped with Labels) */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 border-t border-border/60">
          <nav className="flex flex-wrap items-center justify-around sm:justify-start gap-1 sm:gap-2 py-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('explorer')}
              aria-label="Maqam & 8 Families"
              title="Maqam & 8 Families"
              className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'explorer'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Maqam &amp; 8 Families</span>
            </button>

            <button
              onClick={() => setActiveTab('transposition')}
              aria-label="Transposition Lab (Taswir)"
              title="Transposition Lab (Taswir)"
              className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'transposition'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="hidden sm:inline">Transposition Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('violin')}
              aria-label="Violin Fingerboard"
              title="Violin Fingerboard"
              className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'violin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
            >
              <Music className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Violin Fingerboard</span>
            </button>

            <button
              onClick={() => setActiveTab('sayr')}
              aria-label="Sayr, Modulation & Qafla"
              title="Sayr, Modulation & Qafla"
              className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'sayr'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sayr &amp; Qafla</span>
            </button>

            <button
              onClick={() => setActiveTab('score')}
              aria-label="Score & MusicXML 4.0"
              title="Score & MusicXML 4.0"
              className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'score'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
            >
              <FileMusic className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Score &amp; MusicXML</span>
            </button>

            <button
              onClick={() => setActiveTab('tuning')}
              aria-label="24-EDO Tuning & Spine"
              title="24-EDO Tuning & Spine"
              className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'tuning'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">24-EDO Tuning</span>
            </button>

            <button
              onClick={() => setActiveTab('detector')}
              aria-label="Jins Phrase Classifier"
              title="Jins Phrase Classifier"
              className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'detector'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Jins Classifier</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'explorer' && (
          <MaqamExplorer
            currentMaqam={currentMaqam}
            onSelectMaqam={handleSelectMaqam}
            timbre={timbre}
            isPlayingScale={isPlayingScale}
            onPlayScale={handlePlayScale}
            onStopScale={handleStopScale}
            isDroneActive={isDroneActive}
            onToggleDrone={handleToggleDrone}
          />
        )}

        {activeTab === 'transposition' && (
          <TranspositionLab
            currentMaqam={currentMaqam}
            onSelectMaqam={handleSelectMaqam}
            timbre={timbre}
            isDroneActive={isDroneActive}
            onToggleDrone={handleToggleDrone}
          />
        )}

        {activeTab === 'violin' && (
          <div className="space-y-6">
            <ViolinFingerboard
              scalePitches={scalePitches}
              activePitchIndex={activePitchIndex}
              timbre={timbre}
            />

            {/* Quick Context Summary */}
            <Card className="bg-slate-900/80 border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Active Fingerboard Maqam: {currentMaqam.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  1st position stop ratios computed mathematically via <code className="text-amber-300">L = 1 - 2^(-qt / 24)</code> with quarter-tone finger displacement adjustments.
                </p>
              </div>

              <Button
                variant="amber"
                size="sm"
                onClick={() => isPlayingScale ? handleStopScale() : handlePlayScale(scalePitches)}
              >
                {isPlayingScale ? 'Stop Playback' : 'Play & Trace on Fingerboard'}
              </Button>
            </Card>
          </div>
        )}

        {activeTab === 'sayr' && (
          <SayrQaflaLab
            currentMaqam={currentMaqam}
            timbre={timbre}
          />
        )}

        {activeTab === 'score' && (
          <ScoreViewer
            maqam={currentMaqam}
            activePitchIndex={activePitchIndex}
          />
        )}

        {activeTab === 'tuning' && (
          <TuningWheel24EDO
            timbre={timbre}
          />
        )}

        {activeTab === 'detector' && (
          <JinsDetectorLab
            timbre={timbre}
          />
        )}
      </main>

      {/* Footer Heritage & Credit */}
      <footer className="border-t border-border/40 bg-slate-950 py-6 mt-12 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif text-amber-400 font-bold text-sm">مقام فلو</span>
            <span>• Foundations of Arabic Music Theory &amp; Violin Pedagogy (Levels 1 &amp; 2)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span>Tone.js 24-EDO Microtonal Audio</span>
            <span>•</span>
            <span>صُنِعَ بِسِحْرِك (8 Families)</span>
            <span>•</span>
            <span>MusicXML 4.0</span>
          </div>
        </div>
      </footer>

      {/* Tone.js Audio DSP Studio Modal */}
      {showAudioSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Tone.js Audio DSP Engine
                    <Badge variant="secondary" className="text-[10px]">
                      v15.1
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Microtonal sound synthesis &amp; acoustic space simulation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAudioSettings(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="space-y-4 text-xs">
              {/* Master Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    Master Volume
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{masterVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Freeverb Reverb Wet */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-300">
                    Acoustic Chamber Reverb (Wet / Dry)
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{reverbWet}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={reverbWet}
                  onChange={(e) => handleReverbChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[11px] text-muted-foreground">
                  Simulates sound reflections in historic Ottoman, Andalusian, and court concert halls.
                </p>
              </div>

              {/* Reference Concert Pitch A4 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-300">
                    Concert Reference Pitch (A4 Tuning)
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{referenceA4} Hz</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { freq: 432, label: '432 Hz', desc: 'Verdi / Acoustic' },
                    { freq: 440, label: '440 Hz', desc: 'Modern ISO Standard' },
                    { freq: 442, label: '442 Hz', desc: 'Concert Orchestral' }
                  ].map((item) => (
                    <button
                      key={item.freq}
                      onClick={() => handleA4Change(item.freq)}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${referenceA4 === item.freq
                          ? 'border-amber-400 bg-amber-500/20 text-white font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                    >
                      <div className="font-mono text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Timbre Model */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-300 block">Instrument Acoustic Model</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTimbre('violin')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${timbre === 'violin'
                        ? 'border-amber-400 bg-amber-500/20 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                  >
                    <div className="font-bold">Violin (كمان)</div>
                    <div className="text-[10px] text-slate-400">Bowed string + 5.2Hz LFO</div>
                  </button>
                  <button
                    onClick={() => setTimbre('oud')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${timbre === 'oud'
                        ? 'border-amber-400 bg-amber-500/20 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                  >
                    <div className="font-bold">Oud (عود)</div>
                    <div className="text-[10px] text-slate-400">Plucked lute + bowl body</div>
                  </button>
                  <button
                    onClick={() => setTimbre('kanun')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${timbre === 'kanun'
                        ? 'border-amber-400 bg-amber-500/20 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                  >
                    <div className="font-bold">Kanun (قانون)</div>
                    <div className="text-[10px] text-slate-400">Bright 78-string zither</div>
                  </button>
                </div>
              </div>

              {/* Engine Specs Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tone.js Audio Graph Active</span>
                </div>
                <p>
                  &bull; 24-EDO Quarter-Tone precision: exact mathematical calculation via <code className="text-amber-300">f = A4 &times; 2^((qt - 114)/24)</code>.
                </p>
                <p>
                  &bull; Master brickwall limiter (-0.5 dB) prevents harmonic clipping during dense polyphony or drone overlap.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <Button
                variant="amberOutline"
                size="sm"
                onClick={() => {
                  // Audition neutral third (D4 -> E𝄳4 -> A4)
                  const d4 = new ArabicPitch('D', '♮', 4);
                  const eHalfFlat4 = new ArabicPitch('E', '𝄳', 4);
                  const a4 = new ArabicPitch('A', '♮', 4);
                  MicrotonalAudioEngine.playPitch(d4, 0.4, timbre);
                  setTimeout(() => MicrotonalAudioEngine.playPitch(eHalfFlat4, 0.4, timbre), 350);
                  setTimeout(() => MicrotonalAudioEngine.playPitch(a4, 0.6, timbre), 700);
                }}
                className="gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Audition Tone (Dukah &bull; Sikah &bull; Husayni)
              </Button>

              <Button
                variant="amber"
                size="sm"
                onClick={() => setShowAudioSettings(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
