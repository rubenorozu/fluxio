import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Get platform tenant config
        const config = await prisma.tenantConfig.findFirst({
            where: {
                tenant: {
                    slug: 'platform'
                }
            },
            select: {
                landingHeroImage: true,
                landingHeroImageA: true,
                landingHeroImageB: true,
                landingHeroImageC: true,
                landingScreenshot1: true,
                landingScreenshot2: true,
                landingScreenshot3: true,
                landingScreenshot4: true,
            },
        });

        if (!config) {
            return NextResponse.json({
                landingHeroImage: '',
                landingHeroImageA: '',
                landingHeroImageB: '',
                landingHeroImageC: '',
                landingScreenshot1: '',
                landingScreenshot2: '',
                landingScreenshot3: '',
                landingScreenshot4: '',
            }, {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                }
            });
        }

        return NextResponse.json({
            landingHeroImage: config.landingHeroImage || '',
            landingHeroImageA: config.landingHeroImageA || '',
            landingHeroImageB: config.landingHeroImageB || '',
            landingHeroImageC: config.landingHeroImageC || '',
            landingScreenshot1: config.landingScreenshot1 || '',
            landingScreenshot2: config.landingScreenshot2 || '',
            landingScreenshot3: config.landingScreenshot3 || '',
            landingScreenshot4: config.landingScreenshot4 || '',
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {
        console.error('Error fetching landing images:', error);
        return NextResponse.json({
            landingHeroImage: '',
            landingHeroImageA: '',
            landingHeroImageB: '',
            landingHeroImageC: '',
            landingScreenshot1: '',
            landingScreenshot2: '',
            landingScreenshot3: '',
            landingScreenshot4: '',
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            }
        });
    }
}
