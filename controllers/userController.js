const User = require('../models/User');
const ModelMetrics = require('../models/ModelMetrics');

// Récupérer les données de l'utilisateur actuel
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur lors de la récupération des données');
    }
};

// Mettre à jour les données de l'utilisateur
const updateUserProfile = async (req, res) => {
    const { nom, phone, localisation, email } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

        if (email && email !== user.email) {
            let emailExists = await User.findOne({ email });
            if (emailExists) return res.status(400).json({ message: 'Cet e-mail est déjà utilisé par un autre utilisateur' });
            user.email = email;
        }

        if (nom) user.nom = nom;
        if (phone) user.phone = phone;
        if (localisation) user.localisation = localisation;

        await user.save();
        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json({ message: 'Les données ont été mises à jour avec succès! 🚀', user: updatedUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur lors de la mise à jour des données');
    }
};

// --- Nouvelles fonctions pour les invitations et les discussions ---

// Récupérer tous les utilisateurs d'un rôle donné
const getUsersByRole = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) return res.status(404).json({ message: "Utilisateur introuvable" });

        let query;
        if (req.params.role === 'agriculteur') {
            query = { $or: [{ role: 'agriculteur' }, { role: { $exists: false } }] };
        } else {
            query = { role: req.params.role };
        }

        const excludedIds = [
            req.user.id,
            ...(currentUser.friends ? currentUser.friends.map(id => id.toString()) : []),
            ...(currentUser.invitations ? currentUser.invitations.map(id => id.toString()) : [])
        ];

        const users = await User.find({
            ...query,
            _id: { $nin: excludedIds }
        }).select('-password');

        // Check if current user has sent an invite to any of these users
        const usersWithStatus = users.map(u => {
            const userObj = u.toObject();
            if (u.invitations && u.invitations.includes(req.user.id)) {
                userObj.isPending = true;
            } else {
                userObj.isPending = false;
            }
            return userObj;
        });

        res.json(usersWithStatus);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// Récupérer tous les experts (public, pour la page d'accueil)
