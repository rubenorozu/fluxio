/*
  Warnings:

  - The primary key for the `ReportCounter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ReservationCounter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `tenantId` to the `ReportCounter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ReservationCounter` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReportCounter" (
    "date" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,

    PRIMARY KEY ("date", "tenantId"),
    CONSTRAINT "ReportCounter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReportCounter" ("date", "lastNumber") SELECT "date", "lastNumber" FROM "ReportCounter";
DROP TABLE "ReportCounter";
ALTER TABLE "new_ReportCounter" RENAME TO "ReportCounter";
CREATE TABLE "new_ReservationCounter" (
    "date" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,

    PRIMARY KEY ("date", "tenantId"),
    CONSTRAINT "ReservationCounter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReservationCounter" ("date", "lastNumber") SELECT "date", "lastNumber" FROM "ReservationCounter";
DROP TABLE "ReservationCounter";
ALTER TABLE "new_ReservationCounter" RENAME TO "ReservationCounter";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
