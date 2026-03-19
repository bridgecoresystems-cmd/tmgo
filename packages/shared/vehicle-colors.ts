export const VEHICLE_COLORS = [
  { id: 'white', label: 'Белый', labelEn: 'White' },
  { id: 'black', label: 'Чёрный', labelEn: 'Black' },
  { id: 'silver', label: 'Серебристый', labelEn: 'Silver' },
  { id: 'gray', label: 'Серый', labelEn: 'Gray' },
  { id: 'red', label: 'Красный', labelEn: 'Red' },
  { id: 'blue', label: 'Синий', labelEn: 'Blue' },
  { id: 'green', label: 'Зелёный', labelEn: 'Green' },
  { id: 'yellow', label: 'Жёлтый', labelEn: 'Yellow' },
  { id: 'orange', label: 'Оранжевый', labelEn: 'Orange' },
  { id: 'brown', label: 'Коричневый', labelEn: 'Brown' },
  { id: 'beige', label: 'Бежевый', labelEn: 'Beige' },
  { id: 'other', label: 'Другой', labelEn: 'Other' },
] as const

export type VehicleColorId = (typeof VEHICLE_COLORS)[number]['id']
export const vehicleColorIds = VEHICLE_COLORS.map((c) => c.id) as [VehicleColorId, ...VehicleColorId[]]
