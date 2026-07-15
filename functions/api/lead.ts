/**
 * POST /api/lead — server-side lead intake for the septic service-request form.
 *
 * Mirrors the cumberlandlandclearing reference architecture: validates every
 * field, verifies Turnstile server-side, stores photo uploads in a private R2
 * bucket, optionally persists to D1, then delivers the lead JSON to
 * LEAD_WEBHOOK_URL. Secrets never reach the browser.
 */

interface Env {
  // Optional bindings — endpoint degrades gracefully without them.
  LEADS_DB?: D1Database;
  LEAD_UPLOADS?: R2Bucket;

  // Secrets / vars (set in Cloudflare Pages settings or .dev.vars locally)
  TURNSTILE_SECRET_KEY?: string;
  LEAD_WEBHOOK_URL?: string;
  LEAD_WEBHOOK_SECRET?: string;
  FORM_RECIPIENT_EMAIL?: string;
  EMAIL_API_KEY?: string;
  DEV_MODE?: string;
  CF_PAGES_BRANCH?: string;
}

const MAX_FILES = 4;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

/** Required text fields with max lengths. Options mirror src/data/site.ts. */
const REQUIRED_FIELDS: Record<string, number> = {
  full_name: 120,
  phone: 30,
  email: 200,
  property_location: 250,
  city_or_county: 120,
  property_type: 30,
  service_needed: 60,
  symptoms: 60,
  active_backup: 10,
  tank_location_known: 40,
  last_pumped: 40,
  preferred_contact_time: 30,
  additional_details: 3000,
};

/** Optional fields (sent as empty strings when unset). */
const OPTIONAL_FIELDS: Record<string, number> = {
  alarm_active: 20,
  occupancy: 60,
  real_estate_involved: 10,
  service_timing: 60,
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function sanitize(value: string, max: number): string {
  // Strip control chars, collapse whitespace runs, enforce length.
  return value
    .split('').filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127).join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Normalize a possibly multi-valued form field (radio groups / duplicated
 * inputs) into a single sanitized string — last non-empty value wins.
 */
function single(form: FormData, name: string, max: number): string {
  const values = form
    .getAll(name)
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  return values.length ? sanitize(values[values.length - 1] as string, max) : '';
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Basic magic-byte check for JPEG/PNG/HEIC. Returns the safe extension or null. */
function sniffImage(bytes: Uint8Array): string | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return 'png';
  }
  // HEIC/HEIF: ISO BMFF "ftyp" box with heic/heix/mif1... major brand
  if (bytes.length > 12) {
    const ftyp = String.fromCharCode(...bytes.subarray(4, 8));
    const brand = String.fromCharCode(...bytes.subarray(8, 12)).toLowerCase();
    if (ftyp === 'ftyp' && /^(heic|heix|hevc|heim|heis|mif1|msf1)/.test(brand)) return 'heic';
  }
  // Everything else (executables, svg, html, archives...) is rejected.
  return null;
}