const getPublicExperts = async (req, res) => {
    try {
        const experts = await User.find({ 
            role: 'expert',
            'boutique.name': { $exists: true, $ne: '' } // N'afficher que les experts qui ont configuré leur boutique
        }).select('-password -invitations -friends');
        res.json(experts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// Récupérer tous les experts (public, annuaire simple nom + wilaya)
const getPublicExpertsDirectory = async (req, res) => {
    try {
        const experts = await User.find({ role: 'expert' }).select('nom localisation boutique.wilaya role');
        res.json(experts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// Envoyer une invitation (demande d'ami)
const sendInvitation = async (req, res) => {
    try {
        const targetId = req.body.targetId;
        if (targetId === req.user.id) return res.status(400).json({ message: "Vous ne pouvez pas vous inviter vous-même" });

        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ message: "Utilisateur introuvable" });

        if (targetUser.friends && targetUser.friends.includes(req.user.id)) {
            return res.status(400).json({ message: "Vous êtes déjà amis" });
        }

        if (targetUser.invitations && targetUser.invitations.includes(req.user.id)) {
            return res.status(400).json({ message: "Invitation déjà envoyée" });
        }

        targetUser.invitations.push(req.user.id);
        await targetUser.save();

        const io = req.app.get('io');
        if (io) {
            const sender = await User.findById(req.user.id);
            // Emit to the targetId's ROOM (more robust than socketId)
            io.to(targetId).emit('new_invitation', {
                senderId: sender._id,
                senderName: sender.nom,
                senderRole: sender.role,
                senderLocation: sender.localisation
            });
            console.log(`📡 [SOCKET] 'new_invitation' emitted to room: ${targetId}`);
        }

        res.json({ message: "Invitation envoyée avec succès" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// Récupérer les invitations reçues
const getInvitations = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('invitations', 'nom email role localisation');
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

        res.json(user.invitations || []);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// Accepter une invitation
const acceptInvitation = async (req, res) => {
    try {
        const targetId = req.body.targetId;
        const user = await User.findById(req.user.id);
        const targetUser = await User.findById(targetId);

        if (!user || !targetUser) return res.status(404).json({ message: "Utilisateur introuvable" });

        const invitationIndex = user.invitations.indexOf(targetId);
        if (invitationIndex === -1) return res.status(400).json({ message: "Aucune invitation" });

        user.invitations.splice(invitationIndex, 1);
        if (!user.friends.includes(targetId)) user.friends.push(targetId);
        if (!targetUser.friends.includes(req.user.id)) targetUser.friends.push(req.user.id);

        await user.save(); 
        await targetUser.save();

        const io = req.app.get('io');
        if (io) {
            // Emit to the targetId's ROOM (the original sender who is being accepted)
            io.to(targetId).emit('invitation_accepted', {
                accepterId: user._id,
                accepterName: user.nom
            });
            console.log(`📡 [SOCKET] 'invitation_accepted' emitted to room: ${targetId}`);
        }

        res.json({ message: "Invitation acceptée" });
    } catch (err) { 
        console.error(err.message);
        res.status(500).send('Erreur serveur'); 
    }
};

// Refuser une invitation
const rejectInvitation = async (req, res) => {
    try {
        const targetId = req.body.targetId;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

        const invIndex = user.invitations.indexOf(targetId);
        if (invIndex === -1) return res.status(400).json({ message: "Invitation introuvable" });

        user.invitations.splice(invIndex, 1);
        await user.save();

        res.json({ message: "Invitation refusée" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// Annuler une invitation envoyée
const cancelInvitation = async (req, res) => {
    try {
        const targetId = req.body.targetId;
        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ message: "Utilisateur introuvable" });

        const invIndex = targetUser.invitations.indexOf(req.user.id);
        if (invIndex === -1) return res.status(400).json({ message: "Aucune invitation en attente" });

        targetUser.invitations.splice(invIndex, 1);
        await targetUser.save();

        res.json({ message: "Invitation annulée" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// Récupérer les amis
const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'nom email role localisation');
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

        res.json(user.friends || []);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
};

// Update the expert's boutique configuration
const updateBoutique = async (req, res) => {
    try {
        const { name, specialty, desc, wilaya } = req.body;
        
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
        
        if (user.role !== 'expert') {
            return res.status(403).json({ message: 'Seuls les experts peuvent configurer une boutique' });
        }

        user.boutique = {
            name: name || user.boutique?.name || '',
            specialty: specialty || user.boutique?.specialty || '',
            description: desc || user.boutique?.description || '',
            wilaya: wilaya || user.boutique?.wilaya || ''
        };

        await user.save();
        res.json({ message: 'Configuration de boutique enregistrée avec succès!', boutique: user.boutique });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur lors de la mise à jour de la boutique');
    }
};

// Récupérer et mettre à jour les métriques du modèle
const getModelMetrics = async (req, res) => {
    try {
        const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:5000';

        const existing = await ModelMetrics.findOne();
        const needsRefresh = !existing || !existing.confusionMatrix || existing.confusionMatrix.length === 0;

        if (needsRefresh) {
            try {
                const r = await fetch(`${pythonBackendUrl}/metrics`, { method: 'GET' });
                if (r.ok) {
                    const data = await r.json();
                    if (data && data.success) {
                        const core = data.metrics || {};
                        await ModelMetrics.findOneAndUpdate(
                            {},
                            {
                                algorithmName: data.algorithm || existing?.algorithmName || 'Random Forest',
                                trainProportion: data.split?.train ?? existing?.trainProportion ?? 80,
                                validationProportion: existing?.validationProportion ?? 0,
                                testProportion: data.split?.test ?? existing?.testProportion ?? 20,
                                accuracy: core.accuracy ?? 0,
                                precision: core.precision ?? 0,
                                recall: core.recall ?? 0,
                                f1: core.f1 ?? 0,
                                confusionMatrix: data.confusion_matrix || [],
                                labels: data.labels || [],
                                updatedAt: new Date()
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                    }
                }
            } catch (e) {
            }
        }

        const saved = await ModelMetrics.findOne();
        if (!saved) {
            return res.json({
                success: true,
                algorithm: '—',
                split: { train: 0, test: 0, random_state: 42 },
                metrics: { accuracy: 0, precision: 0, recall: 0, f1: 0 },
                confusion_matrix: [[0]],
                labels: ['N/A']
            });
        }

        res.json({
            success: true,
            algorithm: saved.algorithmName || '—',
            split: { train: saved.trainProportion ?? 0, test: saved.testProportion ?? 0, random_state: 42 },
            metrics: {
                accuracy: saved.accuracy ?? 0,
                precision: saved.precision ?? 0,
                recall: saved.recall ?? 0,
                f1: saved.f1 ?? 0
            },
            confusion_matrix: (saved.confusionMatrix && saved.confusionMatrix.length) ? saved.confusionMatrix : [[0]],
            labels: (saved.labels && saved.labels.length) ? saved.labels : ['N/A']
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur lors de la récupération des métriques');
    }
};

const updateModelMetrics = async (req, res) => {
    try {
        const { algorithmName, trainProportion, validationProportion, testProportion, accuracy, precision, recall, f1, confusion_matrix, labels } = req.body;
        let metrics = await ModelMetrics.findOne();
        if (!metrics) {
            metrics = new ModelMetrics();
        }
        if (algorithmName !== undefined) metrics.algorithmName = algorithmName;
        if (trainProportion !== undefined) metrics.trainProportion = trainProportion;
        if (validationProportion !== undefined) metrics.validationProportion = validationProportion;
        if (testProportion !== undefined) metrics.testProportion = testProportion;
        if (accuracy !== undefined) metrics.accuracy = accuracy;
        if (precision !== undefined) metrics.precision = precision;
        if (recall !== undefined) metrics.recall = recall;
        if (f1 !== undefined) metrics.f1 = f1;
        if (confusion_matrix !== undefined) metrics.confusionMatrix = confusion_matrix;
        if (labels !== undefined) metrics.labels = labels;
        metrics.updatedAt = new Date();
        
        await metrics.save();

        console.log('\n======================================================');
        console.log('✅ Métriques du modèle d\'IA mises à jour (API Post) !');
        console.log('======================================================');
        console.log(`Proportion de test (Test %) : ${metrics.testProportion}%`);
        console.log(`Accuracy                    : ${metrics.accuracy}`);
        console.log(`Precision                   : ${metrics.precision}`);
        console.log(`Recall                      : ${metrics.recall}`);
        console.log(`F1-Score                    : ${metrics.f1}`);
        console.log('======================================================\n');

        res.json({ message: 'Métriques mises à jour avec succès! 🚀', metrics });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur lors de la mise à jour des métriques');
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUsersByRole,
    getPublicExperts,
    getPublicExpertsDirectory,
    sendInvitation,
    getInvitations,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    getFriends,
    updateBoutique,
    getModelMetrics,
    updateModelMetrics
};
