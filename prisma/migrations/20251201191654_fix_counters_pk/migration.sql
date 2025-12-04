/*
  Warnings:

  - The primary key for the `ReportCounter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ReservationCounter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `ReportCounter` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `ReservationCounter` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReportCounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "ReportCounter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReportCounter" ("date", "lastNumber", "tenantId") SELECT "date", "lastNumber", "tenantId" FROM "ReportCounter";
DROP TABLE "ReportCounter";
ALTER TABLE "new_ReportCounter" RENAME TO "ReportCounter";
CREATE UNIQUE INDEX "ReportCounter_date_tenantId_key" ON "ReportCounter"("date", "tenantId");
CREATE TABLE "new_ReservationCounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "ReservationCounter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReservationCounter" ("date", "lastNumber", "tenantId") SELECT "date", "lastNumber", "tenantId" FROM "ReservationCounter";
DROP TABLE "ReservationCounter";
ALTER TABLE "new_ReservationCounter" RENAME TO "ReservationCounter";
CREATE UNIQUE INDEX "ReservationCounter_date_tenantId_key" ON "ReservationCounter"("date", "tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
