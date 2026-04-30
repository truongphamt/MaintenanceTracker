import { useState, useRef, useMemo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, Bell, Shield, Plus, Paperclip, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import type { Attachment } from '../types';

export default function Layout() {
  const { state, dispatch } = useApp();
  const unreadCount = state.notifications.filter(n => !n.read).length;

  const [showLogService, setShowLogService] = useState(false);
  const [logItemId, setLogItemId] = useState('');
  const [logSubId, setLogSubId] = useState('');
  const [logDate, setLogDate] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logAttachments, setLogAttachments] = useState<Attachment[]>([]);
  const logFileRef = useRef<HTMLInputElement>(null);

  const availableSubs = useMemo(() => {
    const item = state.items.find(i => i.id === logItemId);
    return item?.subItems || [];
  }, [state.items, logItemId]);

  const openLogService = () => {
    const firstItem = state.items[0];
    setLogItemId(firstItem?.id || '');
    setLogSubId(firstItem?.subItems[0]?.id || '');
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogNotes('');
    setLogCost('');
    setLogAttachments([]);
    setShowLogService(true);
  };

  const handleItemChange = (itemId: string) => {
    setLogItemId(itemId);
    const item = state.items.find(i => i.id === itemId);
    setLogSubId(item?.subItems[0]?.id || '');
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
    dispatch({
      type: 'ADD_SERVICE_RECORD',
      payload: {
        itemId: logItemId,
        subItemId: logSubId,
        date: logDate,
        notes: logNotes,
        cost: logCost ? parseFloat(logCost) : undefined,
        attachments: logAttachments.length > 0 ? logAttachments : undefined,
      },
    });
    setShowLogService(false);
  };

  const hasItems = state.items.length > 0 && state.items.some(i => i.subItems.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary-700 tracking-tight">
            HomeBase
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex items-end">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
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
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
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
              className="relative -top-3 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 active:scale-95 transition"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>

          <NavLink
            to="/insurance"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
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
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors relative ${
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
            <p className="text-sm text-gray-500">Add an item and services first before logging.</p>
          </div>
        ) : (
          <form onSubmit={handleLogSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select value={logItemId} onChange={e => handleItemChange(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required>
                {state.items.filter(i => i.subItems.length > 0).map(it => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select value={logSubId} onChange={e => setLogSubId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required>
                {availableSubs.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} placeholder="What was done..." rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($) <span className="text-gray-400 font-normal">optional</span></label>
              <input type="number" step="0.01" value={logCost} onChange={e => setLogCost(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachments <span className="text-gray-400 font-normal">optional</span></label>
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
