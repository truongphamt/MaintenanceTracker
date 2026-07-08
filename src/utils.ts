import { differenceInDays, parseISO, format, isValid, addDays, addMonths, addYears } from 'date-fns';
import type { SubItem, ServiceStatus, MaintenanceItem, ServiceInterval, IntervalUnit } from './types';

export function getLastServiceDate(subItem: SubItem): string | null {
  if (subItem.history.length === 0) return null;
  const sorted = [...subItem.history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0].date;
}

/**
 * Returns the interval to use for computing the next due date, preferring the
 * new `interval` field but falling back to the legacy `intervalDays` so records
 * saved before the interval enhancement still work.
 */
export function getEffectiveInterval(subItem: SubItem): ServiceInterval | null {
  if (subItem.interval && subItem.interval.value > 0) return subItem.interval;
  if (subItem.intervalDays && subItem.intervalDays > 0) {
    return { value: subItem.intervalDays, unit: 'days' };
  }
  return null;
}

export function addInterval(date: Date, interval: ServiceInterval): Date {
  switch (interval.unit) {
    case 'days': return addDays(date, interval.value);
    case 'months': return addMonths(date, interval.value);
    case 'years': return addYears(date, interval.value);
  }
}

const unitLabels: Record<IntervalUnit, [string, string]> = {
  days: ['day', 'days'],
  months: ['month', 'months'],
  years: ['year', 'years'],
};

export function formatInterval(interval: ServiceInterval): string {
  const [singular, plural] = unitLabels[interval.unit];
  return `Every ${interval.value} ${interval.value === 1 ? singular : plural}`;
}

export function getNextDueDate(subItem: SubItem): string | null {
  if (subItem.scheduled.length > 0) {
    const upcoming = [...subItem.scheduled].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    return upcoming[0].dueDate;
  }

  const interval = getEffectiveInterval(subItem);
  if (interval && subItem.history.length > 0) {
    const lastDate = getLastServiceDate(subItem);
    if (lastDate) {
      const d = parseISO(lastDate);
      if (isValid(d)) {
        return format(addInterval(d, interval), 'yyyy-MM-dd');
      }
    }
  }

  return null;
}

export function getServiceStatus(subItem: SubItem): ServiceStatus {
  const nextDue = getNextDueDate(subItem);
  if (!nextDue && subItem.history.length === 0) return 'no-history';
  if (!nextDue) return 'current';

  const daysUntil = differenceInDays(parseISO(nextDue), new Date());
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 30) return 'due-soon';
  return 'current';
}

export function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case 'overdue': return 'text-danger-600 bg-danger-50';
    case 'due-soon': return 'text-warning-600 bg-warning-50';
    case 'current': return 'text-success-600 bg-success-50';
    case 'no-history': return 'text-gray-500 bg-gray-100';
  }
}

export function getStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case 'overdue': return 'Overdue';
    case 'due-soon': return 'Due Soon';
    case 'current': return 'Current';
    case 'no-history': return 'No History';
  }
}

export function getWorstStatus(item: MaintenanceItem): ServiceStatus {
  if (item.subItems.length === 0) return 'no-history';
  const statuses = item.subItems.map(getServiceStatus);
  if (statuses.includes('overdue')) return 'overdue';
  if (statuses.includes('due-soon')) return 'due-soon';
  if (statuses.includes('no-history') && statuses.every(s => s === 'no-history')) return 'no-history';
  return 'current';
}

export function formatDate(dateStr: string): string {
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, 'MMM d, yyyy') : dateStr;
}

export function daysFromNow(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date());
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'home': return 'Home';
    case 'car': return 'Car';
    default: return 'Wrench';
  }
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 11);
}
