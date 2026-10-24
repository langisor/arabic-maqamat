// src/components/MaqamFacts.tsx
import React, { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card"
import { Badge } from "./ui/badge"
import { BookOpen, Sparkles, Layers, Compass, Info, Network, Package } from "lucide-react"

interface FactSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  content: string[]
  highlighted?: boolean
}

const maqamFacts: FactSection[] = [
  {
    id: "core-concepts",
    title: "Core Maqam Concepts",
    icon: BookOpen,
    highlighted: true,
    content: [
      "A maqam is not just a scale; it is an interconnected melodic framework built from chained ajnas (jins).",
      "The root jins defines the family, while the melodic course or sayr is shaped by the movement between ajnas and their pivots.",
      "The root jins is the first jins in the scale and it anchors the maqam's character.",
      "The ghammaz is the most important secondary emphasis, usually the note most often used as a pivot or modulation point.",
      "MaqamWorld groups maqamat into eight families by shared root jins: ‘Ajam, Bayati, Hijaz, Kurd, Nahawand, Nikriz, Rast, and Sikah. Saba is listed among maqamat outside a family."
    ]
  },
  {
    id: "jins-baggage",
    title: "Jins Baggage (زخرفة الجنس)",
    icon: Package,
    highlighted: true,
    content: [
      "Jins baggage represents notes outside a jins's core pitches using signed quarter-tone offsets.",
      "Negative offsets are anchored below the root; positive offsets are anchored above the top pitch.",
      "The model displays these notes alongside the core jins so their pitch and register can be compared.",
      "Baggage notes can inform melodic approaches and cadential motion."
    ]
  },
  {
    id: "network-theory",
    title: "Network View of Maqam & Small-World Graphs",
    icon: Network,
    content: [
      "Maqamat are graphs/networks of ajnas with directed edges representing permissible pathways.",
      "Hubs cluster around the tonic (Qarar) and dominant (Ghammaz) with high clustering coefficients and short path lengths.",
      "Instead of smooth continuous modulation, classical maqam performance navigates discrete, structurally grounded nodes.",
      "Understanding the network reveals why certain modulations sound effortless and inevitable while others create stark surprise."
    ]
  },
  {
    id: "family-system",
    title: "The 8 Maqam Families",
    icon: Layers,
    content: [
      "Families are based on sharing the same first (root) jins, which has the largest role in defining a maqam's character.",
      "Branch maqamat in a family use different upper ajnas while sharing the family root jins.",
      "Maqamat that do not share their root jins with others, including Saba, are not part of a family."
    ]
  },
  {
    id: "modulation-tiers",
    title: "Three Categories of Modulation",
    icon: Sparkles,
    content: [
      "Category 1 (Ornamental): Brief passing accidentals within a single jins that do not establish a new tonic center.",
      "Category 2 (Internal): Typical jins-to-jins modulations within the established network of the maqam (not a true maqam change).",
      "Category 3 (Full Maqam): Structural modulation that destabilizes the root jins and firmly shifts the tonal foundation to a new maqam."
    ]
  },
  {
    id: "melodic-movement",
    title: "Melodic Movement (Sayr)",
    icon: Compass,
    content: [
      "Sayr refers to the melodic course or path that characterizes each maqam.",
      "Different maqamat have characteristic sayr patterns: ascending, descending, or undulating.",
      "The sayr determines which notes are emphasized, which pitches are used as pivots, and how modulations occur."
    ]
  }
]

interface MaqamFactsProps {
  className?: string
}

export const MaqamFacts: React.FC<MaqamFactsProps> = ({ className = "" }) => {
  const [expandedSection, setExpandedSection] = useState<string[]>([])

  return (
    <Card className={`border-amber-800/30 bg-linear-to-r from-amber-950/40 via-slate-900/90 to-indigo-950/40 ${className}`}>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Info className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Maqam Facts</CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Classical Arabic modal system fundamentals &amp; Abu Shumays Primer insights
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="font-arabic text-[10px]">
            حقائق المقامات
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Accordion value={expandedSection} onValueChange={(val) => setExpandedSection(val)}>
          {maqamFacts.map((section) => {
            const Icon = section.icon
            return (
              <AccordionItem key={section.id} value={section.id} className="border-b border-border/40">
                <AccordionTrigger className="hover:text-amber-300">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${section.highlighted ? "text-amber-400" : "text-slate-400"}`} />
                    <span className="font-semibold">{section.title}</span>
                    {section.highlighted && (
                      <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">
                        Essential
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <ul className="space-y-2 text-sm text-slate-300">
                    {section.content.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                        <span className="leading-relaxed">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-semibold">Practical note:</span> The family and mood are carried by the ajnas and their baggage notes, not by an isolated scale formula. Navigating the network graph reveals authentic pathways between modal regions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
