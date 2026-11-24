import { useState, useRef, useMemo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, Bell, Shield, Plus, Paperclip, X, Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import AutoGrowTextarea from './AutoGrowTextarea';
import { generateId } from '../utils';
import type { Attachment, IntervalUnit } from '../types';

const NEW_SERVICE = '__new__';

export default function Layout() {
  const { state, dispatch } = useApp();
  const unreadCount = state.notifications.filter(n => !n.read).length;

  const [showLogService, setShowLogService] = useState(false);
  const [logItemId, setLogItemId] = useState('');
  const [logSubId, setLogSubId] = useState('');
  const [logDate, setLogDate] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logPerformedBy, setLogPerformedBy] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logAttachments, setLogAttachments] = useState<Attachment[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceInterval, setNewServiceInterval] = useState('');
  const [newServiceIntervalUnit, setNewServiceIntervalUnit] = useState<IntervalUnit>('months');
  const logFileRef = useRef<HTMLInputElement>(null);

  const availableSubs = useMemo(() => {
    const item = state.items.find(i => i.id === logItemId);
    return item?.subItems || [];
  }, [state.items, logItemId]);

  const resetNewServiceFields = () => {
    setNewServiceName('');
    setNewServiceInterval('');
    setNewServiceIntervalUnit('months');
  };

  const openLogService = () => {
    const firstItem = state.items[0];
    setLogItemId(firstItem?.id || '');
    setLogSubId(firstItem?.subItems[0]?.id || NEW_SERVICE);
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogNotes('');
    setLogPerformedBy('');
    setLogCost('');
    setLogAttachments([]);
    resetNewServiceFields();
    setShowLogService(true);
  };

  const handleItemChange = (itemId: string) => {
    setLogItemId(itemId);
    const item = state.items.find(i => i.id === itemId);
    setLogSubId(item?.subItems[0]?.id || NEW_SERVICE);
    resetNewServiceFields();
  };

  const handleLogFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const att: Attachment = {
          id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 11),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: e.target?.result as string,
        };
        setLogAttachments(prev => [...prev, att]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logItemId || !logSubId) return;
    const cost = logCost ? parseFloat(logCost) : undefined;
    const attachments = logAttachments.length > 0 ? logAttachments : undefined;
    const performedBy = logPerformedBy.trim() || undefined;

    if (logSubId === NEW_SERVICE) {
      const name = newServiceName.trim();
      if (!name) return;
      const intervalValue = newServiceInterval ? parseInt(newServiceInterval, 10) : NaN;
      const interval = Number.isFinite(intervalValue) && intervalValue > 0
        ? { value: intervalValue, unit: newServiceIntervalUnit }
        : undefined;
      dispatch({
        type: 'LOG_NEW_SERVICE',
        payload: {
          itemId: logItemId,
          subItemId: generateId(),
          name,
          interval,
          date: logDate,
          notes: logNotes,
          performedBy,
          cost,
          attachments,
        },
      });
    } else {
      dispatch({
        type: 'ADD_SERVICE_RECORD',
        payload: {
          itemId: logItemId,
          subItemId: logSubId,
          date: logDate,
          notes: logNotes,
          performedBy,
          cost,
          attachments,
        },
      });
    }
    setShowLogService(false);
  };

  const hasItems = state.items.length > 0;
  const isNewService = logSubId === NEW_SERVICE;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary-700 tracking-tight">
            Service Tracker
          </h1>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `p-2 -mr-2 rounded-lg transition ${
                isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`
            }
            aria-label="Settings"
          >
            <SettingsIcon size={20} />
          </NavLink>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="max-w-4xl mx-auto flex items-end tab-bar-inset">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-5 text-xs font-medium transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Home size={20} />
            <span className="mt-0.5">Dashboard</span>
          </NavLink>
          <NavLink
            to="/services"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-5 text-xs font-medium transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <List size={20} />
            <span className="mt-0.5">Services</span>
          </NavLink>

          {/* Center "+" button */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={openLogService}
              className="relative -top-3 w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 active:scale-95 transition"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>

          <NavLink
            to="/insurance"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-5 text-xs font-medium transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Shield size={20} />
            <span className="mt-0.5">Insurance</span>
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-5 text-xs font-medium transition-colors relative ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <div className="relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-danger-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="mt-0.5">Alerts</span>
          </NavLink>
        </div>
      </nav>

      {/* Quick Log Service Modal */}
      <Modal open={showLogService} onClose={() => setShowLogService(false)} title="Log Service">
        {!hasItems ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">Add an item first before logging.</p>
          </div>
        ) : (
          <form onSubmit={handleLogSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
              <select value={logItemId} onChange={e => handleItemChange(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required>
                {state.items.map(it => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
              <select value={logSubId} onChange={e => setLogSubId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required>
                <option value={NEW_SERVICE}>New…</option>
                {availableSubs.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {isNewService && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service name *</label>
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    placeholder="e.g. Oil change"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repeat every
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={newServiceInterval}
                      onChange={e => setNewServiceInterval(e.target.value)}
                      placeholder="e.g. 3"
                      className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                    <select
                      value={newServiceIntervalUnit}
                      onChange={e => setNewServiceIntervalUnit(e.target.value as IntervalUnit)}
                      className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Sets the next due date from this service date.</p>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <AutoGrowTextarea value={logNotes} onChange={e => setLogNotes(e.target.value)} placeholder="What was done..." minRows={3} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completed By</label>
              <input type="text" value={logPerformedBy} onChange={e => setLogPerformedBy(e.target.value)} placeholder="Person or company" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
              <input type="number" step="0.01" value={logCost} onChange={e => setLogCost(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachments</label>
              <button type="button" onClick={() => logFileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 font-medium hover:border-primary-400 hover:text-primary-600 transition">
                <Paperclip size={16} /> Attach Files
              </button>
              {logAttachments.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {logAttachments.map(att => (
                    <div key={att.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-700 truncate text-xs font-medium flex-1">{att.name}</span>
                      <button type="button" onClick={() => setLogAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-gray-400 hover:text-danger-500 p-1 shrink-0"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">Save Record</button>
          </form>
        )}
      </Modal>
      <input ref={logFileRef} type="file" multiple accept="image/*,.pdf,.eml,.msg" onChange={(e) => { handleLogFiles(e.target.files); e.target.value = ''; }} className="hidden" />
    </div>
  );
}
