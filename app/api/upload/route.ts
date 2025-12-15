import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

interface UserPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export async function POST(request: Request): Promise<NextResponse> {
  console.log('[UPLOAD] Inicio de petición de subida');
  console.log('[UPLOAD] BLOB_READ_WRITE_TOKEN exists:', !!process.env.BLOB_READ_WRITE_TOKEN);

  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('session');
  if (!tokenCookie) {
    console.log('[UPLOAD] Error: No hay cookie de sesión');
    return NextResponse.json({ error: 'Acceso denegado. Se requiere autenticación.' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify<UserPayload>(tokenCookie.value, secret);
    console.log('[UPLOAD] Autenticación exitosa');
  } catch (err) {
    console.log('[UPLOAD] Error de autenticación:', err);
    return NextResponse.json({ error: 'La sesión no es válida.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    console.log('[UPLOAD] Archivos recibidos:', files.length);

    if (!files || files.length === 0) {
      console.log('[UPLOAD] Error: No hay archivos');
      return NextResponse.json({ error: 'No se han subido archivos.' }, { status: 400 });
    }

    // SECURITY FIX: Validar tipos de archivo permitidos
    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const ALLOWED_EXTENSIONS = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx'
    ];

    // Validar que los archivos sean válidos
    for (const file of files) {
      console.log('[UPLOAD] Validando archivo:', file.name, 'tipo:', file.type, 'tamaño:', file.size);

      if (!file.name || file.size === 0) {
        console.log('[UPLOAD] Error: Archivo inválido o vacío');
        return NextResponse.json({ error: 'Archivo inválido o vacío.' }, { status: 400 });
      }

      // Validar tipo MIME
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        console.log('[UPLOAD] Error: Tipo MIME no permitido:', file.type);
        return NextResponse.json({
          error: `Tipo de archivo no permitido: ${file.type}. Solo se permiten imágenes, PDFs y documentos de Office.`
        }, { status: 400 });
      }

      // Validar extensión
      const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        console.log('[UPLOAD] Error: Extensión no permitida:', extension);
        return NextResponse.json({
          error: `Extensión de archivo no permitida: ${extension}. Solo se permiten: ${ALLOWED_EXTENSIONS.join(', ')}`
        }, { status: 400 });
      }

      // Límite de 10MB por archivo
      if (file.size > 10 * 1024 * 1024) {
        console.log('[UPLOAD] Error: Archivo muy grande:', file.size);
        return NextResponse.json({ error: `El archivo ${file.name} excede el límite de 10MB.` }, { status: 400 });
      }
    }

    // Verificar que el token de Vercel Blob esté configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[UPLOAD] CRÍTICO: BLOB_READ_WRITE_TOKEN no está configurado en las variables de entorno');
      return NextResponse.json({
        error: 'El servicio de almacenamiento de archivos no está configurado correctamente. Por favor contacta al administrador del sistema.'
      }, { status: 500 });
    }

    console.log('[UPLOAD] Iniciando subida a Vercel Blob...');
    const blobs = await Promise.all(
      files.map(async (file) => {
        const uniqueFilename = `${Date.now()}-${file.name}`;
        console.log('[UPLOAD] Subiendo archivo:', uniqueFilename);
        const blob = await put(uniqueFilename, file, {
          access: 'public',
        });
        console.log('[UPLOAD] Archivo subido exitosamente:', blob.url);
        return blob;
      })
    );

    console.log('[UPLOAD] Subida completada exitosamente');
    return NextResponse.json({ urls: blobs.map(b => b.url) }, { status: 200 });

  } catch (error) {
    console.error('[UPLOAD] Error al subir archivos a Vercel Blob:', error);
    if (error instanceof Error) {
      console.error('[UPLOAD] Error message:', error.message);
      console.error('[UPLOAD] Error stack:', error.stack);
      return NextResponse.json({ error: `Error al subir: ${error.message}` }, { status: 500 });
    }
    console.error('[UPLOAD] Error desconocido:', error);
    return NextResponse.json({ error: 'Error desconocido al procesar la subida de archivos.' }, { status: 500 });
  }
}
