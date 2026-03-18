/**
 * ADR dangerous goods classes (agreement on the carriage of dangerous goods)
 * Labels are i18n keys: use t('adrClasses.' + item.value) in components.
 */
export const adrClasses = [
  { value: '1' },
  { value: '2' },
  { value: '3' },
  { value: '4' },
  { value: '5' },
  { value: '6' },
  { value: '7' },
  { value: '8' },
  { value: '9' },
] as const

export type AdrClassValue = (typeof adrClasses)[number]['value']
