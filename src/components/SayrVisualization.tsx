// src/components/SayrVisualization.tsx
import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Compass, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp } from "lucide-react"
import type { SayrTrajectory } from "../theory/maqam"

interface SayrVisualizationProps {
  sayrDirection: SayrTrajectory
  maqamName: string
  className?: string
}

const sayrDescriptions: Record<SayrTrajectory, { title: string; description: string; icon: React.ComponentType<{ className?: string }>; pattern: string[] }> = {
  ascending: {
    title: "Ascending Sayr",
    description: "Melodic movement primarily upward from tonic through ghammaz to upper register. The tonic serves as the starting point with gradual ascent to the upper octave.",
    icon: ArrowUp,
    pattern: ["tonic", "lower-jins", "ghammaz", "upper-jins", "octave"]
  },
  descending_octave_first: {
    title: "Descending from Octave",
    description: "Begins at the upper octave then descends through the maqam's ajnas. Common in maqamat like Muhayyar that emphasize the upper register before returning to the tonic.",
    icon: ArrowDown,
    pattern: ["octave", "upper-jins", "ghammaz", "lower-jins", "tonic"]
  },
  undulating: {
    title: "Undulating Sayr",
    description: "Melodic movement that rises and falls throughout the range, emphasizing both the tonic and ghammaz as pivot points. Creates a more complex, wandering melodic character.",
    icon: ArrowUpDown,
    pattern: ["tonic", "ghammaz", "tonic", "upper-jins", "ghammaz", "lower-jins", "tonic"]
  }
}

export const SayrVisualization: React.FC<SayrVisualizationProps> = ({ 
  sayrDirection, 
  maqamName,
  className = "" 
}) => {
  const sayrInfo = sayrDescriptions[sayrDirection] || sayrDescriptions.ascending
  const Icon = sayrInfo.icon

  const getPosition = (index: number, total: number) => {
    const percentage = (index / (total - 1)) * 100
    return percentage
  }

  const getHeight = (index: number, total: number) => {
    const baseHeight = 20
    const variation = 60
    if (sayrDirection === "ascending") {
      return baseHeight + (index / (total - 1)) * variation
    } else if (sayrDirection === "descending_octave_first") {
      return baseHeight + ((total - 1 - index) / (total - 1)) * variation
    } else {
      // undulating pattern
      const positions = [20, 70, 30, 80, 50, 40, 20]
      return positions[index] || 50
    }
  }

  return (
    <Card className={`border-sky-800/30 bg-linear-to-r from-sky-950/40 via-slate-900/90 to-indigo-950/40 ${className}`}>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20">
              <Compass className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Sayr (سير) Visualization</CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Melodic course for {maqamName}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-500/30">
            <Icon className="h-3 w-3 mr-1" />
            {sayrInfo.title}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Visual Path Diagram */}
        <div className="relative h-32 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          {/* Background grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full" style={{
              backgroundImage: `
                linear-gradient(to right, #64748b 1px, transparent 1px),
                linear-gradient(to bottom, #64748b 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          </div>

          {/* Melodic Path */}
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            
            {/* Path line */}
            <path
              d={sayrInfo.pattern.map((_, index) => {
                const x = getPosition(index, sayrInfo.pattern.length)
                const y = 100 - getHeight(index, sayrInfo.pattern.length)
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`
              }).join(' ')}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />

            {/* Points */}
            {sayrInfo.pattern.map((point, index) => {
              const x = getPosition(index, sayrInfo.pattern.length)
              const y = 100 - getHeight(index, sayrInfo.pattern.length)
              const isPivot = point === "ghammaz" || point === "tonic"
              
              return (
                <g key={index}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={isPivot ? 6 : 4}
                    fill={isPivot ? "#f59e0b" : "#0ea5e9"}
                    className={isPivot ? "animate-pulse" : ""}
                  />
                  {isPivot && (
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r={10}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      className="animate-ping"
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Labels */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-slate-400">
            <span>Tonic (قرار)</span>
            <span>Ghammaz (غمّاز)</span>
            <span>Upper Register</span>
          </div>
        </div>

        {/* Educational Description */}
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/20">
              <TrendingUp className="h-4 w-4 text-sky-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-sky-300">
                {sayrInfo.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {sayrInfo.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {sayrInfo.pattern.map((point, index) => {
                  const isPivot = point === "ghammaz" || point === "tonic"
                  return (
                    <Badge 
                      key={index} 
                      variant={isPivot ? "default" : "outline"}
                      className={`text-[9px] ${isPivot ? "bg-amber-500 text-slate-950 border-amber-500" : "border-slate-700 text-slate-400"}`}
                    >
                      {point.replace(/-/g, ' ')}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Key Insight */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            <span className="font-semibold">Key Insight:</span> The sayr determines which notes are emphasized, which pitches serve as pivots for modulation, and how the melodic character of each maqam is uniquely shaped beyond its scale structure.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
