const mongoose = require('mongoose');

const ModelMetricsSchema = new mongoose.Schema({
    algorithmName: {
        type: String,
        default: "Random Forest"
    },
    trainProportion: {
        type: Number,
        default: 80
    },
    validationProportion: {
        type: Number,
        default: 5
    },
    testProportion: {
        type: Number,
        default: 15
    },
    accuracy: {
        type: Number,
        default: 99.50
    },
    precision: {
        type: Number,
        default: 0
    },
    recall: {
        type: Number,
        default: 0
    },
    f1: {
        type: Number,
        default: 0
    },
    confusionMatrix: {
        type: [[Number]],
        default: []
    },
    labels: {
        type: [String],
        default: []
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ModelMetrics', ModelMetricsSchema);
