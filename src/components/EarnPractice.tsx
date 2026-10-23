import { useCallback, useEffect, useRef, useState } from "react"
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Headphones,
  Mic,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { MicrotonalAudioEngine, type TimbreType } from "../audio/microtonal-audio"
import { MicrotonalPitchDetector } from "../audio/pitch-detector"
import { ArabicPitch } from "../core/pitch"
import { AjnasLibrary, Jins, type JinsDefinition } from "../theory/jins"
import { Maqam, MaqamatCatalogue } from "../theory/maqam"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Input } from "./ui/input"
import {
  Questionnaire,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "./ui/questionnaire"

type PracticeMethod =
  | "identify-jins"
  | "identify-maqam"
  | "identify-degree"
  | "play-performance"

interface PracticeBoundary {
  id: string
  name: string
  jinsIds: string[]
  maqamIds: string[]
  methods: PracticeMethod[]
}

interface StoredBoundaries {
  boundaries: PracticeBoundary[]
  error: string | null
}

interface AnswerOption {
  id: string
  label: string
}

interface ListeningQuestion {
  method: Exclude<PracticeMethod, "play-performance">
  prompt: string
  targetLabel: string
  answerId: string
  options: AnswerOption[]
  pitches: ArabicPitch[]
}

interface PerformanceTarget {
  kind: "Jins" | "Maqam"
  name: string
  pitches: ArabicPitch[]
}

interface RecordedPitch {
  inTune: boolean
  centsDeviation: number
  inBoundary: boolean
}

interface RecordingReport {
  sampleCount: number
  intonationPercent: number
  boundaryPercent: number
  averageCents: number
  duration: number
}

const STORAGE_KEY = "arabic_maqamat_earn_practice_v1"
const ALL_JINS = AjnasLibrary.getAllDefinitions()
const ALL_MAQAMAT = MaqamatCatalogue.getAll()
const ALL_METHODS: PracticeMethod[] = [
  "identify-jins",
  "identify-maqam",
  "identify-degree",
  "play-performance",
]

const METHOD_DETAILS: Record<
  PracticeMethod,
  { title: string; description: string }
> = {
  "identify-jins": {
    title: "Identify the Jins",
    description: "Listen to a short phrase and choose the Jins you hear.",
  },
  "identify-maqam": {
    title: "Identify the Maqam",
    description: "Listen to a short phrase and identify its Maqam.",
  },
  "identify-degree": {
    title: "Identify the degree",
    description: "Hear the tonic followed by a scale note, then name its degree.",
  },
  "play-performance": {
    title: "Play the Maqam or Jins",
    description: "Prepare your instrument, then record a short performance.",
  },
}

const PRESET_BOUNDARIES: PracticeBoundary[] = [
  {
    id: "preset-all-ajnas",
    name: "All Ajnas",
    jinsIds: ALL_JINS.map((jins) => jins.id),
    maqamIds: [],
    methods: ["identify-jins", "play-performance"],
  },
  {
    id: "preset-all-maqamat",
    name: "All Maqamat",
    jinsIds: [],
    maqamIds: ALL_MAQAMAT.map((maqam) => maqam.id),
    methods: ["identify-maqam", "identify-degree", "play-performance"],
  },
]

const isPracticeMethod = (value: unknown): value is PracticeMethod =>
  typeof value === "string" && ALL_METHODS.includes(value as PracticeMethod)

function isPracticeBoundary(value: unknown): value is PracticeBoundary {
  if (!value || typeof value !== "object") return false
  const boundary = value as Partial<PracticeBoundary>
  return (
    typeof boundary.id === "string" &&
    typeof boundary.name === "string" &&
    Array.isArray(boundary.jinsIds) &&
    boundary.jinsIds.every((id) => typeof id === "string") &&
    Array.isArray(boundary.maqamIds) &&
    boundary.maqamIds.every((id) => typeof id === "string") &&
    Array.isArray(boundary.methods) &&
    boundary.methods.every(isPracticeMethod)
  )
}

function loadSavedBoundaries(): StoredBoundaries {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { boundaries: [], error: null }
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return {
        boundaries: [],
        error: "Saved practices could not be read because the stored data is invalid.",
      }
    }
    const boundaries = parsed.filter(isPracticeBoundary)
    return {
      boundaries,
      error:
        boundaries.length === parsed.length
          ? null
          : "Some saved practices were invalid and were not loaded.",
    }
  } catch (error) {
    return {
      boundaries: [],
      error:
        error instanceof Error
          ? `Could not load saved practices: ${error.message}`
          : "Could not load saved practices.",
    }
  }
}

