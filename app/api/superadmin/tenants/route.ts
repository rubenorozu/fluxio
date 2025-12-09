import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    const session = await getServerSession();

    if (!session || session.user.role !== Role.SUPERUSER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true },
                },
                config: {
                    select: {
                        siteName: true,
                        topLogoUrl: true
                    }
                }
            },
        });

        return NextResponse.json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession();

    if (!session || session.user.role !== Role.SUPERUSER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { name, slug, isActive, adminName, adminEmail, adminPassword } = await req.json();

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
        }

        const existingTenant = await prisma.tenant.findUnique({
            where: { slug },
        });

        if (existingTenant) {
            return NextResponse.json({ error: 'Tenant with this slug already exists' }, { status: 409 });
        }

        // Prepare user data if provided
        let userData = undefined;
        if (adminEmail && adminPassword && adminName) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            userData = {
                create: {
                    email: adminEmail,
                    password: hashedPassword,
                    firstName: adminName.split(' ')[0],
                    lastName: adminName.split(' ').slice(1).join(' ') || 'Admin',
                    role: Role.SUPERUSER, // Tenant Superuser
                    identifier: adminEmail.split('@')[0], // Simple identifier
                    displayId: `USR_${adminEmail.split('@')[0]}`, // Enforce naming convention
                    isVerified: true
                }
            };
        }

        const tenant = await prisma.tenant.create({
            data: {
                name,
                slug,
                isActive: isActive ?? true,
                config: {
                    create: {
                        siteName: name, // Default site name
                        topLogoUrl: '/assets/FluxioRSV.svg',
                        bottomLogoUrl: '/assets/FluxioRSV_TX.svg',
                        faviconUrl: '/assets/defaults/favicon.svg',
                        topLogoHeight: 50
                    }
                },
                users: userData // Create the admin user linked to this tenant
            },
        });

        return NextResponse.json(tenant, { status: 201 });
    } catch (error) {
        console.error('Error creating tenant:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
