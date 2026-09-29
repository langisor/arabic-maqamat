// src/components/SayrVisualization.tsx
"use client"

import { useId, useMemo, useState, useSyncExternalStore } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Compass,
  RotateCcw,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ArabicPitch } from "@/core/pitch"
import type {
  AlternateJinsBranch,
  Maqam,
  SayrTrajectory,
} from "@/theory/maqam"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type StopRole = "tonic" | "lower-jins" | "ghammaz" | "upper-jins" | "octave"

export interface SayrStop {
  /** Position within the trajectory (0-based). */
  index: number
  role: StopRole
  label: string
  /** Scientific pitch name, e.g. "G4". Only available when `maqam` is passed. */
  pitch?: string
  /** Distance above the tonic in quarter tones (1 qt = 50¢). */
  quarterTones: number
}

export interface SayrVisualizationProps {
  sayrDirection: SayrTrajectory
  maqamName: string
  /**
   * Optional. When provided, the diagram plots the maqam's real pitches
   * (heights are true quarter-tone distances, jins ranges and alternate
   * branches come from the maqam). Without it, a schematic shape is drawn.
   */
  maqam?: Maqam
  /** Fired when a stop is clicked or activated with the keyboard (e.g. to play its pitch). */
  onStopSelect?: (stop: SayrStop) => void
  className?: string
}

interface SayrBranch {
  letter: string
  roleLabel: string
  description: string
  rootQt: number
  topQt: number
}

interface SayrModel {
  qt: Record<StopRole, number>
  pitch: Partial<Record<StopRole, string>>
  lowerBand: readonly [number, number]
  upperBand: readonly [number, number]
  branches: SayrBranch[]
  isSchematic: boolean
}

/* -------------------------------------------------------------------------- */
/*  Static content                                                            */
/* -------------------------------------------------------------------------- */

const ROLES: Record<
  StopRole,
  { label: string; arabic: string; hint: string }
> = {
  tonic: {
    label: "Tonic",
    arabic: "قرار",
    hint: "The home note (qarar). Phrases settle here and the sayr eventually returns to it.",
  },
  "lower-jins": {
    label: "Lower jins",
    arabic: "جنس أسفل",
    hint: "The middle of the lower jins, where the maqam's basic colour is set.",
  },
  ghammaz: {
    label: "Ghammaz",
    arabic: "غمّاز",
    hint: "The secondary pivot. The melody pauses here, and it is the usual doorway to modulation.",
  },
  "upper-jins": {
    label: "Upper jins",
    arabic: "جنس أعلى",
    hint: "The middle of the upper jins. This area is often reshaped by the alternate branches.",
  },
  octave: {
    label: "Octave",
    arabic: "جواب",
    hint: "The octave (jawab), the top of the maqam's working range.",
  },
}

const TRAJECTORIES: Record<
  SayrTrajectory,
  {
    title: string
    description: string
    icon: LucideIcon
    pattern: StopRole[]
  }
> = {
  ascending: {
    title: "Ascending Sayr",
    description:
      "Melodic movement primarily upward from tonic through ghammaz to upper register. The tonic serves as the starting point with gradual ascent to the upper octave.",
    icon: ArrowUp,
    pattern: ["tonic", "lower-jins", "ghammaz", "upper-jins", "octave"],
  },
  descending_octave_first: {
    title: "Descending from Octave",
    description:
      "Begins at the upper octave then descends through the maqam's ajnas. Common in maqamat like Muhayyar that emphasize the upper register before returning to the tonic.",
    icon: ArrowDown,
    pattern: ["octave", "upper-jins", "ghammaz", "lower-jins", "tonic"],
  },
  undulating: {
    title: "Undulating Sayr",
    description:
      "Melodic movement that rises and falls throughout the range, emphasizing both the tonic and ghammaz as pivot points. Creates a more complex, wandering melodic character.",
    icon: ArrowUpDown,
    pattern: [
      "tonic",
      "ghammaz",
      "tonic",
      "upper-jins",
      "ghammaz",
      "lower-jins",
      "tonic",
    ],
  },
}

const BRANCH_ROLE_LABELS: Record<AlternateJinsBranch["role"], string> = {
  upper_alternate: "Upper alternate",
  upper_secondary: "Upper secondary",
  modulation: "Modulation",
  descent_only: "Descent only",
}

/** Used when no `maqam` is passed: a plausible, evenly readable shape. */
const SCHEMATIC_MODEL: SayrModel = {
  qt: { tonic: 0, "lower-jins": 5, ghammaz: 10, "upper-jins": 17, octave: 24 },
  pitch: {},
  lowerBand: [0, 10],
  upperBand: [10, 20],
  branches: [],
  isSchematic: true,
}

