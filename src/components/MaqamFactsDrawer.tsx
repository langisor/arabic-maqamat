// src/components/MaqamFactsDrawer.tsx
import React, { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "./ui/drawer"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  BookOpen,
  Sparkles,
  Layers,
  Compass,
  Volume2,
  X,
  Music,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Network,
  Package,
} from "lucide-react"
import { Maqam, MaqamatCatalogue, type MaqamFamilyMnemonic } from "../theory/maqam"
import { MicrotonalAudioEngine, type TimbreType } from "../audio/microtonal-audio"
import { useLanguage } from "../state/language"

interface FactSection {
  id: string
  title: string
  arabicTitle: string
  icon: React.ComponentType<{ className?: string }>
  content: string[]
  highlighted?: boolean
  sampleMaqamId?: string
}

const MAQAM_FACTS_DATA: FactSection[] = [
  {
    id: "core-concepts",
    title: "Core Maqam Concepts (مفاهيم المقام الأساسية)",
    arabicTitle: "المفاهيم الجوهرية",
    icon: BookOpen,
    highlighted: true,
    sampleMaqamId: "rast",
    content: [
      "A maqam is not merely a static scale; it is an organic melodic framework built from chained ajnas (tetrachords, trichords, and pentachords).",
      "The root jins (جنس الأصل) defines the maqam family, anchoring its emotional ethos and tonal foundation.",
      "The ghammaz (الغمّاز) is the secondary focal note, serving as a melodic pivot and modulation gateway, typically on the 4th, 5th, or 3rd degree.",
      "The sayr (السير) governs the temporal melodic trajectory dictating whether melodies ascend from the tonic, undulate around the ghammaz, or descend from the octave.",
      "Traditional maqamat are classified into 8 primary families by their lower jins using the classical mnemonic: صنع بسحرك."
    ],
  },
  {
    id: "jins-baggage",
    title: "Jins Baggage Concept (أمتعة الجنس - أبو شميس)",
    arabicTitle: "أمتعة الجنس النغمية",
    icon: Package,
    highlighted: true,
    sampleMaqamId: "bayati",
    content: [
      "Jins baggage represents notes outside a jins's core pitches using signed quarter-tone offsets.",
      "Negative offsets are anchored below the root; positive offsets are anchored above the top pitch.",
      "The model displays baggage notes with the core jins so their pitch and register can be compared.",
      "Baggage notes can inform melodic approaches and cadential motion."
    ],
  },
  {
    id: "network-theory",
    title: "Network View & Small-World Properties (شبكة الأجناس)",
    arabicTitle: "التمثيل الشبكي للمقامات",
    icon: Network,
    highlighted: true,
    sampleMaqamId: "rast",
    content: [
      "Maqamat should be understood as graphs of ajnas where nodes are scale degrees and edges are acceptable pathways.",
      "Small-World network topology: High clustering coefficient around key hubs (degrees 1, 4, 5) with short path lengths.",
      "Acceptable pathways indicate how composers move from node to node without destabilizing the modal narrative.",
      "Three modulation categories govern transitions: Category 1 (Ornamental), Category 2 (Internal within network), Category 3 (Full Maqam shift)."
    ],
  },
  {
    id: "family-system",
    title: "The 8 Classical Families (العائلات المقامية الثماني)",
    arabicTitle: "عائلات صنع بسحرك",
    icon: Layers,
    sampleMaqamId: "bayati",
    content: [
      "ص = Saba (صبا): Heart-wrenching microtonal compression with lower 400¢ span.",
      "ن = Nahawand (نهاوند): Natural minor tetrachord (whole-half-whole), elegant and harmonic.",
      "ع = ‘Ajam (عجم): Major pentachord (700¢ span) with celebratory Western affinity.",
      "ب = Bayati (بياتي): Quintessential Arabic sound with neutral second degree (Dukah to Sikah half-flat).",
      "س = Sikah (سيكاه): Meditative trichord rooted directly on neutral quarter-tone 3rd (E𝄳).",
      "ح = Hijaz (حجاز): Dramatic and mystical, featuring the characteristic augmented second (300¢ step).",
      "ر = Rast (راست): Stately, noble 'King of Maqamat' with neutral 3rd and 7th degrees.",
      "ك = Kurd (كرد): Tender Phrygian tetrachord starting with a half-step."
    ],
  },
  {
    id: "structural-connections",
    title: "Jins Connections (الوصل والاتصال بين الأجناس)",
    arabicTitle: "أنواع الوصل النغمي",
    icon: Sparkles,
    sampleMaqamId: "hijaz",
    content: [
      "Ittisal (اتصال / Conjunct): The upper jins begins directly on the highest note of the lower jins (sharing the pivot note). Example: Bayati on D + Nahawand on G.",
      "Infisal (انفصال / Disjunct): The lower and upper ajnas are separated by a whole-tone interval (فاصلة طنينية / Fasila of 4 quarter-tones = 200¢). Example: Rast on C + Rast on G.",
      "Tadakhul (تداخل / Overlapping): The upper jins root overlaps inside the span of the lower jins. Characteristic of Maqam Saba and Sikah variants.",
      "Upper Alternate Ajnas: During performance, masters modulate to alternate upper ajnas (e.g. Bayati shifting from upper Nahawand to upper Rast or Hijaz)."
    ],
  },
  {
    id: "sayr-pathways",
    title: "Melodic Course & Cadences (السير المقامي والقفلات)",
    arabicTitle: "السير والقفلة",
    icon: Compass,
    sampleMaqamId: "saba",
    content: [
      "Ascending Sayr (سير صاعد): Begins near the tonic (qarar), develops through the root jins, climbs through the ghammaz into the upper register, and returns home.",
      "Descending / Octave Sayr (سير هابط): Opens directly at the octave (jawab) or upper jins, exploring high tensions before resolving down to the tonic.",
      "Undulating Sayr (سير متموج): Centers around the ghammaz pivot note from the start, oscillating between lower and upper modal layers.",
      "The Qafla (القفلة): The definitive cadential formula that stamps the maqam's identity before resolving onto the tonic."
    ],
  },
  {
    id: "violin-pedagogy",
    title: "Violin Pedagogy & Tuning (الكمان الشرقي والدوزان)",
    arabicTitle: "أصول عزف الكمان الشرقي",
    icon: Music,
    sampleMaqamId: "rast",
    content: [
      "Arabic Violin Tuning (دوزان عربي): G3 (Yakah) - D4 (Dukah) - G4 (Nawa) - D5 (Muhayyar). The 1st and 2nd strings are tuned down a whole step compared to Western violin (A4→G4, E5→D5), creating rich sympathetic resonance on the open strings.",
      "Western Violin Tuning (دوزان غربي): G3 - D4 - A4 - E5. Standard perfect-5ths tuning used in Western classical tradition and adaptable to Arabic music.",
      "Neutral 2nd & 3rd Finger Placement: On the fretless fingerboard, quarter-tone notes (such as Sikah E𝄳4 or Awj B𝄳4) require placing the finger equidistant between minor and major finger stops.",
      "Position Shifting: In 2nd and 3rd positions, shifts are executed smoothly on the Ghammaz pivot note with subtle expressive vocal slide (zahlaka)."
    ],
  },
]