async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | null,
): Promise<{ success: boolean; errorCodes: string[] }> {
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    return { success: data.success === true, errorCodes: data['error-codes'] ?? [] };
  } catch {
    return { success: false, errorCodes: ['siteverify-fetch-failed'] };
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Accept POST only; reject every other method explicitly.
  if (context.request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed.' });
  }
  const { request, env } = context;
  const devMode =
    env.DEV_MODE === 'true' || (!!env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH !== 'main');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: 'The form could not be read. Please try again.' });
  }

  // Honeypot: silently accept but do nothing.
  if (single(form, 'website', 200) !== '') {
    return json(200, { ok: true, leadId: 'CSH-OK' });
  }

  // ── Validate text fields ──
  const fields: Record<string, string> = {};
  for (const [name, max] of Object.entries(REQUIRED_FIELDS)) {
    const value = single(form, name, max);
    if (!value) {
      return json(422, { ok: false, error: `Missing required field: ${name.replace(/_/g, ' ')}.` });
    }
    fields[name] = value;
  }
  for (const [name, max] of Object.entries(OPTIONAL_FIELDS)) {
    fields[name] = single(form, name, max);
  }

  const phone = normalizePhone(fields.phone);
  if (!phone) return json(422, { ok: false, error: 'Please provide a valid phone number.' });
  if (!isValidEmail(fields.email)) {
    return json(422, { ok: false, error: 'Please provide a valid email address.' });
  }

  if (form.get('consent') !== 'yes') {
    return json(422, { ok: false, error: 'Consent is required to submit the request.' });
  }

  const sourcePage = single(form, 'source_page', 200);

  // ── Turnstile (reject 400 on failure) ──
  if (env.TURNSTILE_SECRET_KEY) {
    const token = String(form.get('cf-turnstile-response') ?? '');
    const ip = request.headers.get('CF-Connecting-IP');
    const verdict = token
      ? await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip)
      : { success: false, errorCodes: ['missing-input-response(client)'] };
    if (!verdict.success) {
      // error-codes go to logs only (readable via wrangler pages deployment
      // tail) — never into the public response.
      console.error(`lead turnstile reject: ${JSON.stringify(verdict.errorCodes)}`);
      return json(400, {
        ok: false,
        code: 'turnstile',
        error: 'Spam check failed or expired. Please complete the verification and try again.',
      });
    }
  } else if (!devMode) {
    console.warn(
      'lead: TURNSTILE_SECRET_KEY not configured on production — submission accepted without verification',
    );
  }

  // ── Lead identity ──
  const leadId = `CSH-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const createdAt = new Date().toISOString();

  // ── File uploads → private R2 ──
  const files = (form.getAll('photos') as unknown as (File | string)[]).filter(
    (f): f is File => typeof f !== 'string' && f instanceof File && f.size > 0,
  );
  if (files.length > MAX_FILES) {
    return json(422, { ok: false, error: `Please upload at most ${MAX_FILES} photos.` });
  }
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (files.some((f) => f.size > MAX_FILE_BYTES) || totalBytes > MAX_TOTAL_BYTES) {
    return json(422, { ok: false, error: 'Photos must be 10 MB or less each (25 MB total).' });
  }

  const uploadRefs: string[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = sniffImage(bytes);
    if (!ext) {
      return json(422, { ok: false, error: 'Only JPG, PNG and HEIC photos are supported.' });
    }
    if (env.LEAD_UPLOADS) {
      // Randomized object name; visitor filename never used.
      const key = `${devMode ? 'test/' : ''}${leadId}/${crypto.randomUUID()}.${ext}`;
      try {
        await env.LEAD_UPLOADS.put(key, bytes, {
          httpMetadata: {
            contentType:
              ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg',
          },
        });
        uploadRefs.push(key);
      } catch (err) {
        console.error(`lead ${leadId}: R2 upload failed`, err);
        // Photos are optional context — do not fail the whole lead over storage.
      }
    }
  }

  // Webhook payload — key set is a stable contract with the receiving
  // automation; do not rename or remove keys without updating the consumer.
  const lead = {
    leadId,
    created_at: createdAt,
    full_name: fields.full_name,
    phone,
    email: fields.email,
    property_location: fields.property_location,
    city_or_county: fields.city_or_county,
    property_type: fields.property_type,
    service_needed: fields.service_needed,
    symptoms: fields.symptoms,
    active_backup: fields.active_backup,
    tank_location_known: fields.tank_location_known,
    last_pumped: fields.last_pumped,
    alarm_active: fields.alarm_active,
    occupancy: fields.occupancy,
    real_estate_involved: fields.real_estate_involved,
    service_timing: fields.service_timing,
    preferred_contact_time: fields.preferred_contact_time,
    additional_details: fields.additional_details,
    upload_references: uploadRefs,
    source_page: sourcePage,
    consent_recorded_at: createdAt,
    test_submission: devMode,
  };

  // ── Optional D1 persistence (migrations/0001_create_leads.sql) ──
  if (env.LEADS_DB) {
    try {
      await env.LEADS_DB.prepare(
        `INSERT INTO leads (
          id, created_at, full_name, phone, email, property_location, city_or_county,
          property_type, service_needed, symptoms, active_backup, tank_location_known,
          last_pumped, preferred_contact_time, additional_details, upload_references,
          source_page, consent_recorded_at, lead_status
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
        .bind(
          leadId, createdAt, lead.full_name, lead.phone, lead.email,
          lead.property_location, lead.city_or_county, lead.property_type,
          lead.service_needed, lead.symptoms, lead.active_backup, lead.tank_location_known,
          lead.last_pumped, lead.preferred_contact_time, lead.additional_details,
          JSON.stringify(uploadRefs), lead.source_page, lead.consent_recorded_at,
          devMode ? 'test' : 'new',
        )
        .run();
    } catch (err) {
      console.error(`lead ${leadId}: D1 insert failed`, err);
      // Continue — webhook delivery below is the primary channel.
    }
  }

  // ── Delivery: webhook and/or email. Skipped in dev mode (safe local testing). ──
  let delivered = false;
  if (!devMode) {
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
        if (!res.ok) console.error(`lead ${leadId}: webhook returned ${res.status}`);
      } catch (err) {
        console.error(`lead ${leadId}: webhook delivery failed`, err);
      }
    }

    if (env.FORM_RECIPIENT_EMAIL && env.EMAIL_API_KEY) {
      // Generic transactional-email delivery (Resend-compatible endpoint).
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.EMAIL_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Cumberland Septic Hub <leads@cumberlandseptichub.com>',
            to: [env.FORM_RECIPIENT_EMAIL],
            subject: `Septic lead ${leadId} — ${lead.service_needed} (${lead.city_or_county})${lead.active_backup === 'Yes' ? ' [URGENT: active backup]' : ''}`,
            text: [
              `Lead ${leadId} (${createdAt})`,
              `Name: ${lead.full_name}`,
              `Phone: ${lead.phone}`,
              `Email: ${lead.email}`,
              `Location: ${lead.property_location} (${lead.city_or_county})`,
              `Property type: ${lead.property_type}`,
              `Service: ${lead.service_needed}`,
              `Symptoms: ${lead.symptoms}`,
              `Active backup: ${lead.active_backup} · Alarm: ${lead.alarm_active || 'n/a'}`,
              `Tank location known: ${lead.tank_location_known} · Last pumped: ${lead.last_pumped}`,
              `Occupancy: ${lead.occupancy || 'n/a'} · Real estate involved: ${lead.real_estate_involved || 'n/a'}`,
              `Timing: ${lead.service_timing || 'n/a'} · Contact time: ${lead.preferred_contact_time}`,
              `Details: ${lead.additional_details}`,
              `Photos: ${uploadRefs.length ? uploadRefs.join(', ') : 'none'}`,
              `Source page: ${lead.source_page}`,
            ].join('\n'),
          }),
        });
        delivered = delivered || res.ok;
        if (!res.ok) console.error(`lead ${leadId}: email API returned ${res.status}`);
      } catch (err) {
        console.error(`lead ${leadId}: email delivery failed`, err);
      }
    }

    // Never silently discard: if nothing delivered and nothing persisted, tell the visitor.
    if (!delivered && !env.LEADS_DB) {
      console.error(`lead ${leadId}: no delivery channel succeeded and no D1 configured`);
      return json(502, {
        ok: false,
        error: 'The request could not be delivered right now. Please try again or call instead.',
      });
    }
  } else {
    console.log(`lead ${leadId}: TEST submission (dev mode) — delivery skipped`, {
      service: lead.service_needed,
      city: lead.city_or_county,
      urgent: lead.active_backup,
    });
  }

  return json(200, { ok: true, leadId });
};
