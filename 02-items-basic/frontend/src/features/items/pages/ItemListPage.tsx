import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { ItemFilters } from '../components/list/ItemFilters';
import { ItemTable } from '../components/list/ItemTable';
import { useItemsList } from '../hooks/useItemsList';
import { useAppDispatch } from '../../../store/hooks';
import { clearError, clearSuccessMessage } from '../store/itemSlice';
import { deleteItem, fetchItems, setItemStatus } from '../store/itemThunks';
import { Item } from '../types/item.types';

export function ItemListPage() {
  const dispatch = useAppDispatch();
  const list = useItemsList();
  const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'delete'; item: Item } | null>(null);

  const refreshQuery = {
    search: list.search,
    status: list.status === 'all' ? undefined : list.status,
    itemType: list.itemType === 'all' ? undefined : list.itemType,
    code: list.code,
    page: list.page,
    pageSize: list.pageSize,
  };

  const confirmStatusChange = async () => {
    if (!confirmAction || confirmAction.type !== 'status') return;
    await dispatch(setItemStatus({ id: confirmAction.item.id, isActive: !confirmAction.item.isActive }));
    await dispatch(fetchItems(refreshQuery));
    setConfirmAction(null);
  };

  const confirmDelete = async () => {
    if (!confirmAction || confirmAction.type !== 'delete') return;
    await dispatch(deleteItem(confirmAction.item.id));
    setConfirmAction(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Module 02</p>
          <h1 className="text-3xl font-semibold text-slate-950">Items CRUD</h1>
        </div>
        <Link to="/items/new" className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          New Item
        </Link>
      </div>

      <ItemFilters
        search={list.search}
        status={list.status}
        itemType={list.itemType}
        code={list.code}
        pageSize={list.pageSize}
        onSearchChange={list.setSearch}
        onStatusChange={list.setStatus}
        onItemTypeChange={list.setItemType}
        onCodeChange={list.setCode}
        onPageSizeChange={list.setPageSize}
        onClearFilters={list.clearFilters}
      />

      {list.error && (
        <button type="button" onClick={() => dispatch(clearError())} className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {list.error}
        </button>
      )}
      {list.successMessage && (
        <button type="button" onClick={() => dispatch(clearSuccessMessage())} className="mb-3 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {list.successMessage}
        </button>
      )}

      <ItemTable
        rows={list.rows}
        loading={list.loading}
        saving={list.saving}
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={list.setPage}
        onStatusChange={(item) => setConfirmAction({ type: 'status', item })}
        onDelete={(item) => setConfirmAction({ type: 'delete', item })}
      />

      {confirmAction?.type === 'status' && (
        <ConfirmDialog
          title={confirmAction.item.isActive ? 'Inactivate item?' : 'Reactivate item?'}
          message={`This will ${confirmAction.item.isActive ? 'hide' : 'restore'} ${confirmAction.item.name} in active item lists.`}
          confirmLabel={confirmAction.item.isActive ? 'Inactivate' : 'Reactivate'}
          busy={list.saving}
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmStatusChange}
        />
      )}

      {confirmAction?.type === 'delete' && (
        <ConfirmDialog
          title="Delete item?"
          message={`This permanently deletes ${confirmAction.item.name}. This endpoint is included only for learning/demo data.`}
          confirmLabel="Delete"
          busy={list.saving}
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}