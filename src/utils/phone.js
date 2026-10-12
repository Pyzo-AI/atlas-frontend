// Ported from pyzo-central-frontend/src/utils/phone.ts.
import { COUNTRY_CODES } from "@/utils/countryCodes";

// COUNTRY_CODES stores compound codes with a hyphen for display (e.g. "+1-684"), which
// won't appear in a concatenated stored number — strip it before prefix-matching, and try
// longest codes first so "+1-684" isn't shadowed by the bare "+1" match.
export function splitPhoneNumber(stored) {
  if (!stored) return { countryCode: "+91", digits: "" };
  const compact = stored.replace(/\s+/g, "");
  const sorted = [...COUNTRY_CODES].sort(
    (a, b) => b.code.replace(/-/g, "").length - a.code.replace(/-/g, "").length
  );
  const match = sorted.find((c) => compact.startsWith(c.code.replace(/-/g, "")));
  if (!match) return { countryCode: "+91", digits: compact.replace(/^\+/, "") };
  return { countryCode: match.code, digits: compact.slice(match.code.replace(/-/g, "").length) };
}

// Matches SignupUserDto's existing "+91 9876543210" convention (space-separated).
export function joinPhoneNumber(countryCode, digits) {
  return digits ? `${countryCode} ${digits}` : undefined;
}

// National significant number length per calling code — exact for the most
// common countries (needed to catch an obviously-wrong entry, e.g. an
// 8-digit Indian number), a [min, max] range for the few with a genuinely
// variable-length numbering plan, and a generic ITU E.164 range (7–15 total
// digits) for every calling code not listed here.
const PHONE_DIGIT_LENGTH = {
  "+91": [10, 10], // India
  "+1": [10, 10], // US / Canada / NANP
  "+44": [10, 10], // UK
  "+61": [9, 9], // Australia
  "+86": [11, 11], // China
  "+81": [10, 10], // Japan
  "+82": [9, 10], // South Korea
  "+65": [8, 8], // Singapore
  "+971": [9, 9], // UAE
  "+966": [9, 9], // Saudi Arabia
  "+27": [9, 9], // South Africa
  "+49": [7, 11], // Germany
  "+33": [9, 9], // France
  "+39": [9, 10], // Italy
  "+34": [9, 9], // Spain
  "+31": [9, 9], // Netherlands
  "+7": [10, 10], // Russia / Kazakhstan
  "+52": [10, 10], // Mexico
  "+55": [10, 11], // Brazil
  "+880": [10, 10], // Bangladesh
  "+92": [10, 10], // Pakistan
  "+94": [9, 9], // Sri Lanka
  "+977": [10, 10], // Nepal
  "+63": [10, 10], // Philippines
  "+60": [9, 10], // Malaysia
  "+62": [9, 12], // Indonesia
  "+20": [10, 10], // Egypt
  "+234": [10, 10], // Nigeria
  "+64": [8, 9], // New Zealand
};
const GENERIC_PHONE_DIGIT_RANGE = [7, 15];

// Phone number is optional — an empty `digits` is valid; only a non-empty
// one gets length-checked against the selected country. Returns the allowed
// `{ min, max }` digit range when invalid (so the caller can show a
// translated message), undefined when valid.
export function getPhoneNumberError(countryCode, digits) {
  if (!digits) return undefined;
  const [min, max] = PHONE_DIGIT_LENGTH[countryCode] ?? GENERIC_PHONE_DIGIT_RANGE;
  if (digits.length < min || digits.length > max) return { min, max };
  return undefined;
}
