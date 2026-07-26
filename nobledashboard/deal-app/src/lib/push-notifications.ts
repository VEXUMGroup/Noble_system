import { createSupabaseAdminClient } from './supabase/admin';

export type PushSubscriptionJson = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  data?: Record<string, unknown>;
};

export type PushSubscriptionRow = {
  id?: string;
  user_id: string;
  endpoint: string;
  subscription: PushSubscriptionJson;
  device_name: string | null;
  user_agent: string | null;
  is_active?: boolean;
  updated_at?: string;
};

let vapidConfigured = false;
let webpushModulePromise: Promise<typeof import('web-push')> | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

function configureWebPush() {
  if (vapidConfigured) return;
  void getWebPushModule().then((webpush) => {
    const publicKey = getRequiredEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
    const privateKey = getRequiredEnv('VAPID_PRIVATE_KEY');
    const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';

    webpush.default.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  });
}

async function getWebPushModule() {
  if (!webpushModulePromise) {
    webpushModulePromise = import('web-push');
  }
  return await webpushModulePromise;
}

export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionJson,
  deviceName?: string | null,
  userAgent?: string | null
) {
  const supabase = createSupabaseAdminClient();
  const payload: PushSubscriptionRow = {
    user_id: userId,
    endpoint: subscription.endpoint,
    subscription,
    device_name: deviceName ?? null,
    user_agent: userAgent ?? null,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('push_subscriptions').upsert(payload, {
    onConflict: 'endpoint',
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function removePushSubscription(endpoint: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) {
    throw new Error(error.message);
  }
}

export async function getActivePushSubscriptions(userId?: string) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, subscription, device_name, user_agent, is_active')
    .eq('is_active', true);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PushSubscriptionRow[];
}

export async function sendPushNotifications(
  subscriptions: PushSubscriptionJson[],
  payload: PushPayload
) {
  if (subscriptions.length === 0) {
    return { sent: 0, failures: 0 };
  }

  const webpush = await getWebPushModule();
  if (!vapidConfigured) {
    const publicKey = getRequiredEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
    const privateKey = getRequiredEnv('VAPID_PRIVATE_KEY');
    const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';
    webpush.default.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }
  const jsonPayload = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      await webpush.default.sendNotification(subscription, jsonPayload);
    })
  );

  let sent = 0;
  let failures = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      sent += 1;
      continue;
    }
    failures += 1;
  }

  return { sent, failures };
}

export async function insertNotificationLog(params: {
  notificationKey: string;
  userId: string;
  dealId: string;
  message: string;
  type?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      notification_key: params.notificationKey,
      user_id: params.userId,
      deal_id: params.dealId,
      type: params.type ?? 'payment_due_3days',
      message: params.message,
      is_read: false,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505' || error.message.toLowerCase().includes('duplicate')) {
      return { inserted: false };
    }
    throw new Error(error.message);
  }

  return { inserted: true, id: data?.id as number | undefined };
}
