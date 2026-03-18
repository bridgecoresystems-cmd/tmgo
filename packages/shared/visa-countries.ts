/**
 * Visa countries — closest to Turkmenistan (issuing country / destination country).
 * Used in visa addition forms.
 * Values are i18n keys resolved via t('visaCountries.' + key).
 */
export const visaCountries = [
  // Turkmenistan's neighbors
  'turkmenistan',
  'uzbekistan',
  'kazakhstan',
  'iran',
  'afghanistan',
  'russia',
  'azerbaijan',

  // Further in the region
  'turkey',
  'georgia',
  'armenia',
  'tajikistan',
  'kyrgyzstan',
  'pakistan',
  'india',
  'china',
  'uae',
  'saudi_arabia',
  'qatar',
  'kuwait',
  'bahrain',
  'oman',
  'iraq',
  'syria',
  'jordan',
  'lebanon',
  'israel',

  // Europe (common routes)
  'ukraine',
  'belarus',
  'germany',
  'poland',
  'france',
  'italy',
  'spain',
  'netherlands',
  'belgium',
  'austria',
  'czech_republic',
  'hungary',
  'romania',
  'bulgaria',
  'greece',
  'finland',
  'sweden',
  'norway',
  'uk',
  'lithuania',
  'latvia',
  'estonia',
  'moldova',
] as const

export type VisaCountry = (typeof visaCountries)[number]
