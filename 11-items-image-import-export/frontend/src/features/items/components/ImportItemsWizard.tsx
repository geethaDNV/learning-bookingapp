import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { confirmItemImportThunk, fetchItems, previewItemImportThunk } from '../../../store/itemThunks';
import { clearFileWorkflowState } from '../../../store/itemsSlice';
import { ItemImportOptions } from '../../../types/index';

const defaultOptions: ItemImportOptions = {
  fieldMapping: {
    name: 'Name',
    sku: 'SKU',
    itemType: 'Item Type',
    unit: 'Unit',
    salesPrice: 'Sales Price',
    hsnCode: 'HSN Code',
    sacCode: 'SAC Code',
    isActive: 'Active',
  },
  duplicateHandling: 'skip',
  uniqueKey: 'sku',
};

export function ImportItemsWizard() {
  const dispatch = useAppDispatch();
  const { fileWorkflowLoading, fileWorkflowError, importPreview, importResult, pagination } = useAppSelector((state) => state.items);
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ItemImportOptions>(defaultOptions);

  const canPreview = Boolean(file) && !fileWorkflowLoading;
  const canConfirm = Boolean(file && importPreview && importPreview.summary.validRows > 0) && !fileWorkflowLoading;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    dispatch(clearFileWorkflowState());
  };

  const handleFieldMappingChange = (field: string, sourceHeader: string) => {
    setOptions((current) => ({
      ...current,
      fieldMapping: {
        ...current.fieldMapping,
        [field]: sourceHeader,
      },
    }));
  };

  const handlePreview = async () => {
    if (!file) {
      return;
    }

    await dispatch(previewItemImportThunk({ file, options }));
  };

  const handleConfirm = async () => {
    if (!file) {
      return;
    }

    const result = await dispatch(confirmItemImportThunk({ file, options }));
    if (confirmItemImportThunk.fulfilled.match(result)) {
      dispatch(fetchItems({ page: pagination.page, pageSize: pagination.pageSize }));
    }
  };

  const downloadErrorReport = () => {
    if (!importResult?.errorReportCsv) {
      return;
    }

    const blob = new Blob([importResult.errorReportCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'item-import-errors.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Import Items</h2>
          <p className="text-sm text-gray-600">Upload a CSV or XLSX file, preview validation, then confirm the valid rows.</p>
        </div>
        <input
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          className="text-sm text-gray-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {Object.entries(options.fieldMapping).map(([field, header]) => (
          <label key={field} className="text-sm">
            <span className="block text-xs font-semibold text-gray-600 mb-1">{field}</span>
            <input
              value={header}
              onChange={(event) => handleFieldMappingChange(field, event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-sm text-gray-700">
          Unique key
          <select
            value={options.uniqueKey}
            onChange={(event) => setOptions((current) => ({ ...current, uniqueKey: event.target.value as ItemImportOptions['uniqueKey'] }))}
            className="ml-2 px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="sku">SKU</option>
            <option value="name">Name</option>
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Duplicates
          <select
            value={options.duplicateHandling}
            onChange={(event) => setOptions((current) => ({ ...current, duplicateHandling: event.target.value as ItemImportOptions['duplicateHandling'] }))}
            className="ml-2 px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="skip">Skip</option>
            <option value="overwrite">Overwrite</option>
          </select>
        </label>
        <button
          type="button"
          onClick={handlePreview}
          disabled={!canPreview}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {fileWorkflowLoading ? 'Working...' : 'Preview Import'}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          Confirm Valid Rows
        </button>
      </div>

      {fileWorkflowError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {fileWorkflowError.message}
        </div>
      )}

      {importPreview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">Total rows: <strong>{importPreview.summary.totalRows}</strong></div>
          <div className="p-3 bg-green-50 rounded-lg">Valid rows: <strong>{importPreview.summary.validRows}</strong></div>
          <div className="p-3 bg-red-50 rounded-lg">Invalid rows: <strong>{importPreview.summary.invalidRows}</strong></div>
        </div>
      )}

      {importPreview && importPreview.errors.length > 0 && (
        <div className="max-h-48 overflow-auto border border-red-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-red-50">
              <tr>
                <th className="px-3 py-2 text-left">Row</th>
                <th className="px-3 py-2 text-left">Field</th>
                <th className="px-3 py-2 text-left">Message</th>
              </tr>
            </thead>
            <tbody>
              {importPreview.errors.map((error, index) => (
                <tr key={`${error.rowNumber}-${error.field}-${index}`}>
                  <td className="px-3 py-2">{error.rowNumber}</td>
                  <td className="px-3 py-2">{error.field}</td>
                  <td className="px-3 py-2">{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {importResult && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 space-y-2">
          <p>
            Created {importResult.created}, updated {importResult.updated}, skipped {importResult.skipped}, failed {importResult.failed}.
          </p>
          {importResult.errorReportCsv && importResult.failed > 0 && (
            <button type="button" onClick={downloadErrorReport} className="font-semibold underline">
              Download error report
            </button>
          )}
        </div>
      )}
    </div>
  );
}
