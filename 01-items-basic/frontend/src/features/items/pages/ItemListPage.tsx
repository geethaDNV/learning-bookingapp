import { useItemsList } from '../hooks/useItemsList';
import { ItemFilters } from '../components/list/ItemFilters';
import { ItemTable } from '../components/list/ItemTable';

export function ItemListPage() {
  const { rows, total, page, pageSize, search, status, loading, error, setSearch, setStatus, setPage, clearFilters } =
    useItemsList();

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">Items</h1>
      <ItemFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onClearFilters={clearFilters}
      />
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <ItemTable rows={rows} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
