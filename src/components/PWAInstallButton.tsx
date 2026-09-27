// src/components/PWAInstallButton.tsx
import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet';
import { useLanguage } from '../state/language';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<Props> = ({ className = '', variant = 'compact' }) => {
  const { t } = useLanguage();
  const {
    canInstall,
    isInstalled,
    isIOS,
    isOnline,
    isServiceWorkerReady,
    updateAvailable,
    promptInstall,
    reloadApp
  } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [onlineAlert, setOnlineAlert] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  // Monitor connectivity transitions
  useEffect(() => {
    let timer: number | null = null;
    const handleOnline = () => {
      setOnlineAlert(t('backOnline'));
      timer = window.setTimeout(() => setOnlineAlert(null), 3500);
    };
    const handleOffline = () => {
      setOnlineAlert(t('offlineMode'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timer) window.clearTimeout(timer);
    };
  }, [t]);

  const handleClick = async () => {
    setInstallError(null);
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    try {
      const success = await promptInstall();
      if (success) {
        setInstalledNotice(true);
        setTimeout(() => setInstalledNotice(false), 4000);
      }
    } catch {
      setInstallError(t('installFailed'));
    }
  };

  const handleReload = () => {
    setIsReloading(true);
    reloadApp();
  };

  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Connectivity indicator */}
        {!isOnline ? (
          <Badge
            variant="destructive"
            className="text-[10px] px-2 py-0.5 gap-1 font-semibold animate-pulse"
            title={t('offlineMode')}
            role="status"
            aria-live="polite"
          >
            <WifiOff className="w-3 h-3" />
            <span>{t('offline')}</span>
          </Badge>
        ) : isServiceWorkerReady ? (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0.5 gap-1 font-medium hidden xl:inline-flex text-muted-foreground bg-muted/50 border-border"
            title={t('cachedOffline')}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>{t('cachedOffline')}</span>
          </Badge>
        ) : null}

        {/* Update available prompt */}
        {updateAvailable && (
          <Button
            variant="default"
            size="sm"
            onClick={handleReload}
            disabled={isReloading}
            className="gap-1.5 h-8 px-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md animate-bounce"
            title={t('updateReady')}
            aria-label={t('updateReady')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
            <span>{isReloading ? `${t('reloading')}...` : t('updateReady')}</span>
          </Button>
        )}

        {/* Install Button (only if canInstall or not yet installed) */}
        {!isInstalled && canInstall && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            className="gap-1.5 h-8 px-2.5 text-xs font-bold border-amber-500/50 hover:border-amber-400 bg-amber-500/10 text-amber-500 hover:text-amber-400 cursor-pointer shadow-xs"
            title={t('installApp')}
            aria-label={t('installApp')}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{variant === 'full' ? t('installApp') : t('install')}</span>
          </Button>
        )}

        {/* Success Notice */}
        {installedNotice && (
          <Badge variant="secondary" role="status" aria-live="polite" className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t('installed')}!
          </Badge>
        )}
        {installError && <span role="alert" className="basis-full text-xs text-destructive">{installError}</span>}
      </div>

      {/* Floating Connectivity Banner (transient) */}
      {onlineAlert && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 inset-s-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/50 bg-slate-900/95 px-3.5 py-2 text-xs text-amber-200 shadow-xl backdrop-blur-md"
        >
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{onlineAlert}</span>
        </div>
      )}

      {/* iOS Installation Instructions Modal */}
        <Sheet open={showIOSModal} onOpenChange={setShowIOSModal}>
          <SheetContent side="bottom" className="max-h-[85dvh] gap-4 overflow-y-auto rounded-t-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-bold text-foreground">{t('iosInstallTitle')}</SheetTitle>
                  <SheetDescription className="text-[10px] text-muted-foreground">{t('iosInstallDescription')}</SheetDescription>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <span className="font-semibold text-foreground">{t('tapShare')}</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                    <span>{t('lookFor')}</span>
                    <Share className="w-3.5 h-3.5 text-amber-400 inline" />
                    <span>{t('safariToolbar')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <span className="font-semibold text-foreground">{t('addHomeScreen')}</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                    <span>{t('scrollTap')}</span>
                    <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />
                    <span className="font-arabic" lang="ar" dir="rtl">(إضافة إلى الشاشة الرئيسية)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <span className="font-semibold text-foreground">{t('launchOffline')}</span>
                  <p className="text-muted-foreground mt-0.5">
                    {t('iosOfflineDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
              >
                {t('gotIt')}
              </Button>
            </div>
            </SheetContent>
          </Sheet>
    </>
  );
};
