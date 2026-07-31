const env = require('../config/environment');

/**
 * Normalize stored media URLs so clients always get usable absolute URLs.
 * Relative `/uploads/...` and legacy localhost absolute URLs are rewritten
 * using BACKEND_URL (or http://localhost:PORT).
 */
function absoluteMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const base = (env.backendUrl || `http://localhost:${env.port || 5000}`).replace(
    /\/$/,
    ''
  );

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

function mapImageFields(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const out = { ...doc };
  if (out.image) out.image = absoluteMediaUrl(out.image);
  if (Array.isArray(out.images)) {
    out.images = out.images.map((u) => absoluteMediaUrl(u)).filter(Boolean);
  }
  return out;
}

/** Normalize a lean menu document (and nested combo items) for API responses */
function normalizeMenuMedia(item) {
  if (!item) return item;
  const out = mapImageFields(item);
  if (Array.isArray(out.comboItems)) {
    out.comboItems = out.comboItems.map((ci) => {
      if (!ci || typeof ci !== 'object') return ci;
      const next = { ...ci };
      if (next.item && typeof next.item === 'object') {
        next.item = mapImageFields(next.item);
      }
      return next;
    });
  }
  return out;
}

function normalizeMenuList(items) {
  if (!Array.isArray(items)) return items;
  return items.map(normalizeMenuMedia);
}

module.exports = {
  absoluteMediaUrl,
  normalizeMenuMedia,
  normalizeMenuList,
};
