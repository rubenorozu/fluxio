import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde .env.local
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

/**
 * Script para normalizar todos los emails existentes a minúsculas
 * Esto asegura consistencia con la nueva lógica de autenticación case-insensitive
 */
async function normalizeEmails() {
    console.log('🔄 Iniciando normalización de emails...\n');

    try {
        // 1. Obtener todos los usuarios
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
            },
        });

        console.log(`📊 Total de usuarios encontrados: ${users.length}\n`);

        // 2. Detectar posibles duplicados después de normalizar
        const emailMap = new Map<string, Array<{ id: string; email: string }>>();

        for (const user of users) {
            const normalizedEmail = user.email.toLowerCase().trim();

            if (!emailMap.has(normalizedEmail)) {
                emailMap.set(normalizedEmail, []);
            }
            emailMap.get(normalizedEmail)!.push(user);
        }

        // 3. Reportar duplicados potenciales
        const duplicates = Array.from(emailMap.entries()).filter(([_, users]) => users.length > 1);

        if (duplicates.length > 0) {
            console.log('⚠️  ADVERTENCIA: Se encontraron emails duplicados (con diferentes capitalizaciones):');
            console.log('   Estos usuarios tienen el mismo email:\n');

            for (const [normalizedEmail, users] of duplicates) {
                console.log(`   Email normalizado: ${normalizedEmail}`);
                for (const user of users) {
                    console.log(`     - ID: ${user.id}, Email original: ${user.email}`);
                }
                console.log('');
            }

            console.log('⚠️  Se procederá con la normalización, pero deberás resolver los duplicados manualmente.');
            console.log('   Puedes eliminar o fusionar los usuarios duplicados después.\n');
        }

        // 4. Normalizar emails
        let updatedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            const normalizedEmail = user.email.toLowerCase().trim();

            if (user.email !== normalizedEmail) {
                try {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { email: normalizedEmail },
                    });

                    console.log(`✅ Actualizado: ${user.email} → ${normalizedEmail}`);
                    updatedCount++;
                } catch (error: any) {
                    console.log(`❌ Error al actualizar ${user.email}: ${error.message}`);
                }
            } else {
                skippedCount++;
            }
        }

        console.log('\n✨ Migración completada!');
        console.log(`   - Emails actualizados: ${updatedCount}`);
        console.log(`   - Emails sin cambios: ${skippedCount}`);
        console.log(`   - Total procesados: ${users.length}\n`);

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el script
normalizeEmails()
    .then(() => {
        console.log('🎉 Script finalizado correctamente.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
