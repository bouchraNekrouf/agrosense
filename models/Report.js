const mongoose = require('mongoose');

const ReportDeliverySchema = new mongoose.Schema(
    {
        expert: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        sentAt: { type: Date, default: Date.now },
        comment: { type: String, default: '' },
        reply: { type: String, default: '' },
        commentedAt: { type: Date, default: null }
    },
    { _id: false }
);

const ReportSchema = new mongoose.Schema(
    {
        farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, default: '' },
        crop: { type: String, default: '' },
        fertilizer: { type: String, default: '' },
        yieldEstimate: { type: String, default: '' },
        inputs: { type: mongoose.Schema.Types.Mixed, default: null },
        pdf: {
            data: { type: Buffer, required: true },
            mimeType: { type: String, default: 'application/pdf' },
            fileName: { type: String, default: 'rapport_agronomique.pdf' }
        },
        deliveries: { type: [ReportDeliverySchema], default: [] },
        lastSentExpert: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        deletedByFarmer: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Report', ReportSchema);

