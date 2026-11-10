export function maskPii(text) {
  if (typeof text !== 'string') return text
  return text
    .replace(/\b[\w.+-]+@[\w-]+\.\w{2,}\b/gi, '[email]')
    .replace(/\b(\+91[\s-]?)?[6-9]\d{9}\b/g, '[phone]')
    .replace(/\b\d{10}\b/g, '[phone]')
}
