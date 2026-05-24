async function lancerPrediction() {
    // ── 1. Read all form elements ───────────────────────────────────
    const tempEl      = document.getElementById('temp');
    const airEl       = document.getElementById('air');
    const moistureEl  = document.getElementById('moisture');
    const soilEl      = document.getElementById('soil_type');
    const nitrogenEl  = document.getElementById('nitrogen');
    const potassiumEl = document.getElementById('potassium');
    const phosphorusEl= document.getElementById('phosphorus');
    const phEl        = document.getElementById('ph');
    const rainfallEl  = document.getElementById('rainfall');

    // ── 2. Parse & validate ────────────────────────────────────────
    const Temperature = parseFloat(tempEl?.value)  || 25;
    const Humidity    = parseFloat(airEl?.value)   || 60;

    // Rainfall is required — warn user if empty
    const rainfallRaw = rainfallEl?.value?.trim();
    if (!rainfallRaw) {
        rainfallEl.style.border = '2px solid #ef4444';
        rainfallEl.focus();
        rainfallEl.placeholder = '⚠ Obligatoire !';
        return;
    }
    rainfallEl.style.border = '';

    // ── 3. Build EXACT payload (7 keys, case-sensitive) ────────────
    const data = {
        // For the Crop model (Crop_recommendation.csv)
        Nitrogen:    parseFloat(nitrogenEl?.value)   || 0,
        Phosphorous: parseFloat(phosphorusEl?.value) || 0,
        Potassium:   parseFloat(potassiumEl?.value)  || 0,
        Temperature,
        Humidity,
        ph:          parseFloat(phEl?.value) || 6.5,
        Rainfall:    parseFloat(rainfallRaw),
        // Extra context for the Fertilizer model (data_core.csv — handled server-side)
        moisture:  moistureEl?.value,
        soil_type: soilEl?.value,
    };

    // 2. Préparation de l'interface (Spinner)
    const btn = document.getElementById('predict-btn');
    const spinner = document.getElementById('predict-spinner');
    if (spinner) spinner.classList.remove('hidden');
    if (btn) btn.disabled = true;

    // Réinitialisation des résultats
    const cropsEl = document.getElementById('result-crops');
    const fertEl = document.getElementById('result-fertilizer');
    const yieldEl = document.getElementById('result-yield');

    cropsEl.innerHTML = '<span class="text-gray-500">Chargement...</span>';
    fertEl.innerHTML = '<span class="text-gray-500">Chargement...</span>';
    yieldEl.innerHTML = '<span class="text-gray-500">Chargement...</span>';

    try {
        // 3. Appel à l'API Node.js locale qui gèrera le code Python
        // Plus besoin de "deux liens", tout passe par localhost:3000
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result = await response.json();

        // 4. Affichage des 3 résultats
        cropsEl.innerHTML = `<span class="text-green-700 font-bold text-lg">${result.crops || "N/A"}</span>`;
fertEl.innerHTML = `<span class="text-blue-700 font-bold text-lg">${(result.fertilizer || "N/A").split('(')[0].trim()}</span>`;

        yieldEl.innerHTML = `<span class="text-amber-700 font-bold text-lg">${result.yield || "N/A"}</span>`;

        // Style the parents
        [cropsEl, fertEl, yieldEl].forEach(el => {
            el.classList.remove('text-gray-400', 'italic');
            el.classList.add('bg-white', 'border-l-4', 'border-green-500');
        });

        // Show panel
        document.getElementById('alerts-panel').classList.remove('hidden');

    } catch (error) {
        console.error("Erreur de connexion avec le code Python:", error);

        // Affichage de l'erreur pour aider au diagnostic
        cropsEl.innerHTML = `<span class="text-red-500">Erreur de connexion à l'API Python.</span>`;
        fertEl.innerHTML = `<span class="text-red-500">Vérifiez que votre code Python tourne sur localhost:5000</span>`;
        if (error.message === "Failed to fetch") {
            yieldEl.innerHTML = `<span class="text-red-500">Le serveur Python est injoignable. Lancez-le.</span>`;
        } else {
            yieldEl.innerHTML = `<span class="text-red-500">${error.message}</span>`;
        }
    } finally {
        // Enlever le spinner
        if (spinner) spinner.classList.add('hidden');
        if (btn) btn.disabled = false;
    }
}
