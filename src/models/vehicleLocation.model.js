const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const vehicleLocationSchema = new Schema(
    {
        address: String,
        latitude: String,
        longitude: String,
        plus_code: String,
        vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    },

    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

module.exports = mongoose.model('VehicleLocation', vehicleLocationSchema);
