export function GET() {
  const script = `
    self.addEventListener('push', (event) => {
      const payload = event.data ? event.data.json() : {};
      const title = payload.title || '通知';
      const options = {
        body: payload.body || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: payload.data || {},
        tag: payload.tag,
        renotify: true,
      };
      event.waitUntil(self.registration.showNotification(title, options));
    });

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const targetUrl = (event.notification?.data && event.notification.data.url) || '/payments';
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client && client.url.includes(targetUrl)) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
          return undefined;
        })
      );
    });
  `;

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

