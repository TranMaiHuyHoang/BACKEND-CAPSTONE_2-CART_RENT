const mongoose = require('mongoose');

const vehicleHireSchema = new mongoose.Schema(
    {
        release: {
            date: String,
            time: String,
        },

        due_back: {
            date: { type: String, default: Date.now },
            time: String
        },

        return: Date,
        vehicle_hire_rate_due_in_figures: Number,
        vehicle_hire_rate_due_currency: {
            type: String,
            required: true,
            enum: ['VND', 'USD'],
            default: 'VND'
        },

        paid: { type: Boolean, default: false },
        vehicle_hire_charge_timing: {
            type: String,
            required: true,
            enum: ['minutes', 'seconds', 'hourly', 'day'],
            default: 'minutes'
        },

        hiree: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        hirer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
        booked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        booking_updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        deleted_at: String
    },

    { timestamps: true }
);


module.exports = mongoose.model('vehicleHire', vehicleHireSchema);
