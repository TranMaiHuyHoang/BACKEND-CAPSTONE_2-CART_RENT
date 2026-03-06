const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        payment_initiated_on: Date,
        payment_method: {
            type: String,
            required: true,
            enum: ['Debit/Credit Card', 'Paypal', 'Bitcoin', 'Ethereum'],
            default: 'Debit/Credit Card'
        },

        status: {
            type: String,
            required: true,
            enum: ['Declined', 'Pending', 'Successful'],
            default: 'Pending'
        },

        hiree: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        hirer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
        vehicle_hire: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleHire', required: true },
        paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        deleted_at: String
    },
    { timestamps: true }
);


module.exports = mongoose.model('Payment', paymentSchema);
