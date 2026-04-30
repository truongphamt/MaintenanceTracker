import { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle2, FileJson, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppState } from '../services/dataService';
import { emptyAppState } from '../services/dataService';
import Modal from '../components/Modal';

const EXPORT_VERSION = 1;

interface BackupFile {
  version: number;
  exportedAt: string;
  data: AppState;
}

function isValidBackup(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.version !== 'number') return false;
  const data = v.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') return false;
  return Array.isArray(data.items) && Array.isArray(data.notifications) && Array.isArray(data.policies);
}

export default function Settings() {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const itemCount = state.items.length;
  const serviceCount = state.items.reduce((acc, i) => acc + i.subItems.length, 0);
  const policyCount = state.policies.length;

  const handleExport = () => {
    const backup: BackupFile = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data: state,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `homebase-backup-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({ kind: 'success', message: 'Backup downloaded.' });
  };

  const handleImportFile = (file: File) => {
    setFeedback(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!isValidBackup(parsed)) {
          setFeedback({ kind: 'error', message: 'This file is not a valid HomeBase backup.' });
          return;
        }
        if (parsed.version !== EXPORT_VERSION) {
          setFeedback({ kind: 'error', message: `Unsupported backup version (${parsed.version}). This app expects version ${EXPORT_VERSION}.` });
          return;
        }
        setPendingImport(parsed);
      } catch {
        setFeedback({ kind: 'error', message: 'Could not read this file. Make sure it is a valid JSON backup.' });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    dispatch({ type: 'LOAD_STATE', payload: pendingImport.data });
    const summary = `${pendingImport.data.items.length} items, ${pendingImport.data.policies.length} policies`;
    setPendingImport(null);
    setFeedback({ kind: 'success', message: `Backup restored (${summary}).` });
  };

  const openDeleteConfirm = () => {
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAll = () => {
    dispatch({ type: 'LOAD_STATE', payload: emptyAppState });
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setFeedback({ kind: 'success', message: 'All data has been deleted from this browser.' });
  };

  const hasAnyData = itemCount > 0 || policyCount > 0 || state.notifications.length > 0;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Data</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Items</span>
          <span className="font-medium text-gray-700">{itemCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tracked services</span>
          <span className="font-medium text-gray-700">{serviceCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Insurance policies</span>
          <span className="font-medium text-gray-700">{policyCount}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Download size={16} className="text-primary-600" /> Backup
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Save all of your data as a JSON file. Store it somewhere safe like iCloud Drive, OneDrive,
            or email it to yourself.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition"
        >
          <Download size={16} /> Download Backup
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Upload size={16} className="text-primary-600" /> Restore
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Load data from a previously downloaded backup. This will <strong>replace</strong> all
            current data in this browser.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:border-primary-400 hover:text-primary-600 transition"
        >
          <FileJson size={16} /> Choose Backup File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            feedback.kind === 'success'
              ? 'bg-success-50 text-success-700 border border-success-200'
              : 'bg-danger-50 text-danger-700 border border-danger-200'
          }`}
        >
          {feedback.kind === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-danger-200 p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-danger-700 flex items-center gap-2">
            <Trash2 size={16} /> Danger Zone
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Permanently delete all items, services, history, attachments, insurance policies, and
            notifications stored in this browser. Useful when handing off a device. <strong>Download
            a backup first</strong> if you might want this data back.
          </p>
        </div>
        <button
          onClick={openDeleteConfirm}
          disabled={!hasAnyData}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-danger-300 text-danger-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-danger-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Trash2 size={16} /> Delete All Data
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center pt-2">
        Your data is stored only in this browser. Make backups regularly so you don&apos;t lose it
        if your browser data is cleared.
      </p>

      <Modal
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="Replace all data?"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This backup contains <strong>{pendingImport?.data.items.length ?? 0} items</strong> and{' '}
            <strong>{pendingImport?.data.policies.length ?? 0} insurance policies</strong>. It will
            replace everything currently in this browser. This cannot be undone.
          </p>
          {pendingImport?.exportedAt && (
            <p className="text-xs text-gray-500">
              Backup taken {new Date(pendingImport.exportedAt).toLocaleString()}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setPendingImport(null)}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmImport}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition"
            >
              Replace Data
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete all data?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200 text-sm text-danger-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              This will permanently delete <strong>{itemCount} items</strong>,{' '}
              <strong>{serviceCount} tracked services</strong> (including all history and
              attachments), and <strong>{policyCount} insurance policies</strong> from this
              browser. This cannot be undone.
            </span>
          </div>
          <div>
            <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
              Type <span className="font-mono font-semibold text-danger-700">DELETE</span> to confirm:
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-danger-500 focus:border-danger-500 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteAll}
              disabled={deleteConfirmText !== 'DELETE'}
              className="flex-1 py-2.5 bg-danger-600 text-white rounded-lg text-sm font-semibold hover:bg-danger-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Delete Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
