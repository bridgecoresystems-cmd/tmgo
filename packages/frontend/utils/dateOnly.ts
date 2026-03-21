/**
 * Календарные даты (YYYY-MM-DD) без сдвига из-за timezone.
 * Не использовать toISOString().slice(0, 10) после n-date-picker — в не-UTC зонах день «съедается».
 */

export function formatDateOnlyFromMs(ms: number | null | undefined): string | null {
  if (ms == null || Number.isNaN(Number(ms))) return null
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Строка YYYY-MM-DD (или ISO с датой в начале) → ms для n-date-picker. */
export function dateOnlyToPickerMs(s: string | null | undefined): number | null {
  if (s == null || s === '') return null
  const m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!y || !mo || !d) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return dt.getTime()
}
