const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'a_very_long_and_random_string_that_is_hard_to_guess_and_should_be_kept_secret_for_your_application_security_purposes_please_replace_this_with_a_more_unique_one_in_production_if_possible_but_this_will_work_for_now';

function createCookieHeader(userId, role, tenantId) {
  const token = jwt.sign({ userId, role, tenantId }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  return `session=${token}`;
}

async function run() {
  console.log('🚀 Iniciando prueba integral en el servidor en vivo:', BASE_URL);

  const tenant = await prisma.tenant.findFirst({ where: { slug: 'tuceproa' } }) || await prisma.tenant.findFirst();
  if (!tenant) throw new Error('No tenant found');
  console.log(`✓ Usando tenant: ${tenant.name} (${tenant.slug})`);

  const ts = Date.now();

  // Crear usuario admin y 3 estudiantes
  const admin = await prisma.user.create({
    data: {
      email: `admin_${ts}@test.com`,
      firstName: 'Admin',
      lastName: 'Test',
      identifier: `ADM_${ts}`,
      role: 'SUPERUSER',
      password: 'test_password',
      tenantId: tenant.id,
    },
  });

  const students = [];
  for (let i = 1; i <= 3; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student_${i}_${ts}@test.com`,
        firstName: `Estudiante ${i}`,
        lastName: `Prueba`,
        identifier: `MATR_${i}_${ts}`,
        role: 'USER',
        password: 'test_password',
        tenantId: tenant.id,
      },
    });
    students.push(student);
  }

  const adminCookie = createCookieHeader(admin.id, admin.role, tenant.id);
  const studentCookies = students.map(s => createCookieHeader(s.id, s.role, tenant.id));

  let workshopId = null;
  let student1InsId = null;
  let student2InsId = null;
  let student3InsId = null;

  try {
    // 1. Crear Taller con autoApprove = true, allowWaitlist = true, capacity = 2
    console.log('\n--- 1. Creando Taller vía API Admin ---');
    const createWorkshopRes = await fetch(`${BASE_URL}/api/admin/workshops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'Host': `${tenant.slug}.localhost:3001`,
      },
      body: JSON.stringify({
        name: `Taller Fotografía Digital ${ts}`,
        description: 'Taller práctico de fotografía',
        capacity: 2,
        autoApprove: true,
        allowWaitlist: true,
        maxWaitlist: null,
        teacher: 'Prof. Carlos Ramírez',
        sessions: [
          { dayOfWeek: 1, timeStart: '10:00', timeEnd: '12:00', room: 'A-101' },
        ],
      }),
    });

    if (!createWorkshopRes.ok) {
      const err = await createWorkshopRes.text();
      throw new Error(`Error al crear taller: ${err}`);
    }

    const workshop = await createWorkshopRes.json();
    workshopId = workshop.id;
    console.log(`✓ Taller creado con éxito: ID=${workshopId}, Capacidad=${workshop.capacity}, autoApprove=${workshop.autoApprove}, allowWaitlist=${workshop.allowWaitlist}`);

    // 2. Inscripción Estudiante 1 (Debe aprobarse de forma automática)
    console.log('\n--- 2. Inscripción Estudiante 1 (Auto-Aprobación) ---');
    const inscribe1Res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/inscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookies[0],
        'Host': `${tenant.slug}.localhost:3001`,
      },
    });
    const inscribe1 = await inscribe1Res.json();
    console.log(`✓ Respuesta Alumno 1: status=${inscribe1.status}, autoApproved=${inscribe1.autoApproved}, mensaje="${inscribe1.message}"`);
    if (inscribe1.status !== 'APPROVED') {
      throw new Error(`FALLO: Alumno 1 debió ser APPROVED, recibido: ${inscribe1.status}`);
    }
    student1InsId = inscribe1.inscription.id;

    // 3. Inscripción Estudiante 2 (Debe aprobarse de forma automática - Llenando cupo 2/2)
    console.log('\n--- 3. Inscripción Estudiante 2 (Llena cupo 2/2) ---');
    const inscribe2Res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/inscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookies[1],
        'Host': `${tenant.slug}.localhost:3001`,
      },
    });
    const inscribe2 = await inscribe2Res.json();
    console.log(`✓ Respuesta Alumno 2: status=${inscribe2.status}, autoApproved=${inscribe2.autoApproved}`);
    if (inscribe2.status !== 'APPROVED') {
      throw new Error(`FALLO: Alumno 2 debió ser APPROVED, recibido: ${inscribe2.status}`);
    }
    student2InsId = inscribe2.inscription.id;

    // 4. Inscripción Estudiante 3 (Cupo lleno -> Debe ingresar a Lista de Espera #1)
    console.log('\n--- 4. Inscripción Estudiante 3 (Ingreso a Lista de Espera) ---');
    const inscribe3Res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/inscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookies[2],
        'Host': `${tenant.slug}.localhost:3001`,
      },
    });
    const inscribe3 = await inscribe3Res.json();
    console.log(`✓ Respuesta Alumno 3: status=${inscribe3.status}, isWaitlist=${inscribe3.isWaitlist}, posición=${inscribe3.waitlistPosition}, mensaje="${inscribe3.message}"`);
    if (inscribe3.status !== 'WAITLIST' || inscribe3.waitlistPosition !== 1) {
      throw new Error(`FALLO: Alumno 3 debió estar en WAITLIST pos 1, recibido: ${inscribe3.status}`);
    }
    student3InsId = inscribe3.inscription.id;

    // 5. Consulta de Códigos QR
    console.log('\n--- 5. Verificando Generación de Códigos QR ---');
    const qrPublicRes = await fetch(`${BASE_URL}/api/workshops/${workshopId}/qr?type=public`);
    const qrPublic = await qrPublicRes.json();
    console.log(`✓ QR Difusión generado: target=${qrPublic.targetUrl}, dataUrl=${qrPublic.qrDataUrl.slice(0, 30)}...`);

    const qrCheckInRes = await fetch(`${BASE_URL}/api/workshops/${workshopId}/qr?type=checkin`);
    const qrCheckIn = await qrCheckInRes.json();
    console.log(`✓ QR Asistencia generado: target=${qrCheckIn.targetUrl}, dataUrl=${qrCheckIn.qrDataUrl.slice(0, 30)}...`);

    if (!qrPublic.qrDataUrl.startsWith('data:image/png;base64,') || !qrCheckIn.qrDataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('FALLO: Formato de QR Data URL inválido');
    }

    // 6. Pase de Asistencia Alumno 1 (Confirmado)
    console.log('\n--- 6. Pase de Asistencia Alumno 1 ---');
    const checkIn1Res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/check-in`, {
      method: 'POST',
      headers: {
        'Cookie': studentCookies[0],
        'Host': `${tenant.slug}.localhost:3001`,
      },
    });
    const checkIn1 = await checkIn1Res.json();
    console.log(`✓ Check-in Alumno 1: success=${checkIn1.success}, alreadyCheckedIn=${checkIn1.alreadyCheckedIn}, mensaje="${checkIn1.message}"`);
    if (!checkIn1.success || checkIn1.alreadyCheckedIn) {
      throw new Error('FALLO: El primer check-in debió ser exitoso');
    }

    // 7. Prueba Anti-Duplicidad: Alumno 1 escanea el QR nuevamente
    console.log('\n--- 7. Prueba Anti-Duplicidad Alumno 1 ---');
    const checkIn1DupRes = await fetch(`${BASE_URL}/api/workshops/${workshopId}/check-in`, {
      method: 'POST',
      headers: {
        'Cookie': studentCookies[0],
        'Host': `${tenant.slug}.localhost:3001`,
      },
    });
    const checkIn1Dup = await checkIn1DupRes.json();
    console.log(`✓ Anti-duplicidad Alumno 1: alreadyCheckedIn=${checkIn1Dup.alreadyCheckedIn}, mensaje="${checkIn1Dup.message}"`);
    if (!checkIn1Dup.alreadyCheckedIn) {
      throw new Error('FALLO: El check-in duplicado no fue detectado correctamente');
    }

    // 8. Alumno 3 (en lista de espera) intenta registrar asistencia
    console.log('\n--- 8. Intento de Check-in Alumno 3 (en lista de espera) ---');
    const checkIn3Res = await fetch(`${BASE_URL}/api/workshops/${workshopId}/check-in`, {
      method: 'POST',
      headers: {
        'Cookie': studentCookies[2],
        'Host': `${tenant.slug}.localhost:3001`,
      },
    });
    const checkIn3 = await checkIn3Res.json();
    console.log(`✓ Resultado Check-in en espera: success=${checkIn3.success}, code=${checkIn3.code}, mensaje="${checkIn3.message}"`);
    if (checkIn3.success || checkIn3.code !== 'WAITLIST') {
      throw new Error('FALLO: Alumno en lista de espera no debe poder registrar asistencia');
    }

    // 9. Cancelación de Alumno 2 y Promoción Automática en Cascada
    console.log('\n--- 9. Alumno 2 cancela -> Promoción automática de Alumno 3 ---');
    const cancelRes = await fetch(`${BASE_URL}/api/me/inscriptions/${student2InsId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': studentCookies[1],
        'Host': `${tenant.slug}.localhost:3001`,
      },
    });
    const cancelData = await cancelRes.json();
    console.log(`✓ Alumno 2 canceló inscripción:`, cancelData.message);

    // Verificar que Alumno 3 ahora es APPROVED
    const checkIns3Db = await prisma.inscription.findUnique({ where: { id: student3InsId } });
    console.log(`✓ Estatus en BD de Alumno 3 post-cancelación: ${checkIns3Db.status}`);
    if (checkIns3Db.status !== 'APPROVED') {
      throw new Error(`FALLO: Alumno 3 debió ser promovido a APPROVED, obtenido: ${checkIns3Db.status}`);
    }

    // 10. Ahora Alumno 3 sí puede registrar asistencia
    console.log('\n--- 10. Check-in de Alumno 3 promovido ---');
    const checkIn3PromotedRes = await fetch(`${BASE_URL}/api/workshops/${workshopId}/check-in`, {
      method: 'POST',
      headers: {
        'Cookie': studentCookies[2],
        'Host': `${tenant.slug}.localhost:3001`,
      },
    });
    const checkIn3Promoted = await checkIn3PromotedRes.json();
    console.log(`✓ Check-in Alumno 3 promovido: success=${checkIn3Promoted.success}`);
    if (!checkIn3Promoted.success) {
      throw new Error('FALLO: Alumno 3 promovido debió poder registrar asistencia');
    }

    // 11. Verificar Estadísticas en Vivo para Pantalla de Proyección
    console.log('\n--- 11. Verificando API de Proyección en Vivo ---');
    const attendanceApiRes = await fetch(`${BASE_URL}/api/admin/workshops/${workshopId}/attendance`, {
      headers: {
        'Cookie': adminCookie,
        'Host': `${tenant.slug}.localhost:3001`,
      },
    });
    const attendanceStats = await attendanceApiRes.json();
    console.log(`✓ Datos de proyección en vivo:`, {
      totalApproved: attendanceStats.stats.totalApproved,
      totalCheckedIn: attendanceStats.stats.totalCheckedIn,
      attendanceRate: `${attendanceStats.stats.attendanceRate}%`,
      totalWaitlist: attendanceStats.stats.totalWaitlist,
    });

    if (attendanceStats.stats.totalCheckedIn !== 2 || attendanceStats.stats.totalApproved !== 2) {
      throw new Error('FALLO: Las estadísticas de asistencia en vivo no coinciden');
    }

    console.log('\n🎉 ¡TODAS LAS PRUEBAS EN EL SERVIDOR EN VIVO PASARON CON ÉXITO AL 100%!');
  } finally {
    console.log('\n🧹 Limpiando datos de prueba...');
    if (workshopId) {
      await prisma.inscription.deleteMany({ where: { workshopId } });
      await prisma.workshop.delete({ where: { id: workshopId } }).catch(() => {});
    }
    for (const s of students) {
      await prisma.user.delete({ where: { id: s.id } }).catch(() => {});
    }
    await prisma.user.delete({ where: { id: admin.id } }).catch(() => {});
    console.log('✓ Limpieza completada.');
  }
}

run()
  .catch((e) => {
    console.error('❌ Error fatal en pruebas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

