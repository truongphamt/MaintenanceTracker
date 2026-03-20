export type ItemCategory = 'home' | 'car' | 'other';

export interface ServiceRecord {
  id: string;
  date: string;
  notes: string;
  cost?: number;
}

export interface ScheduledService {
  id: string;
  dueDate: string;
  notes: string;
  notified: boolean;
}

export type ServiceStatus = 'current' | 'due-soon' | 'overdue' | 'no-history';

export interface SubItem {
  id: string;
  name: string;
  intervalDays?: number;
  history: ServiceRecord[];
  scheduled: ScheduledService[];
}

export interface MaintenanceItem {
  id: string;
  name: string;
  category: ItemCategory;
  icon?: string;
  subItems: SubItem[];
  createdAt: string;
}

export interface Notification {
  id: string;
  itemId: string;
  subItemId: string;
  message: string;
  dueDate: string;
  read: boolean;
  createdAt: string;
}
