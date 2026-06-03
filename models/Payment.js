const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
    {
        farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        expert: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
        type: { type: String, enum: ['consultation', 'boutique'], default: 'boutique' },
        amount: { type: Number, default: 0 },
        method: { type: String, default: '' },
        status: { type: String, enum: ['Payé', 'En attente', 'Échoué'], default: 'En attente' },
        details: { type: mongoose.Schema.Types.Mixed, default: null },
        currency: { type: String, default: 'DZD' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);

