import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';

export async function POST(request: Request): Promise<NextResponse> {
    const session = await getServerSession();

    if (!session || session.user.role !== 'SUPERUSER') {
        return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const tenant = await detectTenant();
    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const fileType = formData.get('type') as string; // 'regulations' or 'attachmentForm'

        if (!file) {
            return NextResponse.json({ error: 'No se ha subido archivo.' }, { status: 400 });
        }

        if (!fileType || !['regulations', 'attachmentForm'].includes(fileType)) {
            return NextResponse.json({ error: 'Tipo de archivo inválido.' }, { status: 400 });
        }

        // Validate PDF
        if (!file.type.includes('pdf')) {
            return NextResponse.json({ error: 'Solo se permiten archivos PDF.' }, { status: 400 });
        }

        // Generate clean filename based on tenant slug and type
        const filename = fileType === 'regulations'
            ? `${tenant.slug}-reglamento.pdf`
            : `${tenant.slug}-formato-adjunto.pdf`;

        // Upload to Vercel Blob (will overwrite if exists)
        const blob = await put(filename, file, {
            access: 'public',
        });

        return NextResponse.json({ url: blob.url }, { status: 200 });

    } catch (error) {
        console.error('Error al subir archivo de configuración:', error);
        return NextResponse.json({ error: 'Error al procesar la subida del archivo.' }, { status: 500 });
    }
}
