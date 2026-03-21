DO $$ BEGIN
  CREATE TYPE "legal_doc_type" AS ENUM ('agreement', 'privacy', 'rules');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "legal_doc_locale" AS ENUM ('ru', 'en', 'tk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "legal_documents" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "doc_type"       "legal_doc_type" NOT NULL,
  "locale"         "legal_doc_locale" NOT NULL,
  "version"        varchar(20) NOT NULL DEFAULT '1.0',
  "title"          text NOT NULL,
  "content"        text NOT NULL,
  "is_published"   boolean DEFAULT false NOT NULL,
  "published_at"   timestamp,
  "effective_date" timestamp,
  "created_at"     timestamp DEFAULT now() NOT NULL,
  "updated_at"     timestamp DEFAULT now() NOT NULL,
  "updated_by"     uuid REFERENCES "users"("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_legal_docs_type_locale"
  ON "legal_documents"("doc_type", "locale");

CREATE INDEX IF NOT EXISTS "idx_legal_docs_published"
  ON "legal_documents"("is_published");
