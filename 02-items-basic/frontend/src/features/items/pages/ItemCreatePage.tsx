import { useNavigate } from 'react-router-dom';
import { ItemForm } from '../components/form/ItemForm';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectItemsError, selectItemsSaving } from '../store/itemSelectors';
import { createItem } from '../store/itemThunks';
import { CreateItemPayload } from '../types/item.types';

export function ItemCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const saving = useAppSelector(selectItemsSaving);
  const error = useAppSelector(selectItemsError);

  const handleSubmit = async (payload: CreateItemPayload) => {
    const result = await dispatch(createItem(payload));
    if (createItem.fulfilled.match(result)) {
      navigate(`/items/${result.payload.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold text-slate-950">Create Item</h1>
      {error && <p className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <ItemForm saving={saving} submitLabel="Create Item" onSubmit={handleSubmit} onCancel={() => navigate('/items')} />
    </div>
  );
}