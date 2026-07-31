const {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  getExampleNumber,
} = require('libphonenumber-js');
const examples = require('libphonenumber-js/mobile/examples');

/**
 * Validate checkout mobile with country code.
 * Expects: mobile (national digits), countryCode (+91), countryIso (IN)
 */
function validateOrderPhone({ mobile, countryCode, countryIso, fullMobile }) {
  const national = String(mobile || '').replace(/\D/g, '');
  const iso = String(countryIso || '')
    .trim()
    .toUpperCase();
  let code = String(countryCode || '').trim();
  if (code && !code.startsWith('+')) code = `+${code}`;

  if (!national) {
    return { ok: false, message: 'Mobile number is required' };
  }
  if (!iso || !code) {
    return {
      ok: false,
      message: 'Country code is required for the mobile number',
    };
  }

  let expectedLen = null;
  try {
    const example = getExampleNumber(iso, examples);
    if (example?.nationalNumber) {
      expectedLen = example.nationalNumber.length;
    }
  } catch {
    /* ignore */
  }

  if (expectedLen != null && national.length !== expectedLen) {
    return {
      ok: false,
      message: `Mobile for ${iso} must be exactly ${expectedLen} digits`,
    };
  }

  const e164 =
    fullMobile && String(fullMobile).startsWith('+')
      ? String(fullMobile).trim()
      : `${code}${national}`;

  if (!isValidPhoneNumber(e164, iso)) {
    return {
      ok: false,
      message: `Invalid mobile number for country ${iso}`,
    };
  }

  const parsed = parsePhoneNumberFromString(e164, iso);
  return {
    ok: true,
    mobile: national,
    countryCode: code,
    countryIso: iso,
    fullMobile: parsed ? parsed.format('E.164') : e164,
  };
}

function formatPhoneForDisplay(order) {
  if (order?.fullMobile) return order.fullMobile;
  if (order?.countryCode && order?.mobile) {
    return `${order.countryCode} ${order.mobile}`;
  }
  return order?.mobile || '';
}

module.exports = { validateOrderPhone, formatPhoneForDisplay };
