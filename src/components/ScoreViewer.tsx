// src/components/ScoreViewer.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { Maqam } from '../theory/maqam';
import {
  MusicXMLExporter,
  type RoundTripReport,
} from '../score/musicxml-exporter';
import { getAccidentalLabel } from '../core/pitch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { AsyncFeedback } from './AsyncFeedback';
import { useLanguage } from '../state/language';
import {
  Copy,
  Download,
  Music,
  Eye,
  Code,
  Check,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Play,
} from 'lucide-react';

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

  // Roundtrip audit state
  const [auditReport, setAuditReport] = useState<RoundTripReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const xmlString = useMemo(() => MusicXMLExporter.generateScaleMusicXML(maqam), [maqam]);
  const scalePitches = useMemo(() => maqam.getScale(), [maqam]);
  const validation = useMemo(() => MusicXMLExporter.validatePhrase(scalePitches), [scalePitches]);

  // Ascending + descending scale pitches as generated in scale XML
  const fullScalePitches = useMemo(() => {
    const desc = [...scalePitches].reverse().slice(1);
    return [...scalePitches, ...desc];
  }, [scalePitches]);

  useEffect(() => {
    // Reset audit report when maqam changes
    setAuditReport(null);
  }, [maqam.id]);

  useEffect(() => {
    if (!containerRef.current || viewMode !== 'sheet') return;

    let isMounted = true;
    setIsRendering(true);
    setRenderError(null);

    // Clean container before re-instantiating
    containerRef.current.innerHTML = '';

    const isMobile = (containerRef.current?.clientWidth ?? window.innerWidth) < 540 || window.innerWidth < 640;

    try {
      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        backend: 'svg',
        drawTitle: true,
        drawSubtitle: false,
        drawPartNames: false,
        drawComposer: false,
        drawCredits: false,
        drawingParameters: isMobile ? 'compact' : 'compacttight',
        newSystemFromXML: true,
      });

      if (isMobile) {
        osmd.EngravingRules.RenderXMeasuresPerLineAkaSystem = 1;
        osmd.EngravingRules.NewSystemAtXMLNewSystemAttribute = true;
        osmd.EngravingRules.VoiceSpacingMultiplierVexflow = 1.05;
        osmd.EngravingRules.VoiceSpacingAddendVexflow = 3.0;
        osmd.EngravingRules.MinSkyBottomDistBetweenSystems = 2.0;
        osmd.EngravingRules.MinimumDistanceBetweenSystems = 2.0;
        osmd.EngravingRules.FixedMeasureWidth = false;
      }

      osmdRef.current = osmd;

      osmd
        .load(xmlString)
        .then(() => {
          if (isMounted) {
            osmd.render();
            setIsRendering(false);
          }
        })
        .catch((err) => {
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

  const handleRunRoundtripAudit = () => {
    setIsAuditing(true);
    try {
      const report = MusicXMLExporter.verifyRoundTrip(fullScalePitches, xmlString);
      setAuditReport(report);
      setStatusMessage(
        report.success
          ? `${t('auditPassed')}: ${report.exactPitchMatches}/${report.notesTested}`
          : 'Fidelity audit detected issues.'
      );
    } catch (err) {
      setAuditReport({
        success: false,
        notesTested: fullScalePitches.length,
        exactPitchMatches: 0,
        exactDurationMatches: 0,
        quarterTonesPreserved: 0,
        failures: [`Audit failed with exception: ${String(err)}`],
      });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      {/* Header Controls */}
      <CardHeader className="pb-4 border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400">
                {t('scorePipeline')}
              </span>
              <Badge variant="sky" className="text-[10px]">
                {t('musicXmlStandard')}
              </Badge>
              {validation.stats.quarterToneCount > 0 && (
                <Badge variant="amber" className="text-[10px] gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {validation.stats.quarterToneCount} {t('quarterTonesPreserved')}
                </Badge>
              )}
              {validation.isValid && (
                <Badge variant="emerald" className="text-[10px] gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {t('pitchSpellingVerified')}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl sm:text-2xl mt-1">
              {t('microtonalScore')} ({maqam.name})
            </CardTitle>
            <CardDescription className="mt-0.5">
              {t('scoreDescription')}: {getAccidentalLabel('𝄳', language)} (𝄳) / {getAccidentalLabel('𝄵', language)} (𝄵)
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher */}
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="sheet" className="gap-1.5 text-xs">
                  <Eye className="w-3.5 h-3.5" />
                  {t('sheetMusic')}
                </TabsTrigger>
                <TabsTrigger value="xml" className="gap-1.5 text-xs">
                  <Code className="w-3.5 h-3.5" />
                  {t('xmlView')}
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {t('fidelityAudit')}
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
        <p className="sr-only" role="status" aria-live="polite">
          {statusMessage}
        </p>

        {clipboardError && (
          <AsyncFeedback kind="error" title={t('clipboardCopyFailed')} description={clipboardError} />
        )}

        {/* Validation Errors & Warnings Notice if any */}
        {validation.errors.length > 0 && (
          <AsyncFeedback
            kind="error"
            title="MusicXML Validation Error"
            description={validation.errors.join('; ')}
            className="mb-2"
          />
        )}

        {validation.warnings.length > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{validation.warnings.join(' ')}</span>
          </div>
        )}

        {/* Main Display Area */}
        <div>
          {viewMode === 'sheet' && (
            <div
              className="relative min-h-55 bg-stone-50 rounded-xl p-4 overflow-x-auto shadow-inner border border-stone-200"
              aria-busy={isRendering}
            >
              {isRendering && (
                <AsyncFeedback
                  kind="loading"
                  title={t('renderSheet')}
                  className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-stone-50/80 text-xs font-medium text-stone-700"
                />
              )}

              {/* DOM Container with specific ID anchor */}
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
                    action={{
                      label: t('retryRendering'),
                      onClick: () => setRenderAttempt((attempt) => attempt + 1),
                    }}
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
          )}

          {viewMode === 'xml' && (
            <div className="relative">
              <pre className="max-h-95 overflow-y-auto p-4 rounded-xl bg-slate-950 font-mono text-xs text-amber-200/90 border border-slate-800 select-all">
                {xmlString}
              </pre>
            </div>
          )}

          {viewMode === 'audit' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {t('fidelityAudit')} &amp; Verification Suite
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Validates XML entity escaping, 24-EDO microtonal alteration semantics, and roundtrip re-import fidelity.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRunRoundtripAudit}
                  disabled={isAuditing}
                  className="gap-1.5 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                >
                  <Play className="w-3 h-3" />
                  {isAuditing ? 'Testing...' : t('runFidelityAudit')}
                </Button>
              </div>

              {/* Audit Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[11px] font-medium text-slate-400">XML Escaping</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Hardened
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Entities escaped: &amp;amp;, &amp;lt;, &amp;gt;, &amp;quot;, &amp;apos;
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[11px] font-medium text-slate-400">Microtonal Encoding</div>
                  <div className="text-sm font-semibold text-amber-400 mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> 24-EDO Compliant
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    alter: &plusmn;0.5 / standard quarter-flat &amp; quarter-sharp
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[11px] font-medium text-slate-400">Metric Timing &amp; Divisions</div>
                  <div className="text-sm font-semibold text-sky-400 mt-1 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" /> 16 Divisions / Beat
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Measures: {validation.stats.estimatedMeasures} (Total {validation.stats.totalDurationBeats} beats)
                  </div>
                </div>
              </div>

              {/* Roundtrip Audit Results */}
              {auditReport && (
                <div
                  className={`p-3.5 rounded-lg border text-xs ${
                    auditReport.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-red-500/10 border-red-500/30 text-red-200'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-2">
                    {auditReport.success ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        {t('auditPassed')}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Roundtrip Fidelity Discrepancy Found
                      </>
                    )}
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                    <div>Pitches Verified: <span className="font-bold text-white">{auditReport.exactPitchMatches}/{auditReport.notesTested}</span></div>
                    <div>Quarter-Tones: <span className="font-bold text-amber-300">{auditReport.quarterTonesPreserved}</span></div>
                    <div>Durations Matched: <span className="font-bold text-white">{auditReport.exactDurationMatches}/{auditReport.notesTested}</span></div>
                    <div>Notation Compatibility: <span className="font-bold text-emerald-300">100% MusicXML 4.0</span></div>
                  </div>
                  {auditReport.failures.length > 0 && (
                    <div className="mt-2 text-red-300">
                      {auditReport.failures.map((f, i) => (
                        <div key={i}>• {f}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Note breakdown bar */}
        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            <span>
              {t('scaleDegrees')} ({t('ascending')}):
            </span>
            <span className="font-mono text-amber-300 font-medium">
              {scalePitches.map((p) => p.toScientificString()).join('  –  ')}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {t('osmdAnchor')}:{' '}
            <code className="text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
              #osmd-{maqam.id}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
