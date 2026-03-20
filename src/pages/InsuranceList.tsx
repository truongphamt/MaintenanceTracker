import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Home, Car, Heart, Activity, Wrench,
  Plus, Search, ChevronRight, AlertTriangle, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { formatDate, daysFromNow } from '../utils';
import type { InsuranceType } from '../types';

const typeConfig: Record<InsuranceType, { icon: typeof Shield; label: string; color: string }> = {
  home: { icon: Home, label: 'Home', color: 'bg-blue-50 text-blue-600' },
  auto: { icon: Car, label: 'Auto', color: 'bg-purple-50 text-purple-600' },
  life: { icon: Heart, label: 'Life', color: 'bg-pink-50 text-pink-600' },
  health: { icon: Activity, label: 'Health', color: 'bg-green-50 text-green-600' },
  other: { icon: Wrench, label: 'Other', color: 'bg-gray-100 text-gray-600' },
};

export default function InsuranceList() {
  const { state } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<InsuranceType | 'all'>('all');

  const filtered = useMemo(() => {
    let result = state.policies;

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

    return result;
  }, [state.policies, search, typeFilter]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Insurance</h2>
        <Link
          to="/insurance/add"
          className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700"
        >
          <Plus size={16} /> Add
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

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${
            typeFilter === 'all'
              ? 'bg-primary-50 text-primary-700 border-primary-300'
              : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          All ({state.policies.length})
        </button>
        {(['home', 'auto', 'health', 'life', 'other'] as InsuranceType[]).map(t => {
          const count = state.policies.filter(p => p.type === t).length;
          if (count === 0) return null;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${
                typeFilter === t
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {typeConfig[t].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Policy cards */}
      <div className="space-y-2">
        {filtered.map(policy => {
          const cfg = typeConfig[policy.type];
          const Icon = cfg.icon;
          const daysLeft = daysFromNow(policy.expirationDate);
          const isExpired = daysLeft < 0;
          const expiringSoon = daysLeft >= 0 && daysLeft <= 30;

          return (
            <Link
              key={policy.id}
              to={`/insurance/${policy.id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition active:bg-gray-50"
            >
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
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No policies match your search.</p>
            <button onClick={() => { setSearch(''); setTypeFilter('all'); }} className="text-sm text-primary-600 mt-1 hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
