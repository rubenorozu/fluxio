import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import { DEFAULT_TENANT_CONFIG } from '@/lib/default-tenant-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession();

        if (!session || session.user.role !== Role.SUPERUSER) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                plan: true,
                maxUsers: true,
                maxResources: true,
                maxStorage: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true,
                        spaces: true,
                        equipment: true,
                    }
                }
            }
        });

        return NextResponse.json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();

        if (!session || session.user.role !== Role.SUPERUSER) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, slug } = body;

        if (!name || !slug) {
            return NextResponse.json({ message: 'Name and Slug are required' }, { status: 400 });
        }

        // Check if slug exists
        const existingTenant = await prisma.tenant.findUnique({
            where: { slug },
        });

        if (existingTenant) {
            return NextResponse.json({ message: 'Slug already exists' }, { status: 409 });
        }

        const newTenant = await prisma.tenant.create({
            data: {
                name,
                slug,
                isActive: true,
                config: {
                    create: {
                        ...DEFAULT_TENANT_CONFIG,
                        siteName: name,
                    }
                }
            },
        });

        return NextResponse.json(newTenant, { status: 201 });
    } catch (error) {
        console.error('Error creating tenant:', error);
        return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }
}
