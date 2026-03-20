import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { MaintenanceItem, Notification, InsurancePolicy } from '../types';
import { generateId, getNextDueDate, formatDate } from '../utils';

interface AppState {
  items: MaintenanceItem[];
  notifications: Notification[];
  policies: InsurancePolicy[];
}

type Action =
  | { type: 'ADD_ITEM'; payload: Omit<MaintenanceItem, 'id' | 'createdAt' | 'subItems'> }
  | { type: 'UPDATE_ITEM'; payload: { id: string; name: string; category: MaintenanceItem['category'] } }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'ADD_SUB_ITEM'; payload: { itemId: string; name: string; intervalDays?: number } }
  | { type: 'UPDATE_SUB_ITEM'; payload: { itemId: string; subItemId: string; name: string; intervalDays?: number } }
  | { type: 'DELETE_SUB_ITEM'; payload: { itemId: string; subItemId: string } }
  | { type: 'ADD_SERVICE_RECORD'; payload: { itemId: string; subItemId: string; date: string; notes: string; cost?: number } }
  | { type: 'DELETE_SERVICE_RECORD'; payload: { itemId: string; subItemId: string; recordId: string } }
  | { type: 'ADD_SCHEDULED_SERVICE'; payload: { itemId: string; subItemId: string; dueDate: string; notes: string } }
  | { type: 'DELETE_SCHEDULED_SERVICE'; payload: { itemId: string; subItemId: string; scheduleId: string } }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'createdAt' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'ADD_POLICY'; payload: Omit<InsurancePolicy, 'id' | 'createdAt'> }
  | { type: 'UPDATE_POLICY'; payload: InsurancePolicy }
  | { type: 'DELETE_POLICY'; payload: string }
  | { type: 'LOAD_STATE'; payload: AppState };

const STORAGE_KEY = 'maintenance-tracker-data';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    return { items: parsed.items || [], notifications: parsed.notifications || [], policies: parsed.policies || [] };
  } catch { /* ignore */ }
  return { items: [], notifications: [], policies: [] };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, {
          ...action.payload,
          id: generateId(),
          subItems: [],
          createdAt: new Date().toISOString(),
        }],
      };

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, name: action.payload.name, category: action.payload.category }
            : item
        ),
      };

    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload),
        notifications: state.notifications.filter(n => n.itemId !== action.payload),
      };

    case 'ADD_SUB_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                subItems: [...item.subItems, {
                  id: generateId(),
                  name: action.payload.name,
                  intervalDays: action.payload.intervalDays,
                  history: [],
                  scheduled: [],
                }],
              }
            : item
        ),
      };

    case 'UPDATE_SUB_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                subItems: item.subItems.map(si =>
                  si.id === action.payload.subItemId
                    ? { ...si, name: action.payload.name, intervalDays: action.payload.intervalDays }
                    : si
                ),
              }
            : item
        ),
      };

    case 'DELETE_SUB_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? { ...item, subItems: item.subItems.filter(si => si.id !== action.payload.subItemId) }
            : item
        ),
        notifications: state.notifications.filter(n => n.subItemId !== action.payload.subItemId),
      };

    case 'ADD_SERVICE_RECORD':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                subItems: item.subItems.map(si =>
                  si.id === action.payload.subItemId
                    ? {
                        ...si,
                        history: [...si.history, {
                          id: generateId(),
                          date: action.payload.date,
                          notes: action.payload.notes,
                          cost: action.payload.cost,
                        }],
                      }
                    : si
                ),
              }
            : item
        ),
      };

    case 'DELETE_SERVICE_RECORD':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                subItems: item.subItems.map(si =>
                  si.id === action.payload.subItemId
                    ? { ...si, history: si.history.filter(r => r.id !== action.payload.recordId) }
                    : si
                ),
              }
            : item
        ),
      };

    case 'ADD_SCHEDULED_SERVICE':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                subItems: item.subItems.map(si =>
                  si.id === action.payload.subItemId
                    ? {
                        ...si,
                        scheduled: [...si.scheduled, {
                          id: generateId(),
                          dueDate: action.payload.dueDate,
                          notes: action.payload.notes,
                          notified: false,
                        }],
                      }
                    : si
                ),
              }
            : item
        ),
      };

    case 'DELETE_SCHEDULED_SERVICE':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? {
                ...item,
                subItems: item.subItems.map(si =>
                  si.id === action.payload.subItemId
                    ? { ...si, scheduled: si.scheduled.filter(s => s.id !== action.payload.scheduleId) }
                    : si
                ),
              }
            : item
        ),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, {
          ...action.payload,
          id: generateId(),
          read: false,
          createdAt: new Date().toISOString(),
        }],
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };

    case 'ADD_POLICY':
      return {
        ...state,
        policies: [...state.policies, {
          ...action.payload,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }],
      };

    case 'UPDATE_POLICY':
      return {
        ...state,
        policies: state.policies.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case 'DELETE_POLICY':
      return {
        ...state,
        policies: state.policies.filter(p => p.id !== action.payload),
      };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const checkDueServices = () => {
      state.items.forEach(item => {
        item.subItems.forEach(sub => {
          const nextDue = getNextDueDate(sub);
          if (nextDue) {
            const existing = state.notifications.find(
              n => n.itemId === item.id && n.subItemId === sub.id && n.dueDate === nextDue
            );
            if (!existing) {
              const daysUntil = Math.ceil(
                (new Date(nextDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              if (daysUntil <= 14) {
                dispatch({
                  type: 'ADD_NOTIFICATION',
                  payload: {
                    itemId: item.id,
                    subItemId: sub.id,
                    message: `${item.name} - ${sub.name} is ${daysUntil < 0 ? 'overdue' : `due ${formatDate(nextDue)}`}`,
                    dueDate: nextDue,
                  },
                });
              }
            }
          }
        });
      });
    };
    checkDueServices();
  }, [state.items]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
