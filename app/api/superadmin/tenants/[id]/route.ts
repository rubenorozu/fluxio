import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';

interface Params {
    params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
    const session = await getServerSession();

    if (!session || session.user.role !== Role.SUPERUSER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id } = params;

        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                config: true
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        console.error('Error fetching tenant:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: Params) {
    const session = await getServerSession();

    if (!session || session.user.role !== Role.SUPERUSER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id } = params;
        const { name, slug, isActive, siteName, topLogoUrl, faviconUrl } = await req.json();

        const tenant = await prisma.tenant.update({
            where: { id },
            data: {
                name,
                slug,
                isActive,
                config: {
                    upsert: {
                        create: {
                            siteName,
                            topLogoUrl,
                            faviconUrl
                        },
                        update: {
                            siteName,
                            topLogoUrl,
                            faviconUrl
                        }
                    }
                }
            },
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error('Error updating tenant:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: Params) {
    const session = await getServerSession();

    if (!session || session.user.role !== Role.SUPERUSER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id } = params;

        // Check if tenant has users or resources before deleting?
        // For now, we might want to prevent deletion if it has data, or cascade delete.
        // Prisma schema might handle cascade, but let's be safe.

        await prisma.tenant.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
