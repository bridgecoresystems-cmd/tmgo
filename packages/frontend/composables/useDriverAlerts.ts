/**
 * Оповещения водителя: документы с истекающим сроком (< 30 дней).
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
  const { apiBase } = useApiBase()
  const alerts = ref<DriverAlert[]>([])
  const count = computed(() => alerts.value.length)

  async function fetchAlerts() {
    try {
      const data = await $fetch<any>(`${apiBase}/cabinet/driver/profile`, { credentials: 'include' })
      const now = new Date()
      const threshold = new Date(now)
      threshold.setDate(threshold.getDate() + ALERT_DAYS_THRESHOLD)

      const items: DriverAlert[] = []

      const add = (
        type: DriverAlert['type'],
        title: string,
        dateStr: string | null | undefined
      ) => {
        const d = parseDate(dateStr)
        if (!d) return
        const days = daysBetween(now, d)
        if (days <= ALERT_DAYS_THRESHOLD) {
          items.push({
            id: `${type}-${dateStr}`,
            type,
            title,
            expiryDate: d.toISOString().slice(0, 10),
            daysLeft: days,
            isExpired: days < 0,
          })
        }
      }

      add('passport', 'Паспорт', data.passport_expiry_date)
      add('license', 'Водительское удостоверение', data.license_expiry)
      add('permission', 'Разрешение на въезд', data.permission_validity_date)

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
            title: 'Медосмотр (срок действия)',
            expiryDate: medExpiry.toISOString().slice(0, 10),
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
