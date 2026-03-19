/**
 * Классы опасных грузов ADR/ДОПОГ.
 * Водитель выбирает чекбоксами — прицеп может иметь несколько классов.
 */
export const ADR_CLASSES = [
  { id: '1',    label: 'Класс 1 — Взрывчатые вещества',        labelEn: 'Class 1 — Explosives'                 },
  { id: '2',    label: 'Класс 2 — Газы',                        labelEn: 'Class 2 — Gases'                      },
  { id: '3',    label: 'Класс 3 — Легковоспламеняющиеся жидкости', labelEn: 'Class 3 — Flammable liquids'      },
  { id: '4.1',  label: 'Класс 4.1 — Лёгкие твёрдые вещества',  labelEn: 'Class 4.1 — Flammable solids'         },
  { id: '4.2',  label: 'Класс 4.2 — Самовоспламеняющиеся',      labelEn: 'Class 4.2 — Spontaneously combustible'},
  { id: '4.3',  label: 'Класс 4.3 — Выделяют газ при намокании',labelEn: 'Class 4.3 — Water-reactive'           },
  { id: '5.1',  label: 'Класс 5.1 — Окисляющие вещества',       labelEn: 'Class 5.1 — Oxidizing substances'    },
  { id: '5.2',  label: 'Класс 5.2 — Органические пероксиды',    labelEn: 'Class 5.2 — Organic peroxides'        },
  { id: '6.1',  label: 'Класс 6.1 — Токсичные вещества',        labelEn: 'Class 6.1 — Toxic substances'        },
  { id: '6.2',  label: 'Класс 6.2 — Инфекционные вещества',     labelEn: 'Class 6.2 — Infectious substances'   },
  { id: '7',    label: 'Класс 7 — Радиоактивные материалы',      labelEn: 'Class 7 — Radioactive materials'     },
  { id: '8',    label: 'Класс 8 — Коррозионные вещества',        labelEn: 'Class 8 — Corrosive substances'      },
  { id: '9',    label: 'Класс 9 — Прочие опасные вещества',      labelEn: 'Class 9 — Miscellaneous'             },
] as const

export type AdrClassId = typeof ADR_CLASSES[number]['id']
export const adrClassIds = ADR_CLASSES.map(v => v.id) as [AdrClassId, ...AdrClassId[]]
