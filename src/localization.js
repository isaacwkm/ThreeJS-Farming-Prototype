// Create a function for localization
export function localize(key, language, translations) {
    if (translations[key] && translations[key][language]) { // if the translation exists
        return translations[key][language]; // Language-specific translation
    }
    // Fallback to English or display a placeholder
    if (!translations[key]) return `[Missing Translation key: ${key}]`;
    if (!translations[key][language]) return `[Has key but Missing language: ${language} key: ${key}]`;
    return `[Missing Translation: ${key}]`;
}

