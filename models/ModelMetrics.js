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
    sensitivity: {
        type: Number,
        default: 99.71
    },
    specificity: {
        type: Number,
        default: 99.01
    },
    tp: {
        type: Number,
        default: 695.0
    },
    tn: {
        type: Number,
        default: 300.0
    },
    fp: {
        type: Number,
        default: 3.0
    },
    fn: {
        type: Number,
        default: 2.0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ModelMetrics', ModelMetricsSchema);
