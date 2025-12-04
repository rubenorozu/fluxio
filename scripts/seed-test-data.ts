import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de datos de prueba...');

    // Timestamp único para evitar duplicados
    const timestamp = Date.now();

    // Obtener todos los tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`📊 Encontrados ${tenants.length} tenants`);

    for (const tenant of tenants) {
        console.log(`\n🏢 Poblando tenant: ${tenant.name} (${tenant.slug})`);

        // 1. Crear 5 usuarios
        console.log('👥 Creando 5 usuarios...');
        const users = [];
        for (let i = 1; i <= 5; i++) {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            const user = await prisma.user.create({
                data: {
                    displayId: `USR_${tenant.slug}_${timestamp}_${i}`,
                    firstName: `Usuario${i}`,
                    lastName: `${tenant.name}`,
                    email: `usuario${i}.${timestamp}@${tenant.slug}.test`,
                    password: hashedPassword,
                    identifier: `${tenant.slug.toUpperCase()}${timestamp}${String(i).padStart(4, '0')}`,
                    phoneNumber: `555-${String(i).padStart(4, '0')}`,
                    role: i === 1 ? 'ADMIN_RESOURCE' : 'USER',
                    isVerified: true,
                    tenantId: tenant.id,
                },
            });
            users.push(user);
        }

        // 2. Crear 5 espacios
        console.log('🏛️  Creando 5 espacios...');
        const spaces = [];
        for (let i = 1; i <= 5; i++) {
            const space = await prisma.space.create({
                data: {
                    displayId: `SPC_${tenant.slug}_${timestamp}_${i}`,
                    name: `Espacio ${i} - ${tenant.name}`,
                    description: `Descripción del espacio ${i} para ${tenant.name}`,
                    status: 'AVAILABLE',
                    responsibleUserId: users[0].id, // Asignar al primer usuario (admin)
                    tenantId: tenant.id,
                },
            });
            spaces.push(space);
        }

        // 3. Crear 5 equipos
        console.log('🔧 Creando 5 equipos...');
        const equipment = [];
        for (let i = 1; i <= 5; i++) {
            const equip = await prisma.equipment.create({
                data: {
                    displayId: `EQP_${tenant.slug}_${timestamp}_${i}`,
                    name: `Equipo ${i} - ${tenant.name}`,
                    description: `Descripción del equipo ${i} para ${tenant.name}`,
                    serialNumber: `SN-${tenant.slug.toUpperCase()}-${timestamp}-${String(i).padStart(4, '0')}`,
                    fixedAssetId: `FA-${tenant.slug.toUpperCase()}-${timestamp}-${String(i).padStart(4, '0')}`,
                    status: 'AVAILABLE',
                    spaceId: spaces[i % 5].id, // Distribuir equipos entre espacios
                    responsibleUserId: users[0].id,
                    tenantId: tenant.id,
                },
            });
            equipment.push(equip);
        }

        // 4. Crear 5 talleres
        console.log('🎨 Creando 5 talleres...');
        const workshops = [];
        for (let i = 1; i <= 5; i++) {
            const workshop = await prisma.workshop.create({
                data: {
                    displayId: `WKS_${tenant.slug}_${timestamp}_${i}`,
                    name: `Taller ${i} - ${tenant.name}`,
                    description: `Descripción del taller ${i} para ${tenant.name}`,
                    capacity: 20 + (i * 5),
                    teacher: `Profesor ${i}`,
                    room: `Aula ${i}`,
                    startDate: new Date(2024, 0, 1 + i),
                    endDate: new Date(2024, 11, 31),
                    inscriptionsOpen: true,
                    responsibleUserId: users[0].id,
                    tenantId: tenant.id,
                },
            });
            workshops.push(workshop);

            // Crear sesiones para el taller
            await prisma.workshopSession.create({
                data: {
                    workshopId: workshop.id,
                    dayOfWeek: i % 5, // Lunes a Viernes
                    timeStart: `${8 + i}:00`,
                    timeEnd: `${10 + i}:00`,
                    room: `Aula ${i}`,
                },
            });
        }

        // 5. Crear 10 reservaciones
        console.log('📅 Creando 10 reservaciones...');
        for (let i = 1; i <= 10; i++) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + i);
            startDate.setHours(9 + (i % 8), 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setHours(startDate.getHours() + 2);

            await prisma.reservation.create({
                data: {
                    displayId: `RSV_${tenant.slug}_${timestamp}_${i}`,
                    userId: users[i % 5].id,
                    spaceId: i % 2 === 0 ? spaces[i % 5].id : null,
                    equipmentId: i % 2 === 1 ? equipment[i % 5].id : null,
                    startTime: startDate,
                    endTime: endDate,
                    justification: `Justificación de reservación ${i} para ${tenant.name}`,
                    subject: `Materia ${i}`,
                    coordinator: `Coordinador ${i}`,
                    teacher: `Maestro ${i}`,
                    status: ['PENDING', 'APPROVED', 'REJECTED'][i % 3] as any,
                    tenantId: tenant.id,
                },
            });
        }

        // 6. Crear 10 inscripciones (asegurando combinaciones únicas)
        console.log('📝 Creando 10 inscripciones...');
        let inscriptionCount = 0;
        for (let workshopIdx = 0; workshopIdx < workshops.length; workshopIdx++) {
            for (let userIdx = 0; userIdx < users.length && inscriptionCount < 10; userIdx++) {
                await prisma.inscription.create({
                    data: {
                        workshopId: workshops[workshopIdx].id,
                        userId: users[userIdx].id,
                        status: ['PENDING', 'APPROVED', 'REJECTED'][inscriptionCount % 3] as any,
                        tenantId: tenant.id,
                    },
                });
                inscriptionCount++;
            }
            if (inscriptionCount >= 10) break;
        }
        console.log(`✅ Tenant ${tenant.name} poblado exitosamente`);
    }

    console.log('\n🎉 Seed completado exitosamente!');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
