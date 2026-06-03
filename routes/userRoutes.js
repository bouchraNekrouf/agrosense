const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getUserProfile,
    updateUserProfile,
    getUsersByRole,
    sendInvitation,
    getInvitations,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    getFriends,
    getPublicExperts,
    getPublicExpertsDirectory,
    updateBoutique,
    getModelMetrics,
    updateModelMetrics
} = require('../controllers/userController');

// --- Route publique pour l'accueil ---
router.get('/public/experts', getPublicExperts);
router.get('/public/experts-directory', getPublicExpertsDirectory);

// GET /api/user/profile
router.get('/profile', auth, getUserProfile);

// PUT /api/user/profile
router.put('/profile', auth, updateUserProfile);

// PUT /api/user/boutique
router.put('/boutique', auth, updateBoutique);

// --- Routes pour la gestion des invitations ---
router.get('/all/:role', auth, getUsersByRole);
router.post('/invite', auth, sendInvitation);
router.get('/invitations', auth, getInvitations);
router.post('/accept-invite', auth, acceptInvitation);
router.post('/reject-invite', auth, rejectInvitation);
router.post('/cancel-invite', auth, cancelInvitation);
router.get('/friends', auth, getFriends);

// --- Routes pour les métriques de modèle d'IA ---
router.get('/metrics', auth, getModelMetrics);
router.post('/metrics', auth, updateModelMetrics);

module.exports = router;
