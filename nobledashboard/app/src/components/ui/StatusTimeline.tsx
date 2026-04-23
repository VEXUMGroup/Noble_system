'use client';

import { StatusHistory } from '@/lib/types';

interface StatusTimelineProps {
  history?: StatusHistory[];
  title?: string;
}

export function StatusTimeline({ history, title = 'ステータス変更履歴・担当メモ（時系列）' }: StatusTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <p className="text-gray-500 text-center py-8">履歴がありません</p>
      </div>
    );
  }

  // Sort by timestamp (newest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return { date: `${year}/${month}/${day}`, time: `${hours}:${minutes}:${seconds}` };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold mb-6">{title}</h2>
      <div className="space-y-4">
        {sortedHistory.map((entry, index) => {
          const { date, time } = formatDateTime(entry.timestamp);
          const isLastItem = index === sortedHistory.length - 1;

          return (
            <div key={entry.id} className="flex gap-4">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                {!isLastItem && <div className="w-0.5 h-12 bg-gray-300 mt-1"></div>}
              </div>

              {/* Content */}
              <div className="pb-4 flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{date}</span>
                  <span className="text-xs text-gray-500">{time}</span>
                </div>

                {entry.action_type === 'STATUS_CHANGE' ? (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{entry.user_name}</span>
                    <span className="ml-2 text-gray-600">{entry.status_label}</span>
                    {entry.source && (
                      <span className="ml-2 text-gray-500">— {entry.source}</span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{entry.user_name}</span>
                    <span className="ml-2 text-gray-600">メモ</span>
                    {entry.memo && (
                      <p className="mt-1 text-gray-600 bg-gray-50 p-2 rounded">{entry.memo}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
