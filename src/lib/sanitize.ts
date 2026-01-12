/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

// Characters that could be used for XSS or injection
const DANGEROUS_CHARS = /[<>'"&;\\`${}()[\]]/g

// Maximum allowed input lengths
const MAX_SEARCH_LENGTH = 100
const MAX_GAUGE_ID_LENGTH = 20

/**
 * Sanitize search query input
 * Removes potentially dangerous characters and limits length
 */
export function sanitizeSearchQuery(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
    .replace(DANGEROUS_CHARS, '')
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Sanitize gauge ID input
 * Only allows alphanumeric characters and specific patterns
 */
export function sanitizeGaugeId(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Gauge IDs should match pattern like "130212A"
  return input
    .trim()
    .slice(0, MAX_GAUGE_ID_LENGTH)
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
}

/**
 * Validate gauge ID format
 * Valid format: 6 digits followed by 1 letter (e.g., "130212A")
 */
export function isValidGaugeId(id: string): boolean {
  const sanitized = sanitizeGaugeId(id)
  return /^\d{6}[A-Z]$/.test(sanitized)
}

/**
 * Escape HTML entities for safe display
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char)
}

/**
 * Sanitize URL parameter
 */
export function sanitizeUrlParam(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return encodeURIComponent(input.trim().slice(0, 200))
}
