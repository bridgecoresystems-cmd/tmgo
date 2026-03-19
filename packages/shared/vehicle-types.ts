// packages/shared/src/vehicle-types.ts

export const VEHICLE_TYPES = [
  // ── Тяжёлый грузовой ──────────────────────────────────────────
  { id: 'tractor_unit',       label: 'Тягач (седельный)',          labelEn: 'Tractor unit',                  category: 'heavy_truck'  },
  { id: 'semi_truck',         label: 'Фура (тягач + полуприцеп)',  labelEn: 'Semi-truck',                    category: 'heavy_truck'  },
  { id: 'rigid_flatbed',      label: 'Бортовой грузовик (ригид)',  labelEn: 'Rigid truck / flatbed',         category: 'heavy_truck'  },
  { id: 'curtainsider_truck', label: 'Тентованный грузовик',       labelEn: 'Curtainsider truck',            category: 'heavy_truck'  },
  { id: 'refrigerated_truck', label: 'Рефрижераторный грузовик',   labelEn: 'Refrigerated truck',            category: 'heavy_truck'  },
  { id: 'tanker_truck',       label: 'Грузовик-цистерна',          labelEn: 'Tanker truck',                  category: 'heavy_truck'  },
  { id: 'dump_truck',         label: 'Самосвал',                   labelEn: 'Dump truck / tipper',           category: 'heavy_truck'  },
  { id: 'container_truck',    label: 'Контейнеровоз',              labelEn: 'Container truck',               category: 'heavy_truck'  },
  { id: 'car_transporter',    label: 'Автовоз',                    labelEn: 'Car transporter',               category: 'heavy_truck'  },
  { id: 'timber_truck',       label: 'Лесовоз',                    labelEn: 'Timber truck',                  category: 'heavy_truck'  },
  { id: 'extendable_truck',   label: 'Длинномер',                  labelEn: 'Extendable trailer truck',      category: 'heavy_truck'  },
  { id: 'lowboy_truck',       label: 'Низкорамник (трал)',         labelEn: 'Lowboy / lowloader',            category: 'heavy_truck'  },
  { id: 'livestock_truck',    label: 'Скотовоз',                   labelEn: 'Livestock truck',               category: 'heavy_truck'  },
  // ── Спецтехника ───────────────────────────────────────────────
  { id: 'garbage_truck',      label: 'Мусоровоз',                  labelEn: 'Garbage truck',                 category: 'special'      },
  { id: 'concrete_mixer',     label: 'Бетономешалка',              labelEn: 'Concrete mixer truck',          category: 'special'      },
  { id: 'mobile_crane',       label: 'Автокран',                   labelEn: 'Mobile crane truck',            category: 'special'      },
  { id: 'concrete_pump',      label: 'Бетонный насос',             labelEn: 'Concrete pump truck',           category: 'special'      },
  { id: 'vacuum_tanker',      label: 'Ассенизатор',                labelEn: 'Vacuum tanker',                 category: 'special'      },
  { id: 'fuel_tanker',        label: 'Топливозаправщик',           labelEn: 'Fuel tanker',                   category: 'special'      },
  { id: 'hooklift_truck',     label: 'Мультилифт (крюковой)',      labelEn: 'Hook-lift truck',               category: 'special'      },
  // ── Лёгкий грузовой ───────────────────────────────────────────
  { id: 'gazelle_van',        label: 'Газель / малотоннажный',     labelEn: 'Gazelle / light van',           category: 'light_truck'  },
  { id: 'cargo_minibus',      label: 'Грузовой микроавтобус',      labelEn: 'Cargo minibus',                 category: 'light_truck'  },
  { id: 'pickup_truck',       label: 'Пикап / грузовой пикап',     labelEn: 'Pickup truck',                  category: 'light_truck'  },
  { id: 'isothermal_van',     label: 'Изотермический фургон',      labelEn: 'Isothermal van',                category: 'light_truck'  },
  { id: 'refrigerated_van',   label: 'Рефрижераторный фургон',     labelEn: 'Refrigerated van',              category: 'light_truck'  },
  { id: 'light_flatbed',      label: 'Малотоннажный бортовой',     labelEn: 'Light flatbed',                 category: 'light_truck'  },
  // ── Прицеп / полуприцеп ───────────────────────────────────────
  { id: 'semi_curtainsider',  label: 'Полуприцеп тентованный',     labelEn: 'Curtainsider semi-trailer',     category: 'trailer'      },
  { id: 'semi_reefer',        label: 'Полуприцеп рефрижератор',    labelEn: 'Reefer semi-trailer',           category: 'trailer'      },
  { id: 'semi_tanker',        label: 'Полуприцеп цистерна',        labelEn: 'Tanker semi-trailer',           category: 'trailer'      },
  { id: 'semi_flatbed',       label: 'Полуприцеп платформа',       labelEn: 'Flatbed semi-trailer',          category: 'trailer'      },
  { id: 'semi_container',     label: 'Полуприцеп контейнеровоз',   labelEn: 'Container semi-trailer',        category: 'trailer'      },
  { id: 'semi_tipper',        label: 'Полуприцеп самосвальный',    labelEn: 'Tipper semi-trailer',           category: 'trailer'      },
  { id: 'semi_lowboy',        label: 'Полуприцеп низкорамный',     labelEn: 'Lowboy semi-trailer',           category: 'trailer'      },
  { id: 'semi_timber',        label: 'Полуприцеп лесовозный',      labelEn: 'Timber semi-trailer',           category: 'trailer'      },
  { id: 'semi_livestock',     label: 'Полуприцеп скотовозный',     labelEn: 'Livestock semi-trailer',        category: 'trailer'      },
  { id: 'trailer_curtainsider', label: 'Прицеп тентованный',       labelEn: 'Curtainsider drawbar trailer',  category: 'trailer'      },
  { id: 'trailer_tipper',     label: 'Прицеп самосвальный',        labelEn: 'Tipper trailer',                category: 'trailer'      },
  // ── Пассажирский ──────────────────────────────────────────────
  { id: 'standard_bus',       label: 'Автобус (рейсовый)',         labelEn: 'Standard bus',                  category: 'passenger'    },
  { id: 'minibus',            label: 'Маршрутка / микроавтобус',   labelEn: 'Minibus / marshrutka',          category: 'passenger'    },
  { id: 'intercity_bus',      label: 'Междугородний автобус',      labelEn: 'Coach / intercity bus',         category: 'passenger'    },
  { id: 'tourist_coach',      label: 'Туристический автобус',      labelEn: 'Tourist coach',                 category: 'passenger'    },
] as const

export type VehicleTypeId = typeof VEHICLE_TYPES[number]['id']
export type VehicleCategory = typeof VEHICLE_TYPES[number]['category']

// Для pgEnum в Drizzle — автоматически из массива
export const vehicleTypeIds = VEHICLE_TYPES.map(v => v.id) as [VehicleTypeId, ...VehicleTypeId[]]
export const vehicleCategoryIds = [...new Set(VEHICLE_TYPES.map(v => v.category))] as [VehicleCategory, ...VehicleCategory[]]