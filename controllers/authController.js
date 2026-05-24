const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Nécessaire pour créer la session (Token)

// ----------------------------------------
// Fonction de création de nouveau compte (Inscription)
// ----------------------------------------
const registerUser = async (req, res) => {
    // Récupérer les données envoyées par l'utilisateur depuis le formulaire
    const { nom, phone, localisation, email, password, role } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Cet e-mail est déjà enregistré!' });
        }

        user = new User({
            nom,
            phone,
            localisation,
            email,
            password,
            role: role || 'agriculteur'
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.status(201).json({ message: 'Le compte a été créé avec succès!' });

    } catch (err) {
        console.error("Erreur serveur:", err.message);
        res.status(500).send('Une erreur de serveur est survenue');
    }
};

// ----------------------------------------
// Fonction de connexion (Connexion)
// ----------------------------------------
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. S'assurer que l'utilisateur existe dans la base de données
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'E-mail ou mot de passe incorrect.' });
        }

        // 2. Comparer le mot de passe saisi avec le mot de passe haché stocké
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'E-mail ou mot de passe incorrect.' });
        }

        // 3. Créer un Token (clé de session) pour que l'utilisateur reste connecté
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // Normalement la clé secrète est stockée dans un fichier .env
        jwt.sign(
            payload,
            'agrosence_secret_key',
            { expiresIn: '7d' }, // Validité de session 7 jours
                       (err, token) => {
                if (err) throw err;
                // Retourner le token et le nom d'utilisateur
                res.json({
                    message: 'Connecté avec succès!',
                    token: token,
                    userName: user.nom,
                    role: user.role || 'agriculteur',
                    userId: user.id 
                });
            }

        );

    } catch (err) {
        console.error("Erreur serveur:", err.message);
        res.status(500).send('Une erreur de serveur est survenue');
    }
};

module.exports = {
    registerUser,
    loginUser // Exporter la fonction de connexion
};
