/// <reference types="@cloudflare/workers-types" />

/**
 * POST /api/lead — server-validated lead intake for Cumberland Septic Hub.
 *
 * Validates every field server-side, verifies Cloudflare Turnstile,
 * delivers the lead to a configurable webhook and/or email provider,
 * and optionally stores metadata in D1 and photos in a private R2 bucket.
 *
 * Never returns secrets or stack traces. Never logs full personal data.
 */

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  LEAD_WEBHOOK_URL?: string;
  LEAD_WEBHOOK_SECRET?: string;
  FORM_RECIPIENT_EMAIL?: string;
  EMAIL_API_KEY?: string;
  LEADS_DB?: D1Database;
  LEAD_UPLOADS?: R2Bucket;
  CF_PAGES_BRANCH?: string;
}

const MAX_FILES = 4;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif']);
const ALLOWED_EXT = /\.(jpe?g|png|heic)$/i;

const REQUIRED_TEXT_FIELDS = [
  'full_name',
  'phone',
  'email',
  'property_location',
  'city_or_county',
  'property_type',
  'service_needed',
  'symptoms',
  'active_backup',
  'tank_location_known',
  'last_pumped',
  'preferred_contact_time',
  'additional_details',
] as const;

const OPTIONAL_TEXT_FIELDS = [
  'occupancy',
  'alarm_active',
  'real_estate_involved',
  'service_timing',
  'source_page',
] as const;

const FIELD_MAX_LENGTH: Record<string, number> = {
  full_name: 120,
  phone: 30,
  email: 200,
  property_location: 250,
  city_or_county: 120,
  additional_details: 3000,
  occupancy: 60,
  source_page: 300,
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const sanitize = (value: string, maxLength = 500): string =>
  value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizePhone = (phone: string): string => phone.replace(/[^\d+()\-.\sx]/g, '').trim();

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 200;

const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

const makeReference = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let suffix = '';
  for (const b of bytes) suffix += chars[b % chars.length];
  return `CSH-${suffix}`;
};

