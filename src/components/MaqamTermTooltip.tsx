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
    term: "Root Jins (جنس الأصل)",
    definition: "The first jins in the scale that anchors the maqam's character and defines its family.",
    arabic: "جنس الأصل"
  },
  "ghammaz": {
    term: "Ghammaz (الغمّاز)",
    definition: "The most important secondary emphasis, usually the note most often used as a pivot or modulation point.",
    arabic: "الغمّاز"
  },
  "sayr": {
    term: "Sayr (السير المقامي)",
    definition: "The melodic course or path that characterizes each maqam, determining which notes are emphasized and how modulations occur.",
    arabic: "السير"
  },
  "ascending": {
    term: "Ascending Sayr (سير صاعد)",
    definition: "Melodic movement primarily upward from tonic through ghammaz to upper register. The tonic serves as the starting point with gradual ascent.",
    arabic: "سير صاعد"
  },
  "descending_octave_first": {
    term: "Descending from Octave (سير هابط من الجواب)",
    definition: "Begins at the upper octave then descends through the maqam's ajnas. Common in maqamat that emphasize the upper register.",
    arabic: "سير هابط"
  },
  "undulating": {
    term: "Undulating Sayr (سير متموج)",
    definition: "Melodic movement that rises and falls throughout the range, emphasizing both tonic and ghammaz as pivot points.",
    arabic: "سير متموج"
  },
  "jins": {
    term: "Jins (الجنس)",
    definition: "A melodic framework of 3-5 notes that forms the building block of maqamat. Multiple ajnas combine to create a full maqam.",
    arabic: "الجنس"
  },
  "baggage": {
    term: "Jins Baggage (زخرفة الجنس)",
    definition: "Notes outside the core jins, represented as signed offsets below the root or above the top pitch.",
    arabic: "زخرفة الجنس"
  },
  "network": {
    term: "Maqam Network (شبكة المقام)",
    definition: "Representation of a maqam as a graph of ajnas connected by acceptable melodic pathways with small-world properties.",
    arabic: "شبكة المقام"
  },
  "ajnas": {
    term: "Ajnas (الأجناس)",
    definition: "Plural of jins - the melodic cells that are chained together to form maqamat.",
    arabic: "الأجناس"
  },
  "maqam": {
    term: "Maqam (المقام)",
    definition: "A melodic framework built from chained ajnas, not just a scale. Each maqam has a unique identity defined by its root jins, upper jins, ghammaz, and sayr.",
    arabic: "المقام"
  },
  "family": {
    term: "Maqam Family (عائلة المقام)",
    definition: "Maqamat grouped by shared root jins. MaqamWorld lists the eight families as ‘Ajam, Bayati, Hijaz, Kurd, Nahawand, Nikriz, Rast, and Sikah; Saba is outside a family.",
    arabic: "عائلة المقام"
  },
  "ittisal": {
    term: "Ittisal (اتصال)",
    definition: "A conjunct connection where the lower jins top merges into the upper jins root (shared pivot note).",
    arabic: "اتصال"
  },
  "infisal": {
    term: "Infisal (انفصال)",
    definition: "A disjunct connection with a whole-tone gap (4 quarter-tones / 200 cents) between lower and upper ajnas.",
    arabic: "انفصال"
  },
  "tadakhul": {
    term: "Tadakhul (تداخل)",
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
          <span className="cursor-help border-b border-dotted border-amber-500/50 hover:border-amber-400 hover:text-amber-300 transition-colors inline-flex items-center">
            {children}
            {showIcon && (
              <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500/20 text-[9px] text-amber-400 font-bold">
                ?
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs border-amber-500/30 bg-slate-950/95 text-slate-100 p-3 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 text-xs">{termData.term}</span>
              {termData.arabic && (
                <span className="font-arabic text-xs text-amber-400">{termData.arabic}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{termData.definition}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
