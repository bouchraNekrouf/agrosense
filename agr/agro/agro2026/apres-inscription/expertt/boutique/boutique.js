// ================== DATA CONFIG ==================
const categories = [
    "Semences et Plants",
    "Engrais et Fertilisants",
    "Produits Phytosanitaires",
    "Matériel d'Irrigation",
    "Outillage et Matériel Agricole",
    "Produits Vétérinaires et Aliments",
    "Équipement de Protection Individuelle"
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1592982537447-6f23f13612d3?auto=format&fit=crop&q=80&w=400"; // Generic ag image

let products = [];
let cart = JSON.parse(localStorage.getItem('agriCart')) || [];
let currentCategory = "Toutes les catégories";
let currentProductsKey = 'agriProducts'; // default

// ================== INITIALIZATION ==================
document.addEventListener("DOMContentLoaded", async () => {
    initCategories();
    renderProductsTable();
    renderFellahProducts();
    updateCartSidebar();

    // Determine the context (Are we admin editing our own shop, or a farmer visiting a shop?)
    const urlParams = new URLSearchParams(window.location.search);
    const paramExpert = urlParams.get('expert');

    // === FETCH REAL NAME FROM API (MongoDB Atlas) ===
    let apiName = null;
    const token = localStorage.getItem('token');
    if (!paramExpert && token) {
        try {
            const profileRes = await fetch('/api/user/profile', {
                headers: { 'x-auth-token': token }
            });
            const profileData = await profileRes.json();
            if (profileData && profileData.nom) {
                apiName = profileData.nom;
                localStorage.setItem('userName', apiName); // keep in sync
            }
        } catch (e) {
            console.warn('Could not fetch profile from API:', e);
        }
    }

    const rawContext = paramExpert ? paramExpert : (apiName || localStorage.getItem('userName') || 'Inconnu');
    
    // Normalize to handle spaces and case differences
    const expertContext = rawContext.trim().toLowerCase();
    const isZahra = expertContext.includes('zahra');
    const isLiana = expertContext.includes('liana');

    // Consistent key naming (no spaces for cleaner storage)
    const normalizedKey = expertContext.replace(/\s+/g, '_');
    const configKey = `agriBoutiqueConfig_${normalizedKey}`;
    currentProductsKey = `agriProducts_${normalizedKey}`;

    // Load config if it exists
    const boutiqueConfig = JSON.parse(localStorage.getItem(configKey)) || JSON.parse(localStorage.getItem('agriBoutiqueConfig')) || {};
    
    // Load boutique config form fields
    if (document.getElementById('boutique-name')) {
        document.getElementById('boutique-name').value = boutiqueConfig.name || '';
        document.getElementById('boutique-specialty').value = boutiqueConfig.specialty || '';
        document.getElementById('boutique-desc').value = boutiqueConfig.desc || '';
        
        // Load saved wilaya into dropdown
        const savedWilaya = boutiqueConfig.wilaya || localStorage.getItem('userLocation') || '';
        const wilayaSelect = document.getElementById('boutique-wilaya');
        if (wilayaSelect && savedWilaya) {
            for (let opt of wilayaSelect.options) {
                if (opt.value === savedWilaya) { opt.selected = true; break; }
            }
        }
        
        // Force refresh the global list when loading the page
        if (Object.keys(boutiqueConfig).length > 0) {
            updateAllExpertsList(boutiqueConfig);
        }
    }

    // === Fill the expert name from API (MongoDB Atlas) — called at init since Config is default view
    populateExpertNameField();

    // === FETCH PRODUCTS FROM MONGODB ATLAS ===
    await loadProductsFromAPI();

    renderProductsTable();
    renderFellahProducts();
});

// Load products from API (MongoDB Atlas)
async function loadProductsFromAPI(expertId = null) {
    const token = localStorage.getItem('token');
    
    // For expert dashboard (my products), token is required
    if (!expertId && !token) {
        console.warn('Aucun token trouvé — utilisateur non connecté ?');
        return;
    }
    
    try {
        const url = expertId ? `/api/products/expert/${expertId}` : '/api/products/my';
        const headers = expertId ? {} : { 'x-auth-token': token }; // Pas besoin de token pour voir les produits d'un expert public
        
        const res = await fetch(url, {
            method: 'GET',
            headers: headers,
            cache: 'no-store'
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('Erreur API produits:', res.status, err.message || '');
            return;
        }
        
        const data = await res.json();
        console.log(`🟢 Reponse brute de ${url}:`, data);
        if (Array.isArray(data)) {
            products = data;
            console.log(`✅ ${products.length} produit(s) chargé(s) depuis MongoDB`);
        } else {
            console.warn("⚠️ La réponse n'est pas un tableau:", data);
        }
    } catch (e) {
        console.error('🔴 Impossible de charger les produits:', e);
    }
}

// ================== BOUTIQUE CONFIG ==================
async function saveBoutiqueConfig(event) {
    if (event) event.preventDefault();
    const token = localStorage.getItem('token');
    const wilayaEl = document.getElementById('boutique-wilaya');
    const wilaya = wilayaEl ? wilayaEl.value : (localStorage.getItem('userLocation') || '');
    const config = {
        name: document.getElementById('boutique-name').value,
        specialty: document.getElementById('boutique-specialty').value,
        desc: document.getElementById('boutique-desc').value,
        wilaya: wilaya
    };

    try {
        if (token) {
            const res = await fetch('/api/user/boutique', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(config)
            });
            if (!res.ok) throw new Error('Failed to save to database');
        }
        
        // Also save to localStorage for immediate UI fallback
        const expertContext = (localStorage.getItem('userName') || 'Inconnu').trim().toLowerCase();
        const configKey = `agriBoutiqueConfig_${expertContext.replace(/\s+/g, '_')}`;
        localStorage.setItem(configKey, JSON.stringify(config));
        
        if (wilaya) localStorage.setItem('userLocation', wilaya);
        
        updateAllExpertsList(config);
        alert("Configuration de la boutique enregistrée avec succès dans la base de données !");
    } catch(err) {
        console.error('Erreur saveBoutiqueConfig:', err);
        alert("Erreur lors de la sauvegarde.");
    }
}

function updateAllExpertsList(config) {
    const currentUserName = localStorage.getItem('userName');
    if (!currentUserName) return;

    let savedExperts = localStorage.getItem('allExperts');
    let experts = [];
    if (savedExperts) {
        try { experts = JSON.parse(savedExperts); } catch (e) { experts = []; }
    }

    const expertIdx = experts.findIndex(e => e.nom === currentUserName);
    const updatedData = {
        id: expertIdx !== -1 ? experts[expertIdx].id : Date.now(),
        nom: currentUserName,
        specialite: config.name || 'Boutique de ' + currentUserName,
        localisation: config.wilaya || localStorage.getItem('userLocation') || 'Non spécifiée',
        real_specialty: config.specialty || 'Général',
        description: config.desc || 'Aucune description fournie.'
    };

    if (expertIdx !== -1) {
        experts[expertIdx] = updatedData;
    } else {
        experts.push(updatedData);
    }
    localStorage.setItem('allExperts', JSON.stringify(experts));
}

// ================== VIEW SWITCHING ==================
function switchView(viewName) {
    // Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${viewName}`).classList.add('active');

    // Sections
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active-view');
        // Small timeout to allow fade animation
        setTimeout(() => { view.style.display = 'none'; }, 50);
    });

    const activeView = document.getElementById(`${viewName}-view`);
    setTimeout(() => {
        activeView.style.display = 'block';
        setTimeout(() => activeView.classList.add('active-view'), 50);
    }, 50);

    if (viewName === 'fellah') {
        renderFellahProducts();
        populateExpertBanner();
    } else {
        renderProductsTable();
        populateExpertNameField(); // Re-fetch name from API when returning to Config
    }
}

