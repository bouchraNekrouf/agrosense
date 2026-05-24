const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    expert: { // Reference to the Expert (User ID or name)
        type: String,
        required: true
    },
    farmerContext: { // Who placed the order (either ID or name)
        type: String,
        required: true
    },
    farmerName: {
        type: String,
        required: true
    },
    farmerPhone: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    exactAddress: {
        type: String,
        default: ''
    },
    product: { // Formatted string of products
        type: String,
        required: true
    },
    items: [
        {
            name: String,
            category: String,
            price: Number,
            quantity: Number
        }
    ],
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    farmerReceived: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'En attente'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);
