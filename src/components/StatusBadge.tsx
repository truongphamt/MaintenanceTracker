import type { ServiceStatus } from '../types';
import { getStatusColor, getStatusLabel } from '../utils';

interface Props {
  status: ServiceStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const base = getStatusColor(status);
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${base} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'overdue' ? 'bg-danger-500' :
        status === 'due-soon' ? 'bg-warning-500' :
        status === 'current' ? 'bg-success-500' : 'bg-gray-400'
      }`} />
      {getStatusLabel(status)}
    </span>
  );
}
