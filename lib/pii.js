const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const IN_MOBILE = /(?<!\d)(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g
const AADHAAR = /(?<!\d)[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}(?!\d)/g

// Order matters: phone before Aadhaar, so +91 numbers are not read as an ID.
export function maskPii(text) {
  return String(text)
    .replace(EMAIL, '[EMAIL]')
    .replace(IN_MOBILE, '[PHONE]')
    .replace(AADHAAR, '[ID]')
}

export function isIndianMobile(text) {
  return /^(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/.test(String(text).trim())
}
