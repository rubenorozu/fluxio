import { config } from 'dotenv';
config({ path: '.env.local' });

import pg from 'pg';
const { Client } = pg;

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('🔄 Conectando a la base de datos...');
        await client.connect();
        console.log('✅ Conectado');

        console.log('🔄 Agregando columna reservationFormConfig...');
        await client.query(`
      ALTER TABLE "TenantConfig" ADD COLUMN IF NOT EXISTS "reservationFormConfig" JSONB;
    `);
        console.log('✅ Columna agregada');

        console.log('🔄 Aplicando configuración por defecto...');
        const defaultConfig = {
            fields: [
                {
                    id: 'subject',
                    label: 'Materia',
                    type: 'text',
                    enabled: true,
                    required: true,
                    order: 1,
                    placeholder: 'Ingrese la materia'
                },
                {
                    id: 'teacher',
                    label: 'Maestro que solicita',
                    type: 'text',
                    enabled: true,
                    required: true,
                    order: 2,
                    placeholder: 'Nombre del maestro'
                },
                {
                    id: 'coordinator',
                    label: 'Coordinador que autoriza',
                    type: 'text',
                    enabled: true,
                    required: true,
                    order: 3,
                    placeholder: 'Nombre del coordinador'
                },
                {
                    id: 'justification',
                    label: 'Justificación del Proyecto',
                    type: 'textarea',
                    enabled: true,
                    required: true,
                    order: 4,
                    rows: 4,
                    placeholder: 'Describa la justificación del proyecto'
                }
            ]
        };

        const result = await client.query(`
      UPDATE "TenantConfig" 
      SET "reservationFormConfig" = $1::jsonb
      WHERE "reservationFormConfig" IS NULL;
    `, [JSON.stringify(defaultConfig)]);

        console.log(`✅ Configuración aplicada a ${result.rowCount} registro(s)`);
        console.log('✅ Migración completada exitosamente!');

    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
    } finally {
        await client.end();
    }
}

runMigration();
