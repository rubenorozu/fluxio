-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "fixedAssetId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "tenantId" TEXT,
    "space_id" TEXT,
    "responsibleUserId" TEXT,
    "reservationLeadTime" INTEGER,
    "isFixedToSpace" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Equipment_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "Space" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Equipment_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("createdAt", "description", "displayId", "fixedAssetId", "id", "isFixedToSpace", "name", "reservationLeadTime", "responsibleUserId", "serialNumber", "space_id", "status", "updatedAt") SELECT "createdAt", "description", "displayId", "fixedAssetId", "id", "isFixedToSpace", "name", "reservationLeadTime", "responsibleUserId", "serialNumber", "space_id", "status", "updatedAt" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE UNIQUE INDEX "Equipment_displayId_key" ON "Equipment"("displayId");
CREATE INDEX "Equipment_tenantId_idx" ON "Equipment"("tenantId");
CREATE TABLE "new_Inscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "workshopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inscription_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Inscription" ("createdAt", "id", "status", "userId", "workshopId") SELECT "createdAt", "id", "status", "userId", "workshopId" FROM "Inscription";
DROP TABLE "Inscription";
ALTER TABLE "new_Inscription" RENAME TO "Inscription";
CREATE INDEX "Inscription_tenantId_idx" ON "Inscription"("tenantId");
CREATE UNIQUE INDEX "Inscription_workshopId_userId_key" ON "Inscription"("workshopId", "userId");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "description", "id", "name", "ownerId", "updatedAt") SELECT "createdAt", "description", "id", "name", "ownerId", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");
CREATE TABLE "new_RecurringBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "tenantId" TEXT,
    "spaceId" TEXT,
    "isVisibleToViewer" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringBlock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringBlock_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecurringBlock" ("createdAt", "dayOfWeek", "description", "endDate", "endTime", "id", "isVisibleToViewer", "spaceId", "startDate", "startTime", "title", "updatedAt") SELECT "createdAt", "dayOfWeek", "description", "endDate", "endTime", "id", "isVisibleToViewer", "spaceId", "startDate", "startTime", "title", "updatedAt" FROM "RecurringBlock";
DROP TABLE "RecurringBlock";
ALTER TABLE "new_RecurringBlock" RENAME TO "RecurringBlock";
CREATE INDEX "RecurringBlock_tenantId_idx" ON "RecurringBlock"("tenantId");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportIdCode" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "tenantId" TEXT,
    "spaceId" TEXT,
    "equipmentId" TEXT,
    "workshopId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Report_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "description", "equipmentId", "id", "reportIdCode", "spaceId", "status", "updatedAt", "userId", "workshopId") SELECT "createdAt", "description", "equipmentId", "id", "reportIdCode", "spaceId", "status", "updatedAt", "userId", "workshopId" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE UNIQUE INDEX "Report_reportIdCode_key" ON "Report"("reportIdCode");
CREATE INDEX "Report_tenantId_idx" ON "Report"("tenantId");
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayId" TEXT,
    "tenantId" TEXT,
    "userId" TEXT NOT NULL,
    "spaceId" TEXT,
    "equipmentId" TEXT,
    "cartSubmissionId" TEXT,
    "projectId" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "justification" TEXT NOT NULL,
    "subject" TEXT,
    "coordinator" TEXT,
    "teacher" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedByUserId" TEXT,
    "checkedOutAt" DATETIME,
    "checkedOutByUserId" TEXT,
    "checkedInAt" DATETIME,
    "checkedInByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_checkedOutByUserId_fkey" FOREIGN KEY ("checkedOutByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_checkedInByUserId_fkey" FOREIGN KEY ("checkedInByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("approvedByUserId", "cartSubmissionId", "checkedInAt", "checkedInByUserId", "checkedOutAt", "checkedOutByUserId", "coordinator", "createdAt", "displayId", "endTime", "equipmentId", "id", "justification", "projectId", "rejectionReason", "spaceId", "startTime", "status", "subject", "teacher", "updatedAt", "userId") SELECT "approvedByUserId", "cartSubmissionId", "checkedInAt", "checkedInByUserId", "checkedOutAt", "checkedOutByUserId", "coordinator", "createdAt", "displayId", "endTime", "equipmentId", "id", "justification", "projectId", "rejectionReason", "spaceId", "startTime", "status", "subject", "teacher", "updatedAt", "userId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_tenantId_idx" ON "Reservation"("tenantId");
CREATE TABLE "new_Space" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "tenantId" TEXT,
    "responsibleUserId" TEXT,
    "requiresSpaceReservationWithEquipment" BOOLEAN NOT NULL DEFAULT false,
    "reservationLeadTime" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Space_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Space_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Space" ("createdAt", "description", "displayId", "id", "name", "requiresSpaceReservationWithEquipment", "reservationLeadTime", "responsibleUserId", "status", "updatedAt") SELECT "createdAt", "description", "displayId", "id", "name", "requiresSpaceReservationWithEquipment", "reservationLeadTime", "responsibleUserId", "status", "updatedAt" FROM "Space";
DROP TABLE "Space";
ALTER TABLE "new_Space" RENAME TO "Space";
CREATE UNIQUE INDEX "Space_displayId_key" ON "Space"("displayId");
CREATE INDEX "Space_tenantId_idx" ON "Space"("tenantId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "alternativeEmail" TEXT,
    "profileImageUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "tenantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("alternativeEmail", "createdAt", "displayId", "email", "firstName", "id", "identifier", "isVerified", "lastName", "password", "phoneNumber", "profileImageUrl", "role", "updatedAt", "verificationToken") SELECT "alternativeEmail", "createdAt", "displayId", "email", "firstName", "id", "identifier", "isVerified", "lastName", "password", "phoneNumber", "profileImageUrl", "role", "updatedAt", "verificationToken" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_displayId_key" ON "User"("displayId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_identifier_key" ON "User"("identifier");
CREATE UNIQUE INDEX "User_alternativeEmail_key" ON "User"("alternativeEmail");
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE TABLE "new_Workshop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "availableFrom" DATETIME,
    "inscriptionsOpen" BOOLEAN NOT NULL DEFAULT true,
    "inscriptionsStartDate" DATETIME,
    "teacher" TEXT,
    "schedule" TEXT,
    "room" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "tenantId" TEXT,
    "responsibleUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workshop_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Workshop_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Workshop" ("availableFrom", "capacity", "createdAt", "description", "displayId", "endDate", "id", "inscriptionsOpen", "inscriptionsStartDate", "name", "responsibleUserId", "room", "schedule", "startDate", "teacher", "updatedAt") SELECT "availableFrom", "capacity", "createdAt", "description", "displayId", "endDate", "id", "inscriptionsOpen", "inscriptionsStartDate", "name", "responsibleUserId", "room", "schedule", "startDate", "teacher", "updatedAt" FROM "Workshop";
DROP TABLE "Workshop";
ALTER TABLE "new_Workshop" RENAME TO "Workshop";
CREATE UNIQUE INDEX "Workshop_displayId_key" ON "Workshop"("displayId");
CREATE INDEX "Workshop_tenantId_idx" ON "Workshop"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");
