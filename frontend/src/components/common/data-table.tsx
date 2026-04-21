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
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-white/70 text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-4 py-3 font-semibold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/35 text-sm text-slate-700">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-white/70">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3 align-top">
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
