CREATE TYPE "TipoDocumento" AS ENUM ('CPF', 'RG');

ALTER TABLE "Bailarino"
ADD COLUMN "tipoDocumento" "TipoDocumento" NOT NULL DEFAULT 'CPF',
ADD COLUMN "documento" TEXT;

UPDATE "Bailarino"
SET "documento" = "cpf"
WHERE "documento" IS NULL;

ALTER TABLE "Bailarino"
ALTER COLUMN "documento" SET NOT NULL;

CREATE UNIQUE INDEX "Bailarino_documento_key" ON "Bailarino"("documento");

DROP INDEX "Bailarino_cpf_key";

ALTER TABLE "Bailarino"
DROP COLUMN "cpf";
