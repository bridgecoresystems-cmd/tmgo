import { pgEnum } from 'drizzle-orm/pg-core';

export const verificationStatusEnum = pgEnum('verification_status', [
  'not_submitted',
  'draft',
  'submitted',
  'verified',
  'rejected',
  'suspended',
]);

export const docTypeEnum = pgEnum('doc_type', [
  'passport',
  'drivers_license',
  'international_drivers_license',
  'visa',
  'medical_certificate',
  'insurance',
  'tachograph_card',
  'technical_minimum_cert',
  'entry_permit',
  'adr_certificate',
  'other',
]);

export const docStatusEnum = pgEnum('doc_status', [
  'pending_verification',
  'active',
  'expired',
  'revoked',
  'superseded',
  'rejected',
]);

export const citizenshipStatusEnum = pgEnum('citizenship_status', [
  'active',
  'revoked',
]);

export const contactTypeEnum = pgEnum('contact_type', [
  'phone',
  'email',
]);

export const vehicleOwnershipEnum = pgEnum('vehicle_ownership', [
  'own',
  'company',
  'leased',
]);

export const changeRequestStatusEnum = pgEnum('change_request_status', [
  'pending',
  'approved',
  'rejected',
  'applied',
  'cancelled',
]);

export const legalDocTypeEnum = pgEnum('legal_doc_type', [
  'agreement',
  'privacy',
  'rules',
]);

export const legalDocLocaleEnum = pgEnum('legal_doc_locale', [
  'ru',
  'en',
  'tk',
]);
