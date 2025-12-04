/*
  Warnings:

  - A unique constraint covering the columns `[email,tenantId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[identifier,tenantId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId,tenantId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_alternativeEmail_key";

-- DropIndex
DROP INDEX "User_identifier_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_displayId_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_tenantId_key" ON "User"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_identifier_tenantId_key" ON "User"("identifier", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_displayId_tenantId_key" ON "User"("displayId", "tenantId");
