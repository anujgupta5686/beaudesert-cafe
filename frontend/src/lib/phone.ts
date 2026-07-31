import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js"
import examples from "libphonenumber-js/mobile/examples"

export type PhoneCountry = {
  iso: CountryCode
  name: string
  dialCode: string
  /** Typical mobile national number length for input capping */
  nationalLength: number
  flag: string
}

/** ISO → regional-indicator flag emoji */
export function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null

function countryName(iso: CountryCode): string {
  try {
    return regionNames?.of(iso) || iso
  } catch {
    return iso
  }
}

function nationalLengthFor(iso: CountryCode): number {
  try {
    const example = getExampleNumber(iso, examples)
    if (example?.nationalNumber) {
      return example.nationalNumber.length
    }
  } catch {
    /* fall through */
  }
  return 15
}

/** All countries with dial code, name, flag, expected mobile digit length */
export const PHONE_COUNTRIES: PhoneCountry[] = getCountries()
  .map((iso) => {
    const dial = getCountryCallingCode(iso)
    return {
      iso,
      name: countryName(iso),
      dialCode: `+${dial}`,
      nationalLength: nationalLengthFor(iso),
      flag: flagEmoji(iso),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

export const DEFAULT_PHONE_COUNTRY =
  PHONE_COUNTRIES.find((c) => c.iso === "IN") || PHONE_COUNTRIES[0]

export function findCountry(isoOrDial: string): PhoneCountry | undefined {
  const q = isoOrDial.trim().toLowerCase()
  return PHONE_COUNTRIES.find(
    (c) =>
      c.iso.toLowerCase() === q ||
      c.dialCode === isoOrDial ||
      c.dialCode.replace("+", "") === q
  )
}

export function filterCountries(query: string): PhoneCountry[] {
  const q = query.trim().toLowerCase()
  if (!q) return PHONE_COUNTRIES
  return PHONE_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.dialCode.replace("+", "").includes(q.replace("+", ""))
  )
}

/** Digits only; capped to country national length */
export function sanitizeNationalNumber(
  value: string,
  country: PhoneCountry
): string {
  return value.replace(/\D/g, "").slice(0, country.nationalLength)
}

export function buildE164(country: PhoneCountry, national: string): string {
  const digits = national.replace(/\D/g, "")
  return `${country.dialCode}${digits}`
}

export function isValidNationalMobile(
  country: PhoneCountry,
  national: string
): boolean {
  const digits = national.replace(/\D/g, "")
  if (!digits) return false
  if (digits.length !== country.nationalLength) return false
  const e164 = buildE164(country, digits)
  try {
    return isValidPhoneNumber(e164, country.iso)
  } catch {
    return digits.length === country.nationalLength
  }
}

export function formatPhoneDisplay(
  countryCode?: string | null,
  mobile?: string | null,
  countryIso?: string | null
): string {
  const national = (mobile || "").replace(/\D/g, "")
  if (!national) return "—"
  const code = (countryCode || "").trim()
  if (code) return `${code} ${national}`
  if (countryIso) {
    try {
      const parsed = parsePhoneNumberFromString(
        national,
        countryIso as CountryCode
      )
      if (parsed) return parsed.formatInternational()
    } catch {
      /* ignore */
    }
  }
  return national
}
