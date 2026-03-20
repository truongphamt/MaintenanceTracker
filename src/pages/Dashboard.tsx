import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Car, Wrench, ChevronRight, Filter, LayoutDashboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import SortableList, { ReorderButton } from '../components/SortableList';
import {
  getServiceStatus,
  getWorstStatus,
  getLastServiceDate,
  getNextDueDate,
  formatDate,
} from '../utils';

type FilterType = 'all' | 'overdue' | 'due-soon' | 'current';

const categoryIcons = {
  home: <Home size={20} />,
  car: <Car size={20} />,
  other: <Wrench size={20} />,
};

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [reorderMode, setReorderMode] = useState(false);

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

          const content = (
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition active:bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  item.category === 'home' ? 'bg-blue-50 text-blue-600' :
                  item.category === 'car' ? 'bg-purple-50 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {categoryIcons[item.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.subItems.length} tracked services</p>
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
            <div onClick={() => navigate(`/items/${item.id}`)} className="cursor-pointer">
              {content}
            </div>
          );
        }}
      />
    </div>
  );
}
