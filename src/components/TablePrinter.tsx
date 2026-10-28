import { Printer } from "lucide-react"
import { useTable, type RowData } from "@tanstack/react-table"
import { Fragment, type ReactNode } from "react"
import { Button } from "./ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import {
  TABLE_PRINTER_FEATURES,
  type TablePrinterColumn,
} from "./table-printer-helpers"

interface TablePrinterProps<TData extends RowData> {
  title: string
  description: string
  data: TData[]
  columns: TablePrinterColumn<TData>[]
  toolbar?: ReactNode
  groupLabel?: (row: TData) => string
  printLabel?: string
  emptyLabel?: string
  rowCountLabels?: { one: string; other: string }
}

export function TablePrinter<TData extends RowData>({
  title,
  description,
  data,
  columns,
  toolbar,
  groupLabel,
  printLabel = "Print table",
  emptyLabel = "No matching rows.",
  rowCountLabels = { one: "row", other: "rows" },
}: TablePrinterProps<TData>) {
  const table = useTable({
    features: TABLE_PRINTER_FEATURES,
    columns,
    data,
  })
  const columnCount = table.getAllLeafColumns().length
  let previousGroup: string | undefined

  return (
    <section className="print-table-card rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h2 className="table-print-title text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="print-controls flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end">
          {toolbar}
          <Button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto"
          >
            <Printer data-icon="inline-start" />
            {printLabel}
          </Button>
        </div>
      </header>

      <div className="print-table-wrapper overflow-x-auto">
        <Table className="print-table min-w-max text-xs">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-muted/70 px-3 py-2.5 text-center text-[11px] font-bold text-foreground first:text-start"
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="py-10 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const currentGroup = groupLabel?.(row.original)
                const startsGroup =
                  currentGroup !== undefined && currentGroup !== previousGroup
                previousGroup = currentGroup

                return (
                  <Fragment key={row.id}>
                    {startsGroup && (
                      <TableRow className="print-group-row bg-muted/50">
                        <TableHead
                          colSpan={columnCount}
                          className="px-3 py-2 text-start text-[11px] font-bold text-foreground"
                        >
                          {currentGroup}
                        </TableHead>
                      </TableRow>
                    )}
                    <TableRow className="print-data-row">
                      {row.getAllCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-3 py-2 text-center text-foreground tabular-nums first:text-start"
                        >
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <footer className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground sm:px-5">
        {data.length}{" "}
        {data.length === 1 ? rowCountLabels.one : rowCountLabels.other}
      </footer>
    </section>
  )
}
