-- CreateTable
CREATE TABLE "TenantConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "topLogoUrl" TEXT,
    "bottomLogoUrl" TEXT,
    "siteName" TEXT,
    "contactEmail" TEXT,
    "allowedDomains" TEXT,
    "privacyPolicy" TEXT,
    "howItWorks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TenantConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantConfig_tenantId_key" ON "TenantConfig"("tenantId");
