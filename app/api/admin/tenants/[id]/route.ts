import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession();

        if (!session || session.user.role !== Role.SUPERUSER) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        // Delete all related data in the correct order (respecting foreign key constraints)
        // This is necessary because the schema doesn't have onDelete: Cascade configured

        console.log(`Starting deletion of tenant ${id} and all related data...`);

        // 1. Delete inscriptions (depends on workshops and users)
        await prisma.inscription.deleteMany({ where: { tenantId: id } });

        // 2. Delete documents (depends on reservations)
        const reservations = await prisma.reservation.findMany({
            where: { tenantId: id },
            select: { id: true }
        });
        for (const reservation of reservations) {
            await prisma.document.deleteMany({ where: { reservationId: reservation.id } });
        }

        // 3. Delete notifications (depends on reservations and users)
        await prisma.notification.deleteMany({
            where: {
                OR: [
                    { reservation: { tenantId: id } },
                    { recipient: { tenantId: id } }
                ]
            }
        });

        // 4. Delete reservations
        await prisma.reservation.deleteMany({ where: { tenantId: id } });

        // 5. Delete recurring block exceptions
        const recurringBlocks = await prisma.recurringBlock.findMany({
            where: { tenantId: id },
            select: { id: true }
        });
        for (const block of recurringBlocks) {
            await prisma.recurringBlockException.deleteMany({ where: { recurringBlockId: block.id } });
        }

        // 6. Delete recurring block equipment relations
        await prisma.recurringBlockOnEquipment.deleteMany({
            where: { recurringBlock: { tenantId: id } }
        });

        // 7. Delete recurring blocks
        await prisma.recurringBlock.deleteMany({ where: { tenantId: id } });

        // 8. Delete comments (depends on reports)
        const reports = await prisma.report.findMany({
            where: { tenantId: id },
            select: { id: true }
        });
        for (const report of reports) {
            await prisma.comment.deleteMany({ where: { reportId: report.id } });
        }

        // 9. Delete reports
        await prisma.report.deleteMany({ where: { tenantId: id } });

        // 10. Delete workshop sessions
        const workshops = await prisma.workshop.findMany({
            where: { tenantId: id },
            select: { id: true }
        });
        for (const workshop of workshops) {
            await prisma.workshopSession.deleteMany({ where: { workshopId: workshop.id } });
        }

        // 11. Delete workshop images
        for (const workshop of workshops) {
            await prisma.image.deleteMany({ where: { workshopId: workshop.id } });
        }

        // 12. Delete workshops
        await prisma.workshop.deleteMany({ where: { tenantId: id } });

        // 13. Delete equipment images
        const equipment = await prisma.equipment.findMany({
            where: { tenantId: id },
            select: { id: true }
        });
        for (const eq of equipment) {
            await prisma.image.deleteMany({ where: { equipmentId: eq.id } });
        }

        // 14. Delete equipment
        await prisma.equipment.deleteMany({ where: { tenantId: id } });

        // 15. Delete space images
        const spaces = await prisma.space.findMany({
            where: { tenantId: id },
            select: { id: true }
        });
        for (const space of spaces) {
            await prisma.image.deleteMany({ where: { spaceId: space.id } });
        }

        // 16. Delete spaces
        await prisma.space.deleteMany({ where: { tenantId: id } });

        // 17. Delete projects
        await prisma.project.deleteMany({ where: { tenantId: id } });

        // 18. Delete counters
        await prisma.reservationCounter.deleteMany({ where: { tenantId: id } });
        await prisma.reportCounter.deleteMany({ where: { tenantId: id } });

        // 19. Delete users
        await prisma.user.deleteMany({ where: { tenantId: id } });

        // 20. Delete tenant config
        await prisma.tenantConfig.deleteMany({ where: { tenantId: id } });

        // 21. Finally, delete the tenant itself
        await prisma.tenant.delete({
            where: { id },
        });

        console.log(`Successfully deleted tenant ${id} and all related data`);

        return NextResponse.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        if (error instanceof Error) {
            return NextResponse.json({
                message: 'Error al eliminar la organización',
                error: error.message
            }, { status: 500 });
        }
        return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession();

        if (!session || session.user.role !== Role.SUPERUSER) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { isActive, plan, maxUsers, maxResources, maxStorage } = body;

        // Build update data object
        const updateData: any = {};

        if (typeof isActive === 'boolean') {
            updateData.isActive = isActive;
        }

        if (plan) {
            updateData.plan = plan;
        }

        if (typeof maxUsers === 'number') {
            updateData.maxUsers = maxUsers;
        }

        if (typeof maxResources === 'number') {
            updateData.maxResources = maxResources;
        }

        if (typeof maxStorage === 'number') {
            updateData.maxStorage = maxStorage;
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedTenant);
    } catch (error) {
        console.error('Error updating tenant:', error);
        return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }
}
