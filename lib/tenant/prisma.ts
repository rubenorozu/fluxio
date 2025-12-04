import { PrismaClient } from '@prisma/client';
import { prisma as basePrisma } from '@/lib/prisma';

// Force reload for schema update (PDF logos)

/**
 * Wrapper de Prisma que automáticamente filtra por tenantId
 * Uso: const prisma = getTenantPrisma(tenantId);
 */
export function getTenantPrisma(tenantId: string) {
    return {
        // User - auto-filtrado por tenant
        user: {
            findMany: (args?: any) =>
                basePrisma.user.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findUnique: (args: any) =>
                basePrisma.user.findUnique({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            findFirst: (args?: any) =>
                basePrisma.user.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: any) =>
                basePrisma.user.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            update: (args: any) =>
                basePrisma.user.update({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            delete: (args: any) =>
                basePrisma.user.delete({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            count: (args?: any) =>
                basePrisma.user.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            upsert: (args: any) =>
                basePrisma.user.upsert({
                    ...args,
                    where: { ...args.where, tenantId },
                    create: { ...args.create, tenantId },
                }),
        },

        // Space - auto-filtrado por tenant
        space: {
            findMany: (args?: any) =>
                basePrisma.space.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findUnique: (args: any) =>
                basePrisma.space.findUnique({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            findFirst: (args?: any) =>
                basePrisma.space.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: any) =>
                basePrisma.space.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            update: (args: any) =>
                basePrisma.space.update({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            delete: (args: any) =>
                basePrisma.space.delete({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            count: (args?: any) =>
                basePrisma.space.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },

        // Equipment - auto-filtrado por tenant
        equipment: {
            findMany: (args?: any) =>
                basePrisma.equipment.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findUnique: (args: any) =>
                basePrisma.equipment.findUnique({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            findFirst: (args?: any) =>
                basePrisma.equipment.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: any) =>
                basePrisma.equipment.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            update: (args: any) =>
                basePrisma.equipment.update({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            delete: (args: any) =>
                basePrisma.equipment.delete({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            count: (args?: any) =>
                basePrisma.equipment.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },

        // Workshop - auto-filtrado por tenant
        workshop: {
            findMany: (args?: any) =>
                basePrisma.workshop.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findUnique: (args: any) =>
                basePrisma.workshop.findUnique({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            findFirst: (args?: any) =>
                basePrisma.workshop.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: any) =>
                basePrisma.workshop.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            update: (args: any) =>
                basePrisma.workshop.update({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            delete: (args: any) =>
                basePrisma.workshop.delete({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            count: (args?: any) =>
                basePrisma.workshop.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },

        // Reservation - auto-filtrado por tenant
        reservation: {
            findMany: (args?: any) =>
                basePrisma.reservation.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findUnique: (args: any) =>
                basePrisma.reservation.findUnique({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            findFirst: (args?: any) =>
                basePrisma.reservation.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: any) =>
                basePrisma.reservation.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            update: (args: any) =>
                basePrisma.reservation.update({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            delete: (args: any) =>
                basePrisma.reservation.delete({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            count: (args?: any) =>
                basePrisma.reservation.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },

        // Project - auto-filtrado por tenant
        project: {
            findMany: (args?: any) =>
                basePrisma.project.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findUnique: (args: any) =>
                basePrisma.project.findUnique({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            findFirst: (args?: any) =>
                basePrisma.project.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: any) =>
                basePrisma.project.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            update: (args: any) =>
                basePrisma.project.update({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            delete: (args: any) =>
                basePrisma.project.delete({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            count: (args?: any) =>
                basePrisma.project.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },

        // Report - auto-filtrado por tenant
        report: {
            findMany: (args?: any) =>
                basePrisma.report.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findUnique: (args: any) =>
                basePrisma.report.findUnique({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            findFirst: (args?: any) =>
                basePrisma.report.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: any) =>
                basePrisma.report.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            update: (args: any) =>
                basePrisma.report.update({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            delete: (args: any) =>
                basePrisma.report.delete({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            count: (args?: any) =>
                basePrisma.report.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },

        // RecurringBlock - auto-filtrado por tenant
        recurringBlock: {
            findMany: (args?: any) =>
                basePrisma.recurringBlock.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findUnique: (args: any) =>
                basePrisma.recurringBlock.findUnique({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            findFirst: (args?: any) =>
                basePrisma.recurringBlock.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: any) =>
                basePrisma.recurringBlock.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            update: (args: any) =>
                basePrisma.recurringBlock.update({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            delete: (args: any) =>
                basePrisma.recurringBlock.delete({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            count: (args?: any) =>
                basePrisma.recurringBlock.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },

        // Inscription - auto-filtrado por tenant
        inscription: {
            findMany: (args?: any) =>
                basePrisma.inscription.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findUnique: (args: any) =>
                basePrisma.inscription.findUnique({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            findFirst: (args?: any) =>
                basePrisma.inscription.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: any) =>
                basePrisma.inscription.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            update: (args: any) =>
                basePrisma.inscription.update({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            delete: (args: any) =>
                basePrisma.inscription.delete({
                    ...args,
                    where: { ...args.where, tenantId },
                }),
            count: (args?: any) =>
                basePrisma.inscription.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },

        // Modelos sin filtro de tenant
        document: basePrisma.document,
        notification: basePrisma.notification,
        comment: basePrisma.comment,
        image: basePrisma.image,
        workshopSession: basePrisma.workshopSession,
        reservationCounter: basePrisma.reservationCounter,
        reportCounter: basePrisma.reportCounter,
        systemSettings: basePrisma.systemSettings,
        requirement: basePrisma.requirement,
        recurringBlockOnEquipment: basePrisma.recurringBlockOnEquipment,
        recurringBlockException: basePrisma.recurringBlockException,

        // Acceso directo al tenant
        tenant: basePrisma.tenant,
        tenantConfig: basePrisma.tenantConfig,
    };
}

/**
 * Tipo del wrapper de Prisma con tenant
 */
export type TenantPrisma = ReturnType<typeof getTenantPrisma>;
