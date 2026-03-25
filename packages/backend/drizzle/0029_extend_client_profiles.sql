-- Расширение таблиц client_individual и client_company

-- client_individual: добавить телефон и адрес
ALTER TABLE "client_individual"
  ADD COLUMN IF NOT EXISTS "phone" varchar(30),
  ADD COLUMN IF NOT EXISTS "address_postal" varchar(20),
  ADD COLUMN IF NOT EXISTS "address_region" varchar(100),
  ADD COLUMN IF NOT EXISTS "address_city" varchar(100),
  ADD COLUMN IF NOT EXISTS "address_district" varchar(100),
  ADD COLUMN IF NOT EXISTS "address_street" varchar(200),
  ADD COLUMN IF NOT EXISTS "address_house" varchar(50);

-- client_company: добавить краткое название, контакты, адрес, банковские реквизиты
ALTER TABLE "client_company"
  ADD COLUMN IF NOT EXISTS "short_name" varchar(200),
  ADD COLUMN IF NOT EXISTS "website" varchar(300),
  ADD COLUMN IF NOT EXISTS "phone" varchar(30),
  ADD COLUMN IF NOT EXISTS "additional_email" varchar(200),
  ADD COLUMN IF NOT EXISTS "address_postal" varchar(20),
  ADD COLUMN IF NOT EXISTS "address_region" varchar(100),
  ADD COLUMN IF NOT EXISTS "address_city" varchar(100),
  ADD COLUMN IF NOT EXISTS "address_district" varchar(100),
  ADD COLUMN IF NOT EXISTS "address_street" varchar(200),
  ADD COLUMN IF NOT EXISTS "address_house" varchar(50),
  ADD COLUMN IF NOT EXISTS "bank_code" varchar(50),
  ADD COLUMN IF NOT EXISTS "bank_corr_account" varchar(50);
