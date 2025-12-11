/**
 * Detecta el país del usuario usando IP geolocation
 * Retorna 'MX' para México, 'US' u otro código de país para otros
 */
export async function detectUserCountry(): Promise<string> {
    try {
        // Usar ipapi.co (gratuito, 1000 requests/día)
        const response = await fetch('https://ipapi.co/json/');

        if (!response.ok) {
            console.warn('[GeoLocation] API error, defaulting to US');
            return 'US';
        }

        const data = await response.json();
        return data.country_code || 'US';
    } catch (error) {
        console.error('[GeoLocation] Error detecting country:', error);
        return 'US'; // Default a USD si falla
    }
}

/**
 * Obtiene la configuración de moneda basada en el país
 */
export function getCurrencyConfig(countryCode: string) {
    const configs = {
        MX: {
            currency: 'MXN',
            symbol: '$',
            exchangeRate: 18, // 1 USD = 18 MXN (aproximado)
            locale: 'es-MX'
        },
        US: {
            currency: 'USD',
            symbol: '$',
            exchangeRate: 1,
            locale: 'en-US'
        },
        // Agregar más países si es necesario
    };

    return configs[countryCode as keyof typeof configs] || configs.US;
}

/**
 * Convierte precio de USD a la moneda local
 */
export function convertPrice(usdPrice: number, countryCode: string): number {
    const config = getCurrencyConfig(countryCode);
    return Math.round(usdPrice * config.exchangeRate);
}

/**
 * Formatea precio con símbolo de moneda
 */
export function formatPrice(price: number, countryCode: string): string {
    const config = getCurrencyConfig(countryCode);
    return `${config.symbol}${price} ${config.currency}`;
}
