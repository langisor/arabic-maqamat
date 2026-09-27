// src/state/workspace-state.ts
import { DiatonicBase, MicrotonalAccidental, ArabicPitch } from '../core/pitch';
import { MaqamatCatalogue } from '../theory/maqam';
import type { TimbreType } from '../audio/microtonal-audio';
import type { MetronomeSoundType } from '../audio/metronome-engine';

export const WORKSPACE_SCHEMA_VERSION = 1;
export const WORKSPACE_STORAGE_KEY = 'arabic_maqamat_workspace_v1';

export type ValidLab =
  | 'explorer'
  | 'transposition'
  | 'violin'
  | 'sayr'
  | 'score'
  | 'tuning'
  | 'detector'
  | 'training';

export const VALID_LABS: readonly ValidLab[] = [
  'explorer',
  'transposition',
  'violin',
  'sayr',
  'score',
  'tuning',
  'detector',
  'training'
] as const;

export interface SerializedPitch {
  diatonic: DiatonicBase;
  accidental: MicrotonalAccidental;
  octave: number;
}

export function serializePitch(pitch: ArabicPitch): SerializedPitch {
  return {
    diatonic: pitch.diatonic,
    accidental: pitch.accidental,
    octave: pitch.octave
  };
}

export function deserializePitch(serialized: SerializedPitch | null | undefined): ArabicPitch | null {
  if (!serialized) return null;
  const validDiatonics: DiatonicBase[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const validAccidentals: MicrotonalAccidental[] = ['♭', '𝄳', '♮', '𝄵', '♯'];
  if (!validDiatonics.includes(serialized.diatonic)) return null;
  if (!validAccidentals.includes(serialized.accidental)) return null;
  if (typeof serialized.octave !== 'number' || serialized.octave < 1 || serialized.octave > 8) return null;
  return new ArabicPitch(serialized.diatonic, serialized.accidental, serialized.octave);
}

export interface WorkspaceGlobalState {
  selectedMaqamId: string;
  activeLab: ValidLab;
  timbre: TimbreType;
  audioSettings: {
    masterVolume: number;
    reverbWet: number;
    referenceA4: number;
  };
  metronome: {
    bpm: number;
    timeSignatureId: string;
    soundType: MetronomeSoundType;
    volume: number;
  };
}

export interface WorkspaceDrafts {
  explorer: {
    transpositionTab: 'classical' | 'spine' | 'custom';
    customTonic: SerializedPitch;
  };
  transposition: {
    targetTonic: SerializedPitch | null;
  };
  violin: {
    orientation: 'vertical' | 'horizontal';
    viewMode: 'maqam' | 'sequence';
    seqBpm: number;
    customSequence: SerializedPitch[];
    stringFilter: 'all' | 'G' | 'D' | 'A' | 'E';
    touchZoom: boolean;
  };
  sayr: {
    targetMaqamId: string;
    measureDuration: number;
  };
  jinsDetector: {
    customPhrase: SerializedPitch[] | null;
  };
  training: {
    activeMode: 'memorize' | 'sight' | 'record';
    sightReadingDifficulty: 'level1' | 'level2' | 'level3';
    melodyTempo: number;
    melodyMeter: '4/4' | '3/4' | '2/4';
  };
}

export interface WorkspaceState {
  version: number;
  global: WorkspaceGlobalState;
  drafts: WorkspaceDrafts;
}

export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  version: WORKSPACE_SCHEMA_VERSION,
  global: {
    selectedMaqamId: 'rast',
    activeLab: 'explorer',
    timbre: 'violin',
    audioSettings: {
      masterVolume: 85,
      reverbWet: 20,
      referenceA4: 440
    },
    metronome: {
      bpm: 96,
      timeSignatureId: '4_4_maqsum',
      soundType: 'dum-tak',
      volume: 75
    }
  },
  drafts: {
    explorer: {
      transpositionTab: 'classical',
      customTonic: { diatonic: 'G', accidental: '♮', octave: 4 }
    },
    transposition: {
      targetTonic: null
    },
    violin: {
      orientation: 'vertical',
      viewMode: 'maqam',
      seqBpm: 100,
      customSequence: [],
      stringFilter: 'all',
      touchZoom: false
    },
    sayr: {
      targetMaqamId: 'nahawand',
      measureDuration: 2
    },
    jinsDetector: {
      customPhrase: null
    },
    training: {
      activeMode: 'memorize',
      sightReadingDifficulty: 'level1',
      melodyTempo: 90,
      melodyMeter: '4/4'
    }
  }
};

/**
 * Validates a loaded or user-provided state against constraints and returns a sanitized object.
 */
