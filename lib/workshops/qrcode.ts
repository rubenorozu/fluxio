import QRCode from 'qrcode';

/**
 * Genera un código QR como Data URL (base64 image/png)
 */
export async function generateQrDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: options?.width || 350,
    color: {
      dark: '#1F2937', // Color oscuro profesional
      light: '#FFFFFF',
    },
    ...options,
  };

  return await QRCode.toDataURL(text, defaultOptions);
}

/**
 * Obtiene la URL pública del taller para difusión
 */
export function getWorkshopPublicUrl(workshopId: string, baseUrl?: string): string {
  const host = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  return `${host}/recursos/${workshopId}`;
}

/**
 * Obtiene la URL para registrar asistencia
 */
export function getWorkshopCheckInUrl(workshopId: string, baseUrl?: string): string {
  const host = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  return `${host}/workshops/${workshopId}/check-in`;
}

