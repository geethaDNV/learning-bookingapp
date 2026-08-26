import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Item } from '../../types/item.types';

interface ItemTableProps {
  rows: Item[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const columnHelper = createColumnHelper<Item>();

const columns = [
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('sku', { header: 'SKU', cell: (info) => info.getValue() ?? '—' }),
  columnHelper.accessor('itemType', { header: 'Type' }),
  columnHelper.accessor('isActive', {
    header: 'Status',
    cell: (info) => (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          info.getValue() ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {info.getValue() ? 'Active' : 'Inactive'}
      </span>
    ),
  }),
];

export function ItemTable({ rows, loading, page, pageSize, total, onPageChange }: ItemTableProps) {
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-gray-200 text-left">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="py-2 px-3 font-semibold text-gray-600">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-4 px-3 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-4 px-3 text-center text-gray-500">
                No items found.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-2 px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span>
          Page {page} of {totalPages} ({total} items)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