// Fill the "Propriétaire" field and boutique config in the Config form from the API (MongoDB Atlas)
async function populateExpertNameField() {
    const field = document.getElementById('expert-name-display');
    const token = localStorage.getItem('token');
    
    // Show cached value immediately while fetching
    const cached = localStorage.getItem('userName');
    if (field && cached) field.value = cached;

    try {
        if (!token) return;
        const res = await fetch('/api/user/profile', { headers: { 'x-auth-token': token } });
        const data = await res.json();
        if (data && data.nom) {
            if (field) field.value = data.nom;
            localStorage.setItem('userName', data.nom); // keep in sync
        }
        // Load boutique configuration from DB if it exists
        if (data && data.boutique) {
            if (document.getElementById('boutique-name')) {
                document.getElementById('boutique-name').value = data.boutique.name || '';
                document.getElementById('boutique-specialty').value = data.boutique.specialty || '';
                document.getElementById('boutique-desc').value = data.boutique.description || '';
                
                const wilayaSelect = document.getElementById('boutique-wilaya');
                if (wilayaSelect && data.boutique.wilaya) {
                    for (let opt of wilayaSelect.options) {
                        if (opt.value === data.boutique.wilaya) { opt.selected = true; break; }
                    }
                }
            }
        }
    } catch (e) {
        console.warn('Impossible de récupérer le profil:', e);
    }
}

