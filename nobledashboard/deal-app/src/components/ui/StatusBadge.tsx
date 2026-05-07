import { STATUS_CONFIG } from '@/lib/types';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return (
      <span className="rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
}
