/**
 * Normalizes text by removing accents and converting to lowercase
 * Example: "José García" -> "jose garcia"
 */
export function normalizeText(text: string | null | undefined): string {
    if (!text) return '';
    return String(text)
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
export function matchesSearch(text: string | null | undefined, searchTerm: string | null | undefined): boolean {
    if (!searchTerm) return true;
    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchTerm);
    return normalizedText.includes(normalizedSearch);
}

/**
 * Checks if a searchable text matches all tokens in search query (accent-insensitive, order-independent)
 * Example: "Aerógrafo patche doble accion" matches "aerografo" or "patche aerografo"
 */
export function matchesSearchTokens(searchableText: string | null | undefined, searchTerm: string | null | undefined): boolean {
    if (!searchTerm) return true;
    const normalizedSearch = normalizeText(searchTerm);
    if (!normalizedSearch) return true;

    const normalizedTarget = normalizeText(searchableText);
    const tokens = normalizedSearch.split(/\s+/).filter(Boolean);
    return tokens.every(token => normalizedTarget.includes(token));
}
