const mongoose = require('mongoose');

const interationSchema = new mongoose.Schema(
    {
        message: { type: String, maxLength: 100 },
        for_vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
        added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deleted_at: String

    },
    { timestamps: true }
)

module.exports = mongoose.model('Interaction', interationSchema);
