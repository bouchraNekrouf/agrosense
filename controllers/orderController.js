const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const { expert, farmerContext, farmerName, farmerPhone, location, exactAddress, product, items, status } = req.body;

        // SECURITY: Calculate total on the server to avoid front-end tampering
        let calculatedTotal = 0;
        if (items && Array.isArray(items)) {
            calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
        }

        const newOrder = new Order({
            expert,
            farmerContext,
            farmerName,
            farmerPhone,
            location,
            exactAddress,
            product,
            items,
            totalPrice: calculatedTotal,
            status: status || 'En attente'
        });

        const savedOrder = await newOrder.save();

        try {
            const expertUser = await User.findOne({ nom: expert });
            const payment = new Payment({
                farmer: req.user ? req.user.id : null,
                expert: expertUser ? expertUser._id : null,
                order: savedOrder._id,
                type: 'boutique',
                amount: calculatedTotal,
                method: req.body.paymentMethod || 'Cash',
                status: 'En attente',
                details: {
                    itemsCount: Array.isArray(items) ? items.length : 0,
                    location,
                    exactAddress
                }
            });
            await payment.save();
        } catch (e) {}

        // REAL-TIME: Notify the Expert using Rooms
        const io = req.app.get('io');
        if (io) {
            const expertUser = await User.findOne({ nom: expert });
            if (expertUser) {
                console.log(`📡 [EMIT] Attempting 'new_order' to expert ID: ${expertUser._id}`);
                io.to(expertUser._id.toString()).emit('new_order', savedOrder);
            } else {
                console.warn(`⚠️ [SOCKET] Expert ${expert} not found in DB, can't emit.`);
            }
        } else {
            console.error("❌ [SOCKET] ERROR: 'io' instance not found in req.app!");
        }

        res.status(201).json(savedOrder);
    } catch (err) {
        console.error("Erreur création commande:", err);
        res.status(500).json({ message: "Erreur serveur lors de la création de la commande" });
    }
};

// Get orders for a specific expert
exports.getExpertOrders = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'expert') {
            return res.status(403).json({ message: "Accès refusé" });
        }

        // We fetch orders where the expert field matches the user's name
        const expertName = user.nom;
        
        let query = { expert: { $regex: new RegExp(`^${expertName}$`, 'i') } };
        // For fallback we also check user id just in case
        // But the frontend currently sends expert == userName
        
        // Wait, Zahra fallback:
        if (expertName.toLowerCase().includes('zahra')) {
            query = { expert: { $regex: /zahra/i } };
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error("Erreur récupération commandes expert:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Get orders for a farmer
exports.getFarmerOrders = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        const farmerName = user.nom;

        const orders = await Order.find({
            $or: [
                { farmerContext: farmerName },
                { farmerName: farmerName }
            ]
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error("Erreur récupération commandes agriculteur:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Update order status (for expert validation)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }

        try {
            const payment = await Payment.findOne({ order: updatedOrder._id }).sort({ createdAt: -1 });
            if (payment) {
                if (status === 'Livrée') payment.status = 'Payé';
                if (status === 'Échoué') payment.status = 'Échoué';
                await payment.save();
            }
        } catch (e) {}

        // REAL-TIME: Notify the Farmer using Rooms
        const io = req.app.get('io');
        if (io) {
            const farmerUser = await User.findOne({ nom: updatedOrder.farmerName });
            if (farmerUser) {
                const eventType = status === 'Validée' ? 'order_accepted' : (status === 'Livrée' ? 'order_completed' : 'order_status_changed');
                console.log(`📡 [EMIT] '${eventType}' to farmer ID: ${farmerUser._id}`);
                io.to(farmerUser._id.toString()).emit(eventType, updatedOrder);
            } else {
                console.warn(`⚠️ [SOCKET] Farmer ${updatedOrder.farmerName} not found in DB.`);
            }
        }

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Farmer confirms receipt (Double Handshake)
exports.confirmFarmerReception = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { farmerReceived: true },
            { new: true }
        );

        if (!updatedOrder) return res.status(404).json({ message: "Commande non trouvée" });

        try {
            const payment = await Payment.findOne({ order: updatedOrder._id }).sort({ createdAt: -1 });
            if (payment && payment.status !== 'Payé') {
                payment.status = 'Payé';
                await payment.save();
            }
        } catch (e) {}

        // REAL-TIME: Notify the Expert using Rooms
        const io = req.app.get('io');
        if (io) {
            const expertUser = await User.findOne({ nom: updatedOrder.expert });
            if (expertUser) {
                console.log(`📡 [EMIT] 'farmer_received_order' to expert ID: ${expertUser._id}`);
                io.to(expertUser._id.toString()).emit('farmer_received_order', updatedOrder);
            }
        }

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Get statistics for an expert dashboard
exports.getExpertStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'expert') {
            return res.status(403).json({ message: "Accès refusé" });
        }

        const expertName = user.nom;
        const query = { expert: { $regex: new RegExp(expertName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } };

        const orders = await Order.find(query);

        // 1. CLIENTS ACTIFS: unique farmers who placed orders
        const uniqueFarmers = new Set();
        orders.forEach(o => {
            if (o.farmerContext) uniqueFarmers.add(o.farmerContext);
            else if (o.farmerName) uniqueFarmers.add(o.farmerName);
        });
        const activeClients = uniqueFarmers.size;

        // 2. NOMBRE DE PRODUITS: total quantity of items ordered
        const allCategories = [
            "Semences et Plants", "Engrais et Fertilisants", "Produits Phytosanitaires",
            "Matériel d'Irrigation", "Outillage et Matériel Agricole",
            "Produits Vétérinaires et Aliments", "Équipement de Protection Individuelle"
        ];

        let totalOrderItems = 0;
        const categoryStats = {};
        allCategories.forEach(cat => categoryStats[cat] = 0);

        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const cat = item.category;
                    const qty = item.quantity || 1;
                    if (categoryStats.hasOwnProperty(cat)) {
                        categoryStats[cat] += qty;
                    }
                    totalOrderItems += qty;
                });
            }
        });

        // 3. CATEGORY PERCENTAGES
        const categoryPercentages = {};
        allCategories.forEach(cat => {
            categoryPercentages[cat] = totalOrderItems > 0
                ? Math.round((categoryStats[cat] / totalOrderItems) * 100)
                : 0;
        });

        res.json({
            activeClients,
            totalOrderedItems: totalOrderItems,
            totalOrders: orders.length,
            categoryStats,
            categoryPercentages,
            allCategories
        });
    } catch (err) {
        console.error("Erreur stats expert:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
// Get all orders for Admin
exports.getAllOrders = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès refusé. Réservé aux administrateurs." });
        }

        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error("Erreur récupération toutes les commandes:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
