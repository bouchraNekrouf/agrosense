const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getMyProducts,
    getProductsByExpert,
    addProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// GET mes produits (expert connecté)
router.get('/my', auth, getMyProducts);

// GET produits d'un expert par ID (public - pour les agriculteurs)
router.get('/expert/:expertId', getProductsByExpert);

// POST ajouter un produit
router.post('/', auth, addProduct);

// PUT modifier un produit
router.put('/:id', auth, updateProduct);

// DELETE supprimer un produit
router.delete('/:id', auth, deleteProduct);

module.exports = router;
