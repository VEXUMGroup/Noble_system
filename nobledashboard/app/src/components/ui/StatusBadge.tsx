import { STATUS_CONFIG, getStatusConfig } from '@/lib/types';

interface StatusBadgeProps {
  status: string;
  type?: string; // 'interview' | 'result' | 'contractConfirm' | 'contract' | 'support' | 'payment'
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = type
    ? getStatusConfig(type, status)
    : STATUS_CONFIG[status] ?? { label: status, bgColor: 'bg-gray-100', textColor: 'text-gray-800' };

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
}
