#!/usr/bin/env ts-node
/**
 * Script para verificar credenciales de usuario
 * Uso: npx ts-node scripts/check-user-credentials.ts <email> <password> <tenantId>
 */

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function checkCredentials() {
    const email = process.argv[2];
    const password = process.argv[3];
    const tenantId = process.argv[4];

    if (!email || !password || !tenantId) {
        console.error('Uso: npx ts-node scripts/check-user-credentials.ts <email> <password> <tenantId>');
        process.exit(1);
    }

    console.log('\n🔍 Verificando credenciales...\n');
    console.log('Email:', email);
    console.log('TenantId:', tenantId);

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Email normalizado:', normalizedEmail);

    // Buscar usuario
    const user = await prisma.user.findFirst({
        where: {
            email: normalizedEmail,
            tenantId
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            tenantId: true,
            password: true,
            isVerified: true,
        }
    });

    if (!user) {
        console.log('\n❌ Usuario NO encontrado');
        console.log('\nBuscando con email original (sin normalizar)...');

        const userOriginal = await prisma.user.findFirst({
            where: {
                email: email,
                tenantId
            }
        });

        if (userOriginal) {
            console.log('✅ Usuario encontrado con email original:', userOriginal.email);
            console.log('⚠️  PROBLEMA: El email en la DB no está normalizado');
        } else {
            console.log('❌ Usuario no encontrado ni con email original');
        }

        process.exit(1);
    }

    console.log('\n✅ Usuario encontrado:');
    console.log('  ID:', user.id);
    console.log('  Nombre:', user.firstName, user.lastName);
    console.log('  Email en DB:', user.email);
    console.log('  Rol:', user.role);
    console.log('  Verificado:', user.isVerified);
    console.log('  Hash de contraseña:', user.password.substring(0, 20) + '...');

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password);

    console.log('\n🔐 Verificación de contraseña:');
    if (isValid) {
        console.log('✅ Contraseña CORRECTA');
    } else {
        console.log('❌ Contraseña INCORRECTA');

        // Probar si la contraseña está sin hashear
        if (password === user.password) {
            console.log('⚠️  PROBLEMA: La contraseña en la DB NO está hasheada');
        }
    }

    await prisma.$disconnect();
}

checkCredentials().catch(console.error);
