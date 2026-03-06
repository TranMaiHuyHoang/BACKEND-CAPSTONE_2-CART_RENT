const mongoose = require('mongoose');

const userLocationSchema = new mongoose.Schema(
    {
        address: String,
        latitude: String,
        longitude: String,
        plus_code: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('UserLocation', userLocationSchema);
