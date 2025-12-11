import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Datos de comparación de competidores
const competitorData = [
    {
        'Plataforma': 'Fluxio RSV',
        'Precio Base (USD/mes)': '$49 - $299',
        'Modelo de Pricing': 'Tiered (por tenant)',
        'Usuarios Incluidos': '100 - Ilimitado',
        'Recursos': '25 - Ilimitado',
        'Multi-tenant': '✓',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✓',
        'Talleres/Workshops': '✓',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✓',
        'Custom Domain': '✓ (Pro+)',
        'Mobile App': '✗',
        'API Access': '✓ (Pro+)',
        'SSO/SAML': '✗',
        'Integraciones': 'Limitadas',
        'Vigilancia Integrada': '✓',
        'Soporte': 'Email/Dedicado 24/7',
        'Ventaja Principal': 'Multi-tenant + Talleres + Vigilancia + Precio competitivo vs funcionalidades',
        'Desventaja': 'Sin mobile app nativa'
    },
    {
        'Plataforma': 'Skedda',
        'Precio Base (USD/mes)': '$99 - $199',
        'Modelo de Pricing': 'Por recursos',
        'Usuarios Incluidos': 'Ilimitado',
        'Recursos': '15 - 25',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✓',
        'Talleres/Workshops': '✗',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✓',
        'Custom Domain': '✓',
        'Mobile App': '✓',
        'API Access': '✓',
        'SSO/SAML': '✗',
        'Integraciones': 'Google/Outlook',
        'Vigilancia Integrada': '✗',
        'Soporte': 'Email',
        'Ventaja Principal': 'Interfaz intuitiva + Floor plans interactivos',
        'Desventaja': 'Precio alto por recurso'
    },
    {
        'Plataforma': 'Archie',
        'Precio Base (USD/mes)': '$159+',
        'Modelo de Pricing': 'Por recurso',
        'Usuarios Incluidos': 'Ilimitado',
        'Recursos': 'Variable',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✓',
        'Talleres/Workshops': '✗',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✓',
        'Custom Domain': '✓',
        'Mobile App': '✓',
        'API Access': '✓',
        'SSO/SAML': '✓',
        'Integraciones': 'Múltiples',
        'Vigilancia Integrada': '✗',
        'Soporte': 'Dedicado',
        'Ventaja Principal': 'Enterprise features + SSO + Automations',
        'Desventaja': 'Precio premium'
    },
    {
        'Plataforma': 'Resource Guru',
        'Precio Base (USD/mes)': '$4.16/usuario',
        'Modelo de Pricing': 'Por usuario',
        'Usuarios Incluidos': 'Variable',
        'Recursos': 'Ilimitado',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✓',
        'Talleres/Workshops': '✗',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✗',
        'Custom Domain': '✗',
        'Mobile App': '✓',
        'API Access': '✓',
        'SSO/SAML': '✗',
        'Integraciones': 'Google/Outlook',
        'Vigilancia Integrada': '✗',
        'Soporte': 'Email',
        'Ventaja Principal': 'Precio muy competitivo + Simple',
        'Desventaja': 'Funcionalidades limitadas'
    },
    {
        'Plataforma': 'monday.com',
        'Precio Base (USD/mes)': '$10-12/usuario',
        'Modelo de Pricing': 'Por usuario (tiered)',
        'Usuarios Incluidos': 'Variable',
        'Recursos': 'Ilimitado',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✓',
        'Talleres/Workshops': '✓ (limitado)',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✓',
        'Custom Domain': '✗',
        'Mobile App': '✓',
        'API Access': '✓',
        'SSO/SAML': '✓ (Enterprise)',
        'Integraciones': 'Múltiples (100+)',
        'Vigilancia Integrada': '✗',
        'Soporte': 'Chat/Email',
        'Ventaja Principal': 'Ecosistema completo + Integraciones masivas',
        'Desventaja': 'Complejo para uso simple'
    },
    {
        'Plataforma': 'ClickUp',
        'Precio Base (USD/mes)': '$7/usuario',
        'Modelo de Pricing': 'Por usuario',
        'Usuarios Incluidos': 'Variable',
        'Recursos': 'Ilimitado',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✓',
        'Talleres/Workshops': '✗',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✓',
        'Custom Domain': '✗',
        'Mobile App': '✓',
        'API Access': '✓',
        'SSO/SAML': '✓ (Business+)',
        'Integraciones': 'Múltiples (50+)',
        'Vigilancia Integrada': '✗',
        'Soporte': 'Chat/Email',
        'Ventaja Principal': 'Vistas personalizables + Todo-en-uno',
        'Desventaja': 'Curva de aprendizaje'
    },
    {
        'Plataforma': 'Asana',
        'Precio Base (USD/mes)': '$10.99/usuario',
        'Modelo de Pricing': 'Por usuario',
        'Usuarios Incluidos': 'Variable',
        'Recursos': 'Ilimitado',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✓',
        'Talleres/Workshops': '✗',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✗',
        'Custom Domain': '✗',
        'Mobile App': '✓',
        'API Access': '✓',
        'SSO/SAML': '✓ (Enterprise)',
        'Integraciones': 'Múltiples (200+)',
        'Vigilancia Integrada': '✗',
        'Soporte': 'Email/Chat',
        'Ventaja Principal': 'Gantt charts + Timeline views + Marca reconocida',
        'Desventaja': 'Enfocado en proyectos, no recursos'
    },
    {
        'Plataforma': 'Wrike',
        'Precio Base (USD/mes)': '$9.80/usuario',
        'Modelo de Pricing': 'Por usuario',
        'Usuarios Incluidos': 'Variable',
        'Recursos': 'Ilimitado',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✓',
        'Talleres/Workshops': '✗',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✓',
        'Custom Domain': '✗',
        'Mobile App': '✓',
        'API Access': '✓',
        'SSO/SAML': '✓ (Enterprise)',
        'Integraciones': 'Múltiples (400+)',
        'Vigilancia Integrada': '✗',
        'Soporte': 'Email/Chat/Phone',
        'Ventaja Principal': 'Enterprise-grade + Time tracking + Gantt',
        'Desventaja': 'Precio alto para equipos grandes'
    },
    {
        'Plataforma': 'Productive.io',
        'Precio Base (USD/mes)': '$9-32/usuario',
        'Modelo de Pricing': 'Tiered por usuario',
        'Usuarios Incluidos': 'Variable',
        'Recursos': 'Ilimitado',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✓',
        'Talleres/Workshops': '✗',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✓',
        'Custom Domain': '✗',
        'Mobile App': '✓',
        'API Access': '✓',
        'SSO/SAML': '✓ (Ultimate)',
        'Integraciones': 'Múltiples',
        'Vigilancia Integrada': '✗',
        'Soporte': 'Email/Chat',
        'Ventaja Principal': 'Budgeting + Profitability tracking',
        'Desventaja': 'Enfocado en agencies'
    },
    {
        'Plataforma': 'Officely',
        'Precio Base (USD/mes)': '$12/espacio',
        'Modelo de Pricing': 'Por espacio',
        'Usuarios Incluidos': 'Ilimitado',
        'Recursos': 'Variable',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✗',
        'Talleres/Workshops': '✗',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✗',
        'Custom Domain': '✗',
        'Mobile App': '✓',
        'API Access': '✗',
        'SSO/SAML': '✗',
        'Integraciones': 'Google/Outlook',
        'Vigilancia Integrada': '✗',
        'Soporte': 'Email',
        'Ventaja Principal': 'Precio competitivo + Usuarios ilimitados',
        'Desventaja': 'Solo meeting rooms'
    },
    {
        'Plataforma': 'Envoy',
        'Precio Base (USD/mes)': '$3-7/usuario',
        'Modelo de Pricing': 'Tiered por usuario',
        'Usuarios Incluidos': 'Variable',
        'Recursos': 'Ilimitado',
        'Multi-tenant': '✗',
        'Gestión de Espacios': '✓',
        'Gestión de Equipos': '✗',
        'Talleres/Workshops': '✗',
        'Calendario Integrado': '✓',
        'Reportes/Analytics': '✓',
        'Exportación PDF/CSV': '✓',
        'Personalización Marca': '✓',
        'Custom Domain': '✗',
        'Mobile App': '✓',
        'API Access': '✓',
        'SSO/SAML': '✓',
        'Integraciones': 'Múltiples',
        'Vigilancia Integrada': '✓ (Visitor mgmt)',
        'Soporte': 'Email/Chat',
        'Ventaja Principal': 'Visitor management + Security focus',
        'Desventaja': 'Limitado a espacios'
    }
];

