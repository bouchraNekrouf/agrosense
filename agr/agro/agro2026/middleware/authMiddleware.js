const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: 'Aucune autorisation, requête refusée' });
    }

    try {
        const decoded = jwt.verify(token, 'agrosence_secret_key');
        
        // On récupère l'utilisateur pour avoir son rôle à jour
        const user = await User.findById(decoded.user.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur introuvable, autorisation refusée' });
        }

        req.user = user; // Maintenant req.user contient TOUT l'objet user (id, role, nom, etc.)
        next();
    } catch (err) {
        res.status(401).json({ message: 'Autorisation invalide ou expirée' });
    }
};
