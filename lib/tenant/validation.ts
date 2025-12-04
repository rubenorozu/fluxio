import 'server-only';
import { prisma } from '@/lib/prisma';

/**
 * Verifica si un tenant está activo
 * @param tenantId - ID del tenant a verificar
 * @returns true si el tenant existe y está activo, false en caso contrario
 */
export async function isTenantActive(tenantId: string): Promise<boolean> {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { isActive: true },
        });

        return tenant?.isActive ?? false;
    } catch (error) {
        console.error('[isTenantActive] Error checking tenant status:', error);
        return false;
    }
}

/**
 * Obtiene el tenant y verifica si está activo
 * @param tenantId - ID del tenant
 * @returns El tenant si existe y está activo, null en caso contrario
 */
export async function getActiveTenant(tenantId: string) {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: {
                id: tenantId,
                isActive: true,
            },
        });

        return tenant;
    } catch (error) {
        console.error('[getActiveTenant] Error fetching tenant:', error);
        return null;
    }
}
