export type ItemCategory = 'home' | 'car' | 'person' | 'other';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface ServiceRecord {
  id: string;
  date: string;
  notes: string;
  cost?: number;
  attachments?: Attachment[];
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
  notes?: string;
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

export type InsuranceType = 'home' | 'auto' | 'life' | 'health' | 'other';

export interface InsurancePolicy {
  id: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  holderName: string;
  effectiveDate: string;
  expirationDate: string;
  premium?: number;
  premiumFrequency?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  deductible?: number;
  coverageAmount?: number;
  agentName?: string;
  agentPhone?: string;
  claimsPhone?: string;
  notes?: string;
  cardImageData?: string;
  linkedItemIds?: string[];
  createdAt: string;
}
