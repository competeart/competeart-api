ALTER TABLE "Coreografia"
ADD COLUMN "ordemCronograma" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "concluidaCronograma" BOOLEAN NOT NULL DEFAULT false;

WITH ordenadas AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "criadoEm" ASC) - 1 AS ordem
  FROM "Coreografia"
)
UPDATE "Coreografia"
SET "ordemCronograma" = ordenadas.ordem
FROM ordenadas
WHERE "Coreografia".id = ordenadas.id;