// Crear workbook
const wb = XLSX.utils.book_new();

// Hoja 1: Comparación completa
const ws1 = XLSX.utils.json_to_sheet(competitorData);

// Ajustar anchos de columna
const colWidths = [
    { wch: 18 }, // Plataforma
    { wch: 20 }, // Precio
    { wch: 18 }, // Modelo
    { wch: 18 }, // Usuarios
    { wch: 18 }, // Recursos
    { wch: 12 }, // Multi-tenant
    { wch: 18 }, // Gestión Espacios
    { wch: 18 }, // Gestión Equipos
    { wch: 18 }, // Talleres
    { wch: 18 }, // Calendario
    { wch: 18 }, // Reportes
    { wch: 18 }, // Exportación
    { wch: 20 }, // Personalización
    { wch: 15 }, // Custom Domain
    { wch: 12 }, // Mobile App
    { wch: 15 }, // API Access
    { wch: 12 }, // SSO/SAML
    { wch: 20 }, // Integraciones
    { wch: 20 }, // Vigilancia
    { wch: 20 }, // Soporte
    { wch: 50 }, // Ventaja
    { wch: 30 }  // Desventaja
];
ws1['!cols'] = colWidths;

XLSX.utils.book_append_sheet(wb, ws1, 'Comparación Completa');

