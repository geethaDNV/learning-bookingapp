import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Item } from '../../types/item.types';

interface ItemTableProps {
  rows: Item[];
  loading: boolean;
  saving: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onStatusChange: (item: Item) => void;
  onDelete: (item: Item) => void;
}

const columnHelper = createColumnHelper<Item>();

export function ItemTable({ rows, loading, saving, page, pageSize, total, onPageChange, onStatusChange, onDelete }: ItemTableProps) {
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => <Link to={`/items/${info.row.original.id}`} className="font-medium text-slate-900 underline-offset-2 hover:underline">{info.getValue()}</Link>,
    }),
    columnHelper.accessor('sku', { header: 'SKU', cell: (info) => info.getValue() ?? '-' }),
    columnHelper.accessor('itemType', { header: 'Type', cell: (info) => (info.getValue() === 'goods' ? 'Goods' : 'Service') }),
    columnHelper.accessor('hsnCode', { header: 'HSN', cell: (info) => info.getValue() ?? '-' }),
    columnHelper.accessor('sacCode', { header: 'SAC', cell: (info) => info.getValue() ?? '-' }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) => (
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            info.getValue() ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {info.getValue() ? 'Active' : 'Inactive'}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const item = info.row.original;
        return (
          <div className="flex flex-wrap gap-2">
            <Link to={`/items/${item.id}/edit`} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
              Edit
            </Link>
            <button
              type="button"
              onClick={() => onStatusChange(item)}
              disabled={saving}
              className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
            >
              {item.isActive ? 'Inactivate' : 'Reactivate'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              disabled={saving}
              className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 text-left">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3 py-3 font-semibold text-slate-600">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
                  Loading items...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
                  No items found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {page} of {totalPages} ({total} items)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}