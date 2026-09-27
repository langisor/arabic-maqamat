import { ArrowRight, Music2, Radio } from "lucide-react"
import type { Maqam } from "../theory/maqam"
import type { AudioTransportStatus } from "../audio/audio-transport"
import type { ValidLab } from "../state/workspace-state"
import { useLanguage } from "../state/language"
import { Button } from "./ui/button"

interface Props {
  maqam: Maqam
  isDroneActive: boolean
  transportStatus: AudioTransportStatus
  onNavigate: (lab: ValidLab) => void
}

export function SessionBar({ maqam, isDroneActive, transportStatus, onNavigate }: Props) {
  const { t } = useLanguage()
  const tonic = maqam.getTonic()
  const ghammaz = maqam.getGhammaz()
  const scale = maqam.getScale().map((pitch) => pitch.toScientificString()).join(" · ")

  return (
    <section
      aria-label={t("currentSession")}
      className="border-b border-border bg-muted/35 px-4 py-3 sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl gap-x-6 gap-y-3 md:grid-cols-[minmax(13rem,1fr)_minmax(16rem,1.6fr)_auto] md:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t("currentSession")}</p>
          <div className="flex min-w-0 items-center gap-2">
            <Music2 className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <span className="truncate text-sm font-bold">{maqam.name}</span>
            {maqam.arabicName && (
              <span className="truncate font-arabic text-sm text-amber-600 dark:text-amber-400" lang="ar" dir="rtl">
                {maqam.arabicName}
              </span>
            )}
          </div>
        </div>

        <dl className="grid min-w-0 grid-cols-[auto_auto_1fr] gap-x-4 gap-y-1 text-xs">
          <div>
            <dt className="text-[10px] text-muted-foreground">{t("tonic")}</dt>
            <dd className="font-mono font-semibold">{tonic.toString()}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-muted-foreground">{t("ghammaz")}</dt>
            <dd className="font-mono font-semibold">{ghammaz.toString()}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] text-muted-foreground">{t("scale")}</dt>
            <dd className="truncate font-mono font-semibold" title={scale}>{scale}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="sr-only">{t("quickLinks")}</span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground" role="status" aria-live="polite">
            <Radio className={`h-3.5 w-3.5 ${isDroneActive ? "text-amber-500" : ""}`} aria-hidden="true" />
            {isDroneActive ? t("droneOn") : t("drone")}
            <span aria-hidden="true">·</span>
            {transportStatus.audioStarting
              ? t("audioStarting")
              : transportStatus.activeSessions.length > 0
                ? `${t("audioActive")}: ${transportStatus.activeSessions.length}`
                : transportStatus.audioContextReady ? t("audioReady") : t("audioIdle")}
          </span>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => onNavigate("explorer")}>
            {t("explore")}<ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onNavigate("training")}>{t("practice")}</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onNavigate("score")}>{t("score")}</Button>
        </div>
      </div>
    </section>
  )
}