/* -------------------------------------------------------------------------- */
/*  Model + geometry helpers                                                  */
/* -------------------------------------------------------------------------- */

// toString() omits the natural sign: "G4", "B♭4", "B𝄳4"
const pitchName = (p: ArabicPitch) => p.toString()
const midPitch = (pitches: ArabicPitch[]) =>
  pitches[Math.floor(pitches.length / 2)]

function buildModel(maqam?: Maqam): SayrModel {
  if (!maqam) return SCHEMATIC_MODEL

  try {
    const tonic = maqam.getTonic()
    const qtOf = (p: ArabicPitch) => tonic.diffQuarterTones(p)

    const octave = tonic.transpose(24)
    const lowerMid = midPitch(maqam.lowerJins.getPitches())
    const upperMid = midPitch(maqam.upperJins.getPitches())
    const ghammaz = maqam.getGhammaz()

    const branches: SayrBranch[] = maqam.alternateUpperAjnas.map((b, i) => ({
      letter: String.fromCharCode(65 + i),
      roleLabel: BRANCH_ROLE_LABELS[b.role],
      description: b.description,
      rootQt: qtOf(b.jins.root),
      topQt: qtOf(b.jins.getTopPitch()),
    }))

    return {
      qt: {
        tonic: 0,
        "lower-jins": qtOf(lowerMid),
        ghammaz: qtOf(ghammaz),
        "upper-jins": qtOf(upperMid),
        octave: 24,
      },
      pitch: {
        tonic: pitchName(tonic),
        "lower-jins": pitchName(lowerMid),
        ghammaz: pitchName(ghammaz),
        "upper-jins": pitchName(upperMid),
        octave: pitchName(octave),
      },
      lowerBand: [0, qtOf(maqam.lowerJins.getTopPitch())],
      upperBand: [
        qtOf(maqam.upperJins.root),
        qtOf(maqam.upperJins.getTopPitch()),
      ],
      branches,
      isSchematic: false,
    }
  } catch {
    // If the pitch API ever changes shape, degrade to the schematic view.
    return SCHEMATIC_MODEL
  }
}

const VIEW_W = 440
const VIEW_H = 240
const PAD_TOP = 20
const PAD_BOTTOM = 20
const PLOT_LEFT = 56
const BRANCH_STEP = 16

const r1 = (n: number) => Math.round(n * 10) / 10

function layout(pattern: StopRole[], model: SayrModel) {
  const branchCount = model.branches.length
  const plotRight = VIEW_W - 20 - (branchCount ? 8 + branchCount * BRANCH_STEP : 0)

  const maxQt = Math.max(24, ...model.branches.map((b) => b.topQt))
  const yOf = (qt: number) =>
    r1(PAD_TOP + (1 - qt / maxQt) * (VIEW_H - PAD_TOP - PAD_BOTTOM))

  const last = Math.max(1, pattern.length - 1)
  const points = pattern.map((role, i) => ({
    role,
    x: r1(PLOT_LEFT + (i / last) * (plotRight - PLOT_LEFT)),
    y: yOf(model.qt[role]),
  }))

  // Smooth S-curves between stops: flat at each stop, never overshoots.
  const d = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = points[i - 1]
      const mx = r1((prev.x + p.x) / 2)
      return `C ${mx} ${prev.y}, ${mx} ${p.y}, ${p.x} ${p.y}`
    })
    .join(" ")

  const band = ([lo, hi]: readonly [number, number]) => ({
    y: yOf(Math.max(lo, hi)),
    height: Math.abs(yOf(Math.min(lo, hi)) - yOf(Math.max(lo, hi))),
  })

  const guides = (["tonic", "ghammaz", "octave"] as const).map((role) => ({
    role,
    y: yOf(model.qt[role]),
    text: model.pitch[role] ?? ROLES[role].label,
  }))

  const branchBars = model.branches.map((b, i) => ({
    ...b,
    x: plotRight + 14 + i * BRANCH_STEP,
    yTop: yOf(b.topQt),
    yBottom: yOf(b.rootQt),
  }))

  return {
    points,
    d,
    plotRight,
    lower: band(model.lowerBand),
    upper: band(model.upperBand),
    guides,
    branchBars,
  }
}

/* -------------------------------------------------------------------------- */
/*  Reduced-motion hook (SSR-safe)                                            */
/* -------------------------------------------------------------------------- */

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function SayrVisualization(props: SayrVisualizationProps) {
  // Re-key so selection and the trace animation reset when the maqam or
  // trajectory changes, without needing an effect.
  return (
    <SayrDiagram
      key={`${props.sayrDirection}:${props.maqam?.id ?? "schematic"}`}
      {...props}
    />
  )
}