function populateExpertBanner() {
    if (!document.getElementById('shop-banner-title')) return;
    
    const rawUserName = (localStorage.getItem('userName') || 'Inconnu').trim();
    const expertContext = rawUserName.toLowerCase();
    const configKey = `agriBoutiqueConfig_${expertContext.replace(/\s+/g, '_')}`;
    const expertConfig = JSON.parse(localStorage.getItem(configKey)) || {};
    
    // Si la config contient un nom, on l'affiche, sinon on affiche un texte par défaut
    const shopName = expertConfig.name || `Boutique de ${rawUserName}`;
    const specialty = expertConfig.specialty || 'Général';
    const desc = expertConfig.desc || 'Aucune description fournie.';
    // Read wilaya: from boutique config first, then profile, then default
    const wilaya = expertConfig.wilaya || localStorage.getItem('userLocation') || 'Non spécifiée';

    document.getElementById('shop-banner-title').textContent = shopName;
    document.getElementById('shop-banner-expert').textContent = rawUserName;
    
    if (document.getElementById('info-panel-expert')) {
        document.getElementById('info-panel-expert').textContent = rawUserName;
        document.getElementById('info-panel-wilaya').textContent = wilaya;
        document.getElementById('info-panel-specialite').textContent = specialty;
        document.getElementById('info-panel-desc').textContent = desc;
    }
}

function openShopInfoPanel(e) {
    if(e) e.preventDefault();
    const panel = document.getElementById('shop-info-panel');
    const overlay = document.getElementById('shop-overlay');
    if (panel) panel.style.right = '0';
    if (overlay) overlay.style.display = 'block';
}

function closeShopInfoPanel() {
    const panel = document.getElementById('shop-info-panel');
    const overlay = document.getElementById('shop-overlay');
    if (panel) panel.style.right = '-400px';
    if (overlay) overlay.style.display = 'none';
}

// ================== EXPERT (ADMIN) LOGIC ==================

