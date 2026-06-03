const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Nécessaire pour créer la session (Token)
const crypto = require('crypto');
const nodemailer = require('nodemailer');

function isValidEmailFormat(email) {
    if (!email) return false;
    const v = String(email).trim();
    if (v.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
}

function getMailer() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true';
    if (!host || !user || !pass) return null;
    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// ----------------------------------------
// Fonction de création de nouveau compte (Inscription)
// ----------------------------------------
const registerUser = async (req, res) => {
    // Récupérer les données envoyées par l'utilisateur depuis le formulaire
    const { nom, phone, localisation, email, password, role } = req.body;

    try {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        if (!isValidEmailFormat(normalizedEmail)) {
            return res.status(400).json({ message: 'Veuillez saisir une adresse email valide.' });
        }

        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ message: 'Cet e-mail est déjà enregistré!' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const transporter = getMailer();
        const mailEnabled = !!transporter;

        user = new User({
            nom,
            phone,
            localisation,
            email: normalizedEmail,
            password: passwordHash,
            role: role || 'agriculteur',
            emailVerified: mailEnabled ? false : true
        });

        let rawToken = null;
        if (mailEnabled) {
            rawToken = crypto.randomBytes(32).toString('hex');
            user.emailVerificationTokenHash = hashToken(rawToken);
            user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        await user.save();

        if (!mailEnabled) {
            return res.status(201).json({ message: "Compte créé et activé. Vous pouvez vous connecter." });
        }

        const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
        const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}`;
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        try {
            await transporter.sendMail({
                from,
                to: normalizedEmail,
                subject: 'Vérification de votre email - Agrosence',
                text: `Bonjour,\n\nVeuillez confirmer votre adresse email en cliquant sur ce lien :\n${verifyUrl}\n\nCe lien expire dans 24 heures.\n\nÉquipe Agrosence`
            });
        } catch (mailErr) {
            user.emailVerified = true;
            user.emailVerificationTokenHash = null;
            user.emailVerificationExpiresAt = null;
            await user.save().catch(() => {});
            return res.status(201).json({ message: "Compte créé et activé. Vous pouvez vous connecter." });
        }

        res.status(201).json({ message: "Un email de vérification a été envoyé. Veuillez vérifier votre boîte mail." });

    } catch (err) {
        console.error("Erreur serveur:", err.message);
        res.status(500).send('Une erreur de serveur est survenue');
    }
};

const verifyEmail = async (req, res) => {
    try {
        const token = String(req.query.token || '').trim();
        if (!token) return res.status(400).send('Lien de vérification invalide.');

        const tokenHash = hashToken(token);
        const user = await User.findOne({ emailVerificationTokenHash: tokenHash });
        if (!user) return res.status(400).send('Lien de vérification invalide ou expiré.');

        if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt.getTime() < Date.now()) {
            return res.status(400).send('Lien de vérification invalide ou expiré.');
        }

        user.emailVerified = true;
        user.emailVerificationTokenHash = null;
        user.emailVerificationExpiresAt = null;
        await user.save();

        const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
        const loginUrl = `${baseUrl}/logsigin/sign.html`;

        res.status(200).send(
            `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Agrosence</title></head><body style="font-family:Inter,Arial,sans-serif;background:#0a1f0e;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;"><div style="max-width:520px;width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(129,243,186,0.25);border-radius:16px;padding:26px;text-align:center;"><div style="font-size:48px;margin-bottom:10px;">✅</div><h2 style="margin:0 0 10px 0;">Email vérifié</h2><p style="margin:0 0 18px 0;color:rgba(255,255,255,0.8);">Votre compte est activé. Vous pouvez vous connecter.</p><a href="${loginUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:linear-gradient(135deg,#81f3ba,#2c5a36);color:#0a1f0e;text-decoration:none;font-weight:700;">Se connecter</a></div></body></html>`
        );
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
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'E-mail ou mot de passe incorrect.' });
        }

        if (user.emailVerified === false) {
            return res.status(403).json({ message: "Veuillez vérifier votre adresse email avant de vous connecter." });
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
    verifyEmail,
    loginUser // Exporter la fonction de connexion
};
