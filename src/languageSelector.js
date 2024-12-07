// Define the available languages and their names
export const languages = {
    eng: "English",
    chi: "中文",
    arab: "العربية",
  };
  
  // Default language if nothing is saved
  const DEFAULT_LANGUAGE = "en";
  
  /**
   * Fetches the saved language from `localStorage`.
   * @returns {string} The saved language code; defaults to 'en' if none is saved.
   */
  export function getSavedLanguage() {
    return localStorage.getItem("lang") || DEFAULT_LANGUAGE;
  }
  
  /**
   * Saves the selected language to `localStorage`.
   * @param {string} lang The language code to save (e.g., 'en', 'es').
   */
  export function saveLanguage(lang) {
    localStorage.setItem("lang", lang);
  }
  
  /**
   * Initializes the language dropdown.
   * Creates a button and a dropdown menu inside the provided container.
   * @param {HTMLElement} container The container element where the dropdown will be rendered.
   */
  export function initLanguageSelector(container) {
    if (!container) {
      console.error("Language dropdown container is not defined!");
      return;
    }
  
    // Create the dropdown button
    const button = document.createElement("button");
    button.id = "languageButton";
    button.className = "language-button";
    button.textContent = `🌐A文: ${languages[getSavedLanguage()]}`; // Set initial text
  
    // Create the dropdown menu
    const menu = document.createElement("div");
    menu.id = "languageMenu";
    menu.className = "language-menu";
  
    // Populate the dropdown menu with language options
    Object.entries(languages).forEach(([code, name]) => {
      const option = document.createElement("button");
      option.textContent = name;
      option.className = "language-option"; // Add a class for individual buttons
      option.onclick = () => handleLanguageChange(code, button, container);
      menu.appendChild(option);
    });
  
    // Toggle the menu visibility on button click
    button.onclick = () => {
      container.classList.toggle("open"); // Add/remove the "open" class
    };
  
    // Append the button and menu to the container
    container.appendChild(button);
    container.appendChild(menu);
  
    // Close the menu if user clicks elsewhere on the page
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".language-dropdown")) {
        container.classList.remove("open");
      }
    });
  }
  
  /**
   * Handles the language change:
   * 1. Saves the new language.
   * 2. Updates the button text.
   * 3. Reloads the page.
   * @param {string} newLang The selected language code (e.g., 'en', 'es').
   * @param {HTMLElement} button The dropdown button to update its text.
   */
  function handleLanguageChange(newLang, button, container) {
    saveLanguage(newLang); // Save the selected language
    button.textContent = `🌐A文: ${languages[newLang]}`; // Update dropdown button text
    container.classList.remove("open"); // Close the dropdown menu
    window.location.reload(); // Reload the page to apply the selected language
  }

  // Create a function for localization
export function localize(key, language, translations) {
  if (translations[key] && translations[key][language]) { // if the translation exists
      return translations[key][language]; // Language-specific translation
  }
  // Fallback to English or display a placeholder
  if (!translations[key]) return `[Missing Translation: ${key}]`;
  return translations[key].eng;
}