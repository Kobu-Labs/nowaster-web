"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  ColumnSort,
  RowSelectionState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import React, { useEffect, useState } from "react";

export type ExtractIdsAsArray<T extends { id?: string }[]> = Array<
  T[number] extends { id: infer R extends string } ? R : never
>;

export type ManagedTableProps<
  TData,
  TColumns extends ColumnDef<TData, TValue>[],
  TValue = unknown,
> = Omit<DataTableProps<TData, TColumns, TValue>, "columns">;

export type DataTableProps<
  TData,
  TColumns extends ColumnDef<TData, TValue>[],
  TValue = unknown,
> = {
  columns: TColumns;
  data: TData[];
  loading?: boolean;
  options?: {
    getRowId?: (value: TData) => string;
    loading?: boolean;
    enableMultiRowSelection?: boolean;
    initialSorting?: {
      id: ExtractIdsAsArray<TColumns>[number];
      desc: boolean;
    }[];
    hiddenColumns?: ExtractIdsAsArray<TColumns>;
  };
};

type TableSelection<T> = {
  initialSelection?: T[];
  onSelect: (val: T[]) => void;
  getRowId: (val: T) => string;
  data: T[];
};

// TODO: this should not be used right now, needs refactoring
export function useTableSelection<T>(opts: TableSelection<T>) {
  const selection: RowSelectionState = {};
  opts.initialSelection?.forEach((val) => {
    selection[opts.getRowId(val)] = true;
  });

  const [selectedRows, setSelectedRows] =
    useState<RowSelectionState>(selection);

  useEffect(() => {
    const keys = Object.keys(selectedRows);
    const val = opts.data.filter((v) => keys.includes(opts.getRowId(v)));
    opts.onSelect(val);
  }, [selectedRows]);

  return { selectedRows, setSelectedRows };
}

export function DataTable<
  TData,
  TValue,
  TColumns extends ColumnDef<TData, TValue>[],
>({ columns, data, options }: DataTableProps<TData, TColumns, TValue>) {
  const [sorting, setSorting] = React.useState<ColumnSort[]>(
    options?.initialSorting ?? [],
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const columnVisibilityInitial =
    React.useMemo(
      () =>
        options?.hiddenColumns?.reduce(
          (acc, id) => {
            acc[id as string] = false;
            return acc;
          },
          {} as Record<string, boolean>,
        ),
      [options?.hiddenColumns],
    ) ?? {};

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(columnVisibilityInitial);

  const table = useReactTable({
    data,
    columns,
    getRowId: options?.getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiRowSelection: options?.enableMultiRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : options?.loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <Skeleton className="w-full min-h-32" />
              </TableCell>
            </TableRow>
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          Selected values: {table.getSelectedRowModel().rows.length}
        </TableFooter>
      </Table>
    </div>
  );
}
