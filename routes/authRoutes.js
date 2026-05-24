const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Routage des requêtes vers leurs fonctions (Routes)

// POST /api/auth/register
// Fonction : recevoir les requêtes de création d'un nouveau compte et les passer au contrôleur (Auth Controller)
router.post('/register', registerUser);

// POST /api/auth/login
// Fonction : Connexion
router.post('/login', loginUser);

module.exports = router;
