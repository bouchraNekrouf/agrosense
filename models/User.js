const mongoose = require('mongoose');

// Définition de la structure des données de l'utilisateur (Schéma)
const UserSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    localisation: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['agriculteur', 'expert', 'admin'],
        default: 'agriculteur',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    // Nouveaux champs pour la gestion des relations (amis/invitations)
    invitations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    boutique: {
        name: { type: String, default: '' },
        specialty: { type: String, default: '' },
        description: { type: String, default: '' },
        wilaya: { type: String, default: '' }
    }
});

// Exporter le modèle pour l'utiliser dans le projet
module.exports = mongoose.model('User', UserSchema);
