import { useState, type ReactNode } from 'react';
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState, type RowSelectionState
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  /** Placeholder for the filter box; omit to hide filtering. */
  searchPlaceholder?: string;
  /** Rendered to the right of the filter box — e.g. bulk actions. */
  toolbar?: (selected: T[], clear: () => void) => ReactNode;
  enableSelection?: boolean;
  pageSize?: number;
  emptyMessage?: string;
}

/**
 * Admin data table.
 *
 * Mobile behaviour is the thing to be careful about. The previous hand-written
 * tables collapsed into stacked cards below 900px: each <td> carries a
 * data-label and CSS renders it with ::before, which is why there is no
 * horizontal scrolling on a phone. TanStack renders its own markup, so that
 * data-label is reapplied here from each column's header text. Dropping it
 * would reintroduce a sideways-scrolling table on mobile.
 */
export function DataTable<T>({
  columns, data, searchPlaceholder, toolbar,
  enableSelection = false, pageSize = 25, emptyMessage = 'Nothing to show.'
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } }
  });

  const selected = table.getFilteredSelectedRowModel().rows.map(r => r.original);
  const clearSelection = () => setRowSelection({});

  /** Plain-text header, used as the mobile row label. */
  const labelFor = (id: string) => {
    const col = columns.find(c => (c.id ?? (c as any).accessorKey) === id);
    const h = (col as any)?.header;
    return typeof h === 'string' ? h : '';
  };

  return (
    <>
      {(searchPlaceholder || toolbar) && (
        <div className="admin-toolbar">
          {searchPlaceholder && (
            <input
              className="admin-search"
              type="search"
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              aria-label={searchPlaceholder}
            />
          )}
          <span className="admin-count">
            {table.getFilteredRowModel().rows.length} of {data.length}
          </span>
          {toolbar?.(selected, clearSelection)}
        </div>
      )}

      <div className="admin-table-wrap">
        <Table className="admin-table">
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead key={header.id} aria-sort={
                      header.column.getIsSorted() === 'asc' ? 'ascending'
                        : header.column.getIsSorted() === 'desc' ? 'descending'
                        : undefined
                    }>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="admin-th-sort"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown size={13} aria-hidden="true" />
                        </button>
                      ) : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="admin-td-empty">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.map(row => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} data-label={labelFor(cell.column.id)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="admin-pagination">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div>
            <button type="button" className="btn btn-outline"
              onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft size={15} aria-hidden="true" /> Previous
            </button>
            <button type="button" className="btn btn-outline"
              onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
