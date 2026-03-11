CREATE TABLE "carrier_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" text,
	"license_number" varchar(100),
	"is_verified" boolean DEFAULT false NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"message" text NOT NULL,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"carrier_id" uuid,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"from_address" text NOT NULL,
	"to_address" text NOT NULL,
	"pickup_date" timestamp NOT NULL,
	"delivery_date" timestamp,
	"cargo_type" text NOT NULL,
	"weight" numeric(10, 2) NOT NULL,
	"volume" numeric(10, 2),
	"temperature_required" text,
	"price" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payment_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" text,
	"role" text DEFAULT 'CLIENT' NOT NULL,
	"phone" varchar(50),
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"carrier_id" uuid NOT NULL,
	"type" text NOT NULL,
	"capacity" numeric(10, 2) NOT NULL,
	"volume" numeric(10, 2) NOT NULL,
	"plate_number" varchar(20) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"current_lat" numeric(10, 7),
	"current_lng" numeric(10, 7)
);
--> statement-breakpoint
ALTER TABLE "carrier_profiles" ADD CONSTRAINT "carrier_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_carrier_id_carrier_profiles_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carrier_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_carrier_id_carrier_profiles_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carrier_profiles"("id") ON DELETE no action ON UPDATE no action;