// Hoja 2: Resumen de precios
const pricingSummary = competitorData.map(p => ({
    'Plataforma': p['Plataforma'],
    'Precio Base': p['Precio Base (USD/mes)'],
    'Modelo': p['Modelo de Pricing'],
    'Mejor Para': p['Ventaja Principal']
}));

const ws2 = XLSX.utils.json_to_sheet(pricingSummary);
ws2['!cols'] = [
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 50 }
];
XLSX.utils.book_append_sheet(wb, ws2, 'Resumen Precios');

// Hoja 3: Características únicas de Fluxio
const fluxioUnique = [
    {
        'Característica': 'Multi-tenant SaaS',
        'Descripción': 'Permite gestionar múltiples organizaciones desde una sola instancia',
        'Competidores con esta feature': 'Ninguno',
        'Ventaja Competitiva': 'Alta'
    },
    {
        'Característica': 'Talleres/Workshops Integrados',
        'Descripción': 'Sistema completo de gestión de talleres con inscripciones y aprobaciones',
        'Competidores con esta feature': 'monday.com (limitado)',
        'Ventaja Competitiva': 'Alta'
    },
    {
        'Característica': 'Vigilancia Integrada',
        'Descripción': 'Comunicación directa con área de vigilancia para préstamos de equipos',
        'Competidores con esta feature': 'Envoy (visitor mgmt)',
        'Ventaja Competitiva': 'Alta'
    },
    {
        'Característica': 'Custom Domains',
        'Descripción': 'Dominios personalizados para cada tenant',
        'Competidores con esta feature': 'Skedda, Archie',
        'Ventaja Competitiva': 'Media'
    },
    {
        'Característica': 'Precio Competitivo (MXN)',
        'Descripción': 'Pricing en pesos mexicanos muy accesible',
        'Competidores con esta feature': 'Resource Guru',
        'Ventaja Competitiva': 'Alta'
    },
    {
        'Característica': 'Personalización Total Incluida',
        'Descripción': 'Logos, colores y branding desde plan básico',
        'Competidores con esta feature': 'Mayoría (pero en planes altos)',
        'Ventaja Competitiva': 'Media'
    }
];

const ws3 = XLSX.utils.json_to_sheet(fluxioUnique);
ws3['!cols'] = [
    { wch: 30 },
    { wch: 60 },
    { wch: 30 },
    { wch: 20 }
];
XLSX.utils.book_append_sheet(wb, ws3, 'Ventajas Únicas Fluxio');

// Guardar archivo
const outputPath = path.join(process.cwd(), 'comparacion_competidores.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Archivo Excel creado: ${outputPath}`);
