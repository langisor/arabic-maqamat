// src/components/ScoreViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { Maqam } from '../theory/maqam';
import { MusicXMLExporter } from '../score/musicxml-exporter';
import { getAccidentalLabel } from '../core/pitch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { AsyncFeedback } from './AsyncFeedback';
import { useLanguage } from '../state/language';
import { Copy, Download, Music, Eye, Code, Check } from 'lucide-react';

interface Props {
  maqam: Maqam;
  activePitchIndex: number | null;
}

export const ScoreViewer: React.FC<Props> = ({ maqam, activePitchIndex }) => {
  const { language, t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<string>('sheet');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const xmlString = MusicXMLExporter.generateScaleMusicXML(maqam);
  const scalePitches = maqam.getScale();

  useEffect(() => {
    if (!containerRef.current || viewMode !== 'sheet') return;

    let isMounted = true;
    setIsRendering(true);
    setRenderError(null);

    // Clean container before re-instantiating
    containerRef.current.innerHTML = '';

    try {
      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        backend: 'svg',
        drawTitle: true,
        drawSubtitle: false,
        drawPartNames: false,
        drawComposer: false,
        drawCredits: false,
        drawingParameters: 'compacttight'
      });

      osmdRef.current = osmd;

      osmd.load(xmlString)
        .then(() => {
          if (isMounted) {
            osmd.render();
            setIsRendering(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            console.error('OSMD Render Error:', err);
            setRenderError(String(err));
            setIsRendering(false);
          }
        });
    } catch (err) {
      console.error('Failed to init OSMD:', err);
      queueMicrotask(() => {
        if (isMounted) {
          setRenderError(String(err));
          setIsRendering(false);
        }
      });
    }

    return () => {
      isMounted = false;
      osmdRef.current = null;
    };
  }, [maqam.id, xmlString, viewMode, renderAttempt]);

  const handleCopyXml = async () => {
    setClipboardError(null);
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is not available in this browser context.');
      }
      await navigator.clipboard.writeText(xmlString);
      setCopied(true);
      setStatusMessage(t('copySucceeded'));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setClipboardError(t('clipboardBlocked'));
      setStatusMessage(t('copyFailed'));
    }
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlString], { type: 'application/vnd.recordare.musicxml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${maqam.id}-scale-musicxml4.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      {/* Header Controls */}
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                {t('scorePipeline')}
              </span>
              <Badge variant="sky" className="text-[10px]">
                {t('musicXmlStandard')}
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl mt-1">
              {t('microtonalScore')} ({maqam.name})
            </CardTitle>
            <CardDescription className="mt-0.5">
              {t('scoreDescription')}: {getAccidentalLabel('𝄳', language)} (𝄳) / {getAccidentalLabel('𝄵', language)} (𝄵)
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="sheet" className="gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {t('sheetMusic')}
                </TabsTrigger>
                <TabsTrigger value="xml" className="gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  {t('xmlView')}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Action buttons */}
            <Button
              variant="dark"
              size="sm"
              onClick={handleCopyXml}
              className="gap-1.5"
              title={t('copyXml')}
              aria-label={t('copyXml')}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? `${t('copied')}!` : t('copyXml')}
            </Button>
            <Button
              variant="dark"
              size="sm"
              onClick={handleDownloadXml}
              className="gap-1.5"
              title={t('downloadXml')}
              aria-label={`${t('downloadXml')} MusicXML`}
            >
              <Download className="w-3.5 h-3.5" />
              {t('downloadXml')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <p className="sr-only" role="status" aria-live="polite">{statusMessage}</p>
        {clipboardError && <AsyncFeedback kind="error" title={t('clipboardCopyFailed')} description={clipboardError} />}
        {/* Main Score Display Area */}
        <div>
          {viewMode === 'sheet' ? (
            <div className="relative min-h-55 bg-stone-50 rounded-xl p-4 overflow-x-auto shadow-inner border border-stone-200" aria-busy={isRendering}>
              {isRendering && (
                <AsyncFeedback kind="loading" title={t('renderSheet')} className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-stone-50/80 text-xs font-medium text-stone-700" />
              )}

              {/* DOM Container with specific ID anchor e.g. osmd-rast, osmd-hijaz */}
              <div 
                id={`osmd-${maqam.id}`} 
                ref={containerRef} 
                className="w-full flex justify-center py-2"
              />

              {renderError && (
                <div className="p-4 text-center">
                  <AsyncFeedback
                    kind="error"
                    title={t('sheetUnavailable')}
                    description={t('notationCompatibility')}
                    action={{ label: t('retryRendering'), onClick: () => setRenderAttempt((attempt) => attempt + 1) }}
                    className="mx-auto mb-3 max-w-3xl text-left"
                  />
                  {/* Visual note fallback pills */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    {scalePitches.map((p, idx) => (
                      <div
                        key={idx}
                        role="img"
                        aria-label={`${t('scaleDegree')} ${idx + 1}: ${p.toScientificString()}${activePitchIndex === idx ? `, ${t('playing')}` : ''}`}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                          activePitchIndex === idx
                            ? 'bg-amber-400 border-amber-600 text-stone-900 shadow-md ring-2 ring-amber-500'
                            : 'bg-white border-stone-300 text-stone-800'
                        }`}
                      >
                        {p.toScientificString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <pre className="max-h-95 overflow-y-auto p-4 rounded-xl bg-slate-950 font-mono text-xs text-amber-200/90 border border-slate-800 select-all">
                {xmlString}
              </pre>
            </div>
          )}
        </div>

        {/* Note breakdown bar */}
        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
              <span>{t('scaleDegrees')} ({t('ascending')}):</span>
            <span className="font-mono text-amber-300 font-medium">
              {scalePitches.map(p => p.toScientificString()).join('  –  ')}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {t('osmdAnchor')}: <code className="text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">#osmd-{maqam.id}</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
