import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log('🔍 Verificando conexión a la base de datos...\n');

        // Verificar tenants
        const tenants = await prisma.tenant.findMany({
            select: {
                slug: true,
                name: true,
                isActive: true,
            }
        });

        console.log('📊 Tenants encontrados:');
        tenants.forEach(t => {
            console.log(`  - ${t.slug} (${t.name}) - ${t.isActive ? 'Activo' : 'Inactivo'}`);
        });

        // Verificar usuarios
        const users = await prisma.user.findMany({
            take: 10,
            select: {
                email: true,
                role: true,
                tenantId: true,
                tenant: {
                    select: {
                        slug: true
                    }
                }
            }
        });

        console.log('\n👥 Usuarios encontrados (primeros 10):');
        users.forEach(u => {
            console.log(`  - ${u.email} (${u.role}) - Tenant: ${u.tenant.slug}`);
        });

        console.log('\n✅ Conexión exitosa a la base de datos');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
