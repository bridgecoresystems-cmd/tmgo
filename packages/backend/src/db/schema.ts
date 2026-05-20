// Barrel: схема разложена по доменам в ./schema/. Импорты вида
// `from '../db/schema'` продолжают работать без правок — все таблицы и enum
// реэкспортированы отсюда. Drizzle-kit (см. drizzle.config.ts) тоже подхватывает
// весь набор через этот файл.

export * from './schema/enums';
export * from './schema/auth';
export * from './schema/clients';
export * from './schema/cities';
export * from './schema/vehicle-catalog';
export * from './schema/carriers';
export * from './schema/driver-docs';
export * from './schema/vehicles';
export * from './schema/orders';
export * from './schema/reviews';
export * from './schema/driver-services';
export * from './schema/chat';
export * from './schema/mailing';
export * from './schema/legal';
export * from './schema/misc';
