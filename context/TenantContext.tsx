'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface TenantContextType {
    id: string;
    slug: string;
    name: string;
    config?: {
        topLogoUrl?: string | null;
        topLogoHeight?: number | null; // Added field
        bottomLogoUrl?: string | null;
        faviconUrl?: string | null;
        primaryColor?: string | null; // Added field
        secondaryColor?: string | null; // Added field
        tertiaryColor?: string | null; // Added field
        inscriptionDefaultColor?: string | null; // Inscription default color
        inscriptionPendingColor?: string | null; // Inscription pending color
        inscriptionApprovedColor?: string | null; // Inscription approved color
        siteName?: string | null;
        contactEmail?: string | null;
        allowedDomains?: string | null;
        privacyPolicy?: string | null;
        howItWorks?: string | null;
    } | null;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function useTenant() {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within TenantProvider');
    }
    return context;
}

export function TenantProvider({
    children,
    tenant,
}: {
    children: ReactNode;
    tenant: TenantContextType;
}) {
    return (
        <TenantContext.Provider value={tenant}>
            {children}
        </TenantContext.Provider>
    );
}

export default TenantContext;
