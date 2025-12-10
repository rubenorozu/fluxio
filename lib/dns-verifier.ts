import dns from 'dns/promises';

/**
 * Verifica que un dominio personalizado apunte correctamente al target esperado
 * @param customDomain - Dominio a verificar (ej: universidad.com)
 * @param expectedTarget - Target esperado (ej: universidad.fluxiorsv.com)
 * @returns true si el DNS está configurado correctamente
 */
export async function verifyDNS(
    customDomain: string,
    expectedTarget: string
): Promise<boolean> {
    try {
        console.log(`[DNS Verifier] Checking ${customDomain} -> ${expectedTarget}`);

        // Intentar verificar CNAME primero
        try {
            const cnameRecords = await dns.resolveCname(customDomain);
            console.log(`[DNS Verifier] CNAME records:`, cnameRecords);

            // Verificar que apunte al target correcto
            const isValid = cnameRecords.some(
                (record) =>
                    record.toLowerCase() === expectedTarget.toLowerCase() ||
                    record.toLowerCase() === `${expectedTarget}.`.toLowerCase() // Con punto final
            );

            if (isValid) {
                console.log(`[DNS Verifier] ✅ CNAME verified`);
                return true;
            }
        } catch (cnameError: any) {
            // Si no hay CNAME, intentar A record
            console.log(`[DNS Verifier] No CNAME found, trying A records...`);
        }

        // Fallback: Verificar A records
        try {
            const customDomainIPs = await dns.resolve4(customDomain);
            const targetIPs = await dns.resolve4(expectedTarget);

            console.log(`[DNS Verifier] Custom domain IPs:`, customDomainIPs);
            console.log(`[DNS Verifier] Target IPs:`, targetIPs);

            // Verificar si alguna IP coincide
            const hasMatchingIP = customDomainIPs.some((ip) =>
                targetIPs.includes(ip)
            );

            if (hasMatchingIP) {
                console.log(`[DNS Verifier] ✅ A record verified`);
                return true;
            }
        } catch (aRecordError: any) {
            console.error(`[DNS Verifier] A record error:`, aRecordError.message);
        }

        console.log(`[DNS Verifier] ❌ DNS not configured correctly`);
        return false;
    } catch (error: any) {
        console.error(`[DNS Verifier] Error:`, error.message);
        return false;
    }
}

/**
 * Valida el formato de un dominio
 * @param domain - Dominio a validar
 * @returns true si el formato es válido
 */
export function isValidDomain(domain: string): boolean {
    // Regex para validar dominios
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;

    // No permitir protocolos
    if (domain.includes('://')) {
        return false;
    }

    // No permitir espacios
    if (domain.includes(' ')) {
        return false;
    }

    // No permitir www (debe ser dominio limpio)
    if (domain.startsWith('www.')) {
        return false;
    }

    return domainRegex.test(domain);
}

/**
 * Normaliza un dominio removiendo espacios y convirtiendo a minúsculas
 * @param domain - Dominio a normalizar
 * @returns Dominio normalizado
 */
export function normalizeDomain(domain: string): string {
    return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
}
