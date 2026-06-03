const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    phone: { type: String, required: true },
    localisation: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['agriculteur', 'expert', 'admin'], default: 'agriculteur' },
    tokenHash: { type: String, default: null, index: true },
    otpHash: { type: String, required: true, index: true },
    otpExpiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, expires: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PendingUser', PendingUserSchema);