export interface MaqamFactsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timbre?: TimbreType
  currentMaqam?: Maqam
  onSelectMaqam?: (maqam: Maqam) => void
}

export const MaqamFactsDrawer: React.FC<MaqamFactsDrawerProps> = ({
  open,
  onOpenChange,
  timbre = "violin",
  currentMaqam,
  onSelectMaqam,
}) => {
  const { language } = useLanguage()
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "taxonomy-grid",
    "core-concepts",
    "jins-baggage",
  ])
  const [auditioningMaqamId, setAuditioningMaqamId] = useState<string | null>(null)

  const allMaqamat = MaqamatCatalogue.getAllMaqamat()
  const families = Object.values(MaqamatCatalogue.FAMILIES)

  const handleAuditionSample = (maqamId?: string) => {
    if (!maqamId) return
    const maqam = MaqamatCatalogue.findById(maqamId)
    if (!maqam) return
    setAuditioningMaqamId(maqamId)
    MicrotonalAudioEngine.playSequence(
      maqam.getScale(),
      450,
      timbre,
      undefined,
      () => setAuditioningMaqamId(null),
      undefined,
      "facts-sample"
    )
  }

  const handleFamilyClick = (mnemonic: MaqamFamilyMnemonic) => {
    const found = allMaqamat.find((m) => m.family === mnemonic)
    if (found && onSelectMaqam) {
      onSelectMaqam(found)
    }
  }

  const handleLoadMaqam = (maqamId?: string) => {
    if (!maqamId || !onSelectMaqam) return
    const maqam = MaqamatCatalogue.findById(maqamId)
    if (maqam) {
      onSelectMaqam(maqam)
      onOpenChange(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] bg-slate-950 text-slate-100 border-t border-amber-800/40">
        <DrawerHeader className="border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                  <span>Maqam Theory &amp; 8 Families</span>
                  <span className="font-arabic text-amber-400 text-sm font-semibold">
                    (نظرية المقامات وعائلاتها)
                  </span>
                </DrawerTitle>
                <DrawerDescription className="text-xs text-slate-400">
                  Comprehensive reference for classical Arabic modal music theory, jins baggage, network pathways, and the 8 families mnemonic (صنع بسحرك)
                </DrawerDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 py-5 space-y-6 max-h-[calc(92vh-140px)] scrollbar-thin">
          <div className="rounded-2xl border border-amber-800/40 bg-linear-to-r from-amber-950/50 via-slate-900 to-indigo-950/40 p-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-800/30 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-amber-400">
                    The 8 Fundamental Families
                  </span>
                  <Badge variant="secondary" className="font-arabic text-[11px] font-bold bg-amber-500/20 text-amber-300">
                    صنع بسحرك
                  </Badge>
                </div>
                <h3 className="mt-1 text-lg font-extrabold text-white">
                  Maqam Family Taxonomy
                </h3>
              </div>
              <p className="max-w-md text-xs text-slate-300">
                The classical mnemonic{" "}
                <span className="font-serif text-sm font-bold text-amber-300">
                  "صنع بسحرك"
                </span>{" "}
                categorizes modal systems by their root lower Jins. Click any card to select its archetype Maqam in the studio:
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
              {families.map((fam) => {
                const isSelected = currentMaqam?.family === fam.mnemonic
                const sampleMaqam = allMaqamat.find((m) => m.family === fam.mnemonic)
                const isAuditioning = sampleMaqam && auditioningMaqamId === sampleMaqam.id
                return (
                  <div
                    key={fam.mnemonic}
                    className={`group flex flex-col justify-between rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-amber-300 bg-amber-500/20 text-slate-100 shadow-lg ring-2 ring-amber-400/50"
                        : "border-slate-800/80 bg-slate-950/70 text-slate-200 hover:border-amber-500/40 hover:bg-slate-900/90"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleFamilyClick(fam.mnemonic)}
                      className="cursor-pointer text-center w-full focus:outline-none"
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`font-serif text-2xl font-bold transition-transform group-hover:scale-110 ${
                            isSelected ? "text-amber-300" : "text-amber-400"
                          }`}
                        >
                          {fam.arabicLetter}
                        </span>
                        {isSelected && (
                          <Badge variant="default" className="text-[9px] px-1 py-0 h-4 bg-amber-500 text-slate-950 font-bold">
                            Active
                          </Badge>
                        )}
                      </div>
                      <span className="mt-1 block text-xs font-bold truncate">
                        {fam.mnemonic}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-amber-400/90 font-arabic">
                        {fam.arabicName}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400 truncate">
                        {fam.rootJinsDef.name}
                      </span>
                    </button>

                    {sampleMaqam && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAuditionSample(sampleMaqam.id)}
                          disabled={Boolean(isAuditioning)}
                          className="h-6 w-full text-[10px] p-0 text-slate-300 hover:text-white hover:bg-amber-500/20"
                          title={`Listen to ${sampleMaqam.name}`}
                        >
                          <Volume2 className={`h-2.5 w-2.5 mr-1 text-amber-400 ${isAuditioning ? "animate-pulse" : ""}`} />
                          <span>{isAuditioning ? "Playing" : "Hear"}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Accordion
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="space-y-3"
          >
            {MAQAM_FACTS_DATA.map((section) => {
              const Icon = section.icon
              const isAuditioning = auditioningMaqamId === section.sampleMaqamId
              return (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 transition-all"
                >
                  <AccordionTrigger className="py-3.5 hover:text-amber-300">
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm block">
                          {section.title}
                        </span>
                        {language === "ar" && (
                          <span className="font-arabic text-xs text-amber-400/80 block">
                            {section.arabicTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-1 border-t border-slate-800/60 mt-1">
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      {section.content.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>

                    {section.sampleMaqamId && (
                      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Example: Maqam {section.sampleMaqamId.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAuditionSample(section.sampleMaqamId)}
                            disabled={isAuditioning}
                            className="h-7 text-xs gap-1 border-slate-700 bg-slate-800 text-slate-200 hover:text-white cursor-pointer"
                          >
                            <Volume2 className={`h-3 w-3 text-amber-400 ${isAuditioning ? "animate-pulse" : ""}`} />
                            <span>{isAuditioning ? "Playing..." : "Listen"}</span>
                          </Button>
                          {onSelectMaqam && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoadMaqam(section.sampleMaqamId)}
                              className="h-7 text-xs gap-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                            >
                              <span>Explore in Studio</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>

        <DrawerFooter className="border-t border-slate-800/80 px-6 py-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Tone.js 24-EDO Microtonal Tuning Standard</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 cursor-pointer"
          >
            Close Reference
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export const MaqamHelpDrawer = MaqamFactsDrawer
