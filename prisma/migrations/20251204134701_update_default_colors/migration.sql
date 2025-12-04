-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TenantConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "topLogoUrl" TEXT,
    "topLogoHeight" INTEGER DEFAULT 50,
    "bottomLogoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#145775',
    "secondaryColor" TEXT DEFAULT '#1F2937',
    "tertiaryColor" TEXT DEFAULT '#ff9500',
    "inscriptionDefaultColor" TEXT DEFAULT '#ff9500',
    "inscriptionPendingColor" TEXT DEFAULT '#ff9500',
    "inscriptionApprovedColor" TEXT DEFAULT '#28A745',
    "pdfTopLogoUrl" TEXT,
    "pdfBottomLogoUrl" TEXT,
    "siteName" TEXT,
    "contactEmail" TEXT,
    "allowedDomains" TEXT,
    "privacyPolicy" TEXT,
    "howItWorks" TEXT,
    "regulationsUrl" TEXT,
    "attachmentFormUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TenantConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TenantConfig" ("allowedDomains", "attachmentFormUrl", "bottomLogoUrl", "contactEmail", "createdAt", "faviconUrl", "howItWorks", "id", "inscriptionApprovedColor", "inscriptionDefaultColor", "inscriptionPendingColor", "pdfBottomLogoUrl", "pdfTopLogoUrl", "primaryColor", "privacyPolicy", "regulationsUrl", "secondaryColor", "siteName", "tenantId", "tertiaryColor", "topLogoHeight", "topLogoUrl", "updatedAt") SELECT "allowedDomains", "attachmentFormUrl", "bottomLogoUrl", "contactEmail", "createdAt", "faviconUrl", "howItWorks", "id", "inscriptionApprovedColor", "inscriptionDefaultColor", "inscriptionPendingColor", "pdfBottomLogoUrl", "pdfTopLogoUrl", "primaryColor", "privacyPolicy", "regulationsUrl", "secondaryColor", "siteName", "tenantId", "tertiaryColor", "topLogoHeight", "topLogoUrl", "updatedAt" FROM "TenantConfig";
DROP TABLE "TenantConfig";
ALTER TABLE "new_TenantConfig" RENAME TO "TenantConfig";
CREATE UNIQUE INDEX "TenantConfig_tenantId_key" ON "TenantConfig"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
