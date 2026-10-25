import {  Music2, Radio, Layers, Square, Volume2 } from "lucide-react"
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
  masterVolume: number
  onMasterVolumeChange: (volume: number) => void
  onStopAll: () => void
}

export function SessionBar({
  maqam,
  isDroneActive,
  transportStatus,
  masterVolume,
  onMasterVolumeChange,
  onStopAll,

  onSelectFamily,
  onSelectMaqam,
}: Props) {
  const { t } = useLanguage()
  const tonic = maqam.getTonic()
  const ghammaz = maqam.getGhammaz()
  const scale = maqam.getScale().map((pitch) => pitch.toScientificString()).join("  ")

  const families = MaqamatCatalogue.getFamiliesList()
  const currentFamilyKey = maqam.family
  const familyMembers = currentFamilyKey
    ? MaqamatCatalogue.getMaqamatByFamily(currentFamilyKey)
    : []
  const maqamOptions = familyMembers.some(({ id }) => id === maqam.id)
    ? familyMembers
    : [maqam, ...familyMembers]

  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value
    if (onSelectFamily) {
      onSelectFamily(selectedKey)
    } else if (onSelectMaqam) {
      const rep = MaqamatCatalogue.getRepresentativeMaqamForFamily(selectedKey)
      onSelectMaqam(rep)
    }
  }

  const handleMaqamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMaqam = maqamOptions.find(({ id }) => id === e.target.value)
    if (selectedMaqam) onSelectMaqam?.(selectedMaqam)
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

            <div className="flex items-center gap-1.5 border-l border-border/80 pl-2">
              <label
                htmlFor="maqam-family-select"
                className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground"
              >
                <Layers className="h-3 w-3 text-amber-500" aria-hidden="true" />
                <span className="hidden sm:inline">{t("selectMaqamFamily")}</span>
              </label>
              <select
                id="maqam-family-select"
                value={currentFamilyKey}
                onChange={handleFamilyChange}
                aria-label={t("selectMaqamFamily")}
                className="h-7 cursor-pointer rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-semibold text-slate-100 shadow-xs transition-colors hover:border-amber-500/50 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                style={{ colorScheme: "dark" }}
                title={t("selectMaqamFamily")}
              >
                <option value="None">{t("independentMaqamat")}</option>
                {families.map((fam) => (
                  <option
                    key={fam.key}
                    value={fam.key}
                    className="bg-slate-900 text-slate-100"
                    style={{ backgroundColor: "#0f172a", color: "#f1f5f9" }}
                  >
                    {fam.englishName} ({fam.arabicName})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 border-l border-border/80 pl-2">
              <label
                htmlFor="maqam-select"
                className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground"
              >
                <Music2 className="h-3 w-3 text-amber-500" aria-hidden="true" />
                <span className="hidden sm:inline">{t("selectMaqam")}</span>
              </label>
              <select
                id="maqam-select"
                value={maqam.id}
                onChange={handleMaqamChange}
                aria-label={t("selectMaqam")}
                disabled={maqamOptions.length === 0 || !onSelectMaqam}
                className="h-7 max-w-40 cursor-pointer rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-semibold text-slate-100 shadow-xs transition-colors hover:border-amber-500/50 focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ colorScheme: "dark" }}
                title={t("selectMaqam")}
              >
                {maqamOptions.map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                    className="bg-slate-900 text-slate-100"
                    style={{ backgroundColor: "#0f172a", color: "#f1f5f9" }}
                  >
                    {option.name}
                    {option.arabicName ? ` (${option.arabicName})` : ""}
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
          <label className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
            <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Master volume</span>
            <input
              aria-label="Master volume"
              type="range"
              min="0"
              max="100"
              value={Math.round(masterVolume * 100)}
              onChange={(event) => onMasterVolumeChange(Number(event.target.value) / 100)}
              className="w-16 accent-amber-500"
            />
          </label>
          <button
            type="button"
            onClick={onStopAll}
            disabled={transportStatus.activeSessions.length === 0}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Stop all audio"
            title="Stop all audio"
          >
            <Square className="h-3 w-3 fill-current" aria-hidden="true" />
            <span className="hidden sm:inline">Stop audio</span>
          </button>

        </div>
      </div>
    </section>
  )
}
