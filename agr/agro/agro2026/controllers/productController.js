const Product = require('../models/Product');
const User = require('../models/User'); // Imported User to check boutique status

// GET - Récupérer tous les produits de l'expert connecté
const getMyProducts = async (req, res) => {
    try {
        console.log(`🔍 Fetch produits pour user: ${req.user.id}`);
        const products = await Product.find({ expert: req.user.id }).sort({ date: -1 });
        console.log(`📦 ${products.length} produit(s) trouvé(s) en DB`);
        res.json(products);
    } catch (err) {
        console.error('❌ Erreur getMyProducts:', err.message);
        res.status(500).send('Erreur serveur');
    }
};

// GET - Récupérer les produits d'un expert par son ID (vue publique/agriculteur)
const getProductsByExpert = async (req, res) => {
    try {
        const products = await Product.find({ expert: req.params.expertId }).sort({ date: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// POST - Ajouter un produit
const addProduct = async (req, res) => {
    try {
        // --- Vérification logique: Le vendeur a-t-il configuré sa boutique ? ---
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        if (!user.boutique || !user.boutique.name || user.boutique.name.trim() === '') {
            return res.status(400).json({ 
                message: "Veuillez d'abord configurer votre boutique (Nom, Spécialité...) avant d'ajouter des produits." 
            });
        }
        // -------------------------------------------------------------------------

        const { name, category, price, image } = req.body;
        if (!name || !category || !price) {
            return res.status(400).json({ message: 'Nom, catégorie et prix sont obligatoires' });
        }
        const product = new Product({
            expert: req.user.id,
            name,
            category,
            price: parseFloat(price),
            image: image || ''
        });
        const saved = await product.save();
        res.json(saved);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// PUT - Modifier un produit
const updateProduct = async (req, res) => {
    try {
        const { name, category, price, image } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Produit introuvable' });
        if (product.expert.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        product.name = name || product.name;
        product.category = category || product.category;
        product.price = price ? parseFloat(price) : product.price;
        product.image = image !== undefined ? image : product.image;

        const updated = await product.save();
        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// DELETE - Supprimer un produit
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Produit introuvable' });
        if (product.expert.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        await product.deleteOne();
        res.json({ message: 'Produit supprimé' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

module.exports = { getMyProducts, getProductsByExpert, addProduct, updateProduct, deleteProduct };
