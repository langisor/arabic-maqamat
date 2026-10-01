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
import { BookOpen, Sparkles, Layers, Compass, Info } from "lucide-react"

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
      "A maqam is not just a scale; it is a melodic framework built from chained ajnas (jins).",
      "The root jins defines the family, while the melodic course or sayr is shaped by the movement between ajnas and their pivots.",
      "The root jins is the first jins in the scale and it anchors the maqam's character.",
      "The ghammaz is the most important secondary emphasis, usually the note most often used as a pivot or modulation point.",
      "Traditional maqamat are grouped into families by shared root jins: Rast, Bayati, Hijaz, Nahawand, Kurd, Saba, Ajam, and Sikah."
    ]
  },
  {
    id: "family-system",
    title: "The 8 Maqam Families",
    icon: Layers,
    content: [
      "The classical mnemonic 'صُنِعَ بِسِحْرِك' categorizes modal systems by their root lower Jins.",
      "Each family shares the same root jins but differs in upper ajnas, ghammaz, and sayr patterns.",
      "Understanding the family system helps predict melodic behavior and modulation possibilities."
    ]
  },
  {
    id: "structural-elements",
    title: "Structural Elements",
    icon: Sparkles,
    content: [
      "The common thread across maqamat is that their identity comes from the relationship between the root jins, the upper jins, the ghammaz, and the overall sayr.",
      "Family and mood are carried by the ajnas, not by a single isolated scale formula.",
      "The connection type (Ittisal, Infisal, Tadakhul) determines how ajnas join together."
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
                Classical Arabic modal system fundamentals
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="font-arabic text-[10px]">
            نظريات المقام
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
              <span className="font-semibold">Practical note:</span> The family and mood are carried by the ajnas, not by a single isolated scale formula. Understanding these relationships is key to authentic Arabic music performance.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
