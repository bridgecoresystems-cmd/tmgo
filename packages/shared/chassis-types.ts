export const CHASSIS_TYPES = [
  // ── Седельные (под полуприцеп) ────────────────────────────────
  { id: 'fifth_wheel',        label: 'Седельный (5th wheel)',        labelEn: 'Fifth wheel / kingpin',        category: 'articulated'  },
  { id: 'cab_over',           label: 'Кабина над двигателем (COE)',  labelEn: 'Cab-over engine (COE)',        category: 'articulated'  },
  { id: 'conventional',       label: 'Длиннокапотный (conventional)',labelEn: 'Conventional / long-nose',    category: 'articulated'  },

  // ── Жёсткие (rigid) ───────────────────────────────────────────
  { id: 'rigid_flatbed',      label: 'Бортовой (ригид)',             labelEn: 'Rigid flatbed',               category: 'rigid'        },
  { id: 'rigid_tipper',       label: 'Самосвальный (ригид)',         labelEn: 'Rigid tipper / dumper',       category: 'rigid'        },
  { id: 'chassis_cab',        label: 'Шасси под надстройку',         labelEn: 'Chassis cab (bare chassis)',  category: 'rigid'        },
  { id: 'low_loader',         label: 'Низкорамное шасси',            labelEn: 'Low loader / lowboy chassis', category: 'rigid'        },

  // ── Сочленённые с прицепом на дышле (drawbar) ─────────────────
  { id: 'drawbar_train',      label: 'Автопоезд (дышловой)',         labelEn: 'Drawbar / A-train',           category: 'drawbar'      },
  { id: 'b_train',            label: 'B-train (двойной полуприцеп)', labelEn: 'B-train double semi',         category: 'drawbar'      },

  // ── Полноприводные / вездеходные ──────────────────────────────
  { id: 'offroad_4x4',        label: 'Полноприводное 4×4',           labelEn: 'Off-road 4×4',                category: 'offroad'      },
  { id: 'offroad_6x6',        label: 'Полноприводное 6×6',           labelEn: 'Off-road 6×6',                category: 'offroad'      },
  { id: 'offroad_8x8',        label: 'Полноприводное 8×8',           labelEn: 'Off-road 8×8',                category: 'offroad'      },
] as const

export type ChassisTypeId = typeof CHASSIS_TYPES[number]['id']
export type ChassisCategory = typeof CHASSIS_TYPES[number]['category']

export const chassisTypeIds = CHASSIS_TYPES.map(v => v.id) as [ChassisTypeId, ...ChassisTypeId[]]
export const chassisCategoryIds = [...new Set(CHASSIS_TYPES.map(v => v.category))] as [ChassisCategory, ...ChassisCategory[]]
