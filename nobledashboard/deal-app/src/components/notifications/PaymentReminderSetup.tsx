'use client';

import { useEffect, useState } from 'react';
import { getVapidPublicKey } from '@/lib/push-public';

function formatPermissionLabel(permission: NotificationPermission | string) {
  switch (permission) {
    case 'granted':
      return '許可済み';
    case 'denied':
      return '拒否';
    default:
      return '未許可';
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function ensurePushSubscription() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('service_worker_unsupported');
  }
  if (!('PushManager' in window)) {
    throw new Error('push_manager_unsupported');
  }
  if (!('Notification' in window)) {
    throw new Error('notification_unsupported');
  }

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    throw new Error('vapid_public_key_missing');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(permission === 'denied' ? 'notification_denied' : 'notification_not_granted');
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return existing;
  }

  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

export function PaymentReminderSetup({
  className = '',
  buttonLabel = 'スマホ通知を有効化',
}: {
  className?: string;
  buttonLabel?: string;
}) {
  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionLabel, setPermissionLabel] = useState('未確認');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPermissionLabel('非対応');
      return;
    }
    setPermissionLabel(formatPermissionLabel(Notification.permission));
  }, []);

  const handleEnable = async () => {
    setIsSubmitting(true);
    setStatus('');

    try {
      const subscription = await ensurePushSubscription();
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          device_name: navigator.userAgent,
        }),
      });

      const json = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) {
        throw new Error(json?.message ?? json?.error ?? 'push_subscription_failed');
      }

      setStatus('この端末への通知を有効化しました。');
      setPermissionLabel(formatPermissionLabel('granted'));
    } catch (error) {
      const code = error instanceof Error ? error.message : 'unknown_error';
      const messageMap: Record<string, string> = {
        service_worker_unsupported: 'このブラウザは通知に必要な機能をサポートしていません。',
        push_manager_unsupported: 'このブラウザは Web Push に対応していません。',
        notification_unsupported: 'このブラウザは通知 API に対応していません。',
        vapid_public_key_missing: 'VAPID 公開鍵が設定されていません。',
        notification_denied: '通知が拒否されています。ブラウザ設定から許可してください。',
        notification_not_granted: '通知の許可が取得できませんでした。',
      };
      setStatus(messageMap[code] ?? '通知の有効化に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-900">スマホ通知</p>
          <p className="text-xs text-blue-800 mt-1">
            支払期日3日前かつ未入金の顧客を、ブラウザのシステム通知でお知らせします。
          </p>
          <p className="text-[11px] text-blue-700 mt-1">
            iPhone はホーム画面に追加した Web アプリで有効になります。現在の許可状態: {permissionLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={handleEnable}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? '設定中...' : buttonLabel}
        </button>
      </div>
      {status && <p className="mt-3 text-sm text-blue-900">{status}</p>}
    </div>
  );
}
