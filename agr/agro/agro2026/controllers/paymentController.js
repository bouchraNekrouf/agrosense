const Payment = require('../models/Payment');

exports.listMyPayments = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Non autorisé" });

        let query = {};
        if (req.user.role === 'expert') query = { expert: req.user.id };
        else if (req.user.role === 'agriculteur') query = { farmer: req.user.id };
        else if (req.user.role === 'admin') query = {};
        else return res.status(403).json({ message: "Accès refusé" });

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .populate('order', 'totalPrice status createdAt')
            .populate('farmer', 'nom email')
            .populate('expert', 'nom email');

        res.json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