export function sanitizeWorkspaceState(raw: unknown): WorkspaceState {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_STATE));
  }

  const obj = raw as Partial<WorkspaceState>;
  const result: WorkspaceState = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_STATE));

  if (typeof obj.version === 'number') {
    result.version = obj.version;
  }

  // Validate Global
  if (obj.global && typeof obj.global === 'object') {
    const g = obj.global as Partial<WorkspaceGlobalState>;

    // Maqam ID validation
    if (typeof g.selectedMaqamId === 'string' && g.selectedMaqamId.trim()) {
      const baseId = g.selectedMaqamId.split('-transposed-')[0];
      if (MaqamatCatalogue.findById(baseId)) {
        result.global.selectedMaqamId = g.selectedMaqamId;
      }
    }

    // Active lab validation
    if (g.activeLab && VALID_LABS.includes(g.activeLab as ValidLab)) {
      result.global.activeLab = g.activeLab as ValidLab;
    }

    // Timbre validation
    if (g.timbre === 'violin' || g.timbre === 'oud' || g.timbre === 'kanun') {
      result.global.timbre = g.timbre;
    }

    // Audio settings validation
    if (g.audioSettings && typeof g.audioSettings === 'object') {
      const a = g.audioSettings;
      if (typeof a.masterVolume === 'number' && a.masterVolume >= 0 && a.masterVolume <= 100) {
        result.global.audioSettings.masterVolume = Math.round(a.masterVolume);
      }
      if (typeof a.reverbWet === 'number' && a.reverbWet >= 0 && a.reverbWet <= 100) {
        result.global.audioSettings.reverbWet = Math.round(a.reverbWet);
      }
      if (typeof a.referenceA4 === 'number' && a.referenceA4 >= 400 && a.referenceA4 <= 480) {
        result.global.audioSettings.referenceA4 = a.referenceA4;
      }
    }

    // Metronome validation
    if (g.metronome && typeof g.metronome === 'object') {
      const m = g.metronome;
      if (typeof m.bpm === 'number' && m.bpm >= 30 && m.bpm <= 260) {
        result.global.metronome.bpm = Math.round(m.bpm);
      }
      if (typeof m.timeSignatureId === 'string' && m.timeSignatureId.trim()) {
        result.global.metronome.timeSignatureId = m.timeSignatureId;
      }
      if (m.soundType === 'dum-tak' || m.soundType === 'woodblock' || m.soundType === 'digital' || m.soundType === 'silent') {
        result.global.metronome.soundType = m.soundType;
      }
      if (typeof m.volume === 'number' && m.volume >= 0 && m.volume <= 100) {
        result.global.metronome.volume = Math.round(m.volume);
      }
    }
  }

  // Validate Drafts
  if (obj.drafts && typeof obj.drafts === 'object') {
    const d = obj.drafts as Partial<WorkspaceDrafts>;

    // Explorer
    if (d.explorer) {
      if (['classical', 'spine', 'custom'].includes(d.explorer.transpositionTab as string)) {
        result.drafts.explorer.transpositionTab = d.explorer.transpositionTab;
      }
      const customP = deserializePitch(d.explorer.customTonic);
      if (customP) {
        result.drafts.explorer.customTonic = serializePitch(customP);
      }
    }

    // Transposition
    if (d.transposition && d.transposition.targetTonic) {
      const targetP = deserializePitch(d.transposition.targetTonic);
      if (targetP) {
        result.drafts.transposition.targetTonic = serializePitch(targetP);
      }
    }

    // Violin
    if (d.violin) {
      if (d.violin.orientation === 'vertical' || d.violin.orientation === 'horizontal') {
        result.drafts.violin.orientation = d.violin.orientation;
      }
      if (d.violin.viewMode === 'maqam' || d.violin.viewMode === 'sequence') {
        result.drafts.violin.viewMode = d.violin.viewMode;
      }
      if (typeof d.violin.seqBpm === 'number' && d.violin.seqBpm >= 40 && d.violin.seqBpm <= 240) {
        result.drafts.violin.seqBpm = Math.round(d.violin.seqBpm);
      }
      if (Array.isArray(d.violin.customSequence)) {
        const validSeq = d.violin.customSequence
          .map(deserializePitch)
          .filter((p): p is ArabicPitch => p !== null)
          .map(serializePitch);
        result.drafts.violin.customSequence = validSeq;
      }
      if (['all', 'G', 'D', 'A', 'E'].includes(d.violin.stringFilter)) {
        result.drafts.violin.stringFilter = d.violin.stringFilter;
      }
      if (typeof d.violin.touchZoom === 'boolean') {
        result.drafts.violin.touchZoom = d.violin.touchZoom;
      }
    }

    // Sayr
    if (d.sayr) {
      if (typeof d.sayr.targetMaqamId === 'string' && MaqamatCatalogue.findById(d.sayr.targetMaqamId)) {
        result.drafts.sayr.targetMaqamId = d.sayr.targetMaqamId;
      }
      if (typeof d.sayr.measureDuration === 'number' && d.sayr.measureDuration >= 1 && d.sayr.measureDuration <= 8) {
        result.drafts.sayr.measureDuration = d.sayr.measureDuration;
      }
    }

    // Jins Detector
    if (d.jinsDetector && Array.isArray(d.jinsDetector.customPhrase)) {
      const validPhrase = d.jinsDetector.customPhrase
        .map(deserializePitch)
        .filter((p): p is ArabicPitch => p !== null)
        .map(serializePitch);
      result.drafts.jinsDetector.customPhrase = validPhrase.length > 0 ? validPhrase : null;
    }

    // Training
    if (d.training) {
      if (['memorize', 'sight', 'record'].includes(d.training.activeMode)) {
        result.drafts.training.activeMode = d.training.activeMode;
      }
      if (['level1', 'level2', 'level3'].includes(d.training.sightReadingDifficulty)) {
        result.drafts.training.sightReadingDifficulty = d.training.sightReadingDifficulty;
      }
      if (typeof d.training.melodyTempo === 'number' && d.training.melodyTempo >= 40 && d.training.melodyTempo <= 200) {
        result.drafts.training.melodyTempo = Math.round(d.training.melodyTempo);
      }
      if (['4/4', '3/4', '2/4'].includes(d.training.melodyMeter)) {
        result.drafts.training.melodyMeter = d.training.melodyMeter;
      }
    }
  }

  return result;
}

