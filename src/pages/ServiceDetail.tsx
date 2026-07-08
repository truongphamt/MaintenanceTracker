import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Edit2, Clock, Calendar,
  DollarSign, Home, Car, User, Wrench, Paperclip, FileText,
  Image as ImageIcon, Mail, File, Download, Eye, X,
} from 'lucide-react';
import type { Attachment, IntervalUnit } from '../types';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  getServiceStatus,
  getLastServiceDate,
  getNextDueDate,
  formatDate,
  daysFromNow,
  getEffectiveInterval,
  formatInterval,
} from '../utils';

export default function ServiceDetail() {
  const { itemId, subId } = useParams<{ itemId: string; subId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const item = state.items.find(i => i.id === itemId);
  const sub = item?.subItems.find(s => s.id === subId);

  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showEditSub, setShowEditSub] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [deleteAttachment, setDeleteAttachment] = useState<{ recordId: string; attachmentId: string; name: string } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [attachToRecord, setAttachToRecord] = useState<string | null>(null);

  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordNotes, setRecordNotes] = useState('');
  const [recordCost, setRecordCost] = useState('');
  const [recordAttachments, setRecordAttachments] = useState<Attachment[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [editSubName, setEditSubName] = useState('');
  const [editSubInterval, setEditSubInterval] = useState('');
  const [editSubIntervalUnit, setEditSubIntervalUnit] = useState<IntervalUnit>('months');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachFileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null, target: 'new' | string) => {
    if (!files || !item || !sub) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: Attachment = {
          id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 11),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: e.target?.result as string,
        };
        if (target === 'new') {
          setRecordAttachments(prev => [...prev, attachment]);
        } else {
          dispatch({
            type: 'ADD_ATTACHMENT',
            payload: { itemId: item.id, subItemId: sub.id, recordId: target, attachment },
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type === 'application/pdf') return FileText;
    if (type.includes('mail') || type.includes('message') || type.includes('eml')) return Mail;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!item || !sub) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Service not found</p>
        <Link to="/services" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
          Back to services
        </Link>
      </div>
    );
  }

  const status = getServiceStatus(sub);
  const lastDate = getLastServiceDate(sub);
  const nextDue = getNextDueDate(sub);
  const Icon =
    item.category === 'home' ? Home :
    item.category === 'car' ? Car :
    item.category === 'person' ? User :
    Wrench;

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'ADD_SERVICE_RECORD',
      payload: {
        itemId: item.id,
        subItemId: sub.id,
        date: recordDate,
        notes: recordNotes,
        cost: recordCost ? parseFloat(recordCost) : undefined,
        attachments: recordAttachments.length > 0 ? recordAttachments : undefined,
      },
    });
    setRecordDate(new Date().toISOString().split('T')[0]);
    setRecordNotes('');
    setRecordCost('');
    setRecordAttachments([]);
    setShowAddRecord(false);
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'ADD_SCHEDULED_SERVICE',
      payload: { itemId: item.id, subItemId: sub.id, dueDate: scheduleDate, notes: scheduleNotes },
    });
    setScheduleDate('');
    setScheduleNotes('');
    setShowSchedule(false);
  };

  const handleEditSub = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = editSubInterval ? parseInt(editSubInterval) : NaN;
    const interval = Number.isFinite(parsed) && parsed > 0
      ? { value: parsed, unit: editSubIntervalUnit }
      : undefined;
    dispatch({
      type: 'UPDATE_SUB_ITEM',
      payload: { itemId: item.id, subItemId: sub.id, name: editSubName, interval },
    });
    setShowEditSub(false);
  };

  const openEditSub = () => {
    setEditSubName(sub.name);
    const current = getEffectiveInterval(sub);
    if (current) {
      setEditSubInterval(String(current.value));
      setEditSubIntervalUnit(current.unit);
    } else {
      setEditSubInterval('');
      setEditSubIntervalUnit('months');
    }
    setShowEditSub(true);
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_SUB_ITEM', payload: { itemId: item.id, subItemId: sub.id } });
    navigate('/services');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft size={20} />
        </button>
        <div className={`p-2 rounded-lg ${
          item.category === 'home' ? 'bg-blue-50 text-blue-600' :
          item.category === 'car' ? 'bg-purple-50 text-purple-600' :
          item.category === 'person' ? 'bg-emerald-50 text-emerald-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{sub.name}</h2>
          <p className="text-xs text-gray-500">{item.name}</p>
        </div>
        <button
          onClick={openEditSub}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <Edit2 size={16} />
        </button>
        <button onClick={() => setShowDeleteConfirm(true)} className="text-gray-400 hover:text-danger-600 p-1">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Status overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Status</span>
          <StatusBadge status={status} size="md" />
        </div>
        {(() => {
          const effective = getEffectiveInterval(sub);
          if (!effective) return null;
          return (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Interval</span>
              <span className="text-sm font-medium text-gray-700">{formatInterval(effective)}</span>
            </div>
          );
        })()}
        {lastDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Last Serviced</span>
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Clock size={13} /> {formatDate(lastDate)}</span>
          </div>
        )}
        {nextDue && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Next Due</span>
            <span className={`text-sm font-medium flex items-center gap-1 ${
              daysFromNow(nextDue) < 0 ? 'text-danger-600' : daysFromNow(nextDue) <= 30 ? 'text-warning-600' : 'text-gray-700'
            }`}>
              <Calendar size={13} /> {formatDate(nextDue)}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => { setRecordDate(new Date().toISOString().split('T')[0]); setRecordNotes(''); setRecordCost(''); setRecordAttachments([]); setShowAddRecord(true); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition"
        >
          <Plus size={16} /> Log Service
        </button>
        <button
          onClick={() => { setScheduleDate(''); setScheduleNotes(''); setShowSchedule(true); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          <Calendar size={16} /> Schedule
        </button>
      </div>

      {/* Scheduled */}
      {sub.scheduled.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Scheduled</h3>
          {sub.scheduled.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
              <div>
                <span className={`font-medium ${daysFromNow(s.dueDate) < 0 ? 'text-danger-600' : 'text-gray-700'}`}>
                  {formatDate(s.dueDate)}
                </span>
                {s.notes && <span className="text-gray-500 ml-2">- {s.notes}</span>}
              </div>
              <button
                onClick={() => setDeleteScheduleId(s.id)}
                className="text-gray-300 hover:text-danger-500 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {sub.history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Service History</h3>
          <div className="space-y-2">
            {[...sub.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => {
              const attachments = record.attachments || [];
              return (
                <div key={record.id} className="py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-start justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-700">{formatDate(record.date)}</span>
                      {record.notes && <p className="text-gray-500 text-xs mt-0.5">{record.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {record.cost != null && (
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <DollarSign size={12} />{record.cost.toFixed(2)}
                        </span>
                      )}
                      <button
                        onClick={() => { setAttachToRecord(record.id); attachFileInputRef.current?.click(); }}
                        className="text-gray-300 hover:text-primary-500 p-1"
                        title="Attach receipt"
                      >
                        <Paperclip size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteRecordId(record.id)}
                        className="text-gray-300 hover:text-danger-500 p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {attachments.map(att => {
                        const FIcon = getFileIcon(att.type);
                        const isImage = att.type.startsWith('image/');
                        return (
                          <div key={att.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                            {isImage ? (
                              <img src={att.dataUrl} alt={att.name} className="w-5 h-5 rounded object-cover" />
                            ) : (
                              <FIcon size={14} className="text-gray-400 shrink-0" />
                            )}
                            <span className="text-gray-600 truncate max-w-[100px]">{att.name}</span>
                            <span className="text-gray-400">{formatFileSize(att.size)}</span>
                            <button onClick={() => setPreviewAttachment(att)} className="text-gray-400 hover:text-primary-600 p-0.5"><Eye size={12} /></button>
                            <a href={att.dataUrl} download={att.name} onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-primary-600 p-0.5"><Download size={12} /></a>
                            <button onClick={() => setDeleteAttachment({ recordId: record.id, attachmentId: att.id, name: att.name })} className="text-gray-400 hover:text-danger-500 p-0.5"><X size={12} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sub.history.length === 0 && sub.scheduled.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No service history yet.</p>
          <p className="text-xs text-gray-400 mt-1">Log your first service or schedule one.</p>
        </div>
      )}

      {/* Log Service Modal */}
      <Modal open={showAddRecord} onClose={() => setShowAddRecord(false)} title="Log Service">
        <form onSubmit={handleAddRecord} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={recordNotes} onChange={e => setRecordNotes(e.target.value)} placeholder="What was done..." rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($) <span className="text-gray-400 font-normal">optional</span></label>
            <input type="number" step="0.01" value={recordCost} onChange={e => setRecordCost(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Receipts / Attachments <span className="text-gray-400 font-normal">optional</span></label>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 font-medium hover:border-primary-400 hover:text-primary-600 transition">
              <Paperclip size={16} /> Attach Files
            </button>
            <p className="text-[11px] text-gray-400 mt-1">Images, PDFs, or email files (.eml)</p>
            {recordAttachments.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {recordAttachments.map(att => {
                  const FIcon = getFileIcon(att.type);
                  const isImage = att.type.startsWith('image/');
                  return (
                    <div key={att.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      {isImage ? <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded object-cover shrink-0" /> : <FIcon size={18} className="text-gray-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 truncate text-xs font-medium">{att.name}</p>
                        <p className="text-gray-400 text-[11px]">{formatFileSize(att.size)}</p>
                      </div>
                      <button type="button" onClick={() => setRecordAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-gray-400 hover:text-danger-500 p-1 shrink-0"><X size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">Save Record</button>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Service">
        <form onSubmit={handleSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={scheduleNotes} onChange={e => setScheduleNotes(e.target.value)} placeholder="Details about the service..." rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">Schedule</button>
        </form>
      </Modal>

      {/* Edit Service Modal */}
      <Modal open={showEditSub} onClose={() => setShowEditSub(false)} title="Edit Service">
        <form onSubmit={handleEditSub} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
            <input type="text" value={editSubName} onChange={e => setEditSubName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repeat Every <span className="text-gray-400 font-normal">optional</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={editSubInterval}
                onChange={e => setEditSubInterval(e.target.value)}
                placeholder="e.g. 6"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <select
                value={editSubIntervalUnit}
                onChange={e => setEditSubIntervalUnit(e.target.value as IntervalUnit)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Leave blank if this service has no fixed cadence.</p>
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">Save Changes</button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Service">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Delete <strong>{sub.name}</strong> and all its history? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleDelete} className="flex-1 py-2.5 bg-danger-600 text-white rounded-lg text-sm font-semibold hover:bg-danger-500 transition">Delete</button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={previewAttachment !== null} onClose={() => setPreviewAttachment(null)} title={previewAttachment?.name || 'Preview'}>
        {previewAttachment && (
          <div className="space-y-3">
            {previewAttachment.type.startsWith('image/') ? (
              <img src={previewAttachment.dataUrl} alt={previewAttachment.name} className="w-full h-auto rounded-lg" />
            ) : previewAttachment.type === 'application/pdf' ? (
              <iframe src={previewAttachment.dataUrl} className="w-full h-[60vh] rounded-lg border border-gray-200" title={previewAttachment.name} />
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <File size={48} className="text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">{previewAttachment.name}</p>
                <p className="text-xs text-gray-500 mt-1">{formatFileSize(previewAttachment.size)}</p>
              </div>
            )}
            <a href={previewAttachment.dataUrl} download={previewAttachment.name} className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition">
              <Download size={16} /> Download
            </a>
          </div>
        )}
      </Modal>

      {/* Delete Scheduled Service Confirmation */}
      <Modal open={deleteScheduleId !== null} onClose={() => setDeleteScheduleId(null)} title="Delete Scheduled Service">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete this scheduled service? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteScheduleId(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={() => { if (deleteScheduleId) { dispatch({ type: 'DELETE_SCHEDULED_SERVICE', payload: { itemId: item.id, subItemId: sub.id, scheduleId: deleteScheduleId } }); setDeleteScheduleId(null); } }} className="flex-1 py-2.5 bg-danger-600 text-white rounded-lg text-sm font-semibold hover:bg-danger-500 transition">Delete</button>
          </div>
        </div>
      </Modal>

      {/* Delete Service Record Confirmation */}
      <Modal open={deleteRecordId !== null} onClose={() => setDeleteRecordId(null)} title="Delete Service Record">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete this service record and all its attachments? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteRecordId(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={() => { if (deleteRecordId) { dispatch({ type: 'DELETE_SERVICE_RECORD', payload: { itemId: item.id, subItemId: sub.id, recordId: deleteRecordId } }); setDeleteRecordId(null); } }} className="flex-1 py-2.5 bg-danger-600 text-white rounded-lg text-sm font-semibold hover:bg-danger-500 transition">Delete</button>
          </div>
        </div>
      </Modal>

      {/* Delete Attachment Confirmation */}
      <Modal open={deleteAttachment !== null} onClose={() => setDeleteAttachment(null)} title="Remove Attachment">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Remove <strong>{deleteAttachment?.name}</strong>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteAttachment(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={() => { if (deleteAttachment) { dispatch({ type: 'DELETE_ATTACHMENT', payload: { itemId: item.id, subItemId: sub.id, recordId: deleteAttachment.recordId, attachmentId: deleteAttachment.attachmentId } }); setDeleteAttachment(null); } }} className="flex-1 py-2.5 bg-danger-600 text-white rounded-lg text-sm font-semibold hover:bg-danger-500 transition">Remove</button>
          </div>
        </div>
      </Modal>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.eml,.msg" onChange={(e) => { handleFiles(e.target.files, 'new'); e.target.value = ''; }} className="hidden" />
      <input ref={attachFileInputRef} type="file" multiple accept="image/*,.pdf,.eml,.msg" onChange={(e) => { if (attachToRecord) { handleFiles(e.target.files, attachToRecord); setAttachToRecord(null); } e.target.value = ''; }} className="hidden" />
    </div>
  );
}
