/**
 * Snapshot документов и ТС водителя на момент начала рейса.
 * Используется при принятии заказа клиентом.
 */

import { db } from '../db';
import { driverDocuments, driverVehicles } from '../db/schema';
import { eq, and, or, isNull, lte, gte } from 'drizzle-orm';

export interface TripSnapshot {
  passportId: string | null;
  driversLicenseId: string | null;
  vehicleId: string | null; // из driver_vehicles (если есть), иначе null
  snapshotAt: Date;
}

export async function createTripSnapshot(carrierId: string): Promise<TripSnapshot> {
  const now = new Date();

  const [activePassport] = await db
    .select()
    .from(driverDocuments)
    .where(and(
      eq(driverDocuments.carrierId, carrierId),
      eq(driverDocuments.docType, 'passport'),
      eq(driverDocuments.status, 'active'),
      lte(driverDocuments.validFrom, now),
      or(isNull(driverDocuments.validUntil), gte(driverDocuments.validUntil, now)),
    ))
    .limit(1);

  const [activeLicense] = await db
    .select()
    .from(driverDocuments)
    .where(and(
      eq(driverDocuments.carrierId, carrierId),
      eq(driverDocuments.docType, 'drivers_license'),
      eq(driverDocuments.status, 'active'),
      lte(driverDocuments.validFrom, now),
      or(isNull(driverDocuments.validUntil), gte(driverDocuments.validUntil, now)),
    ))
    .limit(1);

  const [activeVehicle] = await db
    .select()
    .from(driverVehicles)
    .where(and(
      eq(driverVehicles.carrierId, carrierId),
      eq(driverVehicles.isActive, true),
    ))
    .limit(1);

  return {
    passportId: activePassport?.id ?? null,
    driversLicenseId: activeLicense?.id ?? null,
    vehicleId: activeVehicle?.id ?? null,
    snapshotAt: now,
  };
}
