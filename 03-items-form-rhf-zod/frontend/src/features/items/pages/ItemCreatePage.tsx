/**
 * ItemCreatePage
 * 
 * Page for creating a new item.
 * Uses ItemForm component and dispatches createItemThunk.
 * Navigates to list after successful creation.
 */

import { useNavigate } from 'react-router-dom';
import { ItemForm } from '../components/ItemForm';
import { ItemFormValues, formValuesToPayload } from '../schemas/itemValidation';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { createItemThunk } from '../../../store/itemThunks';

export function ItemCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, submitError } = useAppSelector((state) => state.items);

  const handleSubmit = async (values: ItemFormValues) => {
    const payload = formValuesToPayload(values);
    
    const result = await dispatch(createItemThunk(payload as any));
    
    if (result.type === createItemThunk.fulfilled.type) {
      navigate('/items');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Item</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <ItemForm
            onSubmit={handleSubmit}
            loading={loading}
            submitError={submitError}
          />
        </div>
      </div>
    </div>
  );
}
