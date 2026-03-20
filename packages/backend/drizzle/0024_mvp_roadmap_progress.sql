CREATE TABLE IF NOT EXISTS "mvp_roadmap_task_progress" (
  "task_id"    varchar(48) PRIMARY KEY NOT NULL,
  "is_done"    boolean DEFAULT false NOT NULL,
  "notes"      text DEFAULT '' NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "updated_by" text REFERENCES "user"("id")
);
