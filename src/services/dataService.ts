import type { MaintenanceItem, Notification, InsurancePolicy } from '../types';

export interface AppState {
  items: MaintenanceItem[];
  notifications: Notification[];
  policies: InsurancePolicy[];
}

export const emptyAppState: AppState = {
  items: [],
  notifications: [],
  policies: [],
};

/**
 * Persistence boundary for the app's state.
 *
 * Today: a single LocalDataService backed by localStorage.
 * Tomorrow: a SupabaseDataService that talks to a managed (or self-hosted on a
 * Raspberry Pi) Supabase instance. Components and the reducer never touch
 * storage directly so the swap is a one-file change.
 *
 * The interface is intentionally coarse (full state load/save) to match the
 * current synchronous useReducer + persist-on-change pattern. When the remote
 * backend lands it will grow granular per-entity methods (createItem,
 * updateSubItem, etc.) alongside these.
 */
export interface DataService {
  loadState(): Promise<AppState>;
  saveState(state: AppState): Promise<void>;
}
