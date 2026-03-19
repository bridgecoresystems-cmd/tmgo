import type { VehicleTypeId } from './vehicle-types'

export type VehicleMakeSeed = {
  name: string
  slug: string
  countryCode: string
  models: {
    name: string
    slug: string
    compatibleTypes: VehicleTypeId[]
  }[]
}

export const VEHICLE_MAKES_SEED: VehicleMakeSeed[] = [
  // ── Европа — седельные тягачи ─────────────────────────────────
  {
    name: 'Scania', slug: 'scania', countryCode: 'SE',
    models: [
      { name: 'R410', slug: 'r410', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'R440', slug: 'r440', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'R500', slug: 'r500', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'R560', slug: 'r560', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'S500', slug: 's500', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'S560', slug: 's560', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'G410', slug: 'g410', compatibleTypes: ['tractor_unit', 'rigid_flatbed'] },
      { name: 'P360', slug: 'p360', compatibleTypes: ['dump_truck', 'rigid_flatbed'] },
    ],
  },
  {
    name: 'Volvo', slug: 'volvo', countryCode: 'SE',
    models: [
      { name: 'FH460', slug: 'fh460', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'FH500', slug: 'fh500', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'FH540', slug: 'fh540', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'FH16 550', slug: 'fh16-550', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'FH16 750', slug: 'fh16-750', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'FM370', slug: 'fm370', compatibleTypes: ['rigid_flatbed', 'dump_truck'] },
      { name: 'FMX460', slug: 'fmx460', compatibleTypes: ['dump_truck', 'chassis_cab'] },
      { name: 'FL280', slug: 'fl280', compatibleTypes: ['rigid_flatbed', 'gazelle_van'] },
    ],
  },
  {
    name: 'MAN', slug: 'man', countryCode: 'DE',
    models: [
      { name: 'TGX 18.500', slug: 'tgx-18-500', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'TGX 18.440', slug: 'tgx-18-440', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'TGX 26.500', slug: 'tgx-26-500', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'TGS 18.400', slug: 'tgs-18-400', compatibleTypes: ['rigid_flatbed', 'dump_truck'] },
      { name: 'TGS 26.400', slug: 'tgs-26-400', compatibleTypes: ['dump_truck', 'chassis_cab'] },
      { name: 'TGM 18.290', slug: 'tgm-18-290', compatibleTypes: ['rigid_flatbed', 'curtainsider_truck'] },
      { name: 'TGL 12.220', slug: 'tgl-12-220', compatibleTypes: ['light_flatbed', 'rigid_flatbed'] },
    ],
  },
  {
    name: 'Mercedes-Benz Trucks', slug: 'mercedes-benz-trucks', countryCode: 'DE',
    models: [
      { name: 'Actros 1845', slug: 'actros-1845', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Actros 1853', slug: 'actros-1853', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Actros 2545', slug: 'actros-2545', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Actros 2653', slug: 'actros-2653', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Arocs 3245', slug: 'arocs-3245', compatibleTypes: ['dump_truck', 'chassis_cab'] },
      { name: 'Atego 1218', slug: 'atego-1218', compatibleTypes: ['rigid_flatbed', 'curtainsider_truck'] },
      { name: 'Sprinter', slug: 'sprinter', compatibleTypes: ['cargo_minibus', 'isothermal_van', 'refrigerated_van'] },
    ],
  },
  {
    name: 'DAF', slug: 'daf', countryCode: 'NL',
    models: [
      { name: 'XF 480', slug: 'xf-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'XF 530', slug: 'xf-530', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'XG 480', slug: 'xg-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'XG+ 530', slug: 'xg-plus-530', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'CF 450', slug: 'cf-450', compatibleTypes: ['rigid_flatbed', 'dump_truck'] },
      { name: 'LF 230', slug: 'lf-230', compatibleTypes: ['light_flatbed', 'rigid_flatbed'] },
    ],
  },
  {
    name: 'Iveco', slug: 'iveco', countryCode: 'IT',
    models: [
      { name: 'S-Way 480', slug: 's-way-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'S-Way 570', slug: 's-way-570', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Stralis 460', slug: 'stralis-460', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Trakker 450', slug: 'trakker-450', compatibleTypes: ['dump_truck', 'chassis_cab'] },
      { name: 'Daily 35S', slug: 'daily-35s', compatibleTypes: ['cargo_minibus', 'light_flatbed', 'isothermal_van'] },
      { name: 'Eurocargo 120', slug: 'eurocargo-120', compatibleTypes: ['rigid_flatbed', 'curtainsider_truck'] },
    ],
  },
  {
    name: 'Renault Trucks', slug: 'renault-trucks', countryCode: 'FR',
    models: [
      { name: 'T 480', slug: 't-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'T 520', slug: 't-520', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'C 460', slug: 'c-460', compatibleTypes: ['dump_truck', 'chassis_cab'] },
      { name: 'K 460', slug: 'k-460', compatibleTypes: ['dump_truck', 'rigid_flatbed'] },
      { name: 'D 280', slug: 'd-280', compatibleTypes: ['rigid_flatbed', 'curtainsider_truck'] },
    ],
  },

  // ── СНГ — тягачи и грузовики ──────────────────────────────────
  {
    name: 'КамАЗ', slug: 'kamaz', countryCode: 'RU',
    models: [
      { name: '5490', slug: '5490', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: '54901', slug: '54901', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: '65116', slug: '65116', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: '6520', slug: '6520', compatibleTypes: ['dump_truck'] },
      { name: '65201', slug: '65201', compatibleTypes: ['dump_truck'] },
      { name: '43118', slug: '43118', compatibleTypes: ['offroad_6x6', 'chassis_cab'] },
      { name: '65115', slug: '65115', compatibleTypes: ['dump_truck', 'rigid_flatbed'] },
      { name: '4308', slug: '4308', compatibleTypes: ['light_flatbed', 'rigid_flatbed'] },
    ],
  },
  {
    name: 'МАЗ', slug: 'maz', countryCode: 'BY',
    models: [
      { name: '5440', slug: '5440', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: '6430', slug: '6430', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: '6501', slug: '6501', compatibleTypes: ['dump_truck'] },
      { name: '5516', slug: '5516', compatibleTypes: ['dump_truck'] },
      { name: '4371', slug: '4371', compatibleTypes: ['light_flatbed', 'rigid_flatbed'] },
    ],
  },
  {
    name: 'КРАЗ', slug: 'kraz', countryCode: 'UA',
    models: [
      { name: '6510', slug: '6510', compatibleTypes: ['dump_truck'] },
      { name: '65055', slug: '65055', compatibleTypes: ['dump_truck'] },
      { name: '7140', slug: '7140', compatibleTypes: ['offroad_6x6', 'dump_truck'] },
    ],
  },
  {
    name: 'Урал', slug: 'ural', countryCode: 'RU',
    models: [
      { name: '4320', slug: '4320', compatibleTypes: ['offroad_6x6', 'chassis_cab'] },
      { name: '5557', slug: '5557', compatibleTypes: ['offroad_6x6', 'dump_truck'] },
      { name: 'Next 6×4', slug: 'next-6x4', compatibleTypes: ['dump_truck', 'chassis_cab'] },
    ],
  },
  {
    name: 'ГАЗ', slug: 'gaz', countryCode: 'RU',
    models: [
      { name: 'ГАЗель Next', slug: 'gazelle-next', compatibleTypes: ['gazelle_van', 'cargo_minibus', 'isothermal_van'] },
      { name: 'ГАЗель Business', slug: 'gazelle-business', compatibleTypes: ['gazelle_van', 'cargo_minibus'] },
      { name: 'ГАЗон Next', slug: 'gazon-next', compatibleTypes: ['light_flatbed', 'rigid_flatbed'] },
      { name: 'Валдай Next', slug: 'valdai-next', compatibleTypes: ['light_flatbed', 'curtainsider_truck'] },
    ],
  },
  {
    name: 'ЗИЛ', slug: 'zil', countryCode: 'RU',
    models: [
      { name: '5301 (Бычок)', slug: '5301', compatibleTypes: ['light_flatbed', 'rigid_flatbed'] },
      { name: '4331', slug: '4331', compatibleTypes: ['rigid_flatbed', 'dump_truck'] },
    ],
  },

  // ── Азия — тягачи ─────────────────────────────────────────────
  {
    name: 'Sinotruk (HOWO)', slug: 'sinotruk-howo', countryCode: 'CN',
    models: [
      { name: 'A7 420', slug: 'a7-420', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'A7 480', slug: 'a7-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'T7H 440', slug: 't7h-440', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'T7H 480', slug: 't7h-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'ZZ3257', slug: 'zz3257', compatibleTypes: ['dump_truck'] },
      { name: 'ZZ5317', slug: 'zz5317', compatibleTypes: ['rigid_flatbed', 'chassis_cab'] },
    ],
  },
  {
    name: 'Shacman', slug: 'shacman', countryCode: 'CN',
    models: [
      { name: 'X3000 420', slug: 'x3000-420', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'X3000 480', slug: 'x3000-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'F3000', slug: 'f3000', compatibleTypes: ['dump_truck', 'rigid_flatbed'] },
      { name: 'L3000', slug: 'l3000', compatibleTypes: ['tractor_unit', 'semi_truck'] },
    ],
  },
  {
    name: 'FAW', slug: 'faw', countryCode: 'CN',
    models: [
      { name: 'J7 480', slug: 'j7-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'J6P 430', slug: 'j6p-430', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Tiger VH', slug: 'tiger-vh', compatibleTypes: ['dump_truck'] },
    ],
  },
  {
    name: 'Dongfeng', slug: 'dongfeng', countryCode: 'CN',
    models: [
      { name: 'DFH4H 480', slug: 'dfh4h-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'KX 520', slug: 'kx-520', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'EQ3318', slug: 'eq3318', compatibleTypes: ['dump_truck'] },
    ],
  },
  {
    name: 'Foton', slug: 'foton', countryCode: 'CN',
    models: [
      { name: 'Auman EST-A 480', slug: 'auman-est-a-480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Auman GTL 400', slug: 'auman-gtl-400', compatibleTypes: ['tractor_unit', 'rigid_flatbed'] },
      { name: 'Aumark', slug: 'aumark', compatibleTypes: ['light_flatbed', 'cargo_minibus'] },
    ],
  },
  {
    name: 'JAC', slug: 'jac', countryCode: 'CN',
    models: [
      { name: 'N120', slug: 'n120', compatibleTypes: ['gazelle_van', 'light_flatbed'] },
      { name: 'N56', slug: 'n56', compatibleTypes: ['light_flatbed', 'rigid_flatbed'] },
      { name: 'K5', slug: 'k5', compatibleTypes: ['tractor_unit', 'rigid_flatbed'] },
    ],
  },
  {
    name: 'XCMG', slug: 'xcmg', countryCode: 'CN',
    models: [
      { name: 'NXG4250D5WC', slug: 'nxg4250', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'XGA3250D2KC', slug: 'xga3250', compatibleTypes: ['dump_truck'] },
    ],
  },

  // ── Турция ────────────────────────────────────────────────────
  {
    name: 'Ford Trucks', slug: 'ford-trucks', countryCode: 'TR',
    models: [
      { name: 'F-MAX 500', slug: 'f-max-500', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'F-MAX 540', slug: 'f-max-540', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: '1842T', slug: '1842t', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: '2533', slug: '2533', compatibleTypes: ['dump_truck', 'rigid_flatbed'] },
      { name: 'Cargo 1833', slug: 'cargo-1833', compatibleTypes: ['rigid_flatbed', 'curtainsider_truck'] },
      { name: 'Transit', slug: 'transit', compatibleTypes: ['cargo_minibus', 'isothermal_van', 'refrigerated_van'] },
    ],
  },
  {
    name: 'BMC', slug: 'bmc', countryCode: 'TR',
    models: [
      { name: 'TGR 380', slug: 'tgr-380', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'TGR 430', slug: 'tgr-430', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Fatih 280', slug: 'fatih-280', compatibleTypes: ['rigid_flatbed', 'dump_truck'] },
      { name: 'Levend 230', slug: 'levend-230', compatibleTypes: ['light_flatbed', 'rigid_flatbed'] },
    ],
  },
  {
    name: 'Temsa Trucks', slug: 'temsa-trucks', countryCode: 'TR',
    models: [
      { name: 'T420', slug: 't420', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'T480', slug: 't480', compatibleTypes: ['tractor_unit', 'semi_truck'] },
    ],
  },

  // ── Японские / корейские ──────────────────────────────────────
  {
    name: 'Isuzu', slug: 'isuzu', countryCode: 'JP',
    models: [
      { name: 'Giga CXZ', slug: 'giga-cxz', compatibleTypes: ['tractor_unit', 'rigid_flatbed'] },
      { name: 'Forward FRR', slug: 'forward-frr', compatibleTypes: ['rigid_flatbed', 'curtainsider_truck'] },
      { name: 'Elf NMR', slug: 'elf-nmr', compatibleTypes: ['light_flatbed', 'cargo_minibus'] },
      { name: 'NPR', slug: 'npr', compatibleTypes: ['light_flatbed', 'isothermal_van'] },
    ],
  },
  {
    name: 'Mitsubishi Fuso', slug: 'mitsubishi-fuso', countryCode: 'JP',
    models: [
      { name: 'Super Great', slug: 'super-great', compatibleTypes: ['tractor_unit', 'rigid_flatbed'] },
      { name: 'Fighter FK', slug: 'fighter-fk', compatibleTypes: ['rigid_flatbed', 'curtainsider_truck'] },
      { name: 'Canter FE', slug: 'canter-fe', compatibleTypes: ['light_flatbed', 'cargo_minibus'] },
    ],
  },
  {
    name: 'Hino', slug: 'hino', countryCode: 'JP',
    models: [
      { name: '700 SH1EKJD', slug: '700-sh1ekjd', compatibleTypes: ['tractor_unit', 'rigid_flatbed'] },
      { name: '500 FC9J', slug: '500-fc9j', compatibleTypes: ['rigid_flatbed', 'dump_truck'] },
      { name: '300 XKU720', slug: '300-xku720', compatibleTypes: ['light_flatbed', 'cargo_minibus'] },
    ],
  },
  {
    name: 'Hyundai Trucks', slug: 'hyundai-trucks', countryCode: 'KR',
    models: [
      { name: 'Xcient', slug: 'xcient', compatibleTypes: ['tractor_unit', 'semi_truck'] },
      { name: 'Pavise', slug: 'pavise', compatibleTypes: ['rigid_flatbed', 'dump_truck'] },
      { name: 'Mighty', slug: 'mighty', compatibleTypes: ['light_flatbed', 'cargo_minibus'] },
    ],
  },

  // ── Спецтехника / прочее ──────────────────────────────────────
  {
    name: 'Liebherr', slug: 'liebherr', countryCode: 'DE',
    models: [
      { name: 'LTM 1030', slug: 'ltm-1030', compatibleTypes: ['mobile_crane'] },
      { name: 'LTM 1100', slug: 'ltm-1100', compatibleTypes: ['mobile_crane'] },
    ],
  },
  {
    name: 'Tadano', slug: 'tadano', countryCode: 'JP',
    models: [
      { name: 'GR-700EX', slug: 'gr-700ex', compatibleTypes: ['mobile_crane'] },
      { name: 'ATF 220G-5', slug: 'atf-220g-5', compatibleTypes: ['mobile_crane'] },
    ],
  },
  {
    name: 'Putzmeister', slug: 'putzmeister', countryCode: 'DE',
    models: [
      { name: 'M32-4', slug: 'm32-4', compatibleTypes: ['concrete_pump'] },
      { name: 'M38-5', slug: 'm38-5', compatibleTypes: ['concrete_pump'] },
    ],
  },
  {
    name: 'Schwing', slug: 'schwing', countryCode: 'DE',
    models: [
      { name: 'S36SX', slug: 's36sx', compatibleTypes: ['concrete_pump'] },
      { name: 'S52SX', slug: 's52sx', compatibleTypes: ['concrete_pump'] },
    ],
  },
  {
    name: 'Zoomlion', slug: 'zoomlion', countryCode: 'CN',
    models: [
      { name: 'QY25V', slug: 'qy25v', compatibleTypes: ['mobile_crane'] },
      { name: 'ZLJ5418THBHE', slug: 'zlj5418', compatibleTypes: ['concrete_pump'] },
    ],
  },

  // ── Полуприцепы ───────────────────────────────────────────────
  {
    name: 'Schmitz Cargobull', slug: 'schmitz-cargobull', countryCode: 'DE',
    models: [
      { name: 'S.CS', slug: 's-cs', compatibleTypes: ['semi_curtainsider'] },
      { name: 'S.KO', slug: 's-ko', compatibleTypes: ['semi_tipper'] },
      { name: 'S.CF', slug: 's-cf', compatibleTypes: ['semi_reefer'] },
    ],
  },
  {
    name: 'Kögel', slug: 'kogel', countryCode: 'DE',
    models: [
      { name: 'Cargo', slug: 'cargo', compatibleTypes: ['semi_curtainsider'] },
      { name: 'Puris', slug: 'puris', compatibleTypes: ['semi_reefer'] },
      { name: 'Tipper', slug: 'tipper', compatibleTypes: ['semi_tipper'] },
    ],
  },
  {
    name: 'Krone', slug: 'krone', countryCode: 'DE',
    models: [
      { name: 'Profiliner', slug: 'profiliner', compatibleTypes: ['semi_curtainsider'] },
      { name: 'Cool Liner', slug: 'cool-liner', compatibleTypes: ['semi_reefer'] },
      { name: 'Box Liner', slug: 'box-liner', compatibleTypes: ['semi_flatbed'] },
    ],
  },
  {
    name: 'Wielton', slug: 'wielton', countryCode: 'PL',
    models: [
      { name: 'NS-3', slug: 'ns-3', compatibleTypes: ['semi_curtainsider'] },
      { name: 'NW-3', slug: 'nw-3', compatibleTypes: ['semi_tipper'] },
      { name: 'NT-3', slug: 'nt-3', compatibleTypes: ['semi_flatbed'] },
    ],
  },
  {
    name: 'НЕФАЗ', slug: 'nefaz', countryCode: 'RU',
    models: [
      { name: '9334', slug: '9334', compatibleTypes: ['semi_tipper'] },
      { name: '93344', slug: '93344', compatibleTypes: ['semi_tipper'] },
      { name: '9330', slug: '9330', compatibleTypes: ['semi_flatbed'] },
    ],
  },
  {
    name: 'Бецема', slug: 'betsema', countryCode: 'RU',
    models: [
      { name: 'БЦМ-54', slug: 'btsm-54', compatibleTypes: ['semi_tipper'] },
      { name: 'БЦМ-88', slug: 'btsm-88', compatibleTypes: ['semi_tipper'] },
    ],
  },

  // ── Лёгкий коммерческий транспорт ────────────────────────────
  {
    name: 'Volkswagen Commercial', slug: 'volkswagen-commercial', countryCode: 'DE',
    models: [
      { name: 'Crafter', slug: 'crafter', compatibleTypes: ['cargo_minibus', 'isothermal_van', 'refrigerated_van'] },
      { name: 'Transporter', slug: 'transporter', compatibleTypes: ['cargo_minibus'] },
    ],
  },
  {
    name: 'Peugeot', slug: 'peugeot', countryCode: 'FR',
    models: [
      { name: 'Boxer', slug: 'boxer', compatibleTypes: ['cargo_minibus', 'isothermal_van'] },
      { name: 'Partner', slug: 'partner', compatibleTypes: ['cargo_minibus'] },
    ],
  },
  {
    name: 'Citroën', slug: 'citroen', countryCode: 'FR',
    models: [
      { name: 'Jumper', slug: 'jumper', compatibleTypes: ['cargo_minibus', 'isothermal_van'] },
      { name: 'Berlingo', slug: 'berlingo', compatibleTypes: ['cargo_minibus'] },
    ],
  },
  {
    name: 'Fiat', slug: 'fiat', countryCode: 'IT',
    models: [
      { name: 'Ducato', slug: 'ducato', compatibleTypes: ['cargo_minibus', 'isothermal_van', 'refrigerated_van'] },
    ],
  },
  {
    name: 'Toyota', slug: 'toyota', countryCode: 'JP',
    models: [
      { name: 'Hiace', slug: 'hiace', compatibleTypes: ['cargo_minibus'] },
      { name: 'Land Cruiser 79', slug: 'land-cruiser-79', compatibleTypes: ['pickup_truck'] },
    ],
  },
  {
    name: 'Ford', slug: 'ford', countryCode: 'US',
    models: [
      { name: 'F-150', slug: 'f-150', compatibleTypes: ['pickup_truck'] },
      { name: 'F-250', slug: 'f-250', compatibleTypes: ['pickup_truck'] },
    ],
  },
  {
    name: 'Nissan', slug: 'nissan', countryCode: 'JP',
    models: [
      { name: 'Navara', slug: 'navara', compatibleTypes: ['pickup_truck'] },
      { name: 'NV400', slug: 'nv400', compatibleTypes: ['cargo_minibus', 'isothermal_van'] },
    ],
  },
  {
    name: 'Lada (ВАЗ)', slug: 'lada-vaz', countryCode: 'RU',
    models: [
      { name: 'Largus фургон', slug: 'largus-van', compatibleTypes: ['cargo_minibus'] },
    ],
  },
]
