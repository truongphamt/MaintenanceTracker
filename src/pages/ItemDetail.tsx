import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Edit2, Clock, Calendar,
  DollarSign, ChevronDown, ChevronUp, Home, Car, Wrench, Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import {
  getServiceStatus,
  getLastServiceDate,
  getNextDueDate,
  formatDate,
  daysFromNow,
} from '../utils';

type DetailFilter = 'all' | 'overdue' | 'due-soon' | 'current';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const item = state.items.find(i => i.id === id);

  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [filter, setFilter] = useState<DetailFilter>('all');
  const [showAddSub, setShowAddSub] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState<string | null>(null);
  const [showEditItem, setShowEditItem] = useState(false);
  const [showEditSub, setShowEditSub] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [subName, setSubName] = useState('');
  const [subInterval, setSubInterval] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordNotes, setRecordNotes] = useState('');
  const [recordCost, setRecordCost] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'home' | 'car' | 'other'>('home');
  const [editSubName, setEditSubName] = useState('');
  const [editSubInterval, setEditSubInterval] = useState('');

  const filteredSubs = useMemo(() => {
    if (!item) return [];
    if (filter === 'all') return item.subItems;
    return item.subItems.filter(sub => {
      const status = getServiceStatus(sub);
      return status === filter;
    });
  }, [item, filter]);

  if (!item) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Item not found</p>
        <Link to="/items" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
          Back to items
        </Link>
      </div>
    );
  }

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    dispatch({
      type: 'ADD_SUB_ITEM',
      payload: {
        itemId: item.id,
        name: subName.trim(),
        intervalDays: subInterval ? parseInt(subInterval) : undefined,
      },
    });
    setSubName('');
    setSubInterval('');
    setShowAddSub(false);
  };

  const handleAddRecord = (subId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'ADD_SERVICE_RECORD',
      payload: {
        itemId: item.id,
        subItemId: subId,
        date: recordDate,
        notes: recordNotes,
        cost: recordCost ? parseFloat(recordCost) : undefined,
      },
    });
    setRecordDate(new Date().toISOString().split('T')[0]);
    setRecordNotes('');
    setRecordCost('');
    setShowAddRecord(null);
  };

  const handleSchedule = (subId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'ADD_SCHEDULED_SERVICE',
      payload: {
        itemId: item.id,
        subItemId: subId,
        dueDate: scheduleDate,
        notes: scheduleNotes,
      },
    });
    setScheduleDate('');
    setScheduleNotes('');
    setShowSchedule(null);
  };

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_ITEM',
      payload: { id: item.id, name: editName, category: editCategory },
    });
    setShowEditItem(false);
  };

  const handleEditSub = (subId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_SUB_ITEM',
      payload: {
        itemId: item.id,
        subItemId: subId,
        name: editSubName,
        intervalDays: editSubInterval ? parseInt(editSubInterval) : undefined,
      },
    });
    setShowEditSub(null);
  };

  const handleDeleteItem = () => {
    dispatch({ type: 'DELETE_ITEM', payload: item.id });
    navigate('/items');
  };

  const categoryIcon = item.category === 'home' ? <Home size={20} /> :
                        item.category === 'car' ? <Car size={20} /> :
                        <Wrench size={20} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft size={20} />
        </button>
        <div className={`p-2 rounded-lg ${
          item.category === 'home' ? 'bg-blue-50 text-blue-600' :
          item.category === 'car' ? 'bg-purple-50 text-purple-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {categoryIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h2>
          <p className="text-xs text-gray-500 capitalize">{item.category === 'car' ? 'Vehicle' : item.category}</p>
        </div>
        <button
          onClick={() => { setEditName(item.name); setEditCategory(item.category); setShowEditItem(true); }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-gray-400 hover:text-danger-600 p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        {(['all', 'overdue', 'due-soon', 'current'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              filter === f
                ? 'bg-primary-50 text-primary-700 border-primary-300'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {f === 'all' ? 'All' : f === 'due-soon' ? 'Due Soon' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {item.subItems.length === 0 ? (
        <EmptyState
          icon={<Wrench size={40} />}
          title="No Services Yet"
          description="Add services you want to track for this item."
          action={
            <button
              onClick={() => setShowAddSub(true)}
              className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
            >
              Add Service
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredSubs.map(sub => {
            const status = getServiceStatus(sub);
            const lastDate = getLastServiceDate(sub);
            const nextDue = getNextDueDate(sub);
            const isExpanded = expandedSub === sub.id;

            return (
              <div key={sub.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm truncate">{sub.name}</span>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {lastDate && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Last: {formatDate(lastDate)}
                        </span>
                      )}
                      {nextDue && (
                        <span className={`flex items-center gap-1 ${
                          daysFromNow(nextDue) < 0 ? 'text-danger-600 font-medium' :
                          daysFromNow(nextDue) <= 30 ? 'text-warning-600' : ''
                        }`}>
                          <Calendar size={12} />
                          Due: {formatDate(nextDue)}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    {sub.intervalDays && (
                      <p className="text-xs text-gray-500">
                        Service interval: every {sub.intervalDays} days
                      </p>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => { setRecordDate(new Date().toISOString().split('T')[0]); setRecordNotes(''); setRecordCost(''); setShowAddRecord(sub.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition"
                      >
                        <Plus size={14} /> Log Service
                      </button>
                      <button
                        onClick={() => { setScheduleDate(''); setScheduleNotes(''); setShowSchedule(sub.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
                      >
                        <Calendar size={14} /> Schedule
                      </button>
                      <button
                        onClick={() => { setEditSubName(sub.name); setEditSubInterval(sub.intervalDays?.toString() || ''); setShowEditSub(sub.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'DELETE_SUB_ITEM', payload: { itemId: item.id, subItemId: sub.id } })}
                        className="flex items-center gap-1 px-3 py-1.5 text-danger-600 rounded-lg text-xs font-medium hover:bg-danger-50 transition"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>

                    {sub.scheduled.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Scheduled</h4>
                        {sub.scheduled.map(s => (
                          <div key={s.id} className="flex items-center justify-between py-1.5 text-sm">
                            <div>
                              <span className={`font-medium ${daysFromNow(s.dueDate) < 0 ? 'text-danger-600' : 'text-gray-700'}`}>
                                {formatDate(s.dueDate)}
                              </span>
                              {s.notes && <span className="text-gray-500 ml-2">- {s.notes}</span>}
                            </div>
                            <button
                              onClick={() => dispatch({ type: 'DELETE_SCHEDULED_SERVICE', payload: { itemId: item.id, subItemId: sub.id, scheduleId: s.id } })}
                              className="text-gray-300 hover:text-danger-500 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {sub.history.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">History</h4>
                        <div className="space-y-1.5">
                          {[...sub.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                            <div key={record.id} className="flex items-start justify-between py-1.5 text-sm border-b border-gray-50 last:border-0">
                              <div>
                                <span className="font-medium text-gray-700">{formatDate(record.date)}</span>
                                {record.notes && <p className="text-gray-500 text-xs mt-0.5">{record.notes}</p>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {record.cost != null && (
                                  <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                    <DollarSign size={12} />{record.cost.toFixed(2)}
                                  </span>
                                )}
                                <button
                                  onClick={() => dispatch({ type: 'DELETE_SERVICE_RECORD', payload: { itemId: item.id, subItemId: sub.id, recordId: record.id } })}
                                  className="text-gray-300 hover:text-danger-500 p-1"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setShowAddSub(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 font-medium hover:border-primary-400 hover:text-primary-600 transition"
      >
        <Plus size={16} /> Add Service to Track
      </button>

      {/* Add Sub-Item Modal */}
      <Modal open={showAddSub} onClose={() => setShowAddSub(false)} title="Add Service">
        <form onSubmit={handleAddSub} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
            <input
              type="text"
              value={subName}
              onChange={e => setSubName(e.target.value)}
              placeholder="e.g. Oil Change, Roof Inspection"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interval (days) <span className="text-gray-400 font-normal">optional</span>
            </label>
            <input
              type="number"
              value={subInterval}
              onChange={e => setSubInterval(e.target.value)}
              placeholder="e.g. 90 for every 3 months"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">
            Add Service
          </button>
        </form>
      </Modal>

      {/* Add Record Modal */}
      <Modal open={showAddRecord !== null} onClose={() => setShowAddRecord(null)} title="Log Service">
        <form onSubmit={showAddRecord ? handleAddRecord(showAddRecord) : e => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={recordDate}
              onChange={e => setRecordDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={recordNotes}
              onChange={e => setRecordNotes(e.target.value)}
              placeholder="What was done..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost ($) <span className="text-gray-400 font-normal">optional</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={recordCost}
              onChange={e => setRecordCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">
            Save Record
          </button>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal open={showSchedule !== null} onClose={() => setShowSchedule(null)} title="Schedule Service">
        <form onSubmit={showSchedule ? handleSchedule(showSchedule) : e => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={scheduleNotes}
              onChange={e => setScheduleNotes(e.target.value)}
              placeholder="Details about the service..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">
            Schedule
          </button>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal open={showEditItem} onClose={() => setShowEditItem(false)} title="Edit Item">
        <form onSubmit={handleEditItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={editCategory}
              onChange={e => setEditCategory(e.target.value as 'home' | 'car' | 'other')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="home">Home</option>
              <option value="car">Vehicle</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Edit Sub-Item Modal */}
      <Modal open={showEditSub !== null} onClose={() => setShowEditSub(null)} title="Edit Service">
        <form onSubmit={showEditSub ? handleEditSub(showEditSub) : e => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
            <input
              type="text"
              value={editSubName}
              onChange={e => setEditSubName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interval (days) <span className="text-gray-400 font-normal">optional</span>
            </label>
            <input
              type="number"
              value={editSubInterval}
              onChange={e => setEditSubInterval(e.target.value)}
              placeholder="e.g. 90"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Item">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{item.name}</strong>? This will remove all associated services and history. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteItem}
              className="flex-1 py-2.5 bg-danger-600 text-white rounded-lg text-sm font-semibold hover:bg-danger-500 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
