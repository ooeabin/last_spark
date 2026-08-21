-- CreateTable
CREATE TABLE "gravestones" (
    "id" TEXT NOT NULL,
    "country_code" VARCHAR(5) NOT NULL,
    "nickname" VARCHAR(30) NOT NULL,
    "last_words" VARCHAR(100) NOT NULL,
    "skin_id" VARCHAR(20) NOT NULL,
    "grave_type" VARCHAR(20) NOT NULL,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gravestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_inventory" (
    "user_id" TEXT NOT NULL,
    "has_traitor_pass" BOOLEAN NOT NULL DEFAULT false,
    "equipped_grave" VARCHAR(20) NOT NULL DEFAULT 'basic',

    CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "gravestones_country_code_created_at_idx" ON "gravestones"("country_code", "created_at");
