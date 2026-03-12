const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
        amount: { type: Number, required: true },
        payment_method: {
            type: String,
            required: true,
            enum: ['Debit/Credit Card', 'Paypal', 'Bank Transfer', 'Cash', 'Bitcoin', 'Ethereum'],
            default: 'Debit/Credit Card'
        },
        payment_status: {
            type: String,
            required: true,
            enum: ['pending', 'declined', 'successful', 'failed'],
            default: 'pending'
        },
        transaction_code: { type: String, trim: true },
        paid_at: { type: Date },
        paid_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deleted_at: String
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
