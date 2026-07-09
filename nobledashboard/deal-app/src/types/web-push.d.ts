declare module 'web-push' {
  type Subscription = {
    endpoint: string;
    expirationTime: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  type VapidDetails = {
    subject: string;
    publicKey: string;
    privateKey: string;
  };

  type SendOptions = {
    TTL?: number;
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
    topic?: string;
  };

  const webpush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(subscription: Subscription, payload?: string, options?: SendOptions): Promise<unknown>;
    generateVAPIDKeys(): { publicKey: string; privateKey: string };
    encrypt(subscription: Subscription, payload: string): Promise<unknown>;
    getVapidHeaders(subject: string, publicKey: string, privateKey: string, contentEncoding?: string): Record<string, string>;
  };

  export default webpush;
}

