interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}

export function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm, busy = false }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-3 py-2 text-sm" disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}