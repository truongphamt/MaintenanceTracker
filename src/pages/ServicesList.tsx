import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wrench, Clock, Calendar, Home, Car, ChevronRight,
  Search, X, Filter, List, Plus, ArrowDownAZ, AlertTriangle, RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import SortableList, { ReorderButton } from '../components/SortableList';
import Modal from '../components/Modal';
import {
  getServiceStatus,
  getLastServiceDate,
  getNextDueDate,
  formatDate,
  daysFromNow,
} from '../utils';
import type { SubItem, MaintenanceItem } from '../types';

interface FlatService {
  id: string;
  sub: SubItem;
  item: MaintenanceItem;
}

type StatusFilter = 'all' | 'overdue' | 'due-soon' | 'current' | 'no-history';
type SortMode = 'default' | 'name' | 'urgency';

const categoryIcons: Record<string, typeof Home> = {
  home: Home,
  car: Car,
  other: Wrench,
};

const statusPriority: Record<string, number> = {
  overdue: 0,
  'due-soon': 1,
  current: 2,
  'no-history': 3,
};

export default function ServicesList() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialItemFilter = searchParams.get('item') || 'all';
  const [itemFilter, setItemFilter] = useState(initialItemFilter);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceItemId, setNewServiceItemId] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceInterval, setNewServiceInterval] = useState('');

  useEffect(() => {
    const param = searchParams.get('item');
    if (param && state.items.some(i => i.id === param)) {
      setItemFilter(param);
    }
  }, [searchParams, state.items]);

  const updateItemFilter = (value: string) => {
    setItemFilter(value);
    if (value === 'all') {
      searchParams.delete('item');
    } else {
      searchParams.set('item', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const allServices: FlatService[] = useMemo(() => {
    const result: FlatService[] = [];
    state.items.forEach(item => {
      item.subItems.forEach(sub => {
        result.push({ id: `${item.id}-${sub.id}`, sub, item });
      });
    });
    return result;
  }, [state.items]);

  const filtered = useMemo(() => {
    let result = allServices;

    if (itemFilter !== 'all') {
      result = result.filter(s => s.item.id === itemFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(s => getServiceStatus(s.sub) === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.sub.name.toLowerCase().includes(q) ||
        s.item.name.toLowerCase().includes(q)
      );
    }

    if (sortMode === 'name') {
      result = [...result].sort((a, b) => a.sub.name.localeCompare(b.sub.name));
    } else if (sortMode === 'urgency') {
      result = [...result].sort((a, b) => {
        const pa = statusPriority[getServiceStatus(a.sub)] ?? 9;
        const pb = statusPriority[getServiceStatus(b.sub)] ?? 9;
        if (pa !== pb) return pa - pb;
        const da = getNextDueDate(a.sub);
        const db = getNextDueDate(b.sub);
        if (da && db) return new Date(da).getTime() - new Date(db).getTime();
        if (da) return -1;
        if (db) return 1;
        return 0;
      });
    }

    return result;
  }, [allServices, itemFilter, statusFilter, search, sortMode]);

  const statusCounts = useMemo(() => {
    const source = itemFilter === 'all' ? allServices : allServices.filter(s => s.item.id === itemFilter);
    const counts = { overdue: 0, 'due-soon': 0, current: 0, 'no-history': 0 };
    source.forEach(s => {
      const st = getServiceStatus(s.sub);
      if (st in counts) counts[st as keyof typeof counts]++;
    });
    return counts;
  }, [allServices, itemFilter]);

  const activeItem = itemFilter !== 'all' ? state.items.find(i => i.id === itemFilter) : null;

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceItemId) return;
    dispatch({
      type: 'ADD_SUB_ITEM',
      payload: {
        itemId: newServiceItemId,
        name: newServiceName.trim(),
        intervalDays: newServiceInterval ? parseInt(newServiceInterval) : undefined,
      },
    });
    setNewServiceName('');
    setNewServiceInterval('');
    setNewServiceItemId('');
    setShowAddService(false);
  };

  const openAddService = () => {
    const defaultItem = itemFilter !== 'all' ? itemFilter : (state.items[0]?.id || '');
    setNewServiceItemId(defaultItem);
    setNewServiceName('');
    setNewServiceInterval('');
    setShowAddService(true);
  };

  if (allServices.length === 0) {
    return (
      <>
        <EmptyState
          icon={<List size={48} />}
          title="No Services Yet"
          description="Add items and services to start tracking maintenance."
          action={
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/add')}
                className="bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
              >
                Add Item
              </button>
            </div>
          }
        />
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {activeItem ? `${activeItem.name} Services` : 'All Services'}
        </h2>
        <button
          onClick={openAddService}
          className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition shadow-sm"
        >
          <Plus size={16} />
          Add Service
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search services..."
          className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Item filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => updateItemFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${
            itemFilter === 'all'
              ? 'bg-primary-50 text-primary-700 border-primary-300'
              : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          All Items
        </button>
        {state.items.map(item => {
          const Icon = categoryIcons[item.category] || Wrench;
          return (
            <button
              key={item.id}
              onClick={() => updateItemFilter(itemFilter === item.id ? 'all' : item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${
                itemFilter === item.id
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              <Icon size={12} />
              {item.name}
              <span className="text-gray-400">({item.subItems.length})</span>
            </button>
          );
        })}
      </div>

      {/* Status filter chips + Sort + Reorder */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-400 shrink-0" />
        {([
          { key: 'all', label: 'All', count: filtered.length },
          { key: 'overdue', label: 'Overdue', count: statusCounts.overdue },
          { key: 'due-soon', label: 'Due Soon', count: statusCounts['due-soon'] },
          { key: 'current', label: 'Current', count: statusCounts.current },
          { key: 'no-history', label: 'No History', count: statusCounts['no-history'] },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
              statusFilter === f.key
                ? 'bg-primary-50 text-primary-700 border-primary-300'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            {f.label}{f.key !== 'all' && f.count > 0 ? ` (${f.count})` : ''}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          {/* Sort button */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                sortMode !== 'default'
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              <ArrowDownAZ size={14} />
              {sortMode === 'default' ? 'Sort' : sortMode === 'name' ? 'A-Z' : 'Urgent'}
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 w-44 overflow-hidden">
                  <button
                    onClick={() => { setSortMode('name'); setShowSortMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition ${
                      sortMode === 'name' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowDownAZ size={14} />
                    Sort by Name
                  </button>
                  <button
                    onClick={() => { setSortMode('urgency'); setShowSortMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition ${
                      sortMode === 'urgency' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <AlertTriangle size={14} />
                    Sort by Urgency
                  </button>
                  {sortMode !== 'default' && (
                    <button
                      onClick={() => { setSortMode('default'); setShowSortMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left text-gray-500 hover:bg-gray-50 border-t border-gray-100 transition"
                    >
                      <RotateCcw size={14} />
                      Reset to Default
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <ReorderButton active={reorderMode} onToggle={() => setReorderMode(!reorderMode)} itemCount={filtered.length} />
        </div>
      </div>

      {/* Services list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-500">No services match your filters.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); updateItemFilter('all'); setSortMode('default'); }}
            className="text-sm text-primary-600 mt-1 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <SortableList
          isReorderMode={reorderMode}
          showButton={false}
          items={filtered}
          onReorder={() => {}}
          className="space-y-2"
          renderItem={({ sub, item }) => {
            const status = getServiceStatus(sub);
            const lastDate = getLastServiceDate(sub);
            const nextDue = getNextDueDate(sub);
            const Icon = categoryIcons[item.category] || Wrench;

            return (
              <div
                onClick={() => navigate(`/service/${item.id}/${sub.id}`)}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3.5 hover:border-primary-300 transition active:bg-gray-50 cursor-pointer"
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  item.category === 'home' ? 'bg-blue-50 text-blue-600' :
                  item.category === 'car' ? 'bg-purple-50 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-900 text-sm truncate">{sub.name}</span>
                    <StatusBadge status={status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="truncate text-gray-400">{item.name}</span>
                    {lastDate && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock size={11} />
                        {formatDate(lastDate)}
                      </span>
                    )}
                    {nextDue && (
                      <span className={`flex items-center gap-1 shrink-0 ${
                        daysFromNow(nextDue) < 0 ? 'text-danger-600 font-medium' :
                        daysFromNow(nextDue) <= 30 ? 'text-warning-600' : ''
                      }`}>
                        <Calendar size={11} />
                        {formatDate(nextDue)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </div>
            );
          }}
        />
      )}

      <p className="text-xs text-gray-400 text-center pt-1">
        {filtered.length} of {allServices.length} services
      </p>

      {/* Add Service Modal */}
      <Modal open={showAddService} onClose={() => setShowAddService(false)} title="Add Service">
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Item</label>
            <select
              value={newServiceItemId}
              onChange={e => setNewServiceItemId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              required
            >
              <option value="">Select an item...</option>
              {state.items.map(it => (
                <option key={it.id} value={it.id}>{it.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
            <input
              type="text"
              value={newServiceName}
              onChange={e => setNewServiceName(e.target.value)}
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
              value={newServiceInterval}
              onChange={e => setNewServiceInterval(e.target.value)}
              placeholder="e.g. 90 for every 3 months"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition">
            Add Service
          </button>
        </form>
      </Modal>
    </div>
  );
}