async function verifyTurnstile(env: Env, token: string, ip: string | null): Promise<boolean> {
  // If Turnstile is not configured (local development), skip verification.
  // Production must set TURNSTILE_SECRET_KEY — see README.
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function storeUploads(
  env: Env,
  files: File[],
  reference: string,
): Promise<string[]> {
  if (!env.LEAD_UPLOADS || files.length === 0) return [];
  const keys: string[] = [];
  for (const file of files) {
    // Randomized object name — never trust the original filename.
    const ext = (file.name.match(ALLOWED_EXT)?.[0] ?? '.jpg').toLowerCase();
    const key = `leads/${reference}/${crypto.randomUUID()}${ext}`;
    await env.LEAD_UPLOADS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    });
    keys.push(key);
  }
  return keys;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed.' }, 405);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, error: 'Malformed request.', code: 'malformed' }, 400);
  }

  // --- validate required fields ---
  const fields: Record<string, string> = {};
  const missing: string[] = [];

  for (const name of REQUIRED_TEXT_FIELDS) {
    const raw = formData.get(name);
    const value = typeof raw === 'string' ? sanitize(raw, FIELD_MAX_LENGTH[name] ?? 200) : '';
    if (!value) missing.push(name);
    fields[name] = value;
  }

  for (const name of OPTIONAL_TEXT_FIELDS) {
    const raw = formData.get(name);
    fields[name] = typeof raw === 'string' ? sanitize(raw, FIELD_MAX_LENGTH[name] ?? 200) : '';
  }

  if (formData.get('consent') !== 'yes') {
    return json({ ok: false, error: 'Consent is required.', code: 'consent' }, 400);
  }

  if (missing.length > 0) {
    return json(
      { ok: false, error: 'Required fields are missing.', code: 'validation', fields: missing },
      400,
    );
  }

  fields.email = normalizeEmail(fields.email);
  fields.phone = normalizePhone(fields.phone);

  if (!isValidEmail(fields.email)) {
    return json({ ok: false, error: 'Invalid email address.', code: 'validation', fields: ['email'] }, 400);
  }
  if (!isValidPhone(fields.phone)) {
    return json({ ok: false, error: 'Invalid phone number.', code: 'validation', fields: ['phone'] }, 400);
  }

  // --- validate uploads ---
  // workers-types declares getAll() as string[]; at runtime multipart file
  // parts arrive as File objects, so narrow via instanceof.
  const uploads = (formData.getAll('photos') as unknown as (File | string)[]).filter(
    (f): f is File => typeof f !== 'string' && f instanceof File && f.size > 0,
  );

  if (uploads.length > MAX_FILES) {
    return json({ ok: false, error: 'Too many photos.', code: 'validation', fields: ['photos'] }, 400);
  }
  let totalBytes = 0;
  for (const file of uploads) {
    totalBytes += file.size;
    const typeOk = ALLOWED_MIME.has(file.type) || ALLOWED_EXT.test(file.name);
    if (file.size > MAX_FILE_BYTES || totalBytes > MAX_TOTAL_UPLOAD_BYTES || !typeOk) {
      return json(
        { ok: false, error: 'Photo uploads must be JPG, PNG or HEIC under 10 MB.', code: 'validation', fields: ['photos'] },
        400,
      );
    }
  }

  // --- Turnstile ---
  const token = formData.get('cf-turnstile-response');
  const ip = request.headers.get('CF-Connecting-IP');
  const human = await verifyTurnstile(env, typeof token === 'string' ? token : '', ip);
  if (!human) {
    return json({ ok: false, error: 'Verification failed. Please try again.', code: 'turnstile' }, 400);
  }

  // --- assemble lead ---
  const reference = makeReference();
  const now = new Date().toISOString();
  const isPreview = !!env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH !== 'main';

  let uploadKeys: string[] = [];
  try {
    uploadKeys = await storeUploads(env, uploads, reference);
  } catch {
    // Photo storage is optional — the lead must never be lost because of it.
    uploadKeys = [];
  }

  const lead = {
    reference,
    created_at: now,
    environment: isPreview ? 'preview-test' : 'production',
    ...fields,
    upload_references: uploadKeys,
  };

  // --- deliver ---
  let delivered = false;

  if (env.LEAD_WEBHOOK_URL) {
    try {
      const res = await fetch(env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(env.LEAD_WEBHOOK_SECRET ? { 'X-Webhook-Secret': env.LEAD_WEBHOOK_SECRET } : {}),
        },
        body: JSON.stringify(lead),
      });
      delivered = res.ok;
    } catch {
      delivered = false;
    }
  }

  if (env.FORM_RECIPIENT_EMAIL && env.EMAIL_API_KEY) {
    try {
      // Generic transactional-email delivery (Resend-compatible endpoint).
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.EMAIL_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Cumberland Septic Hub <leads@cumberlandseptichub.com>',
          to: [env.FORM_RECIPIENT_EMAIL],
          subject: `${lead.environment === 'preview-test' ? '[TEST] ' : ''}Septic lead ${reference} — ${fields.service_needed} (${fields.city_or_county})`,
          text: Object.entries(lead)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n'),
        }),
      });
      delivered = delivered || res.ok;
    } catch {
      /* fall through to storage check */
    }
  }

  // --- optional D1 storage ---
  let stored = false;
  if (env.LEADS_DB) {
    try {
      await env.LEADS_DB.prepare(
        `INSERT INTO leads (
          id, created_at, full_name, phone, email, property_location, city_or_county,
          property_type, service_needed, symptoms, active_backup, tank_location_known,
          last_pumped, preferred_contact_time, additional_details, upload_references,
          source_page, consent_recorded_at, lead_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          reference,
          now,
          fields.full_name,
          fields.phone,
          fields.email,
          fields.property_location,
          fields.city_or_county,
          fields.property_type,
          fields.service_needed,
          fields.symptoms,
          fields.active_backup,
          fields.tank_location_known,
          fields.last_pumped,
          fields.preferred_contact_time,
          fields.additional_details,
          JSON.stringify(uploadKeys),
          fields.source_page,
          now,
          'new',
        )
        .run();
      stored = true;
    } catch {
      stored = false;
    }
  }

  const noDeliveryConfigured = !env.LEAD_WEBHOOK_URL && !(env.FORM_RECIPIENT_EMAIL && env.EMAIL_API_KEY);

  if (!delivered && !stored && !noDeliveryConfigured) {
    // Delivery was configured but every channel failed — never silently drop a lead.
    console.error(`lead delivery failed: ${reference} (${fields.service_needed})`);
    return json(
      { ok: false, error: 'The request could not be delivered. Please try again or call instead.', code: 'delivery' },
      502,
    );
  }

  if (noDeliveryConfigured && !stored) {
    // Local development fallback: log non-sensitive metadata only.
    console.log(`[dev] lead received: ${reference} service=${fields.service_needed} area=${fields.city_or_county} urgent=${fields.active_backup}`);
  }

  return json({ ok: true, reference });
};
