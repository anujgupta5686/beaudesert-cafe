const env = require('../config/environment');

/**
 * Resolve the public API origin for media URLs.
 * Prefer BACKEND_URL / RENDER_EXTERNAL_URL; fall back to the incoming request host.
 */
function resolvePublicBase(req) {
  const configured = (env.backendUrl || '').replace(/\/$/, '');
  if (
    configured &&
    !/localhost|127\.0\.0\.1/i.test(configured)
  ) {
    return configured;
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    return String(process.env.RENDER_EXTERNAL_URL).replace(/\/$/, '');
  }

  if (req) {
    const proto = (
      req.get?.('x-forwarded-proto') ||
      req.protocol ||
      'http'
    ).split(',')[0].trim();
    const host = (
      req.get?.('x-forwarded-host') ||
      req.get?.('host') ||
      ''
    )
      .split(',')[0]
      .trim();
    if (host) return `${proto}://${host}`;
  }

  return configured || `http://localhost:${env.port || 5000}`;
}

/**
 * Normalize stored media URLs so clients always get usable absolute URLs.
 * Relative `/uploads/...` and legacy localhost absolute URLs are rewritten.
 */
function absoluteMediaUrl(url, req) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const base = resolvePublicBase(req);

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/api/')) {
    return `${base}${trimmed}`;
  }

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
        return `${base}${parsed.pathname}${parsed.search}`;
      }
      return trimmed;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

function mapImageFields(doc, req) {
  if (!doc || typeof doc !== 'object') return doc;
  const out = { ...doc };
  if (out.image) out.image = absoluteMediaUrl(out.image, req);
  if (Array.isArray(out.images)) {
    out.images = out.images
      .map((u) => absoluteMediaUrl(u, req))
      .filter(Boolean);
  }
  return out;
}

/** Normalize a lean menu document (and nested combo items) for API responses */
function normalizeMenuMedia(item, req) {
  if (!item) return item;
  const out = mapImageFields(item, req);
  if (Array.isArray(out.comboItems)) {
    out.comboItems = out.comboItems.map((ci) => {
      if (!ci || typeof ci !== 'object') return ci;
      const next = { ...ci };
      if (next.item && typeof next.item === 'object') {
        next.item = mapImageFields(next.item, req);
      }
      return next;
    });
  }
  return out;
}

function normalizeMenuList(items, req) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => normalizeMenuMedia(item, req));
}

module.exports = {
  resolvePublicBase,
  absoluteMediaUrl,
  normalizeMenuMedia,
  normalizeMenuList,
};
