import { ItemStatusFilter, ItemTypeFilter } from '../../types/item.types';

interface ItemFiltersProps {
  search: string;
  status: ItemStatusFilter;
  itemType: ItemTypeFilter;
  code: string;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ItemStatusFilter) => void;
  onItemTypeChange: (value: ItemTypeFilter) => void;
  onCodeChange: (value: string) => void;
  onPageSizeChange: (value: number) => void;
  onClearFilters: () => void;
}

export function ItemFilters({
  search,
  status,
  itemType,
  code,
  pageSize,
  onSearchChange,
  onStatusChange,
  onItemTypeChange,
  onCodeChange,
  onPageSizeChange,
  onClearFilters,
}: ItemFiltersProps) {
  return (
    <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto_auto]">
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search name, SKU, HSN, SAC"
        className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
      />
      <input
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        placeholder="HSN/SAC code"
        className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
      />
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as ItemStatusFilter)}
        className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
      >
        <option value="all">All status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select
        value={itemType}
        onChange={(event) => onItemTypeChange(event.target.value as ItemTypeFilter)}
        className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
      >
        <option value="all">All types</option>
        <option value="goods">Goods</option>
        <option value="service">Service</option>
      </select>
      <select
        value={pageSize}
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
        className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
      >
        <option value={5}>5 rows</option>
        <option value={10}>10 rows</option>
        <option value={20}>20 rows</option>
      </select>
      <button type="button" onClick={onClearFilters} className="rounded border border-slate-300 px-3 py-2 text-sm">
        Clear
      </button>
    </div>
  );
}