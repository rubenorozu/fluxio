import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';

interface Params {
    params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
    const session = await getServerSession();

    if (!session || session.user.role !== Role.SUPERUSER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id } = params;
        const { plan, maxUsers, maxResources, maxStorage, trialDays } = await req.json();

        // Calculate trial expiration date if plan is TRIAL
        let trialExpiresAt = null;
        if (plan === 'TRIAL' && trialDays) {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + trialDays);
            trialExpiresAt = expirationDate;
        }

        const tenant = await prisma.tenant.update({
            where: { id },
            data: {
                plan,
                maxUsers,
                maxResources,
                maxStorage,
                trialDays: plan === 'TRIAL' ? trialDays : null,
                trialExpiresAt: plan === 'TRIAL' ? trialExpiresAt : null,
            },
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error('Error updating tenant plan:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
