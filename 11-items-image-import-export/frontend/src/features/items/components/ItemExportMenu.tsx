import { useState } from 'react';
import { useAppDispatch } from '../../../hooks/redux';
import { exportItemsThunk } from '../../../store/itemThunks';
import { ItemExportFilters, ItemExportFormat } from '../../../types/index';

interface ItemExportMenuProps {
  filters?: ItemExportFilters;
}

export function ItemExportMenu({ filters = {} }: ItemExportMenuProps) {
  const dispatch = useAppDispatch();
  const [exportingFormat, setExportingFormat] = useState<ItemExportFormat | null>(null);

  const handleExport = async (format: ItemExportFormat) => {
    setExportingFormat(format);
    await dispatch(exportItemsThunk({ format, filters }));
    setExportingFormat(null);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleExport('csv')}
        disabled={exportingFormat !== null}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {exportingFormat === 'csv' ? 'Exporting...' : 'Export CSV'}
      </button>
      <button
        type="button"
        onClick={() => handleExport('xlsx')}
        disabled={exportingFormat !== null}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {exportingFormat === 'xlsx' ? 'Exporting...' : 'Export XLSX'}
      </button>
    </div>
  );
}
