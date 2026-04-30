import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Car, User, Wrench, ChevronRight, Filter, LayoutDashboard, Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import SortableList, { ReorderButton } from '../components/SortableList';
import type { ItemCategory } from '../types';
import {
  getServiceStatus,
  getWorstStatus,
  getLastServiceDate,
  formatDate,
} from '../utils';

type FilterType = 'all' | 'overdue' | 'due-soon' | 'current';

const categoryIcons: Record<ItemCategory, React.ReactNode> = {
  home: <Home size={20} />,
  car: <Car size={20} />,
  person: <User size={20} />,
  other: <Wrench size={20} />,
};

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [reorderMode, setReorderMode] = useState(false);
  const [showEditItem, setShowEditItem] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('home');

  const stats = useMemo(() => {
    let overdue = 0, dueSoon = 0, current = 0, total = 0;
    state.items.forEach(item => {
      item.subItems.forEach(sub => {
        total++;
        const s = getServiceStatus(sub);
        if (s === 'overdue') overdue++;
        else if (s === 'due-soon') dueSoon++;
        else if (s === 'current') current++;
      });
    });
    return { overdue, dueSoon, current, total };
  }, [state.items]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return state.items;
    return state.items.filter(item => {
      return item.subItems.some(sub => {
        const status = getServiceStatus(sub);
        if (filter === 'overdue') return status === 'overdue';
        if (filter === 'due-soon') return status === 'due-soon';
        if (filter === 'current') return status === 'current';
        return true;
      });
    });
  }, [state.items, filter]);

  if (state.items.length === 0) {
    return (
      <EmptyState
        icon={<LayoutDashboard size={48} />}
        title="Welcome to HomeBase"
        description="Start by adding your first home, car, or other item to track maintenance."
        action={
          <Link
            to="/add"
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
          >
            Add Your First Item
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <Link
          to="/add"
          className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition shadow-sm"
        >
          <Plus size={16} />
          Add Item
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter(f => f === 'overdue' ? 'all' : 'overdue')}
          className={`rounded-xl p-3 text-center transition border ${
            filter === 'overdue' ? 'border-danger-500 bg-danger-50' : 'border-gray-200 bg-white'
          }`}
        >
          <p className="text-2xl font-bold text-danger-600">{stats.overdue}</p>
          <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
        </button>
        <button
          onClick={() => setFilter(f => f === 'due-soon' ? 'all' : 'due-soon')}
          className={`rounded-xl p-3 text-center transition border ${
            filter === 'due-soon' ? 'border-warning-500 bg-warning-50' : 'border-gray-200 bg-white'
          }`}
        >
          <p className="text-2xl font-bold text-warning-600">{stats.dueSoon}</p>
          <p className="text-xs text-gray-500 mt-0.5">Due Soon</p>
        </button>
        <button
          onClick={() => setFilter(f => f === 'current' ? 'all' : 'current')}
          className={`rounded-xl p-3 text-center transition border ${
            filter === 'current' ? 'border-success-500 bg-success-50' : 'border-gray-200 bg-white'
          }`}
        >
          <p className="text-2xl font-bold text-success-600">{stats.current}</p>
          <p className="text-xs text-gray-500 mt-0.5">Current</p>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {filter !== 'all' ? (
          <>
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">
              Showing: <span className="font-medium text-gray-700 capitalize">{filter === 'due-soon' ? 'Due Soon' : filter}</span>
            </span>
            <button onClick={() => setFilter('all')} className="text-xs text-primary-600 hover:underline">
              Clear
            </button>
          </>
        ) : (
          <span className="text-xs text-gray-400">{filteredItems.length} items</span>
        )}
        <div className="ml-auto">
          <ReorderButton active={reorderMode} onToggle={() => setReorderMode(!reorderMode)} itemCount={filteredItems.length} />
        </div>
      </div>

      <SortableList
        isReorderMode={reorderMode}
        showButton={false}
        items={filteredItems}
        onReorder={(newIds) => dispatch({ type: 'REORDER_ITEMS', payload: newIds })}
        className="space-y-3"
        renderItem={(item, isReorderMode) => {
          const worstStatus = getWorstStatus(item);
          const relevantSubs = filter === 'all'
            ? item.subItems
            : item.subItems.filter(sub => {
                const s = getServiceStatus(sub);
                return filter === 'overdue' ? s === 'overdue' :
                       filter === 'due-soon' ? s === 'due-soon' :
                       s === 'current';
              });

          const linkedPolicies = state.policies.filter(
            p => p.linkedItemIds?.includes(item.id)
          );

          const content = (
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition active:bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  item.category === 'home' ? 'bg-blue-50 text-blue-600' :
                  item.category === 'car' ? 'bg-purple-50 text-purple-600' :
                  item.category === 'person' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {categoryIcons[item.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">{item.subItems.length} tracked services</span>
                    {linkedPolicies.map(policy => (
                      <span
                        key={policy.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/insurance/${policy.id}`);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full hover:bg-primary-100 cursor-pointer transition"
                      >
                        <Shield size={10} />
                        {policy.provider}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditName(item.name);
                      setEditCategory(item.category);
                      setShowEditItem(item.id);
                    }}
                    className="text-gray-300 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                    title="Edit item"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(item.id);
                    }}
                    className="text-gray-300 hover:text-danger-600 p-1.5 rounded-lg hover:bg-danger-50 transition"
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <StatusBadge status={worstStatus} />
                <ChevronRight size={16} className="text-gray-300" />
              </div>

              {relevantSubs.length > 0 && (
                <div className="space-y-1.5 border-t border-gray-100 pt-2.5">
                  {relevantSubs.slice(0, 4).map(sub => {
                    const status = getServiceStatus(sub);
                    const lastDate = getLastServiceDate(sub);
                    return (
                      <div key={sub.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 truncate flex-1">{sub.name}</span>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          {lastDate && (
                            <span className="text-xs text-gray-400">
                              Last: {formatDate(lastDate)}
                            </span>
                          )}
                          <StatusBadge status={status} />
                        </div>
                      </div>
                    );
                  })}
                  {relevantSubs.length > 4 && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      +{relevantSubs.length - 4} more
                    </p>
                  )}
                </div>
              )}
            </div>
          );

          if (isReorderMode) return content;

          return (
            <div onClick={() => navigate(`/services?item=${item.id}`)} className="cursor-pointer">
              {content}
            </div>
          );
        }}
      />

      {/* Edit Item Modal */}
      <Modal open={showEditItem !== null} onClose={() => setShowEditItem(null)} title="Edit Item">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (showEditItem) {
            dispatch({ type: 'UPDATE_ITEM', payload: { id: showEditItem, name: editName, category: editCategory } });
            setShowEditItem(null);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={editCategory} onChange={e => setEditCategory(e.target.value as ItemCategory)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
              <option value="home">Home</option>
              <option value="car">Vehicle</option>
              <option value="person">Person</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">Save Changes</button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteConfirm !== null} onClose={() => setShowDeleteConfirm(null)} title="Delete Item">
        {showDeleteConfirm && (() => {
          const delItem = state.items.find(i => i.id === showDeleteConfirm);
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <strong>{delItem?.name}</strong>? This will remove all associated services and history. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={() => { dispatch({ type: 'DELETE_ITEM', payload: showDeleteConfirm }); setShowDeleteConfirm(null); }} className="flex-1 py-2.5 bg-danger-600 text-white rounded-lg text-sm font-semibold hover:bg-danger-500 transition">Delete</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
