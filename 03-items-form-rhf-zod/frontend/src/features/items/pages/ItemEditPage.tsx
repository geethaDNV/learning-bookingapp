/**
 * ItemEditPage
 * 
 * Page for editing an existing item.
 * Loads item by ID and displays form with default values.
 * Uses reset() to update form when item data arrives.
 * Dispatches updateItemThunk on submit.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ItemForm } from '../components/ItemForm';
import { ItemFormValues, formValuesToPayload } from '../schemas/itemValidation';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { fetchItemById, updateItemThunk } from '../../../store/itemThunks';

export function ItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentItem, loading, submitError } = useAppSelector((state) => state.items);

  const itemId = Number(id);

  // Fetch item when page loads
  useEffect(() => {
    if (itemId) {
      dispatch(fetchItemById(itemId));
    }
  }, [itemId, dispatch]);

  const handleSubmit = async (values: ItemFormValues) => {
    const payload = formValuesToPayload(values);
    
    const result = await dispatch(
      updateItemThunk({
        id: itemId,
        payload: payload as any,
      })
    );
    
    if (result.type === updateItemThunk.fulfilled.type) {
      navigate('/items');
    }
  };

  if (loading && !currentItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading item...</div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Item not found</div>
      </div>
    );
  }

  // Convert Item to form values
  const defaultValues: ItemFormValues = {
    name: currentItem.name,
    sku: currentItem.sku,
    itemType: currentItem.itemType as 'GOODS' | 'SERVICES' | 'CONSUMABLE',
    hsnCode: currentItem.hsnCode,
    sacCode: currentItem.sacCode,
    isActive: currentItem.isActive,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Item</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <ItemForm
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            loading={loading}
            submitError={submitError}
          />
        </div>
      </div>
    </div>
  );
}
