// src/components/JinsAnalysisDrawer.tsx
import React from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet"
import { JinsAnalysisTool } from "./JinsAnalysisTool"
import { TimbreType } from "../audio/microtonal-audio"
import { ArabicPitch } from "../core/pitch"
import { Package, X } from "lucide-react"
import { Button } from "./ui/button"
import { useLanguage } from "../state/language"

interface JinsAnalysisDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timbre?: TimbreType
  onTimbreChange: (timbre: TimbreType) => void
  initialJinsId?: string
  initialRoot?: ArabicPitch
}

export const JinsAnalysisDrawer: React.FC<JinsAnalysisDrawerProps> = ({
  open,
  onOpenChange,
  timbre = "violin",
  onTimbreChange,
  initialJinsId = "bayati",
  initialRoot,
}) => {
  const { language } = useLanguage()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={language === "ar" ? "left" : "right"}
        className="w-[min(94vw,1200px)] max-h-dvh scrollbar-thin overflow-y-auto border-l border-slate-800 bg-slate-950 p-4 text-slate-100 
        shadow-2xl sm:p-6"
        showCloseButton={false}
      >
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="w-full flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/20 text-purple-400">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                <span>Jins Analysis Sidebar</span>
                <span className="font-arabic text-xs text-purple-400">
                  أمتعة الأجناس الموسيقية
                </span>
              </SheetTitle>
              <SheetDescription className="text-[11px] text-slate-400">
                Interactive SVG staff showing baggage below the root and above
                the jins top pitch
              </SheetDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <JinsAnalysisTool
          initialJinsId={initialJinsId}
          initialRoot={initialRoot}
          timbre={timbre}
          onTimbreChange={onTimbreChange}
          isCompact={true}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
