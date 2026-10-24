import { Music } from "lucide-react"
import {
  ViolinFingerboard,
  type ViolinTuningPreset,
} from "../../components/ViolinFingerboard"
import { Button } from "../../components/ui/button"
import { useLanguage } from "../../state/language"
import type { TimbreType } from "../../audio/microtonal-audio"
import type { Maqam } from "../../theory/maqam"
import { OudStudio } from "../oud/OudStudio"

interface InstrumentStudioProps {
  currentMaqam: Maqam
  instrument: TimbreType
  onInstrumentChange: (instrument: TimbreType) => void
  timbre: TimbreType
  tuning: ViolinTuningPreset
  onTuningChange: (tuning: ViolinTuningPreset) => void
}

export function InstrumentStudio({
  currentMaqam,
  instrument,
  onInstrumentChange,
  timbre,
  tuning,
  onTuningChange,
}: InstrumentStudioProps) {
  const { language, t } = useLanguage()
  const instrumentName =
    instrument === "violin" ? t("instrumentViolin") : t("instrumentOud")

  return (
    <section
      className="space-y-5"
      aria-labelledby="instrument-studio-title"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-900/50 bg-linear-to-br from-amber-950/50 via-slate-900 to-slate-950 p-4 sm:flex-row sm:items-center sm:p-5">
        <div>
          <h2
            id="instrument-studio-title"
            className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl"
          >
            <Music className="h-5 w-5 text-amber-400" aria-hidden="true" />
            {t("instrumentStudio")}
          </h2>
          <p className="mt-1 text-sm text-amber-200/80">{instrumentName}</p>
        </div>
        <div
          className="flex w-fit items-center gap-1 rounded-xl border border-amber-100/10 bg-black/20 p-1"
          role="group"
          aria-label={t("instrumentSelect")}
        >
          {(["violin", "oud"] as const).map((choice) => {
            const selected = instrument === choice
            return (
              <Button
                key={choice}
                type="button"

                aria-pressed={selected}
                onClick={() => onInstrumentChange(choice)}
                className={`h-9 px-4 ${selected ? "bg-amber-400" : ""}`}
              >
                {choice === "violin"
                  ? t("instrumentViolin")
                  : t("instrumentOud")}
              </Button>
            )
          })}
        </div>
      </div>

      {instrument === "violin" ? (
        <ViolinFingerboard
          currentMaqam={currentMaqam}
          timbre={timbre}
          tuning={tuning}
          onTuningChange={onTuningChange}
        />
      ) : (
        <OudStudio currentMaqam={currentMaqam} />
      )}
    </section>
  )
}
