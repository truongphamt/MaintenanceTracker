import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Camera, Upload, Loader2, CheckCircle2, AlertCircle,
  Home, Car, Heart, Activity, Wrench, X, Image as ImageIcon,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useApp } from '../context/AppContext';
import type { InsuranceType, InsurancePolicy } from '../types';

const typeOptions: { value: InsuranceType; label: string; icon: typeof Home }[] = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'auto', label: 'Auto', icon: Car },
  { value: 'health', label: 'Health', icon: Activity },
  { value: 'life', label: 'Life', icon: Heart },
  { value: 'other', label: 'Other', icon: Wrench },
];

interface FormData {
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  groupNumber: string;
  holderName: string;
  effectiveDate: string;
  expirationDate: string;
  premium: string;
  premiumFrequency: string;
  deductible: string;
  coverageAmount: string;
  agentName: string;
  agentPhone: string;
  claimsPhone: string;
  notes: string;
  cardImageData: string;
  linkedItemIds: string[];
}

const emptyForm: FormData = {
  type: 'auto',
  provider: '',
  policyNumber: '',
  groupNumber: '',
  holderName: '',
  effectiveDate: '',
  expirationDate: '',
  premium: '',
  premiumFrequency: 'monthly',
  deductible: '',
  coverageAmount: '',
  agentName: '',
  agentPhone: '',
  claimsPhone: '',
  notes: '',
  cardImageData: '',
  linkedItemIds: [],
};

