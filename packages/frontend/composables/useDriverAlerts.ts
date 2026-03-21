import { formatDateOnlyFromMs } from '~/utils/dateOnly'

/**
 * Оповещения водителя: документы с истекающим сроком (< 30 дней).
 * Не показываем алерт по старому паспорту/ВУ, если есть более новый документ (добавлен через «Добавить документы»).
 */
const ALERT_DAYS_THRESHOLD = 30

export interface DriverAlert {
  id: string
  type: 'passport' | 'license' | 'permission' | 'medical'
  title: string
  expiryDate: string
  daysLeft: number
  isExpired: boolean
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

export function useDriverAlerts() {
  const { t } = useI18n()
  const { apiBase } = useApiBase()
  const alerts = ref<DriverAlert[]>([])
  const count = computed(() => alerts.value.length)

  async function fetchAlerts() {
    try {
      const data = await $fetch<any>(`${apiBase}/cabinet/driver/profile`, { credentials: 'include' })
      const now = new Date()

      const items: DriverAlert[] = []

      const add = (
        type: DriverAlert['type'],
        title: string,
        dateStr: string | null | undefined,
        idSuffix?: string,
        isActive: boolean = true
      ) => {
        if (!isActive) return
        const d = parseDate(dateStr)
        if (!d) return
        const days = daysBetween(now, d)
        if (days <= ALERT_DAYS_THRESHOLD) {
          items.push({
            id: idSuffix ? `${type}-${idSuffix}` : `${type}-${dateStr}`,
            type,
            title,
            expiryDate: formatDateOnlyFromMs(d.getTime()) ?? '',
            daysLeft: days,
            isExpired: days < 0,
          })
        }
      }

      // Паспорта: если есть passports_from_documents (добавлены через «Добавить документы»),
      // то новый документ уже есть — не показываем алерт по старому паспорту из профиля
      const fromDocsPassports = Array.isArray(data.passports_from_documents) ? data.passports_from_documents : []
      const hasNewerPassport = fromDocsPassports.length > 0

      if (!hasNewerPassport) {
        add('passport', t('driver.alerts.passportN', { n: 1 }), data.passport_expiry_date, undefined, data.passport_is_active)
        const extra = Array.isArray(data.extra_passports) ? data.extra_passports : []
        extra.forEach((p: { passport_expiry_date?: string | null; is_active?: boolean }, i: number) => {
          add('passport', t('driver.alerts.passportN', { n: i + 2 }), p.passport_expiry_date, `extra-${i}`, p.is_active)
        })
      } else {
        // Только самый новый паспорт (первый в списке — orderBy createdAt desc)
        const newest = fromDocsPassports[0]
        if (newest) add('passport', t('driver.alerts.passportN', { n: 1 }), newest.expires_at, 'doc-0', true)
      }

      // ВУ: аналогично — если есть licenses_from_documents, не показываем алерт по старому ВУ из профиля
      const fromDocsLicenses = Array.isArray(data.licenses_from_documents) ? data.licenses_from_documents : []
      const hasNewerLicense = fromDocsLicenses.length > 0

      if (!hasNewerLicense) {
        add('license', t('driver.alerts.driversLicense'), data.license_expiry)
      } else {
        const newestLic = fromDocsLicenses[0]
        if (newestLic) add('license', t('driver.alerts.driversLicense'), newestLic.expires_at, 'doc-0', true)
      }

      add('permission', t('driver.alerts.entryPermit'), data.permission_validity_date)

      // Медосмотр действует 1 год — срок = дата осмотра + 365 дней
      const medDate = parseDate(data.last_medical_examination_date)
      if (medDate) {
        const medExpiry = new Date(medDate)
        medExpiry.setFullYear(medExpiry.getFullYear() + 1)
        const days = daysBetween(now, medExpiry)
        if (days <= ALERT_DAYS_THRESHOLD) {
          items.push({
            id: 'medical-expiry',
            type: 'medical',
            title: t('driver.alerts.medicalExpiry'),
            expiryDate: formatDateOnlyFromMs(medExpiry.getTime()) ?? '',
            daysLeft: days,
            isExpired: days < 0,
          })
        }
      }

      alerts.value = items
    } catch {
      alerts.value = []
    }
  }

  return { alerts, count, fetchAlerts }
}
