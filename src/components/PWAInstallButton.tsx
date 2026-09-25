// src/components/PWAInstallButton.tsx
import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  Wifi,
  WifiOff,
  CheckCircle2,
  X
} from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<Props> = ({ className = '', variant = 'compact' }) => {
  const { canInstall, isInstalled, isIOS, isOnline, promptInstall } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    const success = await promptInstall();
    if (success) {
      setInstalledNotice(true);
      setTimeout(() => setInstalledNotice(false), 4000);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Offline / Online connection indicator */}
        {!isOnline && (
          <Badge
            variant="destructive"
            className="text-[10px] px-2 py-0.5 gap-1 font-semibold animate-pulse"
            title="Running in offline mode with cached 24-EDO assets and service worker"
          >
            <WifiOff className="w-3 h-3" />
            <span>Offline Ready</span>
          </Badge>
        )}

        {/* Install Button (only if canInstall or not yet installed) */}
        {!isInstalled && canInstall && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            className="gap-1.5 h-8 px-2.5 text-xs font-bold border-amber-500/50 hover:border-amber-400 bg-amber-500/10 text-amber-500 hover:text-amber-400 cursor-pointer shadow-xs"
            title="Install Arabic Maqamat as a native Progressive Web App (PWA)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{variant === 'full' ? 'Install App (PWA)' : 'Install'}</span>
          </Button>
        )}

        {/* Success Notice */}
        {installedNotice && (
          <Badge variant="secondary" className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Installed!
          </Badge>
        )}
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-5 text-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Install on iOS (iPhone / iPad)</h4>
                  <p className="text-[10px] text-muted-foreground">Add to Home Screen for offline standalone play</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <span className="font-semibold text-foreground">Tap the Share button</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                    <span>Look for</span>
                    <Share className="w-3.5 h-3.5 text-amber-400 inline" />
                    <span>in your Safari toolbar at bottom or top.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <span className="font-semibold text-foreground">Select &quot;Add to Home Screen&quot;</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                    <span>Scroll down and tap</span>
                    <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />
                    <span className="font-arabic" dir="rtl">(إضافة إلى الشاشة الرئيسية)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <span className="font-semibold text-foreground">Launch Offline Anytime</span>
                  <p className="text-muted-foreground mt-0.5">
                    The app will launch full-screen with offline caching, Tone.js synthesis, and instant touch responsiveness.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
