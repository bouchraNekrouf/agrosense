// ملف محرك الترجمة (i18n.js)

function translatePage() {
    const currentLang = localStorage.getItem('site_lang');

    if (!currentLang || currentLang === 'fr') {
        document.documentElement.lang = 'fr';
        document.dir = 'ltr';
        return;
    }

    if (currentLang === 'ar') {
        document.documentElement.lang = 'ar';
        document.dir = 'rtl';
    } else {
        document.documentElement.lang = currentLang;
        document.dir = 'ltr';
    }

    if (typeof translations !== 'undefined' && translations[currentLang]) {
        const dictionary = translations[currentLang];
        const elementsToTranslate = document.querySelectorAll('[data-i18n]');
        
        elementsToTranslate.forEach(element => {
            const translationKey = element.getAttribute('data-i18n');
            if (dictionary[translationKey]) {
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = dictionary[translationKey];
                } else {
                    element.innerHTML = dictionary[translationKey];
                }
            }
        });
    }
}

window.translatePage = translatePage;

document.addEventListener("DOMContentLoaded", translatePage);
