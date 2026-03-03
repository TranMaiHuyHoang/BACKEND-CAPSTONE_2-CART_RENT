const mongoose = require('mongoose');

const userLocationSchema = new mongoose.Schema(
    {
        address: String,
        latitude: String,
        longitude: String,
        plus_code: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        deleted_at: String
    },

    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

module.exports = mongoose.model('UserLocation', userLocationSchema);
