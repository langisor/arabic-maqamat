// src/components/MaqamNetworkGraph.tsx
import React, { useState, useMemo } from "react"
import { Maqam, ModulationNode, NetworkPathway } from "../theory/maqam"
import { formatPitchWithLargeAccidentalReact } from "../core/pitch-styling"
import { AjnasLibrary, Jins } from "../theory/jins"
import { MicrotonalAudioEngine, TimbreType } from "../audio/microtonal-audio"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  Network,
  GitFork,
  Volume2,
  Info,
  Play,
  ArrowRight,
  Package,
} from "lucide-react"

interface MaqamNetworkGraphProps {
  maqam: Maqam
  timbre?: TimbreType
  onSelectNode?: (node: ModulationNode) => void
  className?: string
}

export const MaqamNetworkGraph: React.FC<MaqamNetworkGraphProps> = ({
  maqam,
  timbre = "violin",
  onSelectNode,
  className = "",
}) => {
  const [selectedNodeDegree, setSelectedNodeDegree] = useState<number>(1)
  const [frequencyFilter, setFrequencyFilter] = useState<
    "all" | "common" | "uncommon" | "rare"
  >("all")
  const [, setActivePlayingId] = useState<string | null>(null)

  const network = maqam.network

  // Filtered nodes based on frequency
  const filteredNodes = useMemo(() => {
    if (!network) return []
    if (frequencyFilter === "all") return network.nodes
    return network.nodes.filter((n) => n.frequency === frequencyFilter)
  }, [network, frequencyFilter])

  // Active selected node
  const activeNode = useMemo(() => {
    if (filteredNodes.length === 0) return null
    return (
      filteredNodes.find((n) => n.scaleDegree === selectedNodeDegree) ||
      filteredNodes[0]
    )
  }, [filteredNodes, selectedNodeDegree])

  // Outgoing and incoming pathways for active node
  const nodePathways = useMemo(() => {
    if (!network || !activeNode) return { outgoing: [], incoming: [] }
    const outgoing = network.pathways.filter(
      (p) => p.fromDegree === activeNode.scaleDegree
    )
    const incoming = network.pathways.filter(
      (p) => p.toDegree === activeNode.scaleDegree
    )
    return { outgoing, incoming }
  }, [network, activeNode])

  // Resolve jins definition and baggage notes for active node
  const activeJinsDef = useMemo(() => {
    if (!activeNode) return null
    return AjnasLibrary.findById(activeNode.jinsId) || null
  }, [activeNode])

  const activeJins = useMemo(
    () => activeNode && activeJinsDef
      ? new Jins(activeJinsDef, activeNode.root)
      : null,
    [activeNode, activeJinsDef]
  )

  const baggageNotes = useMemo(
    () => activeJins?.getBaggageNotes() ?? [],
    [activeJins]
  )

  // Audio Playback
  const handlePlayNodeJins = (
    node: ModulationNode,
    includeBaggage: boolean = false
  ) => {
    const def = AjnasLibrary.findById(node.jinsId)
    if (!def) {
      MicrotonalAudioEngine.playPitch(node.root, 1.0, timbre)
      return
    }
    const root = node.root
    const jins = new Jins(def, root)
    const pitches = includeBaggage
      ? jins.getPitchesWithBaggage()
      : jins.getPitches()

    setActivePlayingId(`${node.jinsId}-${node.scaleDegree}`)
    MicrotonalAudioEngine.playSequence(
      pitches,
      400,
      timbre,
      undefined,
      () => setActivePlayingId(null),
      undefined,
      "network-jins-preview"
    )
  }

  const handlePlayPathway = (path: NetworkPathway) => {
    if (!network) return
    const fromNode = network.nodes.find(
      (n) => n.scaleDegree === path.fromDegree
    )
    const toNode = network.nodes.find((n) => n.scaleDegree === path.toDegree)
    if (!fromNode || !toNode) return

    const pitches = [fromNode.root, toNode.root]
    setActivePlayingId(`pathway-${path.fromDegree}-${path.toDegree}`)
    MicrotonalAudioEngine.playSequence(
      pitches,
      600,
      timbre,
      undefined,
      () => setActivePlayingId(null),
      undefined,
      "network-pathway-preview"
    )
  }

  // SVG Layout dimensions
  const SVG_WIDTH = 760
  const SVG_HEIGHT = 380
  const CENTER_X = SVG_WIDTH / 2
  const CENTER_Y = SVG_HEIGHT / 2
  const RADIUS_X = 280
  const RADIUS_Y = 135

  // Node positions mapped in an ellipse or hub-and-spoke layout
  const nodePositions = useMemo(() => {
    if (filteredNodes.length === 0) return new Map()
    const map = new Map<
      number,
      { x: number; y: number; node: ModulationNode }
    >()
    const total = filteredNodes.length

    // Sort nodes by scale degree
    const sorted = [...filteredNodes].sort(
      (a, b) => a.scaleDegree - b.scaleDegree
    )

    sorted.forEach((node, idx) => {
      // Scale degree 1 at bottom-center or left
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
      const x = CENTER_X + RADIUS_X * Math.cos(angle)
      const y = CENTER_Y + RADIUS_Y * Math.sin(angle)
      map.set(node.scaleDegree, { x, y, node })
    })
    return map
  }, [filteredNodes, CENTER_X, CENTER_Y])

  if (!network || network.nodes.length === 0) {
    return (
      <Card className={`border-slate-800 bg-slate-900 ${className}`}>
        <CardContent className="p-8 text-center text-slate-400">
          <Network className="mx-auto mb-2 h-10 w-10 text-slate-600" />
          <p className="font-semibold text-white">
            Network topology not yet defined for {maqam.name}.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Networks based on Sami Abu Shumays' "Maqam Analysis: A Primer" are
            available for Maqam Rast, Bayati, Hijaz, Nahawand, Sikah, and Saba.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`overflow-hidden border-slate-800 bg-slate-900/90 shadow-xl ${className}`}
    >
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
                Maqam as Graph &amp; Small-World Network
              </span>
              <Badge
                variant="secondary"
                className="border-amber-500/30 bg-amber-500/10 font-mono text-[10px] text-amber-300"
              >
                Abu Shumays Model
              </Badge>
            </div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
              <Network className="h-5 w-5 text-amber-400" />
              <span>{maqam.name} Ajnas Network Graph</span>
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-slate-300">
              Visualizes the maqam not as a static linear scale, but as an
              interconnected network of ajnas with directed pathways, baggage
              notes, and modular pivot hubs.
            </CardDescription>
          </div>

          {/* Frequency Filter Pills */}
          <div className="flex items-center gap-1.5 self-start rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs sm:self-auto">
            <span className="px-2 text-[11px] font-medium text-slate-400">
              Filter:
            </span>
            {(["all", "common", "uncommon", "rare"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequencyFilter(f)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                  frequencyFilter === f
                    ? "bg-amber-500 font-bold text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Network Diagram Viewport */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-inner">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="h-auto max-h-95 w-full select-none"
          >
            <defs>
              {/* Arrowhead markers */}
              <marker
                id="arrow-common"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker
                id="arrow-uncommon"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
              <marker
                id="arrow-rare"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
              </marker>

              {/* Radial glow for selected node */}
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background ambient network lines */}
            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={RADIUS_Y}
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <ellipse
              cx={CENTER_X}
              cy={CENTER_Y}
              rx={RADIUS_X}
              ry={RADIUS_Y}
              fill="none"
              stroke="rgba(245,158,11,0.05)"
              strokeWidth="1.5"
            />

            {/* Pathways / Edges */}
            {network.pathways.map((path, idx) => {
              const fromPos = nodePositions.get(path.fromDegree)
              const toPos = nodePositions.get(path.toDegree)
              if (!fromPos || !toPos) return null

              const isPathActive =
                activeNode &&
                (activeNode.scaleDegree === path.fromDegree ||
                  activeNode.scaleDegree === path.toDegree)

              const strokeColor =
                path.frequency === "common"
                  ? "#10b981"
                  : path.frequency === "uncommon"
                    ? "#38bdf8"
                    : "#f59e0b"

              const strokeWidth = isPathActive ? 2.5 : 1.2
              const opacity = isPathActive ? 0.9 : 0.35
              const marker = `url(#arrow-${path.frequency})`

              return (
                <g key={`path-${idx}`}>
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={opacity}
                    strokeDasharray={
                      path.technique === "Infisal" ? "5 3" : "none"
                    }
                    markerEnd={marker}
                    className="transition-all duration-200"
                  />
                </g>
              )
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const pos = nodePositions.get(node.scaleDegree)
              if (!pos) return null

              const isSelected = activeNode?.scaleDegree === node.scaleDegree
              const isRoot = node.scaleDegree === 1
              const isGhammaz = node.root.equals(maqam.getGhammaz())
              return (
                <g
                  key={`node-${node.jinsId}-${node.scaleDegree}`}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => {
                    setSelectedNodeDegree(node.scaleDegree)
                    onSelectNode?.(node)
                  }}
                  className="group cursor-pointer"
                >
                  {/* Glow circle for active/selected */}
                  {isSelected && (
                    <circle
                      r="36"
                      fill="url(#nodeGlow)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Outer circle */}
                  <circle
                    r={isSelected ? 26 : 22}
                    fill={
                      isSelected
                        ? "#f59e0b"
                        : isRoot
                          ? "#059669"
                          : isGhammaz
                            ? "#0284c7"
                            : "#1e293b"
                    }
                    stroke={
                      isSelected
                        ? "#fef08a"
                        : isRoot
                          ? "#34d399"
                          : isGhammaz
                            ? "#38bdf8"
                            : "#475569"
                    }
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-200 group-hover:scale-110"
                  />

                  {/* Scale Degree Number */}
                  <text
                    x="0"
                    y="-9"
                    textAnchor="middle"
                    fill={
                      isSelected || isRoot || isGhammaz ? "#0f172a" : "#f8fafc"
                    }
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Deg {node.scaleDegree}
                  </text>

                  {/* Note Name */}
                  <text
                    x="0"
                    y="6"
                    textAnchor="middle"
                    fill={
                      isSelected || isRoot || isGhammaz ? "#0f172a" : "#cbd5e1"
                    }
                    fontSize="9"
                    fontWeight="black"
                    fontFamily="monospace"
                  >
                    {node.root.toScientificString()}
                  </text>

                  {/* Label under node */}
                  <text
                    x="0"
                    y={isSelected ? 44 : 40}
                    textAnchor="middle"
                    fill={isSelected ? "#f59e0b" : "#94a3b8"}
                    fontSize="9"
                    fontWeight="semibold"
                    className="select-none"
                  >
                    {node.jinsName}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Graph Legend Overlay */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-4 gap-y-1 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 text-[11px] text-slate-300 backdrop-blur-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Degree 1 (Root Qarar)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              <span>Ghammaz Pivot Hub</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Selected Node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 bg-emerald-500" />
              <span>Common Pathway</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-t border-dashed bg-sky-400" />
              <span>Infisal (Disjunct)</span>
            </div>
          </div>
        </div>

        {/* Selected Node Deep-Dive Inspector */}
        {activeNode && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 1. Node Info & Jins Details */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                    Node Focus (Degree {activeNode.scaleDegree})
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      activeNode.frequency === "common"
                        ? "border-emerald-500/50 text-emerald-300"
                        : activeNode.frequency === "uncommon"
                          ? "border-sky-500/50 text-sky-300"
                          : "border-amber-500/50 text-amber-300"
                    }`}
                  >
                    {activeNode.frequency}
                  </Badge>
                </div>
                <h4 className="mt-1 text-lg font-bold text-white">
                  {activeNode.jinsName} ({activeNode.arabicName})
                </h4>
                <div className="mt-1 font-mono text-xs text-slate-300">
                  Root Pitch:{" "}
                  <strong className="text-amber-300">
                    {formatPitchWithLargeAccidentalReact(activeNode.root, {
                      size: "large",
                    })}
                  </strong>{" "}
                  ({activeNode.root.toFrequency().toFixed(1)} Hz)
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {activeNode.roleDescription || activeJinsDef?.description}
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex items-center gap-2 border-t border-slate-900 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlayNodeJins(activeNode, false)}
                  className="flex-1 cursor-pointer gap-1.5 text-xs"
                >
                  <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Play Jins</span>
                </Button>
                {baggageNotes.length > 0 && (
                  <Button
                    variant="amber"
                    size="sm"
                    onClick={() => handlePlayNodeJins(activeNode, true)}
                    className="flex-1 cursor-pointer gap-1.5 text-xs font-bold"
                  >
                    <Package className="h-3.5 w-3.5" />
                    <span>+ Baggage</span>
                  </Button>
                )}
              </div>
            </div>

            {/* 2. Jins Baggage Notes (أمتعة الجنس) */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-purple-400 uppercase">
                    <Package className="h-3.5 w-3.5 text-purple-400" />
                    <span>Jins Baggage (أمتعة الجنس)</span>
                  </span>
                  <Badge
                    variant="outline"
                    className="border-purple-500/40 text-[10px] text-purple-300"
                  >
                    {baggageNotes.length > 0
                      ? `${baggageNotes.length} Outside Core`
                      : "No Baggage"}
                  </Badge>
                </div>

                {baggageNotes.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs leading-relaxed text-slate-300">
                      {activeJinsDef?.baggageDescription ||
                        "Baggage notes are signed offsets below the root or above the jins top pitch."}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {baggageNotes.map((bp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            MicrotonalAudioEngine.playPitch(bp, 0.8, timbre)
                          }
                          className="flex cursor-pointer items-center gap-1 rounded-lg border border-purple-700/60 bg-purple-950/40 px-2.5 py-1 font-mono text-xs font-bold text-purple-200 transition hover:bg-purple-900/60"
                          title="Click to audition baggage note"
                        >
                          <span>
                            {formatPitchWithLargeAccidentalReact(bp, {
                              size: "large",
                            })}
                          </span>
                          <span className="text-[10px] text-purple-400 opacity-75">
                            {activeNode &&
                            activeJins &&
                            bp.toQuarterToneIndex() > activeJins.getTopPitch().toQuarterToneIndex()
                              ? "↑"
                              : "↓"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-500 italic">
                    This Jins has no baggage intervals defined in this model.
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-slate-900 pt-2 text-[11px] text-slate-500">
                Signed baggage offsets may extend below the root or above the
                top pitch.
              </div>
            </div>

            {/* 3. Permissible Network Connections from this Node */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                    <GitFork className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Pathways ({nodePathways.outgoing.length})</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    From Deg {activeNode.scaleDegree}
                  </span>
                </div>

                <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto pr-1">
                  {nodePathways.outgoing.map((path, idx) => {
                    const toNode = network.nodes.find(
                      (n) => n.scaleDegree === path.toDegree
                    )
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-xs"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono font-bold text-amber-300">
                            Deg {path.toDegree}
                          </span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-slate-500" />
                          <span className="truncate text-slate-300">
                            {toNode?.jinsName || `Deg ${path.toDegree}`}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handlePlayPathway(path)}
                          title="Audition 2-note pathway transition"
                          className="h-6 w-6 cursor-pointer text-emerald-400 hover:text-emerald-300"
                        >
                          <Play className="h-3 w-3 fill-current" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-900 pt-2 text-[11px] text-slate-400">
                <span>Network Hubs: Degrees 1 &amp; 4/5</span>
                <span className="text-amber-400">
                  Click graph nodes to explore
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Small-World Theory Note */}
        {network.clusteringNotes && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-200/90">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="leading-relaxed">
              <strong>Small-World Network Properties:</strong>{" "}
              {network.clusteringNotes} In classical maqam performance, artists
              traverse between these specific nodes rather than wandering across
              a continuous spectrum, ensuring both coherent identity and rich
              expressive freedom.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
