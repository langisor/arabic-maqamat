import {
  createColumnHelper,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"

export const TABLE_PRINTER_FEATURES = tableFeatures({})

export type TablePrinterColumn<TData extends RowData> = ColumnDef<
  typeof TABLE_PRINTER_FEATURES,
  TData
>

export function createTablePrinterColumnHelper<TData extends RowData>() {
  return createColumnHelper<typeof TABLE_PRINTER_FEATURES, TData>()
}
