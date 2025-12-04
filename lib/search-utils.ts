/**
 * Normalizes text by removing accents and converting to lowercase
 * Example: "José García" -> "jose garcia"
 */
export function normalizeText(text: string): string {
    return text
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .toLowerCase()
        .trim();
}

/**
 * Creates search variants for a search term
 * Returns both the original term and normalized version
 */
export function createSearchVariants(searchTerm: string): string[] {
    const normalized = normalizeText(searchTerm);
    const variants = [searchTerm, normalized];

    // Remove duplicates
    return Array.from(new Set(variants));
}

/**
 * Checks if a text matches a search term (accent-insensitive)
 */
export function matchesSearch(text: string, searchTerm: string): boolean {
    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchTerm);
    return normalizedText.includes(normalizedSearch);
}
