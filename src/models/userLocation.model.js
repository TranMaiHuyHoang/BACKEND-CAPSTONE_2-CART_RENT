const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userLocationSchema = new Schema(
    {
        address: String,
        latitude: String,
        longitude: String,
        plus_code: String,
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        deleted_at: String
    },
    
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

module.exports = mongoose.model('UserLocation', userLocationSchema);
