import { timingSafeEqual } from 'crypto'

/** Constant-time comparison of a provided secret against the expected value. */
export function secretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
