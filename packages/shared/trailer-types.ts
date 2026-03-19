/**
 * Типы кузова прицепа/полуприцепа.
 * Используется для матчинга с типом груза заказчика.
 */
export const TRAILER_BODY_TYPES = [
  // ── Тентованные ───────────────────────────────────────────────
  { id: 'curtainsider',   label: 'Тент (шторный)',          labelEn: 'Curtainsider',          hasRefUnit: false },
  { id: 'mega',           label: 'Мега (увеличенный объём)',labelEn: 'Mega curtainsider',      hasRefUnit: false },
  { id: 'double_deck',    label: 'Двухъярусный',            labelEn: 'Double deck',            hasRefUnit: false },

  // ── Рефрижераторные ───────────────────────────────────────────
  { id: 'reefer',         label: 'Рефрижератор',            labelEn: 'Reefer / refrigerated',  hasRefUnit: true  },
  { id: 'multi_temp',     label: 'Мультитемпературный',     labelEn: 'Multi-temperature reefer',hasRefUnit: true  },
  { id: 'isothermal',     label: 'Изотермический',          labelEn: 'Isothermal',             hasRefUnit: false },

  // ── Платформы / борта ─────────────────────────────────────────
  { id: 'flatbed',        label: 'Борт / платформа',        labelEn: 'Flatbed / platform',     hasRefUnit: false },
  { id: 'lowboy',         label: 'Низкорамник',             labelEn: 'Lowboy / lowloader',     hasRefUnit: false },
  { id: 'extendable',     label: 'Раздвижная платформа',    labelEn: 'Extendable flatbed',     hasRefUnit: false },
  { id: 'coil_well',      label: 'Колодезный (для рулонов)',labelEn: 'Coil well / steel coil', hasRefUnit: false },

  // ── Самосвальные ──────────────────────────────────────────────
  { id: 'tipper_rear',    label: 'Самосвал (задняя разгр.)',labelEn: 'Rear tipper',            hasRefUnit: false },
  { id: 'tipper_side',    label: 'Самосвал (боковая разгр.)',labelEn: 'Side tipper',           hasRefUnit: false },
  { id: 'tipper_3way',    label: 'Самосвал (3-сторонний)', labelEn: 'Three-way tipper',       hasRefUnit: false },
  { id: 'walking_floor',  label: 'Ходячий пол (walking floor)',labelEn: 'Walking floor',       hasRefUnit: false },

  // ── Цистерны ──────────────────────────────────────────────────
  { id: 'tanker_fuel',    label: 'Цистерна (топливо)',      labelEn: 'Fuel tanker',            hasRefUnit: false },
  { id: 'tanker_food',    label: 'Цистерна (пищевая)',      labelEn: 'Food grade tanker',      hasRefUnit: false },
  { id: 'tanker_chemical',label: 'Цистерна (химия)',        labelEn: 'Chemical tanker',        hasRefUnit: false },
  { id: 'tanker_gas',     label: 'Газовоз (LPG/LNG)',       labelEn: 'Gas tanker (LPG/LNG)',   hasRefUnit: false },
  { id: 'silo',           label: 'Силос (сыпучие)',         labelEn: 'Silo / bulk tanker',     hasRefUnit: false },

  // ── Контейнерные ──────────────────────────────────────────────
  { id: 'container_20',   label: 'Контейнеровоз 20 фут',   labelEn: 'Container 20ft',         hasRefUnit: false },
  { id: 'container_40',   label: 'Контейнеровоз 40 фут',   labelEn: 'Container 40ft',         hasRefUnit: false },
  { id: 'container_swap', label: 'Съёмный кузов (swap)',    labelEn: 'Swap body',              hasRefUnit: false },

  // ── Специализированные ────────────────────────────────────────
  { id: 'timber',         label: 'Лесовозный',              labelEn: 'Timber / logging',       hasRefUnit: false },
  { id: 'livestock',      label: 'Скотовозный',             labelEn: 'Livestock',              hasRefUnit: false },
  { id: 'car_carrier',    label: 'Автовоз',                 labelEn: 'Car carrier',            hasRefUnit: false },
  { id: 'dumper_tipping', label: 'Зерновоз (самосвал)',     labelEn: 'Grain / cereal tipper',  hasRefUnit: false },
  { id: 'oversized',      label: 'Негабаритный груз',       labelEn: 'Oversized cargo',        hasRefUnit: false },
] as const

export type TrailerBodyTypeId = typeof TRAILER_BODY_TYPES[number]['id']

export const trailerBodyTypeIds = TRAILER_BODY_TYPES.map(v => v.id) as [TrailerBodyTypeId, ...TrailerBodyTypeId[]]

/** Типы у которых есть холодильный агрегат — показываем доп. поля */
export const REEFER_BODY_TYPES = TRAILER_BODY_TYPES
  .filter(v => v.hasRefUnit)
  .map(v => v.id) as TrailerBodyTypeId[]
