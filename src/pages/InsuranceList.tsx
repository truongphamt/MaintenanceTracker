import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Home, Car, User, Heart, Activity, Wrench,
  Plus, Search, ChevronRight, AlertTriangle, X, Filter,
  ArrowDownAZ, RotateCcw, Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import SortableList, { ReorderButton } from '../components/SortableList';
import { formatDate, daysFromNow } from '../utils';
import type { InsuranceType } from '../types';

const typeConfig: Record<InsuranceType, { icon: typeof Shield; label: string; color: string }> = {
  home: { icon: Home, label: 'Home', color: 'bg-blue-50 text-blue-600' },
  auto: { icon: Car, label: 'Auto', color: 'bg-purple-50 text-purple-600' },
  life: { icon: Heart, label: 'Life', color: 'bg-pink-50 text-pink-600' },
  health: { icon: Activity, label: 'Health', color: 'bg-green-50 text-green-600' },
  other: { icon: Wrench, label: 'Other', color: 'bg-gray-100 text-gray-600' },
};

const categoryIcons: Record<string, typeof Home> = {
  home: Home,
  car: Car,
  person: User,
  other: Wrench,
};

type SortMode = 'default' | 'name' | 'expiration';

export default function InsuranceList() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [itemFilter, setItemFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<InsuranceType | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const filtered = useMemo(() => {
    let result = state.policies;

    if (itemFilter !== 'all') {
      result = result.filter(p => p.linkedItemIds?.includes(itemFilter));
    }

    if (typeFilter !== 'all') {
      result = result.filter(p => p.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.provider.toLowerCase().includes(q) ||
        p.policyNumber.toLowerCase().includes(q) ||
        p.holderName.toLowerCase().includes(q) ||
        (p.agentName && p.agentName.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }

    if (sortMode === 'name') {
      result = [...result].sort((a, b) => a.provider.localeCompare(b.provider));
    } else if (sortMode === 'expiration') {
      result = [...result].sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
    }

    return result;
  }, [state.policies, itemFilter, typeFilter, search, sortMode]);

  const typeCounts = useMemo(() => {
    const source = itemFilter === 'all' ? state.policies : state.policies.filter(p => p.linkedItemIds?.includes(itemFilter));
    const counts: Record<string, number> = {};
    source.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return counts;
  }, [state.policies, itemFilter]);

  if (state.policies.length === 0) {
    return (
      <EmptyState
        icon={<Shield size={48} />}
        title="No Insurance Policies"
        description="Add your insurance cards and policies to keep them organized and accessible."
        action={
          <Link
            to="/insurance/add"
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
          >
            Add Policy
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Insurance</h2>
        <Link
          to="/insurance/add"
          className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition shadow-sm"
        >
          <Plus size={16} /> Add Policy
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search policies, providers, numbers..."
          className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Item filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setItemFilter('all')}
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
          const count = state.policies.filter(p => p.linkedItemIds?.includes(item.id)).length;
          return (
            <button
              key={item.id}
              onClick={() => setItemFilter(itemFilter === item.id ? 'all' : item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${
                itemFilter === item.id
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              <Icon size={12} />
              {item.name}
              <span className="text-gray-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Type filter chips + Sort + Reorder */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-400 shrink-0" />
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
            typeFilter === 'all'
              ? 'bg-primary-50 text-primary-700 border-primary-300'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          }`}
        >
          All
        </button>
        {(['home', 'auto', 'health', 'life', 'other'] as InsuranceType[]).map(t => {
          const count = typeCounts[t] || 0;
          if (count === 0 && typeFilter !== t) return null;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                typeFilter === t
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {typeConfig[t].label}{count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}

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
              {sortMode === 'default' ? 'Sort' : sortMode === 'name' ? 'A-Z' : 'Expiring'}
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 w-48 overflow-hidden">
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
                    onClick={() => { setSortMode('expiration'); setShowSortMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition ${
                      sortMode === 'expiration' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={14} />
                    Sort by Expiration
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

      {/* Policy cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-500">No policies match your filters.</p>
          <button
            onClick={() => { setSearch(''); setTypeFilter('all'); setItemFilter('all'); setSortMode('default'); }}
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
          onReorder={(newIds) => dispatch({ type: 'REORDER_POLICIES', payload: newIds })}
          className="space-y-2"
          renderItem={(policy, isReorderMode) => {
            const cfg = typeConfig[policy.type];
            const Icon = cfg.icon;
            const daysLeft = daysFromNow(policy.expirationDate);
            const isExpired = daysLeft < 0;
            const expiringSoon = daysLeft >= 0 && daysLeft <= 30;

            const content = (
              <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition active:bg-gray-50">
                <div className={`p-2.5 rounded-lg ${cfg.color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{policy.provider}</h3>
                    {isExpired && (
                      <span className="text-[10px] font-semibold text-danger-600 bg-danger-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                        <AlertTriangle size={10} /> Expired
                      </span>
                    )}
                    {expiringSoon && (
                      <span className="text-[10px] font-semibold text-warning-600 bg-warning-50 px-1.5 py-0.5 rounded-full shrink-0">
                        Exp. Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {cfg.label} &middot; #{policy.policyNumber}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Expires {formatDate(policy.expirationDate)}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </div>
            );

            if (isReorderMode) return content;

            return (
              <div onClick={() => navigate(`/insurance/${policy.id}`)} className="cursor-pointer">
                {content}
              </div>
            );
          }}
        />
      )}

      <p className="text-xs text-gray-400 text-center pt-1">
        {filtered.length} of {state.policies.length} policies
      </p>
    </div>
  );
}
