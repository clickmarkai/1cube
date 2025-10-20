-- CreateTable (this table may already exist in Supabase; ensure you have run the latest migrations there before invoking)
CREATE TABLE IF NOT EXISTS "brand_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "source_url" TEXT NOT NULL,
    "url" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "price" REAL,
    "price_text" TEXT,
    "currency" TEXT,
    "category" TEXT,
    "sku" TEXT,
    "images" JSONB,
    "attributes" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "brand_products_user_id_idx" ON "brand_products"("user_id");

