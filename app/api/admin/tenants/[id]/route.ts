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

        // Optional: Check if tenant has critical data before deleting?
        // For now, we assume cascade delete or manual cleanup is handled by Prisma schema if configured,
        // or we just delete the tenant record.

        await prisma.tenant.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Error deleting tenant:', error);
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
