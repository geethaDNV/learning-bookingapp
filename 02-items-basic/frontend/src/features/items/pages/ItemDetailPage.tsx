import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { clearSelectedItem } from '../store/itemSlice';
import { selectItemsError, selectItemsLoading, selectSelectedItem } from '../store/itemSelectors';
import { fetchItemById } from '../store/itemThunks';

export function ItemDetailPage() {
  const { id } = useParams();
  const itemId = Number(id);
  const dispatch = useAppDispatch();
  const item = useAppSelector(selectSelectedItem);
  const loading = useAppSelector(selectItemsLoading);
  const error = useAppSelector(selectItemsError);

  useEffect(() => {
    if (Number.isFinite(itemId)) {
      dispatch(fetchItemById(itemId));
    }

    return () => {
      dispatch(clearSelectedItem());
    };
  }, [dispatch, itemId]);

  if (!Number.isFinite(itemId)) {
    return <PageMessage message="Invalid item id." />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/items" className="text-sm text-slate-700 underline-offset-2 hover:underline">
            Back to Items
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Item Detail</h1>
        </div>
        {item && (
          <Link to={`/items/${item.id}/edit`} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Edit
          </Link>
        )}
      </div>

      {error && <p className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {loading && <p className="rounded bg-white p-4 text-sm text-slate-500">Loading item...</p>}

      {!loading && item && (
        <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <Detail label="Name" value={item.name} />
          <Detail label="SKU" value={item.sku ?? '-'} />
          <Detail label="Type" value={item.itemType === 'goods' ? 'Goods' : 'Service'} />
          <Detail label="Status" value={item.isActive ? 'Active' : 'Inactive'} />
          <Detail label="HSN Code" value={item.hsnCode ?? '-'} />
          <Detail label="SAC Code" value={item.sacCode ?? '-'} />
          <Detail label="Created" value={new Date(item.createdAt).toLocaleString()} />
          <Detail label="Updated" value={new Date(item.updatedAt).toLocaleString()} />
        </dl>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function PageMessage({ message }: { message: string }) {
  return <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-600">{message}</div>;
}