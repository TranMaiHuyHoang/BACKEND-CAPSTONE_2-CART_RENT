const mongoose = require('mongoose');

const vehicleLocationSchema = new mongoose.Schema(
    {
        address: String,
        latitude: String,
        longitude: String,
        plus_code: String,
        vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    },

    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

module.exports = mongoose.model('VehicleLocation', vehicleLocationSchema);