function persistBoundaries(boundaries: PracticeBoundary[]): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boundaries))
    return null
  } catch (error) {
    return error instanceof Error
      ? `Could not save practices: ${error.message}`
      : "Could not save practices."
  }
}

function randomItem<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

function randomize<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

function makeChoiceOptions<T>(
  target: T,
  candidates: T[],
  getId: (item: T) => string,
  getLabel: (item: T) => string
): AnswerOption[] {
  const targetId = getId(target)
  const options = [
    target,
    ...randomize(candidates.filter((item) => getId(item) !== targetId)).slice(
      0,
      3
    ),
  ]
  return randomize(options).map((item) => ({
    id: getId(item),
    label: getLabel(item),
  }))
}

function getBoundaryJins(boundary: PracticeBoundary): JinsDefinition[] {
  return boundary.jinsIds
    .map((id) => AjnasLibrary.findById(id))
    .filter((jins): jins is JinsDefinition => jins !== undefined)
}

function getBoundaryMaqamat(boundary: PracticeBoundary): Maqam[] {
  return boundary.maqamIds
    .map((id) => MaqamatCatalogue.getById(id))
    .filter((maqam): maqam is Maqam => maqam !== undefined)
}

function createListeningQuestion(
  boundary: PracticeBoundary,
  method: Exclude<PracticeMethod, "play-performance">
): ListeningQuestion | null {
  if (method === "identify-jins") {
    const candidates = getBoundaryJins(boundary)
    const target = randomItem(candidates)
    if (!target) return null
    const jins = new Jins(target, target.defaultRoot)
    const pitches = randomize(jins.getPitches()).slice(0, 3)
    return {
      method,
      prompt: "Listen to the phrase and identify the Jins.",
      targetLabel: target.name,
      answerId: target.id,
      options: makeChoiceOptions(
        target,
        candidates,
        (item) => item.id,
        (item) => item.name
      ),
      pitches,
    }
  }

  const maqamat = getBoundaryMaqamat(boundary)
  const target = randomItem(maqamat)
  if (!target) return null

  if (method === "identify-maqam") {
    return {
      method,
      prompt: "Listen to the phrase and identify the Maqam.",
      targetLabel: target.name,
      answerId: target.id,
      options: makeChoiceOptions(
        target,
        maqamat,
        (item) => item.id,
        (item) => item.name
      ),
      pitches: randomize(target.getScale()).slice(0, 4),
    }
  }

  const scale = target.getScale()
  if (scale.length < 2) return null
  const degreeIndex = 1 + Math.floor(Math.random() * (scale.length - 1))
  return {
    method,
    prompt: `This is ${target.name}. Listen to the tonic, then the second pitch.`,
    targetLabel: target.name,
    answerId: String(degreeIndex + 1),
    options: Array.from({ length: scale.length }, (_, index) => ({
      id: String(index + 1),
      label: `Degree ${index + 1}`,
    })),
    pitches: [target.getTonic(), scale[degreeIndex]],
  }
}

function createPerformanceTarget(
  boundary: PracticeBoundary
): PerformanceTarget | null {
  const jins = getBoundaryJins(boundary)
  const maqamat = getBoundaryMaqamat(boundary)
  const availableKinds = [
    ...(jins.length ? ["Jins" as const] : []),
    ...(maqamat.length ? ["Maqam" as const] : []),
  ]
  const kind = randomItem(availableKinds)
  if (!kind) return null

  if (kind === "Jins") {
    const target = randomItem(jins)
    if (!target) return null
    return {
      kind,
      name: target.name,
      pitches: new Jins(target, target.defaultRoot).getPitches(),
    }
  }

  const target = randomItem(maqamat)
  if (!target) return null
  return { kind, name: target.name, pitches: target.getScale() }
}

function getPracticeMethods(boundary: PracticeBoundary): PracticeMethod[] {
  return boundary.methods.filter((method) =>
    isMethodCompatible(method, boundary.jinsIds, boundary.maqamIds)
  )
}

function isMethodCompatible(
  method: PracticeMethod,
  jinsIds: string[],
  maqamIds: string[]
): boolean {
  if (method === "identify-jins") return jinsIds.length > 0
  if (method === "identify-maqam" || method === "identify-degree") {
    return maqamIds.length > 0
  }
  return jinsIds.length > 0 || maqamIds.length > 0
}

function rating(percent: number): string {
  if (percent >= 80) return "Strong"
  if (percent >= 55) return "Developing"
  return "Keep practicing"
}

