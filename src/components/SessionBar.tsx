import {  Music2, Radio, Layers } from "lucide-react"
import { MaqamatCatalogue, type Maqam } from "../theory/maqam"
import type { AudioTransportStatus } from "../audio/audio-transport"
import type { ValidLab } from "../state/workspace-state"
import { useLanguage } from "../state/language"

interface Props {
  maqam: Maqam
  isDroneActive: boolean
  transportStatus: AudioTransportStatus
  onNavigate: (lab: ValidLab) => void
  onSelectFamily?: (familyKey: string) => void
  onSelectMaqam?: (maqam: Maqam) => void
}

export function SessionBar({
  maqam,
  isDroneActive,
  transportStatus,

  onSelectFamily,
  onSelectMaqam,
}: Props) {
  const { t, language } = useLanguage()
  const tonic = maqam.getTonic()
  const ghammaz = maqam.getGhammaz()
  const scale = maqam.getScale().map((pitch) => pitch.toScientificString()).join("  ")

  const families = MaqamatCatalogue.getFamiliesList()

  // Match current maqam's family to the key in families list
  const currentFamilyKey =
    (maqam.family as string) === "صنع" || (maqam.family as string) === "Saba" ? "صنع" : maqam.family

  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value
    if (onSelectFamily) {
      onSelectFamily(selectedKey)
    } else if (onSelectMaqam) {
      const rep = MaqamatCatalogue.getRepresentativeMaqamForFamily(selectedKey)
      onSelectMaqam(rep)
    }
  }

  return (
    <section
      aria-label={t("currentSession")}
      className="border-b border-border bg-muted/35 px-3 py-2 sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 md:grid-cols-[minmax(14rem,1.3fr)_minmax(13rem,1.3fr)_auto] md:items-center">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
            {t("currentSession")}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Music2 className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              <span className="truncate text-sm font-bold text-foreground">{maqam.name}</span>
              {maqam.arabicName && (
                <span className="truncate font-arabic text-sm text-amber-600 dark:text-amber-400" lang="ar" dir="rtl">
                  {maqam.arabicName}
                </span>
              )}
            </div>

            {/* Maqam Family Selecting Drop List */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-border/80">
              <label
                htmlFor="maqam-family-select"
                className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1 shrink-0"
              >
                <Layers className="h-3 w-3 text-amber-500" aria-hidden="true" />
                <span className="hidden sm:inline">{language === "ar" ? "العائلة:" : "Family:"}</span>
              </label>
              <select
                id="maqam-family-select"
                value={currentFamilyKey}
                onChange={handleFamilyChange}
                className="h-7 text-xs font-semibold rounded-md border border-input bg-background/90 px-2 py-0.5 text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-amber-500 hover:border-amber-500/50 transition-colors cursor-pointer"
                title={language === "ar" ? "اختر عائلة المقامات" : "Select Maqam Family"}
              >
                {families.map((fam) => (
                  <option key={fam.key} value={fam.key} className="bg-popover text-popover-foreground">
                    {fam.englishName} ({fam.arabicName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <dl className="grid min-w-0 grid-cols-2 sm:grid-cols-[auto_auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          <div>
            <dt className="text-[10px] text-muted-foreground">{t("tonic")}</dt>
            <dd className="font-mono font-semibold">{tonic.toString()}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-muted-foreground">{t("ghammaz")}</dt>
            <dd className="font-mono font-semibold">{ghammaz.toString()}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1 min-w-0">
            <dt className="text-[10px] text-muted-foreground">{t("scale")}</dt>
            <dd className="truncate font-mono font-semibold" title={scale}>
              {scale}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="sr-only">{t("quickLinks")}</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Radio className={`h-3.5 w-3.5 ${isDroneActive ? "text-amber-500" : ""}`} aria-hidden="true" />
            {isDroneActive ? t("droneOn") : t("drone")}
            <span aria-hidden="true">·</span>
            {transportStatus.audioStarting
              ? t("audioStarting")
              : transportStatus.activeSessions.length > 0
                ? `${t("audioActive")}: ${transportStatus.activeSessions.length}`
                : transportStatus.audioContextReady
                  ? t("audioReady")
                  : t("audioIdle")}
          </span>

        </div>
      </div>
    </section>
  )
}