function SayrDiagram({
  sayrDirection,
  maqamName,
  maqam,
  onStopSelect,
  className,
}: SayrVisualizationProps) {
  const info = TRAJECTORIES[sayrDirection] ?? TRAJECTORIES.ascending
  const Icon = info.icon

  const model = useMemo(() => buildModel(maqam), [maqam])
  const geo = useMemo(() => layout(info.pattern, model), [info.pattern, model])
  const reducedMotion = usePrefersReducedMotion()

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const pathId = `sayr-path-${uid}`
  const gradientId = `sayr-gradient-${uid}`

  const stops: SayrStop[] = info.pattern.map((role, index) => ({
    index,
    role,
    label: ROLES[role].label,
    pitch: model.pitch[role],
    quarterTones: model.qt[role],
  }))

  const [selected, setSelected] = useState(() =>
    Math.max(0, info.pattern.indexOf("ghammaz"))
  )
  const [run, setRun] = useState(0)

  const activate = (index: number) => {
    setSelected(index)
    onStopSelect?.(stops[index])
  }

  const current = stops[selected]
  const currentRole = ROLES[current.role]
  const isPivot = (role: StopRole) => role === "tonic" || role === "ghammaz"

  return (
    <Card
      className={cn(
        "border-sky-800/30 bg-linear-to-r from-sky-950/40 via-slate-900/90 to-indigo-950/40",
        className
      )}
    >
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20">
              <Compass className="h-5 w-5 text-sky-400" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-xl">
                Sayr <span lang="ar">(سير)</span> Visualization
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Melodic course for {maqamName}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-sky-500/30 text-xs text-sky-400"
          >
            <Icon className="mr-1 h-3 w-3" aria-hidden />
            {info.title}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {/* Path diagram */}
        <div>
          <div className="relative rounded-xl border border-slate-800 bg-slate-950/60 p-2 sm:p-3">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              role="group"
              aria-label={`${info.title} path for ${maqamName}, ${info.pattern.length} stops`}
              className="block h-auto w-full"
            >
              <defs>
                <linearGradient
                  id={gradientId}
                  gradientUnits="userSpaceOnUse"
                  x1={PLOT_LEFT}
                  y1="0"
                  x2={geo.plotRight}
                  y2="0"
                >
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
                  <stop offset="55%" stopColor="#a78bfa" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.55" />
                </linearGradient>
              </defs>

              {/* Jins ranges */}
              <rect
                x={PLOT_LEFT}
                width={geo.plotRight - PLOT_LEFT}
                y={geo.lower.y}
                height={geo.lower.height}
                rx={6}
                className="fill-sky-400/10"
              />
              <rect
                x={PLOT_LEFT}
                width={geo.plotRight - PLOT_LEFT}
                y={geo.upper.y}
                height={geo.upper.height}
                rx={6}
                className="fill-violet-400/10"
              />

              {/* Pitch guides */}
              {geo.guides.map((g) => (
                <g key={g.role}>
                  <line
                    x1={PLOT_LEFT - 4}
                    x2={geo.plotRight}
                    y1={g.y}
                    y2={g.y}
                    strokeDasharray="3 4"
                    className="stroke-slate-700"
                  />
                  <text
                    x={PLOT_LEFT - 10}
                    y={g.y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-slate-400 text-xs"
                  >
                    {g.text}
                  </text>
                </g>
              ))}

              {/* Alternate upper ajnas: vertical range bars in the right margin */}
              {geo.branchBars.map((b) => (
                <g key={b.letter}>
                  <title>{`${b.roleLabel}: ${b.description}`}</title>
                  <rect
                    x={b.x - 2}
                    y={b.yTop}
                    width={4}
                    height={Math.max(4, b.yBottom - b.yTop)}
                    rx={2}
                    className="fill-violet-400/70"
                  />
                  <text
                    x={b.x}
                    y={b.yTop - 6}
                    textAnchor="middle"
                    className="fill-violet-300 text-xs"
                  >
                    {b.letter}
                  </text>
                </g>
              ))}

              {/* Melodic path (drawn once on mount; replay with the button) */}
              <g key={run}>
                <path
                  id={pathId}
                  d={geo.d}
                  pathLength={1}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={reducedMotion ? undefined : 1}
                  strokeDashoffset={reducedMotion ? undefined : 1}
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="1"
                      to="0"
                      dur="1.6s"
                      fill="freeze"
                    />
                  )}
                </path>

                {!reducedMotion && (
                  <circle r={4} className="pointer-events-none fill-white">
                    <animateMotion
                      dur="1.6s"
                      fill="freeze"
                      calcMode="linear"
                      rotate="0"
                    >
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                    <set attributeName="opacity" to="0" begin="1.6s" fill="freeze" />
                  </circle>
                )}
              </g>

              {/* Stops */}
              {geo.points.map((p, i) => {
                const pivot = isPivot(p.role)
                const isSelected = i === selected
                const pitch = model.pitch[p.role]
                return (
                  <g
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${ROLES[p.role].label}${pitch ? `, ${pitch}` : ""}, stop ${i + 1} of ${stops.length}`}
                    className="cursor-pointer outline-none"
                    onClick={() => activate(i)}
                    onFocus={() => setSelected(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        activate(i)
                      }
                    }}
                  >
                    {/* Larger invisible hit area for touch */}
                    <circle cx={p.x} cy={p.y} r={18} fill="transparent" />
                    {isSelected && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={pivot ? 13 : 11}
                        fill="none"
                        strokeWidth={2}
                        className={pivot ? "stroke-amber-300" : "stroke-sky-300"}
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={pivot ? 7 : 5}
                      className={pivot ? "fill-amber-400" : "fill-sky-400"}
                    />
                  </g>
                )
              })}
            </svg>

            {!reducedMotion && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 size-8 text-slate-400 hover:text-sky-300"
                onClick={() => setRun((n) => n + 1)}
                aria-label="Trace the path again"
                title="Trace the path again"
              >
                <RotateCcw className="size-4" aria-hidden />
              </Button>
            )}
          </div>

          {/* Legend */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 px-1 pt-2 text-xs text-slate-400">
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-400" aria-hidden />
              Pivot (tonic, ghammaz)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-400" aria-hidden />
              Passing point
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-sky-400/25" aria-hidden />
              Lower jins
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-violet-400/25" aria-hidden />
              Upper jins
            </li>
            {model.branches.length > 0 && (
              <li className="flex items-center gap-1.5">
                <span className="h-3 w-1 rounded-full bg-violet-400/70" aria-hidden />
                Alternate upper jins
              </li>
            )}
            {model.isSchematic && (
              <li className="text-slate-500">Schematic shape</li>
            )}
          </ul>
        </div>

        {/* Stop sequence */}
        <ol
          className="flex flex-wrap gap-1.5"
          aria-label="Sayr stops in order"
        >
          {stops.map((s, i) => {
            const pivot = isPivot(s.role)
            const isSelected = i === selected
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => activate(i)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
                    isSelected
                      ? pivot
                        ? "border-amber-400 bg-amber-400 text-slate-950"
                        : "border-sky-400/60 bg-sky-400/15 text-sky-100"
                      : pivot
                        ? "border-amber-500/40 text-amber-300 hover:border-amber-400"
                        : "border-slate-700 text-slate-300 hover:border-slate-500"
                  )}
                >
                  <span className="tabular-nums opacity-60">{i + 1}</span>
                  {s.label}
                </button>
              </li>
            )
          })}
        </ol>

        {/* Selected stop + trajectory description */}
        <div
          aria-live="polite"
          className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="text-sm font-semibold text-sky-200">
              {currentRole.label}
            </h4>
            <span lang="ar" dir="rtl" className="text-sm text-sky-300/80">
              {currentRole.arabic}
            </span>
            {current.pitch && (
              <span className="text-sm font-medium tabular-nums text-amber-300">
                {current.pitch}
              </span>
            )}
            <span className="text-xs text-slate-400">
              {current.quarterTones === 0
                ? "Home pitch"
                : `${current.quarterTones * 50}¢ above the tonic`}
            </span>
          </div>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-slate-300">
            {currentRole.hint}
          </p>
          <p className="mt-3 max-w-prose border-t border-sky-500/10 pt-3 text-xs leading-relaxed text-slate-400">
            {info.description}
          </p>
        </div>

        {/* Alternate branches */}
        {model.branches.length > 0 && (
          <ul className="space-y-2">
            {model.branches.map((b) => (
              <li key={b.letter} className="flex items-start gap-3 text-xs">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-violet-400/20 font-medium text-violet-200">
                  {b.letter}
                </span>
                <p className="max-w-prose leading-relaxed text-slate-300">
                  <span className="font-medium text-violet-200">
                    {b.roleLabel}.
                  </span>{" "}
                  {b.description}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="max-w-prose text-xs leading-relaxed text-amber-200/80">
          The sayr decides which notes are stressed, where the melody can pivot
          or modulate, and what gives each maqam its character beyond its
          scale.
        </p>
      </CardContent>
    </Card>
  )
}