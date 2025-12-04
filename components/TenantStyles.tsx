'use client';

import { useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';

/**
 * Componente que inyecta CSS variables dinámicas basadas en el tenant
 */
export function TenantStyles() {
    const tenant = useTenant();

    useEffect(() => {
        // Obtener colores de la configuración o usar defaults
        const primaryColor = tenant.config?.primaryColor || '#3B82F6'; // Azul por defecto
        const secondaryColor = tenant.config?.secondaryColor || '#1F2937'; // Gris oscuro por defecto
        const tertiaryColor = tenant.config?.tertiaryColor || '#F28C00'; // Naranja por defecto

        // Inyectar CSS variables en el documento
        document.documentElement.style.setProperty('--tenant-primary-color', primaryColor);
        document.documentElement.style.setProperty('--tenant-secondary-color', secondaryColor);
        document.documentElement.style.setProperty('--tenant-tertiary-color', tertiaryColor);
        document.documentElement.style.setProperty('--tenant-name', `"${tenant.name}"`);

        // Agregar clase con el slug del tenant para estilos específicos
        document.body.classList.add(`tenant-${tenant.slug}`);

        return () => {
            // Limpiar al desmontar
            document.body.classList.remove(`tenant-${tenant.slug}`);
        };
    }, [tenant]);

    return null; // Este componente no renderiza nada
}
