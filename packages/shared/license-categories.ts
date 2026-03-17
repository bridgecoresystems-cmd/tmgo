/**
 * Категории водительского удостоверения
 */
export const licenseCategories = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
] as const

export type LicenseCategoryValue = (typeof licenseCategories)[number]['value']
