-- Скрытые поля в карточке водителя (глаз в админке)
ALTER TABLE "carrier_profiles" ADD COLUMN IF NOT EXISTS "hidden_fields" jsonb DEFAULT '[]';
