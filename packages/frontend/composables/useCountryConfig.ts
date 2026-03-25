interface BankingConfig {
  codeLabel: string   // БИК / МФО / SWIFT/BIC
  swift: boolean      // показывать отдельное поле SWIFT
  iban: boolean       // показывать IBAN
  ibanPrefix?: string
  hasCorrAccount?: boolean  // только RU — корр. счёт
}

interface IndividualConfig {
  docType: string
  docLabel: string
  docPlaceholder?: string
  docMaxLen?: number
}

interface CompanyConfig {
  taxIdLabel: string
  taxIdMaxLen?: number
  legalForms: { label: string; value: string }[]
  banking: BankingConfig
}

interface CountryConfig {
  name: string
  flag: string
  hasPatronymic: boolean
  individual: IndividualConfig
  company: CompanyConfig
}

const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  TM: {
    name: 'Туркменистан', flag: '🇹🇲', hasPatronymic: true,
    individual: { docType: 'passport_tm', docLabel: 'Номер паспорта', docPlaceholder: 'A 123456' },
    company: {
      taxIdLabel: 'ИНН',
      legalForms: [
        { label: 'Хусусы телекечи (ХТ)', value: 'ht' },
        { label: 'ЖПЖ (ООО)', value: 'jpj' },
        { label: 'ЗАТ (ЗАО)', value: 'zat' },
      ],
      banking: { codeLabel: 'МФО', swift: false, iban: false },
    },
  },
  UZ: {
    name: 'Узбекистан', flag: '🇺🇿', hasPatronymic: true,
    individual: { docType: 'pinfl', docLabel: 'ПИНФЛ (14 цифр)', docPlaceholder: '00000000000000', docMaxLen: 14 },
    company: {
      taxIdLabel: 'ИНН (9 цифр)', taxIdMaxLen: 9,
      legalForms: [
        { label: 'ЯТТ (ИП)', value: 'yatt' },
        { label: 'МЧЖ (ООО)', value: 'mchj' },
        { label: 'АЖ (АО)', value: 'aj' },
      ],
      banking: { codeLabel: 'МФО (9 цифр)', swift: false, iban: false },
    },
  },
  KZ: {
    name: 'Казахстан', flag: '🇰🇿', hasPatronymic: true,
    individual: { docType: 'iin', docLabel: 'ИИН (12 цифр)', docPlaceholder: '000000000000', docMaxLen: 12 },
    company: {
      taxIdLabel: 'БИН (12 цифр)', taxIdMaxLen: 12,
      legalForms: [
        { label: 'ЖК (ИП)', value: 'jk' },
        { label: 'ЖШС (ТОО)', value: 'jshs' },
        { label: 'АҚ (АО)', value: 'ak' },
      ],
      banking: { codeLabel: 'БИК (8 цифр)', swift: false, iban: true, ibanPrefix: 'KZ' },
    },
  },
  KG: {
    name: 'Кыргызстан', flag: '🇰🇬', hasPatronymic: true,
    individual: { docType: 'inn_kg', docLabel: 'ИНН (14 цифр)', docPlaceholder: '00000000000000', docMaxLen: 14 },
    company: {
      taxIdLabel: 'ИНН юрлица',
      legalForms: [
        { label: 'Жеке ишкер (ИП)', value: 'ji' },
        { label: 'ЖЧК (ООО)', value: 'jchk' },
        { label: 'АО', value: 'ao' },
      ],
      banking: { codeLabel: 'БИК (9 цифр)', swift: false, iban: false },
    },
  },
  TJ: {
    name: 'Таджикистан', flag: '🇹🇯', hasPatronymic: true,
    individual: { docType: 'passport_tj', docLabel: 'Номер паспорта' },
    company: {
      taxIdLabel: 'ИНН',
      legalForms: [
        { label: 'КИ (ИП)', value: 'ki' },
        { label: 'ҶММ (ООО)', value: 'jmm' },
        { label: 'ШС (АО)', value: 'shs' },
      ],
      banking: { codeLabel: 'МФО', swift: false, iban: false },
    },
  },
  IR: {
    name: 'Иран', flag: '🇮🇷', hasPatronymic: false,
    individual: { docType: 'melli_code', docLabel: 'کد ملی (10 цифр)', docPlaceholder: '0000000000', docMaxLen: 10 },
    company: {
      taxIdLabel: 'شناسه ملی (11 цифр)', taxIdMaxLen: 11,
      legalForms: [
        { label: 'شخص حقیقی (Физлицо)', value: 'natural' },
        { label: 'شرکت با مسئولیت محدود (LLC)', value: 'llc' },
        { label: 'شرکت سهامی خاص (JSC)', value: 'jsc' },
      ],
      banking: { codeLabel: 'شناسه بانک', swift: true, iban: true, ibanPrefix: 'IR' },
    },
  },
  TR: {
    name: 'Турция', flag: '🇹🇷', hasPatronymic: false,
    individual: { docType: 'tc_kimlik', docLabel: 'TC Kimlik No (11 цифр)', docPlaceholder: '00000000000', docMaxLen: 11 },
    company: {
      taxIdLabel: 'Vergi No (10 цифр)', taxIdMaxLen: 10,
      legalForms: [
        { label: 'Şahıs İşletmesi (ИП)', value: 'sahis' },
        { label: 'Limited Şirketi (Ltd.)', value: 'ltd' },
        { label: 'Anonim Şirketi (A.Ş.)', value: 'as' },
      ],
      banking: { codeLabel: 'SWIFT/BIC', swift: true, iban: true, ibanPrefix: 'TR' },
    },
  },
  AE: {
    name: 'ОАЭ', flag: '🇦🇪', hasPatronymic: false,
    individual: { docType: 'emirates_id', docLabel: 'Emirates ID (15 цифр)', docPlaceholder: '000-0000-0000000-0', docMaxLen: 15 },
    company: {
      taxIdLabel: 'Trade License No',
      legalForms: [
        { label: 'Sole Establishment', value: 'sole' },
        { label: 'LLC (Local)', value: 'llc' },
        { label: 'Free Zone LLC', value: 'fzllc' },
        { label: 'Branch', value: 'branch' },
      ],
      banking: { codeLabel: 'SWIFT/BIC', swift: true, iban: true, ibanPrefix: 'AE' },
    },
  },
  RU: {
    name: 'Россия', flag: '🇷🇺', hasPatronymic: true,
    individual: { docType: 'inn_ru', docLabel: 'ИНН (12 цифр)', docPlaceholder: '000000000000', docMaxLen: 12 },
    company: {
      taxIdLabel: 'ИНН (10 цифр)', taxIdMaxLen: 10,
      legalForms: [
        { label: 'ИП', value: 'ip' },
        { label: 'ООО', value: 'ooo' },
        { label: 'АО', value: 'ao' },
        { label: 'ПАО', value: 'pao' },
      ],
      banking: { codeLabel: 'БИК (9 цифр)', swift: false, iban: false, hasCorrAccount: true },
    },
  },
  BY: {
    name: 'Беларусь', flag: '🇧🇾', hasPatronymic: true,
    individual: { docType: 'passport_by', docLabel: 'Номер паспорта' },
    company: {
      taxIdLabel: 'УНП (9 цифр)', taxIdMaxLen: 9,
      legalForms: [
        { label: 'ИП', value: 'ip' },
        { label: 'ООО', value: 'ooo' },
        { label: 'ЧТУП', value: 'chtup' },
        { label: 'ОАО', value: 'oao' },
      ],
      banking: { codeLabel: 'БИК (8 цифр)', swift: false, iban: true, ibanPrefix: 'BY' },
    },
  },
}

export const COUNTRY_LIST = Object.entries(COUNTRY_CONFIG).map(([code, cfg]) => ({
  code,
  name: cfg.name,
  flag: cfg.flag,
}))

export function useCountryConfig() {
  function getConfig(code: string): CountryConfig | null {
    return COUNTRY_CONFIG[code] ?? null
  }

  function getLegalFormOptions(code: string) {
    return COUNTRY_CONFIG[code]?.company.legalForms ?? []
  }

  return { getConfig, getLegalFormOptions, COUNTRY_LIST }
}
