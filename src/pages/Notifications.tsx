import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { formatDate, daysFromNow } from '../utils';

export default function Notifications() {
  const { state, dispatch } = useApp();
  const notifications = [...state.notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={48} />}
        title="No Notifications"
        description="Notifications will appear here when services are due or overdue. Set up service intervals to get automatic reminders."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => notifications.forEach(n => !n.read && dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id }))}
              className="flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition"
            >
              <Check size={14} /> Mark All Read
            </button>
          )}
          <button
            onClick={() => dispatch({ type: 'CLEAR_NOTIFICATIONS' })}
            className="flex items-center gap-1 text-xs text-gray-500 font-medium hover:text-danger-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {notifications.map(n => {
          const item = state.items.find(i => i.id === n.itemId);
          const days = daysFromNow(n.dueDate);

          return (
            <div
              key={n.id}
              className={`bg-white rounded-xl border p-4 transition ${
                n.read ? 'border-gray-200' : 'border-primary-200 bg-primary-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                  days < 0 ? 'bg-danger-100 text-danger-600' :
                  days <= 7 ? 'bg-warning-100 text-warning-600' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  <Bell size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-xs font-medium ${
                      days < 0 ? 'text-danger-600' : days <= 7 ? 'text-warning-600' : 'text-gray-500'
                    }`}>
                      {days < 0 ? `${Math.abs(days)} days overdue` :
                       days === 0 ? 'Due today' :
                       `Due in ${days} days`}
                    </span>
                    {item && (
                      <Link
                        to={`/items/${item.id}`}
                        className="text-xs text-primary-600 hover:underline flex items-center gap-0.5"
                      >
                        View <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id })}
                    className="text-gray-300 hover:text-primary-500 p-1 shrink-0"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
