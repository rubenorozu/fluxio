'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Componente para detectar y redirigir custom domains
 * Se ejecuta del lado del cliente para evitar problemas con Edge Runtime
 */
export default function CustomDomainResolver() {
    const router = useRouter();

    useEffect(() => {
        async function checkCustomDomain() {
            try {
                // Obtener hostname actual
                const hostname = window.location.hostname;

                // Si ya estamos en un subdomain de fluxiorsv.com, no hacer nada
                if (hostname.includes('fluxiorsv.com') || hostname === 'localhost') {
                    return;
                }

                console.log('[Custom Domain Resolver] Checking:', hostname);

                // Llamar al API para verificar si es un custom domain
                const response = await fetch(`/api/resolve-domain?hostname=${encodeURIComponent(hostname)}`);

                if (!response.ok) {
                    console.error('[Custom Domain Resolver] API error:', response.status);
                    return;
                }

                const data = await response.json();

                if (data.isCustomDomain && data.tenantSlug) {
                    console.log('[Custom Domain Resolver] Custom domain detected, redirecting to:', data.tenantSlug);

                    // Redirigir al subdomain correcto manteniendo el path
                    const newUrl = `https://${data.tenantSlug}.fluxiorsv.com${window.location.pathname}${window.location.search}`;
                    window.location.href = newUrl;
                }
            } catch (error) {
                console.error('[Custom Domain Resolver] Error:', error);
            }
        }

        checkCustomDomain();
    }, [router]);

    // Este componente no renderiza nada
    return null;
}
