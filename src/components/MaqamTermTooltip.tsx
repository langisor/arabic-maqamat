// src/components/MaqamTermTooltip.tsx
import React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"

interface MaqamTerm {
  term: string
  definition: string
  arabic?: string
}

const maqamTerms: Record<string, MaqamTerm> = {
  "root jins": {
    term: "Root Jins",
    definition: "The first jins in the scale that anchors the maqam's character and defines its family.",
    arabic: "جنس الأصل"
  },
  "ghammaz": {
    term: "Ghammaz",
    definition: "The most important secondary emphasis, usually the note most often used as a pivot or modulation point.",
    arabic: "غمّاز"
  },
  "sayr": {
    term: "Sayr",
    definition: "The melodic course or path that characterizes each maqam, determining which notes are emphasized and how modulations occur.",
    arabic: "سير"
  },
  "ascending": {
    term: "Ascending Sayr",
    definition: "Melodic movement primarily upward from tonic through ghammaz to upper register. The tonic serves as the starting point with gradual ascent.",
    arabic: "سير تصاعدي"
  },
  "descending_octave_first": {
    term: "Descending from Octave",
    definition: "Begins at the upper octave then descends through the maqam's ajnas. Common in maqamat that emphasize the upper register.",
    arabic: "سير تنازلي من الأوكتاف"
  },
  "undulating": {
    term: "Undulating Sayr",
    definition: "Melodic movement that rises and falls throughout the range, emphasizing both tonic and ghammaz as pivot points.",
    arabic: "سير متماوج"
  },
  "jins": {
    term: "Jins",
    definition: "A melodic framework of 3-5 notes that forms the building block of maqamat. Multiple ajnas combine to create a full maqam.",
    arabic: "جنس"
  },
  "ajnas": {
    term: "Ajnas",
    definition: "Plural of jins - the melodic cells that are chained together to form maqamat.",
    arabic: "أجناس"
  },
  "maqam": {
    term: "Maqam",
    definition: "A melodic framework built from chained ajnas, not just a scale. Each maqam has a unique identity defined by its root jins, upper jins, ghammaz, and sayr.",
    arabic: "مقام"
  },
  "family": {
    term: "Maqam Family",
    definition: "Maqamat grouped by shared root jins. The 8 families are: Rast, Bayati, Hijaz, Nahawand, Kurd, Saba, Ajam, and Sikah.",
    arabic: "عائلة المقام"
  },
  "ittisal": {
    term: "Ittisal",
    definition: "A conjunct connection where the lower jins top merges into the upper jins root (shared pivot note).",
    arabic: "اتصال"
  },
  "infisal": {
    term: "Infisal",
    definition: "A disjunct connection with a whole-tone gap (4 quarter-tones / 200 cents) between lower and upper ajnas.",
    arabic: "انفصال"
  },
  "tadakhul": {
    term: "Tadakhul",
    definition: "An overlapping or interlocking cell structure where ajnas share notes in complex ways.",
    arabic: "تداخل"
  }
}

interface MaqamTermTooltipProps {
  term: string
  children: React.ReactNode
  showIcon?: boolean
}

export const MaqamTermTooltip: React.FC<MaqamTermTooltipProps> = ({ 
  term, 
  children, 
  showIcon = true 
}) => {
  const termKey = term.toLowerCase()
  const termData = maqamTerms[termKey]

  if (!termData) {
    return <>{children}</>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="cursor-help border-b border-dotted border-amber-500/50 hover:border-amber-400 hover:text-amber-300 transition-colors">
            {children}
            {showIcon && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] text-amber-400">
                ?
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs border-amber-500/30 bg-slate-950/95">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">{termData.term}</span>
              {termData.arabic && (
                <span className="font-arabic text-sm text-slate-300">{termData.arabic}</span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{termData.definition}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
