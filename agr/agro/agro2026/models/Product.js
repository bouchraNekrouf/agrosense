const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    expert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: '' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
