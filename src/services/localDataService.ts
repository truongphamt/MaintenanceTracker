import type { AppState, DataService } from './dataService';
import { emptyAppState } from './dataService';

const STORAGE_KEY = 'maintenance-tracker-data';

function readSync(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAppState;
    const parsed = JSON.parse(raw);
    return {
      items: parsed.items || [],
      notifications: parsed.notifications || [],
      policies: parsed.policies || [],
    };
  } catch {
    return emptyAppState;
  }
}

function writeSync(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const localDataService: DataService = {
  async loadState() {
    return readSync();
  },
  async saveState(state) {
    writeSync(state);
  },
};

/**
 * Synchronous accessors are exposed so the reducer can hydrate without
 * suspending React on first render. Once the SupabaseDataService lands, the
 * AppProvider will switch to an async hydration boundary instead.
 */
export const localDataServiceSync = {
  loadState: readSync,
  saveState: writeSync,
};
