const mongoose = require('mongoose');

const interationSchema = new mongoose.Schema(
    {
        message: { type: String, maxLength: 100 },
        for_vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
        added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deleted_at: String

    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)

module.exports = mongoose.model('Interaction', interationSchema);
