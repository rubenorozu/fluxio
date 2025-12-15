/**
 * Utilidad para comprimir y redimensionar imágenes antes de subirlas
 * Esto permite subir imágenes grandes sin exceder el límite de Vercel (4.5MB)
 */

interface CompressImageOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
}

/**
 * Comprime una imagen manteniendo la relación de aspecto
 * @param file - Archivo de imagen original
 * @param options - Opciones de compresión
 * @returns Promise con el archivo comprimido
 */
export async function compressImage(
    file: File,
    options: CompressImageOptions = {}
): Promise<File> {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        maxSizeMB = 4,
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calcular nuevas dimensiones manteniendo aspect ratio
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Crear canvas para redimensionar
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo crear el contexto del canvas'));
                    return;
                }

                // Dibujar imagen redimensionada
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a blob con compresión
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Error al comprimir la imagen'));
                            return;
                        }

                        // Verificar tamaño
                        const sizeMB = blob.size / (1024 * 1024);

                        if (sizeMB > maxSizeMB) {
                            // Si aún es muy grande, reducir calidad recursivamente
                            const newQuality = quality * 0.8;
                            if (newQuality < 0.1) {
                                reject(new Error('No se pudo comprimir la imagen lo suficiente'));
                                return;
                            }

                            // Intentar de nuevo con menor calidad
                            compressImage(file, { ...options, quality: newQuality })
                                .then(resolve)
                                .catch(reject);
                            return;
                        }

                        // Crear nuevo archivo con el blob comprimido
                        const compressedFile = new File(
                            [blob],
                            file.name,
                            {
                                type: file.type,
                                lastModified: Date.now(),
                            }
                        );

                        console.log(`[Compress] Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

                        resolve(compressedFile);
                    },
                    file.type,
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Error al cargar la imagen'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Comprime múltiples imágenes
 * @param files - Array de archivos de imagen
 * @param options - Opciones de compresión
 * @returns Promise con array de archivos comprimidos
 */
export async function compressImages(
    files: File[],
    options: CompressImageOptions = {}
): Promise<File[]> {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));

    const compressedImages = await Promise.all(
        imageFiles.map(file => compressImage(file, options))
    );

    return [...compressedImages, ...nonImageFiles];
}

/**
 * Valida si un archivo es una imagen
 * @param file - Archivo a validar
 * @returns true si es una imagen
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/**
 * Obtiene el tamaño de un archivo en MB
 * @param file - Archivo
 * @returns Tamaño en MB
 */
export function getFileSizeMB(file: File): number {
    return file.size / (1024 * 1024);
}
