import { useMemo, useState } from "react"
import { FileMusic, Printer } from "lucide-react"
import { AjnasLibrary } from "../theory/jins"
import { Maqam, MaqamatCatalogue } from "../theory/maqam"
import { useLanguage } from "../state/language"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  createTablePrinterColumnHelper,
  type TablePrinterColumn,
} from "./table-printer-helpers"
import { TablePrinter } from "./TablePrinter"

type AjnasGroup = "5-note" | "4-note" | "3-note" | "variable"
type TableKind = "ajnas" | "maqamat"

interface AjnasTableRow {
  id: string
  name: string
  group: AjnasGroup
  pitchTotal: number
  tonic: string
  tonicOrder: number
  intervals: readonly number[]
}

interface MaqamTableRow {
  id: string
  name: string
  family: string
  tonic: string
  tonicOrder: number
  pitchTotal: number
  intervals: readonly number[]
}

const GROUP_ORDER: Record<AjnasGroup, number> = {
  "5-note": 0,
  "4-note": 1,
  "3-note": 2,
  variable: 3,
}

function getAjnasGroup(sizeLabel: string): AjnasGroup {
  if (sizeLabel === "5-note") return "5-note"
  if (sizeLabel === "4-note") return "4-note"
  if (sizeLabel === "3-note") return "3-note"
  return "variable"
}

function getOrdinal(value: number, language: "en" | "ar"): string {
  if (language === "ar")
    return `الفاصل ${["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع"][value - 1] ?? value}`
  if (value === 1) return "1st interval"
  if (value === 2) return "2nd interval"
  if (value === 3) return "3rd interval"
  return `${value}th interval`
}

function getIntervalHeader(value: number, language: "en" | "ar"): string {
  if (language === "ar") {
    return (
      ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع"][
        value - 1
      ] ?? String(value)
    )
  }
  if (value === 1) return "1st"
  if (value === 2) return "2nd"
  if (value === 3) return "3rd"
  return `${value}th`
}

function toAjnasRows(): AjnasTableRow[] {
  return AjnasLibrary.getAllDefinitions()
    .map((definition) => ({
      id: definition.id,
      name: definition.name,
      group: getAjnasGroup(definition.sizeLabel),
      pitchTotal: definition.intervals.length + 1,
      tonic: definition.defaultRoot.toDisplayString(),
      tonicOrder: definition.defaultRoot.toQuarterToneIndex(),
      intervals: definition.intervals,
    }))
    .sort(
      (a, b) =>
        GROUP_ORDER[a.group] - GROUP_ORDER[b.group] ||
        a.tonicOrder - b.tonicOrder ||
        (a.intervals[0] ?? 0) - (b.intervals[0] ?? 0) ||
        a.name.localeCompare(b.name)
    )
}

function toMaqamRows(maqamat: Maqam[]): MaqamTableRow[] {
  return maqamat
    .map((maqam) => {
      const tonic = maqam.getTonic()
      return {
        id: maqam.id,
        name: maqam.name,
        family: maqam.family === "None" ? "Independent" : maqam.family,
        tonic: tonic.toDisplayString(),
        tonicOrder: tonic.toQuarterToneIndex(),
        pitchTotal: maqam.getScale().length,
        intervals: maqam.getIntervals(),
      }
    })
    .sort(
      (a, b) =>
        a.family.localeCompare(b.family) ||
        a.tonicOrder - b.tonicOrder ||
        a.pitchTotal - b.pitchTotal ||
        a.name.localeCompare(b.name)
    )
}

function makeAjnasColumns(
  language: "en" | "ar"
): TablePrinterColumn<AjnasTableRow>[] {
  const helper = createTablePrinterColumnHelper<AjnasTableRow>()
  const intervalColumns = Array.from({ length: 5 }, (_, index) =>
    helper.accessor((row) => row.intervals[index] ?? null, {
      id: `interval-${index + 1}`,
      header: getIntervalHeader(index + 1, language),
      cell: ({ getValue }) => getValue() ?? "—",
    })
  )

  return helper.columns([
    helper.accessor("group", {
      header: language === "ar" ? "الحجم" : "Group",
      cell: ({ getValue }) =>
        getValue() === "variable"
          ? language === "ar"
            ? "متغير"
            : "Variable"
          : getValue().replace("-note", ""),
    }),
    helper.accessor("name", {
      header: language === "ar" ? "الجنس" : "Jins",
      cell: ({ getValue }) => (
        <span className="font-semibold">{getValue()}</span>
      ),
    }),
    helper.accessor("pitchTotal", {
      header: language === "ar" ? "مجموع النغمات" : "Pitches",
    }),
    helper.accessor("tonic", {
      header: language === "ar" ? "القرار" : "Tonic",
    }),
    ...intervalColumns,
  ])
}