function renderProductsTable() {
    const tbody = document.getElementById('admin-products-table');
    tbody.innerHTML = '';

    products.forEach((prod) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${prod.image || DEFAULT_IMAGE}" alt="${prod.name}"></td>
            <td><strong>${prod.name}</strong></td>
            <td><span style="background:var(--bg-light); padding:4px 8px; border-radius:4px; font-size:0.85rem; color:var(--primary)">${prod.category}</span></td>
            <td>${parseFloat(prod.price).toFixed(2)} DA</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct('${prod._id}')" title="Modifier"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" onclick="deleteProduct('${prod._id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openProductModal() {
    // Vérification UI: Bloquer l'ouverture si la boutique n'est pas configurée
    const boutiqueNameField = document.getElementById('boutique-name');
    if (boutiqueNameField && boutiqueNameField.value.trim() === '') {
        alert("⚠️ Accès refusé : Veuillez d'abord configurer le nom de votre boutique et cliquer sur 'Enregistrer la configuration' !");
        return;
    }

    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-image-data').value = '';
    document.getElementById('product-image-preview').style.display = 'none';
    document.getElementById('modal-title').textContent = 'Ajouter un produit';
    document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

async function saveProduct(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const idInput = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const price = document.getElementById('product-price').value;
    const imageData = document.getElementById('product-image-data').value;
    const imageUrl = document.getElementById('product-image').value;
    const image = imageData || imageUrl || DEFAULT_IMAGE;

    const body = { name, category, price: parseFloat(price), image };

    try {
        let res;
        if (idInput) {
            // Edit existing — PUT
            res = await fetch(`/api/products/${idInput}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(body)
            });
        } else {
            // Add new — POST
            res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(body)
            });
        }

        if (!res.ok) {
            const err = await res.json();
            alert('Erreur: ' + (err.message || 'Impossible de sauvegarder'));
            return;
        }

        // Refresh product list from API
        await loadProductsFromAPI();
        renderProductsTable();
        renderFellahProducts();
        closeProductModal();
    } catch (e) {
        console.error(e);
        alert('Erreur de connexion au serveur');
    }
}

// Image preview from file upload
function previewProductImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById('product-image-data').value = dataUrl;
        document.getElementById('product-image').value = ''; // clear URL
        const preview = document.getElementById('product-image-preview');
        const img = document.getElementById('preview-img');
        img.src = dataUrl;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Image preview from URL
function previewProductImageUrl(url) {
    if (!url) {
        document.getElementById('product-image-preview').style.display = 'none';
        return;
    }
    document.getElementById('product-image-data').value = ''; // clear upload
    const preview = document.getElementById('product-image-preview');
    const img = document.getElementById('preview-img');
    img.src = url;
    preview.style.display = 'block';
}

function editProduct(id) {
    const prod = products.find(p => (p._id || p.id) === id);
    if (!prod) return;

    document.getElementById('product-id').value = prod._id || prod.id;
    document.getElementById('product-name').value = prod.name;
    document.getElementById('product-category').value = prod.category;
    document.getElementById('product-price').value = prod.price;
    document.getElementById('product-image-data').value = '';

    const isDefault = prod.image === DEFAULT_IMAGE;
    const isBase64 = prod.image && prod.image.startsWith('data:');

    if (isBase64) {
        // Show the uploaded image
        document.getElementById('product-image-data').value = prod.image;
        document.getElementById('product-image').value = '';
        document.getElementById('preview-img').src = prod.image;
        document.getElementById('product-image-preview').style.display = 'block';
    } else {
        document.getElementById('product-image').value = isDefault ? '' : prod.image;
        if (!isDefault) {
            document.getElementById('preview-img').src = prod.image;
            document.getElementById('product-image-preview').style.display = 'block';
        } else {
            document.getElementById('product-image-preview').style.display = 'none';
        }
    }

    document.getElementById('modal-title').textContent = 'Modifier le produit';
    document.getElementById('product-modal').classList.remove('hidden');
}

async function deleteProduct(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) {
            alert('Impossible de supprimer le produit.');
            return;
        }
        await loadProductsFromAPI();
        renderProductsTable();
        renderFellahProducts();
    } catch (e) {
        console.error(e);
        alert('Erreur de connexion au serveur');
    }
}

// ================== FELLAH (SHOP) LOGIC ==================

function initCategories() {
    // Fill Admin Dropdown
    const select = document.getElementById('product-category');
    select.innerHTML = '<option value="" disabled selected>Choisir une catégorie...</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    // Fill Sidebar
    const list = document.getElementById('category-list');
    list.innerHTML = `<li class="active" onclick="filterByCategory('Toutes les catégories', this)">Toutes les catégories</li>`;
    categories.forEach(cat => {
        // Escape apostrophes to prevent breaking the onclick handler
        const escapedCat = cat.replace(/'/g, "\\'");
        list.innerHTML += `<li onclick="filterByCategory('${escapedCat}', this)">${cat}</li>`;
    });
}

function filterByCategory(catName, element) {
    currentCategory = catName;
    document.getElementById('current-category-title').textContent = catName;

    // Update active class on sidebar
    document.querySelectorAll('.category-list li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');

    renderFellahProducts();
}

function renderFellahProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    const filtered = currentCategory === "Toutes les catégories"
        ? products
        : products.filter(p => p.category === currentCategory);

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 3rem;">Aucun produit disponible dans cette catégorie pour le moment.</p>`;
        return;
    }

    // Check once (not inside loop)
    const isExpertPreview = !new URLSearchParams(window.location.search).get('expert');

    filtered.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const prodId = prod._id || prod.id;
        let actionHtml = '';

        if (isExpertPreview) {
            actionHtml = `<button onclick="switchView('admin')" style="width:100%;background:#f1f5f9;border:1px solid #cbd5e1;color:#475569;padding:8px;border-radius:8px;font-size:0.85rem;cursor:pointer;font-weight:500;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;"><i class="fas fa-edit"></i> Modifier le produit / Boutique</button>`;
        } else {
            actionHtml = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white;">
                    <button onclick="changeQty('${prodId}', -1)" style="padding: 6px 15px; background: #f8fafc; border: none; cursor: pointer; color: #475569; font-weight: bold; font-size: 1.1rem; border-right: 1px solid #e2e8f0;">-</button>
                    <input type="number" id="qty-${prodId}" value="1" min="1" style="width: 100%; text-align: center; border: none; font-size: 1rem; font-weight: 600; color: #0f172a; outline: none; -moz-appearance: textfield;" readonly>
                    <button onclick="changeQty('${prodId}', 1)" style="padding: 6px 15px; background: #f8fafc; border: none; cursor: pointer; color: #475569; font-weight: bold; font-size: 1.1rem; border-left: 1px solid #e2e8f0;">+</button>
                </div>
                <button class="btn-add-cart" style="width: 100%;" onclick="addToCart('${prodId}')"><i class="fas fa-cart-plus"></i> Ajouter au panier</button>
            </div>`;
        }

        card.innerHTML =
            '<img src="' + (prod.image || DEFAULT_IMAGE) + '" alt="' + prod.name + '" class="product-img">' +
            '<div class="product-info">' +
            '<span class="product-cat">' + prod.category + '</span>' +
            '<h4 class="product-name">' + prod.name + '</h4>' +
            '<div class="product-price">' + parseFloat(prod.price).toFixed(2) + ' DA</div>' +
            actionHtml +
            '</div>';

        grid.appendChild(card);
    });
}

// Helper for Quantity Selector
window.changeQty = function(id, delta) {
    const input = document.getElementById(`qty-${id}`);
    if (!input) return;
    let val = parseInt(input.value) || 1;
    val += delta;
    if (val < 1) val = 1;
    input.value = val;
};

// ================== CART LOGIC ==================

function toggleCart() {
    document.getElementById('cart-panel').classList.toggle('hidden');
}

window.addToCart = function(id) {
    const prod = products.find(p => p._id === id || p.id === id);
    if (!prod) {
        console.error("Produit introuvable pour l'id:", id);
        return;
    }

    const input = document.getElementById(`qty-${id}`);
    const qtyToAdd = input ? (parseInt(input.value) || 1) : 1;

    const existingItem = cart.find(item => item._id === id || item.id === id);
    if (existingItem) {
        existingItem.quantity += qtyToAdd;
    } else {
        cart.push({ ...prod, quantity: qtyToAdd });
    }

    // Reset UI quantity to 1 after adding
    if (input) input.value = 1;

    // Track category hit for stats
    if (prod.category) {
        trackCategoryHit(prod.category);
    }

    saveCartParams();
    updateCartSidebar();

    // Quick visual feedback
    const cartBtn = document.querySelector('.cart-btn span');
    if (cartBtn) {
        cartBtn.style.transform = 'scale(1.3)';
        setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
    }
};

function saveCartParams() {
    // Only save the cart part so we don't mess up products array
    localStorage.setItem('agriCart', JSON.stringify(cart));
}

function trackCategoryHit(category) {
    // Get expert context
    const urlParams = new URLSearchParams(window.location.search);
    const paramExpert = urlParams.get('expert');
    const expertContext = (paramExpert || localStorage.getItem('userName') || 'expert').trim().toLowerCase();
    const normalizedKey = expertContext.replace(/\s+/g, '_');
    
    const statsKey = `agriCategoryHits_${normalizedKey}`;
    let hits = JSON.parse(localStorage.getItem(statsKey)) || {};
    
    hits[category] = (hits[category] || 0) + 1;
    localStorage.setItem(statsKey, JSON.stringify(hits));
}

window.removeFromCart = function(id) {
    cart = cart.filter(item => item._id !== id && item.id !== id);
    saveCartParams();
    updateCartSidebar();
};

function updateCartSidebar() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

    if (!cartItemsContainer) return; // Prevent crash if cart UI is not on this page

    cartItemsContainer.innerHTML = '';

    let totalItems = 0;
    let totalPrice = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<div class="cart-empty"><i class="fas fa-basket-shopping" style="font-size: 3rem; margin-bottom: 1rem; opacity:0.5;"></i><p>Votre panier est vide</p></div>`;
    } else {
        cart.forEach(item => {
            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">${parseFloat(item.price).toFixed(2)} DA <span style="color:var(--text-muted); font-size: 0.8rem; font-weight: normal;">x${item.quantity}</span></span>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item._id || item.id}')"><i class="fas fa-trash-alt"></i></button>
            `;
            cartItemsContainer.appendChild(div);
        });
    }

    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotalPrice) cartTotalPrice.textContent = `${totalPrice.toFixed(2)} DA`;
}

function checkout() {
    if (cart.length === 0) {
        alert("Votre panier est vide !");
        return;
    }
    alert("Commande confirmée ! Le vendeur (Expert) sera notifié. Merci pour votre achat.");
    cart = [];
    saveCartParams();
    updateCartSidebar();
    toggleCart();
}

// ================== UTILS ==================
function saveData(overrideKey) {
    const key = overrideKey || currentProductsKey;
    localStorage.setItem(key, JSON.stringify(products));
    localStorage.setItem('agriCart', JSON.stringify(cart));
}
