// src/components/JinsAnalysisDrawer.tsx
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import { JinsAnalysisTool } from './JinsAnalysisTool';
import { TimbreType } from '../audio/microtonal-audio';
import { ArabicPitch } from '../core/pitch';
import { Package, X } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../state/language';

interface JinsAnalysisDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timbre?: TimbreType;
  initialJinsId?: string;
  initialRoot?: ArabicPitch;
}

export const JinsAnalysisDrawer: React.FC<JinsAnalysisDrawerProps> = ({
  open,
  onOpenChange,
  timbre = 'violin',
  initialJinsId = 'bayati',
  initialRoot,
}) => {
  const { language } = useLanguage();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={language === 'ar' ? 'left' : 'right'}
        className="w-[min(94vw,900px)] max-w-none max-h-dvh overflow-y-auto bg-slate-950 p-4 sm:p-6 text-slate-100 border-l border-slate-800 shadow-2xl scrollbar-thin"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Jins Analysis Sidebar</span>
                <span className="font-arabic text-purple-400 text-xs">
                  أمتعة الأجناس الموسيقية
                </span>
              </SheetTitle>
              <SheetDescription className="text-[11px] text-slate-400">
                Interactive SVG staff showing baggage below the root and above the jins top pitch
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
          isCompact={true}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
};
