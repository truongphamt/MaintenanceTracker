import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2, Shield, Home, Car, Heart, Activity, Wrench,
  Phone, User, FileText, DollarSign, Calendar, Hash, AlertTriangle, Image,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { formatDate, daysFromNow } from '../utils';
import type { InsuranceType, InsurancePolicy } from '../types';

const typeConfig: Record<InsuranceType, { icon: typeof Shield; label: string; color: string }> = {
  home: { icon: Home, label: 'Homeowners', color: 'bg-blue-50 text-blue-600' },
  auto: { icon: Car, label: 'Auto', color: 'bg-purple-50 text-purple-600' },
  life: { icon: Heart, label: 'Life', color: 'bg-pink-50 text-pink-600' },
  health: { icon: Activity, label: 'Health', color: 'bg-green-50 text-green-600' },
  other: { icon: Wrench, label: 'Other', color: 'bg-gray-100 text-gray-600' },
};

const freqLabels: Record<string, string> = {
  monthly: '/mo',
  quarterly: '/qtr',
  'semi-annual': '/6mo',
  annual: '/yr',
};

function InfoRow({ icon: Icon, label, value, href, highlight }: {
  icon: typeof Phone;
  label: string;
  value?: string | number | null;
  href?: string;
  highlight?: boolean;
}) {
  if (value == null || value === '') return null;
  const content = (
    <div className={`flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 ${highlight ? 'bg-warning-50 -mx-4 px-4 rounded-lg' : ''}`}>
      <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium ${highlight ? 'text-warning-700' : 'text-gray-900'} break-all`}>
          {typeof value === 'number' ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : value}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <a href={href} className="block hover:bg-gray-50 rounded-lg transition">{content}</a>;
  }
  return content;
}

export default function InsuranceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const policy = state.policies.find(p => p.id === id);
  const [showDelete, setShowDelete] = useState(false);
  const [showImage, setShowImage] = useState(false);

  if (!policy) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Policy not found</p>
        <Link to="/insurance" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
          Back to policies
        </Link>
      </div>
    );
  }

  const cfg = typeConfig[policy.type];
  const Icon = cfg.icon;
  const daysLeft = daysFromNow(policy.expirationDate);
  const isExpired = daysLeft < 0;
  const expiringSoon = daysLeft >= 0 && daysLeft <= 30;
  const linkedItems = (policy.linkedItemIds || [])
    .map(id => state.items.find(i => i.id === id))
    .filter(Boolean);

  const handleDelete = () => {
    dispatch({ type: 'DELETE_POLICY', payload: policy.id });
    navigate('/insurance');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft size={20} />
        </button>
        <div className={`p-2.5 rounded-lg ${cfg.color}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{policy.provider}</h2>
          <p className="text-xs text-gray-500">{cfg.label} Insurance</p>
        </div>
        <Link
          to={`/insurance/${policy.id}/edit`}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <Edit2 size={16} />
        </Link>
        <button onClick={() => setShowDelete(true)} className="text-gray-400 hover:text-danger-600 p-1">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Expiration banner */}
      {(isExpired || expiringSoon) && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
          isExpired ? 'bg-danger-50 text-danger-700' : 'bg-warning-50 text-warning-700'
        }`}>
          <AlertTriangle size={16} />
          <span className="text-sm font-medium">
            {isExpired
              ? `This policy expired ${Math.abs(daysLeft)} days ago`
              : `This policy expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
            }
          </span>
        </div>
      )}

      {/* Card image */}
      {policy.cardImageData && (
        <button
          onClick={() => setShowImage(true)}
          className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary-300 transition group"
        >
          <div className="relative">
            <img
              src={policy.cardImageData}
              alt="Insurance card"
              className="w-full h-auto object-contain max-h-56"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center">
              <span className="bg-white/90 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow">
                Tap to enlarge
              </span>
            </div>
          </div>
        </button>
      )}

      {/* Policy details */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-1">
        <InfoRow icon={Hash} label="Policy Number" value={policy.policyNumber} />
        {policy.groupNumber && <InfoRow icon={Hash} label="Group Number" value={policy.groupNumber} />}
        <InfoRow icon={User} label="Policyholder" value={policy.holderName} />
        <InfoRow icon={Calendar} label="Effective Date" value={formatDate(policy.effectiveDate)} />
        <InfoRow
          icon={Calendar}
          label="Expiration Date"
          value={formatDate(policy.expirationDate)}
          highlight={isExpired || expiringSoon}
        />
      </div>

      {/* Financial details */}
      {(policy.premium || policy.deductible || policy.coverageAmount) && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-1">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-3 pb-1">Financial</h3>
          {policy.premium != null && (
            <InfoRow
              icon={DollarSign}
              label={`Premium${policy.premiumFrequency ? ` (${policy.premiumFrequency})` : ''}`}
              value={policy.premium}
            />
          )}
          <InfoRow icon={DollarSign} label="Deductible" value={policy.deductible} />
          <InfoRow icon={DollarSign} label="Coverage Amount" value={policy.coverageAmount} />
        </div>
      )}

      {/* Contact info */}
      {(policy.agentName || policy.agentPhone || policy.claimsPhone) && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-1">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-3 pb-1">Contact</h3>
          <InfoRow icon={User} label="Agent" value={policy.agentName} />
          <InfoRow icon={Phone} label="Agent Phone" value={policy.agentPhone} href={policy.agentPhone ? `tel:${policy.agentPhone}` : undefined} />
          <InfoRow icon={Phone} label="Claims Phone" value={policy.claimsPhone} href={policy.claimsPhone ? `tel:${policy.claimsPhone}` : undefined} />
        </div>
      )}

      {/* Notes */}
      {policy.notes && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-1">
          <InfoRow icon={FileText} label="Notes" value={policy.notes} />
        </div>
      )}

      {/* Linked items */}
      {linkedItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Linked Items</h3>
          {linkedItems.map(li => (
            <Link
              key={li!.id}
              to={`/items/${li!.id}`}
              className="flex items-center gap-3 bg-primary-50 rounded-xl border border-primary-200 p-4 hover:bg-primary-100 transition"
            >
              <Shield size={16} className="text-primary-600" />
              <span className="text-sm font-medium text-primary-700">
                {li!.name}
              </span>
              <span className="text-xs text-primary-400 capitalize">{li!.category}</span>
              <ChevronRight size={14} className="text-primary-400 ml-auto" />
            </Link>
          ))}
        </div>
      )}

      {/* Full-size image modal */}
      <Modal open={showImage} onClose={() => setShowImage(false)} title="Insurance Card">
        {policy.cardImageData && (
          <img src={policy.cardImageData} alt="Insurance card" className="w-full h-auto rounded-lg" />
        )}
      </Modal>

      {/* Delete modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Policy">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the <strong>{policy.provider}</strong> policy? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDelete(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
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

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
