/**
 * Колёсная формула: первая цифра — всего колёс, вторая — ведущих.
 * Используется для матчинга (грузоподъёмность, допуск по осям, дорожный налог).
 */
export const AXLE_CONFIGS = [
  // ── Двухосные (4 колеса) ──────────────────────────────────────
  { id: '4x2', label: '4×2', labelEn: '4×2 (single rear axle)',         axles: 2, driven: 1, note: 'Лёгкие грузовики, газели'              },
  { id: '4x4', label: '4×4', labelEn: '4×4 (both axles driven)',         axles: 2, driven: 2, note: 'Полноприводные пикапы, вездеходы'      },

  // ── Трёхосные (6 колёс) ───────────────────────────────────────
  { id: '6x2', label: '6×2', labelEn: '6×2 (one rear axle driven)',      axles: 3, driven: 1, note: 'Тягачи, экономия топлива'              },
  { id: '6x4', label: '6×4', labelEn: '6×4 (both rear axles driven)',    axles: 3, driven: 2, note: 'Самый распространённый у тягачей СНГ'  },
  { id: '6x6', label: '6×6', labelEn: '6×6 (all axles driven)',          axles: 3, driven: 3, note: 'Урал, КамАЗ вездеход, стройка'        },

  // ── Четырёхосные (8 колёс) ────────────────────────────────────
  { id: '8x2', label: '8×2', labelEn: '8×2 (one driven axle)',           axles: 4, driven: 1, note: 'Длинномеры, спецтехника'              },
  { id: '8x4', label: '8×4', labelEn: '8×4 (two driven axles)',          axles: 4, driven: 2, note: 'Тяжёлые самосвалы, краны, 32+ т'      },
  { id: '8x6', label: '8×6', labelEn: '8×6 (three driven axles)',        axles: 4, driven: 3, note: 'Тяжёлая спецтехника'                  },
  { id: '8x8', label: '8×8', labelEn: '8×8 (all axles driven)',          axles: 4, driven: 4, note: 'Военная техника, экстремальный офроуд' },
] as const

export type AxleConfigId = typeof AXLE_CONFIGS[number]['id']

export const axleConfigIds = AXLE_CONFIGS.map(v => v.id) as [AxleConfigId, ...AxleConfigId[]]
