import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ItemForm } from '../components/form/ItemForm';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { clearSelectedItem } from '../store/itemSlice';
import { selectItemsError, selectItemsLoading, selectItemsSaving, selectSelectedItem } from '../store/itemSelectors';
import { fetchItemById, updateItem } from '../store/itemThunks';
import { CreateItemPayload } from '../types/item.types';

export function ItemEditPage() {
  const { id } = useParams();
  const itemId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const item = useAppSelector(selectSelectedItem);
  const loading = useAppSelector(selectItemsLoading);
  const saving = useAppSelector(selectItemsSaving);
  const error = useAppSelector(selectItemsError);

  useEffect(() => {
    if (Number.isFinite(itemId)) {
      dispatch(fetchItemById(itemId));
    }

    return () => {
      dispatch(clearSelectedItem());
    };
  }, [dispatch, itemId]);

  const handleSubmit = async (payload: CreateItemPayload) => {
    const result = await dispatch(updateItem({ id: itemId, payload }));
    if (updateItem.fulfilled.match(result)) {
      navigate(`/items/${itemId}`);
    }
  };

  if (!Number.isFinite(itemId)) {
    return <PageMessage message="Invalid item id." />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-slate-950">Edit Item</h1>
        <Link to="/items" className="text-sm text-slate-700 underline-offset-2 hover:underline">
          Back to Items
        </Link>
      </div>
      {error && <p className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {loading && <p className="rounded bg-white p-4 text-sm text-slate-500">Loading item...</p>}
      {!loading && item && (
        <ItemForm initialItem={item} saving={saving} submitLabel="Save Changes" onSubmit={handleSubmit} onCancel={() => navigate(`/items/${itemId}`)} />
      )}
    </div>
  );
}

function PageMessage({ message }: { message: string }) {
  return <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-600">{message}</div>;
}