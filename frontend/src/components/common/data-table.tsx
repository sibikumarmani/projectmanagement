import type { ReactNode } from "react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
};

export function DataTable<T extends { id: string }>({ columns, rows }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-line">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-[720px] w-full text-left">
          <thead className="surface-soft text-[11px] uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)] sm:text-xs sm:tracking-[0.18em]">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-3 py-3 font-semibold sm:px-4">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-sm text-[color:var(--foreground)]" style={{ background: "color-mix(in srgb, var(--surface-soft) 74%, transparent)" }}>
            {rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-[color:var(--surface-soft)]">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-3 py-3 align-top sm:px-4">
                    {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
