import { FormEvent, useState } from 'react';
import { CreateItemPayload, Item } from '../../types/item.types';

interface ItemFormProps {
  initialItem?: Item | null;
  saving: boolean;
  submitLabel: string;
  onSubmit: (payload: CreateItemPayload) => Promise<void> | void;
  onCancel: () => void;
}

export function ItemForm({ initialItem, saving, submitLabel, onSubmit, onCancel }: ItemFormProps) {
  const [name, setName] = useState(initialItem?.name ?? '');
  const [sku, setSku] = useState(initialItem?.sku ?? '');
  const [itemType, setItemType] = useState<'goods' | 'service'>(initialItem?.itemType ?? 'goods');
  const [hsnCode, setHsnCode] = useState(initialItem?.hsnCode ?? '');
  const [sacCode, setSacCode] = useState(initialItem?.sacCode ?? '');
  const [isActive, setIsActive] = useState(initialItem?.isActive ?? true);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }

    setFormError(null);
    await onSubmit({
      name: name.trim(),
      sku: sku.trim() || null,
      itemType,
      hsnCode: hsnCode.trim() || null,
      sacCode: sacCode.trim() || null,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {formError && <p className="mb-4 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="Office Chair"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          SKU
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="FUR-001"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Item Type
          <select
            value={itemType}
            onChange={(event) => setItemType(event.target.value as 'goods' | 'service')}
            className="rounded border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
          >
            <option value="goods">Goods</option>
            <option value="service">Service</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Status
          <select
            value={isActive ? 'active' : 'inactive'}
            onChange={(event) => setIsActive(event.target.value === 'active')}
            className="rounded border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          HSN Code
          <input
            value={hsnCode}
            onChange={(event) => setHsnCode(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="9401"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          SAC Code
          <input
            value={sacCode}
            onChange={(event) => setSacCode(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 font-normal outline-none focus:border-slate-900"
            placeholder="9983"
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-4 py-2 text-sm" disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}