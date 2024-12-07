// Create a function for localization
export function localize(key, language, translations) {
    if (translations[language] && translations[key][language]) { // if the translation exists
        return translations[key][language]; // Language-specific translation
    }
    // Fallback to English or display a placeholder
    if (!translations[key]) return `[Missing Translation: ${key}]`;
    return translations[key].eng;
}

