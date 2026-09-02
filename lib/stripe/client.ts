const STRIPE_API = 'https://api.stripe.com/v1';

function key(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error('STRIPE_SECRET_KEY is not set');
  return k;
}

function toFormBody(params: Record<string, unknown>, prefix = ''): string[] {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const fullKey = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          parts.push(...toFormBody(item as Record<string, unknown>, `${fullKey}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (v !== null && typeof v === 'object') {
      parts.push(...toFormBody(v as Record<string, unknown>, fullKey));
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts;
}

async function stripeRequest<T = Record<string, unknown>>(
  method: 'GET' | 'POST',
  path: string,
  params?: Record<string, unknown>
): Promise<T> {
  const url = method === 'GET' && params
    ? `${STRIPE_API}${path}?${toFormBody(params).join('&')}`
    : `${STRIPE_API}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key()}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: method === 'POST' && params ? toFormBody(params).join('&') : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || `Stripe API error (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer: string | null;
  subscription: string | null;
  client_reference_id: string | null;
  payment_status: string;
}

export interface StripeSubscription {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid' | 'paused';
  customer: string;
}

const PRICE_IDS: Record<'basic' | 'pro', string> = {
  basic: 'price_1UB3BUAsdgtV2iVLVGMHHAQc',
  pro: 'price_1UB3BUAsdgtV2iVLbmQRetBy',
};

export async function createCheckoutSession(opts: {
  websiteId: string;
  plan: 'basic' | 'pro';
  domain: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>('POST', '/checkout/sessions', {
    mode: 'subscription',
    client_reference_id: opts.websiteId,
    line_items: [{ price: PRICE_IDS[opts.plan], quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: { website_id: opts.websiteId, domain: opts.domain, plan: opts.plan },
    subscription_data: { metadata: { website_id: opts.websiteId, domain: opts.domain, plan: opts.plan } },
  });
}

export async function retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>('GET', `/checkout/sessions/${sessionId}`);
}

export async function retrieveSubscription(subscriptionId: string): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>('GET', `/subscriptions/${subscriptionId}`);
}
