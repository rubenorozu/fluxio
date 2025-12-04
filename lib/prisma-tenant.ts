import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export function getTenantPrisma(tenantId: string) {
    return {
        space: {
            findMany: (args?: Prisma.SpaceFindManyArgs) =>
                prisma.space.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: Prisma.SpaceCreateArgs) =>
                prisma.space.create({
                    ...args,
                    data: { ...args.data, tenantId } as any,
                }),
            count: (args?: Prisma.SpaceCountArgs) =>
                prisma.space.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findFirst: (args?: Prisma.SpaceFindFirstArgs) =>
                prisma.space.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },
        equipment: {
            findMany: (args?: Prisma.EquipmentFindManyArgs) =>
                prisma.equipment.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            create: (args: Prisma.EquipmentCreateArgs) =>
                prisma.equipment.create({
                    ...args,
                    data: { ...args.data, tenantId },
                }),
            count: (args?: Prisma.EquipmentCountArgs) =>
                prisma.equipment.count({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
            findFirst: (args?: Prisma.EquipmentFindFirstArgs) =>
                prisma.equipment.findFirst({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        },
    };
}
