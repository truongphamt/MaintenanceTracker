import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Car, User, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ItemCategory } from '../types';
import { generateId } from '../utils';

const categories: { value: ItemCategory; label: string; icon: typeof Home; color: string }[] = [
  { value: 'home', label: 'Home', icon: Home, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'car', label: 'Vehicle', icon: Car, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { value: 'person', label: 'Person', icon: User, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { value: 'other', label: 'Other', icon: Wrench, color: 'bg-gray-50 text-gray-600 border-gray-200' },
];

const subItemSuggestions: Record<ItemCategory, string[]> = {
  home: ['Roof', 'HVAC Filter', 'Gutters', 'Paint', 'Plumbing', 'Electrical', 'Pest Control', 'Lawn Care', 'Water Heater', 'Smoke Detectors'],
  car: ['Oil Change', 'Tire Rotation', 'Air Filter', 'Brake Pads', 'Transmission Fluid', 'Coolant', 'Wiper Blades', 'Battery', 'Spark Plugs', 'Alignment'],
  person: ['Annual Physical', 'Dentist', 'Eye Exam', 'Dermatology', 'Vaccinations', 'Blood Work', 'Specialist Visit', 'Therapy', 'Haircut'],
  other: ['General Maintenance', 'Cleaning', 'Inspection'],
};

export default function AddItem() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('home');
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [customSub, setCustomSub] = useState('');

  const toggleSub = (sub: string) => {
    setSelectedSubs(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const addCustomSub = () => {
    const trimmed = customSub.trim();
    if (trimmed && !selectedSubs.includes(trimmed)) {
      setSelectedSubs(prev => [...prev, trimmed]);
      setCustomSub('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItemId = generateId();
    dispatch({ type: 'ADD_ITEM', payload: { id: newItemId, name: name.trim(), category } });
    selectedSubs.forEach(subName => {
      dispatch({
        type: 'ADD_SUB_ITEM',
        payload: { itemId: newItemId, name: subName },
      });
    });

    navigate('/');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Add New Item</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => { setCategory(cat.value); setSelectedSubs([]); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${
                    category === cat.value
                      ? `${cat.color} border-current`
                      : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={
              category === 'home' ? 'e.g. Main House' :
              category === 'car' ? 'e.g. Honda Civic 2022' :
              category === 'person' ? 'e.g. Mom, Self, Kids' :
              'e.g. Boat'
            }
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Services to Track <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {subItemSuggestions[category].map(sub => (
              <button
                key={sub}
                type="button"
                onClick={() => toggleSub(sub)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  selectedSubs.includes(sub)
                    ? 'bg-primary-50 text-primary-700 border-primary-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {selectedSubs.includes(sub) ? '- ' : '+ '}{sub}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customSub}
              onChange={e => setCustomSub(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSub(); } }}
              placeholder="Add custom service..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <button
              type="button"
              onClick={addCustomSub}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              Add
            </button>
          </div>
          {selectedSubs.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">{selectedSubs.length} selected</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow-sm"
        >
          Create Item
        </button>
      </form>
    </div>
  );
}