function analyzeRecording(
  samples: RecordedPitch[],
  duration: number
): RecordingReport {
  if (!samples.length) {
    return {
      sampleCount: 0,
      intonationPercent: 0,
      boundaryPercent: 0,
      averageCents: 0,
      duration,
    }
  }
  return {
    sampleCount: samples.length,
    intonationPercent: Math.round(
      (samples.filter((sample) => sample.inTune).length / samples.length) * 100
    ),
    boundaryPercent: Math.round(
      (samples.filter((sample) => sample.inBoundary).length / samples.length) *
        100
    ),
    averageCents: Math.round(
      (samples.reduce(
        (total, sample) => total + Math.abs(sample.centsDeviation),
        0
      ) /
        samples.length) *
        10
    ) / 10,
    duration,
  }
}

interface EarnPracticeProps {
  timbre: TimbreType
}

export function EarnPractice({ timbre }: EarnPracticeProps) {
  const [initialSaved] = useState(loadSavedBoundaries)
  const [customBoundaries, setCustomBoundaries] = useState(initialSaved.boundaries)
  const [storageError, setStorageError] = useState<string | null>(initialSaved.error)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PracticeBoundary | null>(null)
  const [draftStep, setDraftStep] = useState(0)
  const [builderError, setBuilderError] = useState<string | null>(null)
  const [activeBoundary, setActiveBoundary] =
    useState<PracticeBoundary | null>(null)
  const [activeMethod, setActiveMethod] = useState<PracticeMethod | null>(null)
  const [question, setQuestion] = useState<ListeningQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerChecked, setAnswerChecked] = useState(false)
  const [performanceTarget, setPerformanceTarget] =
    useState<PerformanceTarget | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isStartingRecording, setIsStartingRecording] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [recordingReport, setRecordingReport] =
    useState<RecordingReport | null>(null)
  const [practiceError, setPracticeError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const detectorRef = useRef<MicrotonalPitchDetector | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const frameRef = useRef<number | null>(null)
  const maxDurationRef = useRef<number | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const lastAnalysisAtRef = useRef(0)
  const recordingRef = useRef(false)
  const recordedPitchesRef = useRef<RecordedPitch[]>([])
  const pitchBufferRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const performanceTargetRef = useRef<PerformanceTarget | null>(null)

  const boundaries = [...PRESET_BOUNDARIES, ...customBoundaries]

  const releaseRecording = useCallback(() => {
    recordingRef.current = false
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    if (maxDurationRef.current !== null) {
      window.clearTimeout(maxDurationRef.current)
      maxDurationRef.current = null
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    sourceRef.current?.disconnect()
    sourceRef.current = null
    analyserRef.current = null
    detectorRef.current = null
    pitchBufferRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const finishRecording = useCallback(() => {
    if (!recordingRef.current) return
    const duration = Math.min(
      12,
      Math.max(
        0,
        (performance.now() - (startedAtRef.current ?? performance.now())) /
          1000
      )
    )
    const report = analyzeRecording(recordedPitchesRef.current, duration)
    setRecordingReport(report)
    setRecordSeconds(Math.ceil(duration))
    setIsRecording(false)
    setPracticeError(
      report.sampleCount
        ? null
        : "No clear pitches were detected. Try again in a quieter space and play sustained notes."
    )
    releaseRecording()
  }, [releaseRecording])

  const beginRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || !analyserRef.current || !detectorRef.current) {
      setPracticeError("The recording could not start. Please try again.")
      releaseRecording()
      return
    }

    try {
      recordedPitchesRef.current = []
      recorder.start()
      recordingRef.current = true
      startedAtRef.current = performance.now()
      lastAnalysisAtRef.current = 0
      setRecordSeconds(0)
      setIsRecording(true)
      setPracticeError(null)

      const loop = (now: number) => {
        if (!recordingRef.current) return
        const analyser = analyserRef.current
        const detector = detectorRef.current
        const buffer = pitchBufferRef.current
        const target = performanceTargetRef.current
        if (!analyser || !detector || !buffer || !target) return

        if (now - lastAnalysisAtRef.current >= 125) {
          lastAnalysisAtRef.current = now
          analyser.getFloatTimeDomainData(buffer)
          const detected = detector.detectPitch(buffer)
          if (detected) {
            const targetPitchClasses = target.pitches.map((pitch) =>
              ((pitch.toQuarterToneIndex() % 24) + 24) % 24
            )
            const pitchClass =
              ((detected.quarterToneIndex % 24) + 24) % 24
            recordedPitchesRef.current.push({
              inTune: detected.inTune,
              centsDeviation: detected.centsDeviation,
              inBoundary: targetPitchClasses.includes(pitchClass),
            })
          }
        }
        frameRef.current = requestAnimationFrame(loop)
      }
      frameRef.current = requestAnimationFrame(loop)
      maxDurationRef.current = window.setTimeout(finishRecording, 12_000)
    } catch (error) {
      setPracticeError(
        error instanceof Error
          ? `Could not record: ${error.message}`
          : "Could not start recording."
      )
      setIsRecording(false)
      releaseRecording()
    }
  }, [finishRecording, releaseRecording])

  useEffect(() => {
    if (countdown === null) return
    const timer = window.setTimeout(
      () => {
        if (countdown <= 1) {
          setCountdown(null)
          beginRecording()
        } else {
          setCountdown(countdown - 1)
        }
      },
      1000
    )
    return () => window.clearTimeout(timer)
  }, [beginRecording, countdown])

  useEffect(() => {
    if (!isRecording) return
    const interval = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        setRecordSeconds(
          Math.min(
            12,
            Math.floor((performance.now() - startedAtRef.current) / 1000)
          )
        )
      }
    }, 250)
    return () => window.clearInterval(interval)
  }, [isRecording])

  useEffect(() => releaseRecording, [releaseRecording])

  const playPitches = useCallback(
    async (pitches: ArabicPitch[]) => {
      setPracticeError(null)
      try {
        await MicrotonalAudioEngine.startAudioContext()
        MicrotonalAudioEngine.playSequence(
          pitches,
          650,
          timbre,
          undefined,
          undefined,
          undefined,
          "earn-practice"
        )
      } catch (error) {
        setPracticeError(
          error instanceof Error
            ? `Audio could not start: ${error.message}`
            : "Audio could not start. Check your audio settings and try again."
        )
      }
    },
    [timbre]
  )

  const openBuilder = (boundary?: PracticeBoundary) => {
    setEditingId(boundary?.id ?? null)
    setDraft(
      boundary
        ? { ...boundary, jinsIds: [...boundary.jinsIds], maqamIds: [...boundary.maqamIds], methods: [...boundary.methods] }
        : {
            id: crypto.randomUUID(),
            name: "",
            jinsIds: [],
            maqamIds: [],
            methods: [],
          }
    )
    setDraftStep(0)
    setBuilderError(null)
    setPracticeError(null)
    setActiveBoundary(null)
  }

  const closeBuilder = () => {
    setDraft(null)
    setEditingId(null)
    setBuilderError(null)
  }

  const setDraftTargets = (
    target: "jinsIds" | "maqamIds",
    id: string,
    checked: boolean
  ) => {
    setDraft((current) => {
      if (!current) return current
      const existing = current[target]
      const updated = {
        ...current,
        [target]: checked
          ? [...existing, id]
          : existing.filter((item) => item !== id),
      }
      return {
        ...updated,
        methods: updated.methods.filter((method) =>
          isMethodCompatible(method, updated.jinsIds, updated.maqamIds)
        ),
      }
    })
  }

  const setDraftMethod = (method: PracticeMethod, checked: boolean) => {
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        methods: checked
          ? [...current.methods, method]
          : current.methods.filter((item) => item !== method),
      }
    })
  }

  const moveDraftForward = () => {
    if (!draft) return
    if (draftStep === 0 && !draft.name.trim()) {
      setBuilderError("Give this practice boundary a name to continue.")
      return
    }
    if (draftStep === 1 && !draft.jinsIds.length && !draft.maqamIds.length) {
      setBuilderError("Select at least one Jins or Maqam.")
      return
    }
    if (draftStep === 2) return
    setBuilderError(null)
    setDraftStep((step) => step + 1)
  }

  const saveDraft = () => {
    if (!draft || !draft.name.trim()) return
    const cleanDraft = { ...draft, name: draft.name.trim() }
    const next = editingId
      ? customBoundaries.map((boundary) =>
          boundary.id === editingId ? cleanDraft : boundary
        )
      : [...customBoundaries, cleanDraft]
    const error = persistBoundaries(next)
    if (error) {
      setStorageError(error)
      return
    }
    setCustomBoundaries(next)
    setStorageError(null)
    closeBuilder()
  }

  const deleteBoundary = (boundary: PracticeBoundary) => {
    if (!window.confirm(`Delete "${boundary.name}"?`)) return
    const next = customBoundaries.filter((item) => item.id !== boundary.id)
    const error = persistBoundaries(next)
    if (error) {
      setStorageError(error)
      return
    }
    setCustomBoundaries(next)
    setStorageError(null)
    if (activeBoundary?.id === boundary.id) exitPractice()
  }

  const exportBoundary = (boundary: PracticeBoundary) => {
    const payload = {
      format: "arabic-maqamat-practice-boundary",
      version: 1,
      exportedAt: new Date().toISOString(),
      practice: boundary,
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      })
    )
    const link = document.createElement("a")
    link.href = url
    link.download = `${boundary.name.trim().replace(/[^a-z0-9-_]+/gi, "-") || "practice"}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const startListeningPractice = (
    boundary: PracticeBoundary,
    method: Exclude<PracticeMethod, "play-performance">
  ) => {
    const nextQuestion = createListeningQuestion(boundary, method)
    if (!nextQuestion) {
      setPracticeError("This practice has no available targets for that method.")
      return
    }
    setActiveBoundary(boundary)
    setActiveMethod(method)
    setQuestion(nextQuestion)
    setSelectedAnswer(null)
    setAnswerChecked(false)
    setPerformanceTarget(null)
    setRecordingReport(null)
    setPracticeError(null)
    void playPitches(nextQuestion.pitches)
  }

  const startPerformancePractice = (boundary: PracticeBoundary) => {
    const target = createPerformanceTarget(boundary)
    if (!target) {
      setPracticeError("This practice has no available performance targets.")
      return
    }
    setActiveBoundary(boundary)
    setActiveMethod("play-performance")
    setPerformanceTarget(target)
    performanceTargetRef.current = target
    setQuestion(null)
    setRecordingReport(null)
    setPracticeError(null)
  }

  const startRecording = async () => {
    setPracticeError(null)
    setIsStartingRecording(true)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone access requires a supported browser on HTTPS or localhost."
        )
      }
      if (typeof MediaRecorder === "undefined") {
        throw new Error("Audio recording is not supported by this browser.")
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      })
      streamRef.current = stream
      await MicrotonalAudioEngine.startAudioContext()
      const audioContext = MicrotonalAudioEngine.getAudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.1
      source.connect(analyser)
      sourceRef.current = source
      analyserRef.current = analyser
      detectorRef.current = new MicrotonalPitchDetector(
        audioContext.sampleRate,
        analyser.fftSize,
        { volumeThresholdRms: 0.012, clarityThreshold: 0.55 }
      )
      pitchBufferRef.current = new Float32Array(analyser.fftSize)
      recorderRef.current = new MediaRecorder(stream)
      performanceTargetRef.current = performanceTarget
      setCountdown(4)
    } catch (error) {
      releaseRecording()
      setPracticeError(
        error instanceof Error
          ? error.message
          : "Microphone access could not start."
      )
    } finally {
      setIsStartingRecording(false)
    }
  }

  const checkRecording = () => {
    if (countdown !== null) {
      setCountdown(null)
      releaseRecording()
      return
    }
    finishRecording()
  }

  const submitAnswer = () => {
    if (!selectedAnswer || !question) return
    setAnswerChecked(true)
  }

  const nextQuestion = () => {
    if (!activeBoundary || !activeMethod || activeMethod === "play-performance")
      return
    const next = createListeningQuestion(activeBoundary, activeMethod)
    if (!next) {
      setPracticeError("This practice has no available questions.")
      return
    }
    setQuestion(next)
    setSelectedAnswer(null)
    setAnswerChecked(false)
    setPracticeError(null)
    void playPitches(next.pitches)
  }

  function exitPractice() {
    setCountdown(null)
    setIsRecording(false)
    setIsStartingRecording(false)
    setRecordSeconds(0)
    setRecordingReport(null)
    setQuestion(null)
    setSelectedAnswer(null)
    setAnswerChecked(false)
    setPerformanceTarget(null)
    setActiveBoundary(null)
    setActiveMethod(null)
    setPracticeError(null)
    releaseRecording()
    MicrotonalAudioEngine.stopSequence("earn-practice")
  }

  const availableMethods = draft ? getPracticeMethods(draft) : []
  const methodChoices: PracticeMethod[] = [
    "identify-jins",
    "identify-maqam",
    "identify-degree",
    "play-performance",
  ]

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <BookOpen className="size-5 text-amber-400" />
            Earn Practice
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Build a practice boundary from the ajnas and maqamat you want to
            master, then listen, identify, and play.
          </p>
        </div>
        {!activeBoundary && !draft && (
          <Button onClick={() => openBuilder()}>
            <Plus data-icon="inline-start" />
            New practice boundary
          </Button>
        )}
      </header>

      {storageError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {storageError}
        </div>
      )}

      {practiceError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {practiceError}
        </div>
      )}

      {draft && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>
                  {editingId ? "Edit practice boundary" : "Create a practice boundary"}
                </CardTitle>
                <CardDescription>
                  Step {draftStep + 1} of 3 · Name it, choose your material, and
                  select practice methods.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close boundary builder"
                onClick={closeBuilder}
              >
                <X />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Questionnaire>
              <QuestionnaireItem name={`practice-boundary-step-${draftStep}`}>
                <QuestionnaireTitle>
                  {draftStep === 0
                    ? "Name this practice"
                    : draftStep === 1
                      ? "Choose what to practice"
                      : "Choose practice methods"}
                </QuestionnaireTitle>
                <QuestionnaireDescription>
                  {draftStep === 0
                    ? "Give your boundary a name you will recognize in your practice list."
                    : draftStep === 1
                      ? "Select one or more ajnas and maqamat to include."
                      : "Only methods compatible with your selected material can be enabled."}
                </QuestionnaireDescription>

                {draftStep === 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    <label
                      htmlFor="practice-boundary-name"
                      className="text-sm font-medium"
                    >
                      Boundary name
                    </label>
                    <Input
                      id="practice-boundary-name"
                      autoFocus
                      maxLength={60}
                      value={draft.name}
                      placeholder="e.g. Bayati and Rast review"
                      onChange={(event) =>
                        setDraft({ ...draft, name: event.target.value })
                      }
                    />
                  </div>
                )}

                {draftStep === 1 && (
                  <div className="mt-4 grid gap-5 lg:grid-cols-2">
                    <fieldset className="flex min-w-0 flex-col gap-2">
                      <legend className="mb-2 text-sm font-semibold">
                        Ajnas ({draft.jinsIds.length} selected)
                      </legend>
                      <div className="grid max-h-80 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">
                        {ALL_JINS.map((jins) => (
                          <label
                            key={jins.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm hover:bg-muted/60"
                          >
                            <input
                              type="checkbox"
                              checked={draft.jinsIds.includes(jins.id)}
                              onChange={(event) =>
                                setDraftTargets(
                                  "jinsIds",
                                  jins.id,
                                  event.target.checked
                                )
                              }
                              className="accent-primary"
                            />
                            <span className="min-w-0 truncate">{jins.name}</span>
                            <span className="ms-auto text-xs text-muted-foreground">
                              {jins.sizeLabel}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset className="flex min-w-0 flex-col gap-2">
                      <legend className="mb-2 text-sm font-semibold">
                        Maqamat ({draft.maqamIds.length} selected)
                      </legend>
                      <div className="grid max-h-80 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-2">
                        {ALL_MAQAMAT.map((maqam) => (
                          <label
                            key={maqam.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm hover:bg-muted/60"
                          >
                            <input
                              type="checkbox"
                              checked={draft.maqamIds.includes(maqam.id)}
                              onChange={(event) =>
                                setDraftTargets(
                                  "maqamIds",
                                  maqam.id,
                                  event.target.checked
                                )
                              }
                              className="accent-primary"
                            />
                            <span className="truncate">{maqam.name}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}

                {draftStep === 2 && (
                  <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
                    <legend className="sr-only">Practice methods</legend>
                    {methodChoices.map((method) => {
                      const compatible = isMethodCompatible(
                        method,
                        draft.jinsIds,
                        draft.maqamIds
                      )
                      return (
                        <label
                          key={method}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 ${
                            compatible ? "hover:bg-muted/50" : "opacity-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={draft.methods.includes(method)}
                            disabled={!compatible}
                            onChange={(event) =>
                              setDraftMethod(method, event.target.checked)
                            }
                            className="mt-1 accent-primary"
                          />
                          <span className="flex flex-col gap-1">
                            <span className="font-medium">
                              {METHOD_DETAILS[method].title}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {METHOD_DETAILS[method].description}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                    <p className="text-sm text-muted-foreground sm:col-span-2">
                      Selected: {draft.jinsIds.length} ajnas,{" "}
                      {draft.maqamIds.length} maqamat, {draft.methods.length}{" "}
                      methods.
                    </p>
                  </fieldset>
                )}
              </QuestionnaireItem>
            </Questionnaire>

            {builderError && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {builderError}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                disabled={draftStep === 0}
                onClick={() => {
                  setBuilderError(null)
                  setDraftStep((step) => Math.max(0, step - 1))
                }}
              >
                <ChevronLeft data-icon="inline-start" />
                Back
              </Button>
              {draftStep < 2 ? (
                <Button onClick={moveDraftForward}>
                  Continue
                  <ChevronRight data-icon="inline-end" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (!availableMethods.length) {
                      setBuilderError(
                        "Select at least one practice method compatible with your targets."
                      )
                      return
                    }
                    saveDraft()
                  }}
                >
                  <Save data-icon="inline-start" />
                  Save boundary
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeBoundary && activeMethod && (
        <Card>
          <CardHeader>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="amber">{METHOD_DETAILS[activeMethod].title}</Badge>
                  <Badge variant="muted">{activeBoundary.name}</Badge>
                </div>
                <CardTitle>
                  {activeMethod === "play-performance"
                    ? "Prepare your instrument"
                    : METHOD_DETAILS[activeMethod].title}
                </CardTitle>
                <CardDescription>
                  {activeMethod === "play-performance"
                    ? "Play the prompted Maqam or Jins. You will have four seconds to get ready, followed by up to 12 seconds to perform."
                    : question?.prompt}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={exitPractice}>
                <X data-icon="inline-start" />
                Exit Practice
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {question && activeMethod !== "play-performance" && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
                  <div>
                    <p className="text-sm font-medium">
                      {question.method === "identify-degree"
                        ? question.prompt
                        : "Listen, then choose an answer."}
                    </p>
                    {question.method === "identify-degree" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tonic first; the second pitch is a higher scale degree.
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void playPitches(question.pitches)}
                  >
                    <RotateCcw data-icon="inline-start" />
                    Replay
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {question.options.map((option) => {
                    const selected = selectedAnswer === option.id
                    const correct =
                      answerChecked && option.id === question.answerId
                    const incorrect =
                      answerChecked &&
                      selected &&
                      option.id !== question.answerId
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={answerChecked}
                        onClick={() => setSelectedAnswer(option.id)}
                        className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors ${
                          correct
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : incorrect
                              ? "border-destructive/50 bg-destructive/10"
                              : selected
                                ? "border-primary bg-primary/10"
                                : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs">
                          {correct ? <Check /> : option.label.match(/^Degree/) ? option.id : ""}
                        </span>
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                {answerChecked && (
                  <p
                    role="status"
                    className={
                      selectedAnswer === question.answerId
                        ? "text-sm font-medium text-emerald-400"
                        : "text-sm font-medium text-destructive"
                    }
                  >
                    {selectedAnswer === question.answerId
                      ? "Correct."
                      : `Not quite. The answer is ${
                          question.method === "identify-degree"
                            ? `degree ${question.answerId}`
                            : question.targetLabel
                        }.`}
                  </p>
                )}
                <div className="flex justify-end">
                  {answerChecked ? (
                    <Button onClick={nextQuestion}>
                      Next question
                      <ChevronRight data-icon="inline-end" />
                    </Button>
                  ) : (
                    <Button
                      disabled={!selectedAnswer}
                      onClick={submitAnswer}
                    >
                      Check answer
                      <Check data-icon="inline-end" />
                    </Button>
                  )}
                </div>
              </>
            )}

            {activeMethod === "play-performance" && performanceTarget && (
              <>
                <div className="rounded-xl border border-border bg-muted/30 p-5">
                  <div className="flex items-start gap-3">
                    <Headphones className="mt-0.5 size-5 text-amber-400" />
                    <div className="flex-1">
                      <p className="font-semibold">
                        Play {performanceTarget.kind} {performanceTarget.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Use your instrument to explore the target. Select Replay
                        for a reference, then start when ready.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => void playPitches(performanceTarget.pitches)}
                    >
                      <RotateCcw data-icon="inline-start" />
                      Replay
                    </Button>
                  </div>
                </div>

                {countdown !== null && (
                  <div
                    role="status"
                    aria-live="assertive"
                    className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-center"
                  >
                    <span className="text-sm text-muted-foreground">
                      Recording starts in
                    </span>
                    <span className="text-5xl font-bold tabular-nums text-amber-300">
                      {countdown}
                    </span>
                  </div>
                )}

                {isRecording && (
                  <div className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="size-2 animate-pulse rounded-full bg-destructive" />
                        Recording · {recordSeconds}s / 12s
                      </span>
                      <Badge variant="rose">Live</Badge>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label="Recording time"
                      aria-valuemin={0}
                      aria-valuemax={12}
                      aria-valuenow={recordSeconds}
                    >
                      <div
                        className="h-full rounded-full bg-destructive transition-all"
                        style={{ width: `${(recordSeconds / 12) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {recordingReport && (
                  <section
                    aria-label="Performance analysis report"
                    className="flex flex-col gap-4 rounded-xl border border-border p-4"
                  >
                    <div>
                      <h3 className="font-semibold">Performance report</h3>
                      <p className="text-sm text-muted-foreground">
                        Analyzed {recordingReport.duration.toFixed(1)} seconds
                        of your recording.
                      </p>
                    </div>
                    {recordingReport.sampleCount > 0 ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">
                              Intonation
                            </p>
                            <p className="mt-1 font-semibold">
                              {rating(recordingReport.intonationPercent)}
                            </p>
                            <p className="text-sm">
                              {recordingReport.intonationPercent}% in tune
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">
                              Boundary notes
                            </p>
                            <p className="mt-1 font-semibold">
                              {rating(recordingReport.boundaryPercent)}
                            </p>
                            <p className="text-sm">
                              {recordingReport.boundaryPercent}% in target
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">
                              Average deviation
                            </p>
                            <p className="mt-1 font-semibold">
                              ±{recordingReport.averageCents}¢
                            </p>
                            <p className="text-sm">from the nearest 24-EDO pitch</p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border p-3 text-sm">
                          <p className="font-medium">Practice advice</p>
                          <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                            {recordingReport.intonationPercent < 80 && (
                              <li>
                                Sustain each note and listen for a steady center
                                before moving on.
                              </li>
                            )}
                            {recordingReport.boundaryPercent < 80 && (
                              <li>
                                Review the target scale and focus on its
                                characteristic quarter-tone steps.
                              </li>
                            )}
                            {recordingReport.intonationPercent >= 80 &&
                              recordingReport.boundaryPercent >= 80 && (
                                <li>
                                  Good control. Try a more varied phrase while
                                  keeping the Maqam&apos;s characteristic notes
                                  clear.
                                </li>
                              )}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Play a few sustained notes and record again to receive
                        skill levels and advice.
                      </p>
                    )}
                  </section>
                )}

                <div className="flex flex-wrap gap-2">
                  {!isRecording && countdown === null && (
                    <Button
                      disabled={isStartingRecording}
                      onClick={() => void startRecording()}
                    >
                      <Mic data-icon="inline-start" />
                      {isStartingRecording
                        ? "Preparing microphone..."
                        : recordingReport
                          ? "Record again"
                          : "Start"}
                    </Button>
                  )}
                  {(isRecording || countdown !== null) && (
                    <Button
                      variant="destructive"
                      onClick={checkRecording}
                    >
                      <Check data-icon="inline-start" />
                      {countdown !== null ? "Cancel countdown" : "Check"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!draft && !activeBoundary && (
        <div className="grid gap-4 md:grid-cols-2">
          {boundaries.map((boundary) => {
            const isPreset = boundary.id.startsWith("preset-")
            const jinsCount = getBoundaryJins(boundary).length
            const maqamCount = getBoundaryMaqamat(boundary).length
            const methods = getPracticeMethods(boundary)
            return (
              <Card key={boundary.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {isPreset && <Badge variant="amber">Built-in</Badge>}
                        <Badge variant="muted">
                          {jinsCount} ajnas · {maqamCount} maqamat
                        </Badge>
                      </div>
                      <CardTitle>{boundary.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {isPreset
                          ? "A preconfigured collection that cannot be changed or deleted."
                          : "Your saved practice boundary."}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {!isPreset && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${boundary.name}`}
                            title="Edit boundary"
                            onClick={() => openBuilder(boundary)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${boundary.name}`}
                            title="Delete boundary"
                            onClick={() => deleteBoundary(boundary)}
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Export ${boundary.name} as JSON`}
                        title="Export JSON"
                        onClick={() => exportBoundary(boundary)}
                      >
                        <Download />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {methods.length ? (
                    <div className="flex flex-wrap gap-2">
                      {methods.map((method) => (
                        <Badge key={method} variant="muted">
                          {METHOD_DETAILS[method].title}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select compatible methods to begin practicing.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {methods.map((method) => (
                      <Button
                        key={method}
                        variant={method === "play-performance" ? "outline" : "default"}
                        size="sm"
                        onClick={() =>
                          method === "play-performance"
                            ? startPerformancePractice(boundary)
                            : startListeningPractice(boundary, method)
                        }
                      >
                        {method === "play-performance" ? (
                          <Mic data-icon="inline-start" />
                        ) : (
                          <Play data-icon="inline-start" />
                        )}
                        {method === "play-performance"
                          ? "Play"
                          : METHOD_DETAILS[method].title}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