function parseOcrText(text: string, form: FormData): Partial<FormData> {
  const updates: Partial<FormData> = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const full = text.replace(/\n/g, ' ');

  // Policy number patterns
  const policyMatch = full.match(/(?:policy|pol)[#:\s]*\s*([A-Z0-9][\w-]{4,})/i);
  if (policyMatch) updates.policyNumber = policyMatch[1];

  // Group number
  const groupMatch = full.match(/(?:group|grp)[#:\s]*\s*([A-Z0-9][\w-]{2,})/i);
  if (groupMatch) updates.groupNumber = groupMatch[1];

  // Member / ID number (fallback for policy)
  if (!updates.policyNumber) {
    const memberMatch = full.match(/(?:member|id|subscriber)[#:\s]*\s*([A-Z0-9][\w-]{4,})/i);
    if (memberMatch) updates.policyNumber = memberMatch[1];
  }

  // Dates (MM/DD/YYYY or MM-DD-YYYY)
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
  const dates: string[] = [];
  let m;
  while ((m = dateRegex.exec(full)) !== null) {
    const month = m[1].padStart(2, '0');
    const day = m[2].padStart(2, '0');
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    dates.push(`${year}-${month}-${day}`);
  }
  if (dates.length >= 2) {
    updates.effectiveDate = dates[0];
    updates.expirationDate = dates[1];
  } else if (dates.length === 1) {
    if (full.toLowerCase().includes('eff')) updates.effectiveDate = dates[0];
    else updates.expirationDate = dates[0];
  }

  // Dollar amounts
  const dollarRegex = /\$\s?([\d,]+(?:\.\d{2})?)/g;
  const amounts: number[] = [];
  while ((m = dollarRegex.exec(full)) !== null) {
    amounts.push(parseFloat(m[1].replace(/,/g, '')));
  }
  if (amounts.length > 0) {
    const sorted = [...amounts].sort((a, b) => a - b);
    if (sorted.length >= 2) {
      updates.deductible = sorted[0].toString();
      updates.premium = sorted[1].toString();
    } else {
      updates.premium = sorted[0].toString();
    }
  }

  // Phone numbers
  const phoneRegex = /(?:1[-.]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/g;
  const phones: string[] = [];
  while ((m = phoneRegex.exec(full)) !== null) {
    phones.push(`(${m[1]}) ${m[2]}-${m[3]}`);
  }
  if (phones.length >= 2) {
    updates.agentPhone = phones[0];
    updates.claimsPhone = phones[1];
  } else if (phones.length === 1) {
    updates.claimsPhone = phones[0];
  }

  // Provider name: often the first or second line with mostly letters
  for (const line of lines.slice(0, 5)) {
    const cleaned = line.replace(/[^a-zA-Z\s]/g, '').trim();
    if (cleaned.length > 3 && cleaned.split(' ').length <= 5 && !cleaned.match(/policy|group|member|date|phone|plan|id|eff|exp/i)) {
      updates.provider = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      break;
    }
  }

  // Policyholder name: look for "insured", "name", "subscriber"
  const nameMatch = full.match(/(?:insured|name|subscriber|member name)[:\s]+([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)/i);
  if (nameMatch) updates.holderName = nameMatch[1];

  // Detect type from keywords
  if (full.match(/\b(auto|vehicle|car|motor|vin|driver)\b/i)) updates.type = 'auto';
  else if (full.match(/\b(home|homeowner|property|dwelling|house)\b/i)) updates.type = 'home';
  else if (full.match(/\b(health|medical|copay|rx|pharmacy|prescription)\b/i)) updates.type = 'health';
  else if (full.match(/\b(life|death benefit|beneficiary|term life|whole life)\b/i)) updates.type = 'life';

  return updates;
}

export default function InsuranceForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!id;
  const existingPolicy = isEditing ? state.policies.find(p => p.id === id) : null;

  const [form, setForm] = useState<FormData>(() => {
    if (existingPolicy) {
      return {
        type: existingPolicy.type,
        provider: existingPolicy.provider,
        policyNumber: existingPolicy.policyNumber,
        groupNumber: existingPolicy.groupNumber || '',
        holderName: existingPolicy.holderName,
        effectiveDate: existingPolicy.effectiveDate,
        expirationDate: existingPolicy.expirationDate,
        premium: existingPolicy.premium?.toString() || '',
        premiumFrequency: existingPolicy.premiumFrequency || 'monthly',
        deductible: existingPolicy.deductible?.toString() || '',
        coverageAmount: existingPolicy.coverageAmount?.toString() || '',
        agentName: existingPolicy.agentName || '',
        agentPhone: existingPolicy.agentPhone || '',
        claimsPhone: existingPolicy.claimsPhone || '',
        notes: existingPolicy.notes || '',
        cardImageData: existingPolicy.cardImageData || '',
        linkedItemIds: existingPolicy.linkedItemIds || [],
      };
    }
    return emptyForm;
  });

  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrExtracted, setOcrExtracted] = useState<string[]>([]);
  const [showOcrResult, setShowOcrResult] = useState(false);

  const update = (field: keyof FormData, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleLinkedItem = (itemId: string) => {
    setForm(prev => ({
      ...prev,
      linkedItemIds: prev.linkedItemIds.includes(itemId)
        ? prev.linkedItemIds.filter(id => id !== itemId)
        : [...prev.linkedItemIds, itemId],
    }));
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      update('cardImageData', dataUrl);

      setOcrStatus('processing');
      setOcrProgress(0);
      setOcrExtracted([]);

      try {
        const result = await Tesseract.recognize(dataUrl, 'eng', {
          logger: info => {
            if (info.status === 'recognizing text') {
              setOcrProgress(Math.round((info.progress || 0) * 100));
            }
          },
        });

        const text = result.data.text;
        const parsed = parseOcrText(text, form);
        const extracted: string[] = [];

        setForm(prev => {
          const updated = { ...prev };
          for (const [key, value] of Object.entries(parsed)) {
            if (value && !prev[key as keyof FormData]) {
              (updated as Record<string, string>)[key] = value as string;
              extracted.push(`${key}: ${value}`);
            }
          }
          return updated;
        });

        setOcrExtracted(extracted);
        setOcrStatus('done');
        setShowOcrResult(true);
      } catch {
        setOcrStatus('error');
      }
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      type: form.type,
      provider: form.provider,
      policyNumber: form.policyNumber,
      groupNumber: form.groupNumber || undefined,
      holderName: form.holderName,
      effectiveDate: form.effectiveDate,
      expirationDate: form.expirationDate,
      premium: form.premium ? parseFloat(form.premium) : undefined,
      premiumFrequency: form.premiumFrequency as InsurancePolicy['premiumFrequency'] || undefined,
      deductible: form.deductible ? parseFloat(form.deductible) : undefined,
      coverageAmount: form.coverageAmount ? parseFloat(form.coverageAmount) : undefined,
      agentName: form.agentName || undefined,
      agentPhone: form.agentPhone || undefined,
      claimsPhone: form.claimsPhone || undefined,
      notes: form.notes || undefined,
      cardImageData: form.cardImageData || undefined,
      linkedItemIds: form.linkedItemIds.length > 0 ? form.linkedItemIds : undefined,
    };

    if (isEditing && existingPolicy) {
      dispatch({
        type: 'UPDATE_POLICY',
        payload: { ...payload, id: existingPolicy.id, createdAt: existingPolicy.createdAt } as InsurancePolicy,
      });
    } else {
      dispatch({ type: 'ADD_POLICY', payload });
    }

    navigate('/insurance');
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Policy' : 'Add Insurance Policy'}
        </h2>
      </div>

      {/* OCR upload section */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-primary-800">Scan Insurance Card</h3>
        </div>
        <p className="text-xs text-primary-600">
          Upload a photo of your insurance card and we'll automatically extract the details.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-primary-300 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-50 transition"
          >
            <Camera size={16} /> Take Photo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-primary-300 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-50 transition"
          >
            <Upload size={16} /> Upload
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
        />

        {ocrStatus === 'processing' && (
          <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-primary-200">
            <Loader2 size={18} className="text-primary-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Reading card...</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                <div
                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500">{ocrProgress}%</span>
          </div>
        )}

        {ocrStatus === 'done' && showOcrResult && (
          <div className="bg-white rounded-lg p-3 border border-success-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success-600" />
                <span className="text-sm font-medium text-success-700">Fields extracted</span>
              </div>
              <button onClick={() => setShowOcrResult(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            {ocrExtracted.length > 0 ? (
              <ul className="space-y-0.5">
                {ocrExtracted.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-success-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No fields were auto-detected. Please fill in manually.</p>
            )}
          </div>
        )}

        {ocrStatus === 'error' && (
          <div className="flex items-center gap-2 bg-danger-50 rounded-lg p-3 border border-danger-200">
            <AlertCircle size={16} className="text-danger-600" />
            <span className="text-sm text-danger-700">Could not read the image. Please fill in manually.</span>
          </div>
        )}

        {form.cardImageData && (
          <div className="relative">
            <img src={form.cardImageData} alt="Uploaded card" className="w-full h-auto rounded-lg border border-gray-200 max-h-40 object-contain bg-white" />
            <button
              type="button"
              onClick={() => update('cardImageData', '')}
              className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow text-gray-500 hover:text-danger-600"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="grid grid-cols-5 gap-2">
            {typeOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('type', opt.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition text-xs font-medium ${
                    form.type === opt.value
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Provider & Policy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider / Company *</label>
            <input type="text" value={form.provider} onChange={e => update('provider', e.target.value)} placeholder="e.g. State Farm" className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number *</label>
            <input type="text" value={form.policyNumber} onChange={e => update('policyNumber', e.target.value)} placeholder="e.g. HO-1234567" className={inputClass} required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Number</label>
            <input type="text" value={form.groupNumber} onChange={e => update('groupNumber', e.target.value)} placeholder="If applicable" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Policyholder Name *</label>
            <input type="text" value={form.holderName} onChange={e => update('holderName', e.target.value)} placeholder="Full name" className={inputClass} required />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
            <input type="date" value={form.effectiveDate} onChange={e => update('effectiveDate', e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date *</label>
            <input type="date" value={form.expirationDate} onChange={e => update('expirationDate', e.target.value)} className={inputClass} required />
          </div>
        </div>

        {/* Financial */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Premium ($)</label>
            <input type="number" step="0.01" value={form.premium} onChange={e => update('premium', e.target.value)} placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select value={form.premiumFrequency} onChange={e => update('premiumFrequency', e.target.value)} className={inputClass}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi-annual">Semi-Annual</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deductible ($)</label>
            <input type="number" step="0.01" value={form.deductible} onChange={e => update('deductible', e.target.value)} placeholder="0.00" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Amount ($)</label>
          <input type="number" step="0.01" value={form.coverageAmount} onChange={e => update('coverageAmount', e.target.value)} placeholder="0.00" className={inputClass} />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
            <input type="text" value={form.agentName} onChange={e => update('agentName', e.target.value)} placeholder="Agent name" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent Phone</label>
            <input type="tel" value={form.agentPhone} onChange={e => update('agentPhone', e.target.value)} placeholder="(555) 123-4567" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Claims Phone</label>
          <input type="tel" value={form.claimsPhone} onChange={e => update('claimsPhone', e.target.value)} placeholder="(800) 123-4567" className={inputClass} />
        </div>

        {/* Link to maintenance items */}
        {state.items.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Link to Items <span className="text-gray-400 font-normal">(optional, select multiple)</span>
            </label>
            <div className="space-y-1.5">
              {state.items.map(item => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                    form.linkedItemIds.includes(item.id)
                      ? 'bg-primary-50 border-primary-300'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.linkedItemIds.includes(item.id)}
                    onChange={() => toggleLinkedItem(item.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-xs text-gray-400 capitalize ml-auto">{item.category}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Additional details..." rows={3} className={`${inputClass} resize-none`} />
        </div>

        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow-sm"
        >
          {isEditing ? 'Save Changes' : 'Add Policy'}
        </button>
      </form>
    </div>
  );
}
