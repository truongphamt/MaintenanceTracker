import { Link, useNavigate } from 'react-router-dom';
import { Home, Car, Wrench, ChevronRight, Plus, List } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import SortableList from '../components/SortableList';
import { getWorstStatus } from '../utils';

const categoryIcons = {
  home: <Home size={20} />,
  car: <Car size={20} />,
  other: <Wrench size={20} />,
};

const categoryLabels = {
  home: 'Home',
  car: 'Vehicle',
  other: 'Other',
};

export default function ItemsList() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  if (state.items.length === 0) {
    return (
      <EmptyState
        icon={<List size={48} />}
        title="No Items Yet"
        description="Add homes, cars, or other items to start tracking their maintenance."
        action={
          <Link
            to="/add"
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
          >
            Add Item
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Items</h2>
        <Link
          to="/add"
          className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700"
        >
          <Plus size={16} />
          Add
        </Link>
      </div>

      <SortableList
        items={state.items}
        onReorder={(newIds) => dispatch({ type: 'REORDER_ITEMS', payload: newIds })}
        className="space-y-2"
        renderItem={(item, isReorderMode) => {
          const cat = item.category;
          const content = (
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition active:bg-gray-50">
              <div className={`p-2 rounded-lg ${
                cat === 'home' ? 'bg-blue-50 text-blue-600' :
                cat === 'car' ? 'bg-purple-50 text-purple-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {categoryIcons[cat]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                <p className="text-xs text-gray-500">
                  {categoryLabels[cat]} &middot; {item.subItems.length} services
                </p>
              </div>
              <StatusBadge status={getWorstStatus(item)} />
              <ChevronRight size={16} className="text-gray-300" />
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