// In-memory cache & listeners
let cachedState: WorkspaceState | null = null;
const stateListeners = new Set<(state: WorkspaceState) => void>();

export function getWorkspaceState(): WorkspaceState {
  if (cachedState) return cachedState;

  if (typeof window === 'undefined' || !window.localStorage) {
    const fallback = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_STATE));
    cachedState = fallback;
    return fallback;
  }

  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      const fallback = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_STATE));
      cachedState = fallback;
      return fallback;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeWorkspaceState(parsed);
    cachedState = sanitized;
    return sanitized;
  } catch {
    const fallback = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_STATE));
    cachedState = fallback;
    return fallback;
  }
}

export function saveWorkspaceState(state: WorkspaceState): void {
  cachedState = state;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // safe fallback if quota exceeded
    }
  }
  stateListeners.forEach((fn) => {
    try {
      fn(state);
    } catch {
      // safe
    }
  });
}

export function updateWorkspaceGlobal(partial: Partial<WorkspaceGlobalState>): void {
  const current = getWorkspaceState();
  const next: WorkspaceState = {
    ...current,
    global: {
      ...current.global,
      ...partial,
      audioSettings: {
        ...current.global.audioSettings,
        ...(partial.audioSettings || {})
      },
      metronome: {
        ...current.global.metronome,
        ...(partial.metronome || {})
      }
    }
  };
  saveWorkspaceState(sanitizeWorkspaceState(next));
}

export function updateWorkspaceDraft<K extends keyof WorkspaceDrafts>(
  lab: K,
  patch: Partial<WorkspaceDrafts[K]>
): void {
  const current = getWorkspaceState();
  const next: WorkspaceState = {
    ...current,
    drafts: {
      ...current.drafts,
      [lab]: {
        ...current.drafts[lab],
        ...patch
      }
    }
  };
  saveWorkspaceState(sanitizeWorkspaceState(next));
}

export function subscribeWorkspace(listener: (state: WorkspaceState) => void): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

// -------------------------------------------------------------
// URL NAVIGATION SYNCHRONIZATION HELPERS
// -------------------------------------------------------------

export interface UrlNavigationParams {
  lab?: ValidLab;
  maqamId?: string;
}

/**
 * Extracts and validates navigation params from current URL search params.
 */
export function parseNavigationFromUrl(searchString?: string): UrlNavigationParams {
  if (typeof window === 'undefined') return {};
  const query = searchString ?? window.location.search;
  const params = new URLSearchParams(query);
  const result: UrlNavigationParams = {};

  const labParam = params.get('lab') || params.get('tab');
  if (labParam && VALID_LABS.includes(labParam as ValidLab)) {
    result.lab = labParam as ValidLab;
  }

  const maqamParam = params.get('maqam');
  if (maqamParam && maqamParam.trim()) {
    const baseId = maqamParam.split('-transposed-')[0];
    if (MaqamatCatalogue.findById(baseId)) {
      result.maqamId = maqamParam;
    }
  }

  return result;
}

/**
 * Synchronizes the URL query params without full page reload.
 * Uses replaceState or pushState to support back/forward history without loops.
 */
export function syncNavigationToUrl(
  lab: ValidLab,
  maqamId: string,
  mode: 'replace' | 'push' = 'replace'
): void {
  if (typeof window === 'undefined' || !window.history) return;

  try {
    const url = new URL(window.location.href);
    const prevLab = url.searchParams.get('lab');
    const prevMaqam = url.searchParams.get('maqam');

    if (prevLab === lab && prevMaqam === maqamId) {
      return; // Already in sync
    }

    url.searchParams.set('lab', lab);
    url.searchParams.set('maqam', maqamId);

    const targetUrl = url.pathname + url.search + url.hash;
    if (mode === 'push') {
      window.history.pushState({ lab, maqamId }, '', targetUrl);
    } else {
      window.history.replaceState({ lab, maqamId }, '', targetUrl);
    }
  } catch {
    // safe fallback
  }
}
