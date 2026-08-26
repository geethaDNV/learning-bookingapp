import { ItemStatusFilter } from '../../types/item.types';

interface ItemFiltersProps {
  search: string;
  status: ItemStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ItemStatusFilter) => void;
}

export function ItemFilters({ search, status, onSearchChange, onStatusChange }: ItemFiltersProps) {
  return (
    <div className="flex gap-3 mb-4">
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name or SKU..."
        className="border border-gray-300 rounded px-3 py-2 w-64 text-sm"
      />
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as ItemStatusFilter)}
        className="border border-gray-300 rounded px-3 py-2 text-sm"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
