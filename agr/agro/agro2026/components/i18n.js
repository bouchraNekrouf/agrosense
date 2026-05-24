/**
 * Agrosence i18n Engine — Standalone
 * ====================================
 * Loaded dynamically by navbar.js (after translations.js).
 * Can also be loaded directly in any page.
 *
 * Strategy:
 *  - French (fr) = original language → key IS the French text → show as-is
 *  - English / Arabic → look up in translations[lang]
 *  - Default language on first visit: English ('en')
 *  - RTL applied for Arabic
 *  - Exposes window.AgroI18n and window.setLanguage
 */
(function () {
    'use strict';

    var DEFAULT_LANG = 'en';

    function getSaved() {
        return localStorage.getItem('site_lang');
    }

    function getCurrent() {
        return getSaved() || DEFAULT_LANG;
    }

    function apply(lang) {
        if (!lang) lang = DEFAULT_LANG;

        var html = document.documentElement;
        html.lang = lang;
        html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        html.setAttribute('data-lang', lang);

        // French = default; key is the French text itself → no lookup needed
        var dict = null;
        if (lang !== 'fr' && typeof translations !== 'undefined' && translations[lang]) {
            dict = translations[lang];
        }

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (!key || key.trim() === '') return;

            // Use translated value; fall back to the key (French) if not found
            var text = dict ? (dict[key] !== undefined ? dict[key] : key) : key;

            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        });

        // Sync language dropdown trigger text and active state
        var flagMap = { ar: '🇸🇦 AR', en: '🇺🇸 EN', fr: '🇫🇷 FR' };
        var trigger = document.getElementById('agro-lang-trigger');
        if (trigger) trigger.textContent = (flagMap[lang] || '🌐') + ' ▾';

        document.querySelectorAll('.agro-lang-item').forEach(function (item) {
            item.classList.toggle('active', item.getAttribute('data-lang') === lang);
        });
    }

    function setLanguage(lang) {
        localStorage.setItem('site_lang', lang);
        apply(lang);
    }

    // Bootstrap: set default on very first visit
    if (!getSaved()) {
        localStorage.setItem('site_lang', DEFAULT_LANG);
    }

    // Apply translations when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { apply(getCurrent()); });
    } else {
        apply(getCurrent());
    }

    // Public API
    window.AgroI18n = { setLanguage: setLanguage, getCurrent: getCurrent, apply: apply };
    window.setLanguage = setLanguage;
})();