function makeMaqamColumns(
  language: "en" | "ar"
): TablePrinterColumn<MaqamTableRow>[] {
  const helper = createTablePrinterColumnHelper<MaqamTableRow>()

  return helper.columns([
    helper.accessor("name", {
      header: language === "ar" ? "المقام" : "Maqam",
      cell: ({ getValue }) => (
        <span className="font-semibold">{getValue()}</span>
      ),
    }),
    helper.accessor("family", {
      header: language === "ar" ? "العائلة" : "Family",
    }),
    helper.accessor("tonic", {
      header: language === "ar" ? "القرار" : "Tonic",
    }),
    helper.accessor("pitchTotal", {
      header: language === "ar" ? "مجموع النغمات" : "Total pitches",
    }),
    helper.accessor((row) => row.intervals.join(" · "), {
      id: "intervals",
      header: language === "ar" ? "الفواصل (ربع صوت)" : "Intervals (qt)",
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] tracking-wide">
          {getValue()}
        </span>
      ),
    }),
  ])
}

interface FilterSelectProps {
  label: string
  value: string
  options: string[]
  allLabel: string
  onChange: (value: string) => void
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
}: FilterSelectProps) {
  return (
    <label className="flex min-w-32 flex-col gap-1 text-[11px] font-semibold text-muted-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

export function PrintServicesLab() {
  const { language } = useLanguage()
  const [tableKind, setTableKind] = useState<TableKind>("ajnas")
  const [ajnasGroup, setAjnasGroup] = useState("all")
  const [ajnasTonic, setAjnasTonic] = useState("all")
  const [ajnasFirstInterval, setAjnasFirstInterval] = useState("all")
  const [maqamFamily, setMaqamFamily] = useState("all")
  const [maqamTonic, setMaqamTonic] = useState("all")
  const [maqamPitchTotal, setMaqamPitchTotal] = useState("all")
  const ajnasRows = useMemo(() => toAjnasRows(), [])
  const maqamRows = useMemo(() => toMaqamRows(MaqamatCatalogue.getAll()), [])
  const ajnasColumns = useMemo(() => makeAjnasColumns(language), [language])
  const maqamColumns = useMemo(() => makeMaqamColumns(language), [language])
  const visibleAjnas = useMemo(
    () =>
      ajnasRows.filter(
        (row) =>
          (ajnasGroup === "all" || row.group === ajnasGroup) &&
          (ajnasTonic === "all" || row.tonic === ajnasTonic) &&
          (ajnasFirstInterval === "all" ||
            row.intervals[0] === Number(ajnasFirstInterval))
      ),
    [ajnasFirstInterval, ajnasGroup, ajnasRows, ajnasTonic]
  )
  const visibleMaqamat = useMemo(
    () =>
      maqamRows.filter(
        (row) =>
          (maqamFamily === "all" || row.family === maqamFamily) &&
          (maqamTonic === "all" || row.tonic === maqamTonic) &&
          (maqamPitchTotal === "all" ||
            row.pitchTotal === Number(maqamPitchTotal))
      ),
    [maqamFamily, maqamPitchTotal, maqamRows, maqamTonic]
  )
  const isArabic = language === "ar"
  const tonicOptions = (rows: { tonic: string; tonicOrder: number }[]) =>
    [...new Map(rows.map((row) => [row.tonic, row.tonicOrder])).entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([tonic]) => tonic)
  const allLabel = isArabic ? "الكل" : "All"

  const ajnasToolbar = (
    <div className="flex flex-wrap gap-2">
      <FilterSelect
        label={isArabic ? "حجم الجنس" : "Pitch group"}
        value={ajnasGroup}
        options={["5-note", "4-note", "3-note", "variable"].map((group) =>
          group === "variable"
            ? isArabic
              ? "متغير"
              : "Variable"
            : group.replace("-note", "")
        )}
        allLabel={allLabel}
        onChange={(value) => {
          const translatedVariable = isArabic ? "متغير" : "Variable"
          setAjnasGroup(
            value === translatedVariable
              ? "variable"
              : value === "all"
                ? "all"
                : `${value}-note`
          )
        }}
      />
      <FilterSelect
        label={isArabic ? "القرار" : "Tonic"}
        value={ajnasTonic}
        options={tonicOptions(ajnasRows)}
        allLabel={allLabel}
        onChange={setAjnasTonic}
      />
      <FilterSelect
        label={isArabic ? "الفاصل الأول" : "First interval"}
        value={ajnasFirstInterval}
        options={[
          ...new Set(ajnasRows.map((row) => String(row.intervals[0] ?? ""))),
        ].filter(Boolean)}
        allLabel={allLabel}
        onChange={setAjnasFirstInterval}
      />
    </div>
  )

  const maqamToolbar = (
    <div className="flex flex-wrap gap-2">
      <FilterSelect
        label={isArabic ? "العائلة" : "Family"}
        value={maqamFamily}
        options={[...new Set(maqamRows.map((row) => row.family))]}
        allLabel={allLabel}
        onChange={setMaqamFamily}
      />
      <FilterSelect
        label={isArabic ? "القرار" : "Tonic"}
        value={maqamTonic}
        options={tonicOptions(maqamRows)}
        allLabel={allLabel}
        onChange={setMaqamTonic}
      />
      <FilterSelect
        label={isArabic ? "مجموع النغمات" : "Total pitches"}
        value={maqamPitchTotal}
        options={[
          ...new Set(maqamRows.map((row) => String(row.pitchTotal))),
        ].sort((a, b) => Number(a) - Number(b))}
        allLabel={allLabel}
        onChange={setMaqamPitchTotal}
      />
    </div>
  )

  return (
    <div
      className="print-services-lab flex flex-col gap-5"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Card className="print-lab-intro overflow-hidden">
        <CardHeader className="flex flex-row items-start gap-3 p-4 sm:p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Printer aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-xl">
              {isArabic ? "مختبر خدمات الطباعة" : "Print Services Lab"}
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl leading-relaxed">
              {isArabic
                ? "أنشئ جداول مطبوعة ومنظمة لأجناس المقام والمقامات، مع خيارات تجميع وتصفية قابلة للطباعة."
                : "Create clear, print-ready interval tables for ajnas and maqamat, with grouping and filters for the dimensions you need."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 pb-4 sm:grid-cols-2 sm:px-5 sm:pb-5">
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 p-3">
            <Printer
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold">
                {isArabic ? "جدول فواصل الأجناس" : "Ajnas intervals"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? "مجمّع حسب الحجم والقرار والفاصل الأول"
                  : "Grouped by size, tonic, and first interval"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 p-3">
            <FileMusic
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold">
                {isArabic ? "جدول فواصل المقامات" : "Maqamat intervals"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? "مجمّع حسب العائلة والقرار ومجموع النغمات"
                  : "Grouped by family, tonic, and total pitches"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        className="screen-only flex flex-wrap gap-2"
        role="tablist"
        aria-label={isArabic ? "جداول الطباعة" : "Printable tables"}
      >
        <Button
          type="button"
          role="tab"
          aria-selected={tableKind === "ajnas"}
          variant={tableKind === "ajnas" ? "default" : "outline"}
          onClick={() => setTableKind("ajnas")}
        >
          <Printer data-icon="inline-start" />
          {isArabic ? "فواصل الأجناس" : "Ajnas intervals"}
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={tableKind === "maqamat"}
          variant={tableKind === "maqamat" ? "default" : "outline"}
          onClick={() => setTableKind("maqamat")}
        >
          <FileMusic data-icon="inline-start" />
          {isArabic ? "فواصل المقامات" : "Maqamat intervals"}
        </Button>
      </div>

      {tableKind === "ajnas" ? (
        <TablePrinter
          title={isArabic ? "جدول فواصل الأجناس" : "Ajnas Intervals Table"}
          description={
            isArabic
              ? "كل فاصل بوحدات ربع الصوت (٥٠ سنتاً). يعرض حجم الجنس الرسمي وعدد النغمات الفعلي."
              : "Intervals are quarter-tone steps (50 cents each). Size groups use the catalogue's official labels; pitch totals count the listed notes."
          }
          data={visibleAjnas}
          columns={ajnasColumns}
          toolbar={ajnasToolbar}
          printLabel={isArabic ? "طباعة الجدول" : "Print table"}
          emptyLabel={isArabic ? "لا توجد نتائج مطابقة." : "No matching rows."}
          rowCountLabels={
            isArabic
              ? { one: "صف", other: "صفوف" }
              : { one: "row", other: "rows" }
          }
          groupLabel={(row) => {
            const group =
              row.group === "variable"
                ? isArabic
                  ? `حجم متغير · ${row.pitchTotal} نغمات`
                  : `Variable size · ${row.pitchTotal} pitches`
                : isArabic
                  ? `${row.group.replace("-note", "")} نغمات`
                  : `${row.group.replace("-note", "")} pitches`
            return `${group} · ${isArabic ? "القرار" : "Tonic"} ${row.tonic} · ${getOrdinal(1, language)} ${row.intervals[0] ?? "—"}`
          }}
        />
      ) : (
        <TablePrinter
          title={isArabic ? "جدول فواصل المقامات" : "Maqamat Intervals Table"}
          description={
            isArabic
              ? "الفواصل الصاعدة بوحدات ربع الصوت (٥٠ سنتاً). العائلة المستقلة تعني أن المقام غير منسوب إلى عائلة."
              : "Ascending intervals are quarter-tone steps (50 cents each). Independent maqamat are not assigned to a named family."
          }
          data={visibleMaqamat}
          columns={maqamColumns}
          toolbar={maqamToolbar}
          printLabel={isArabic ? "طباعة الجدول" : "Print table"}
          emptyLabel={isArabic ? "لا توجد نتائج مطابقة." : "No matching rows."}
          rowCountLabels={
            isArabic
              ? { one: "صف", other: "صفوف" }
              : { one: "row", other: "rows" }
          }
          groupLabel={(row) =>
            `${row.family} · ${isArabic ? "القرار" : "Tonic"} ${row.tonic} · ${row.pitchTotal} ${isArabic ? "نغمات" : "pitches"}`
          }
        />
      )}
      <p className="screen-only text-[11px] text-muted-foreground">
        {isArabic
          ? "تُحذف عناصر التحكم تلقائياً من نسخة الطباعة."
          : "Filters and navigation are omitted from the printout."}
      </p>
    </div>
  )
}
