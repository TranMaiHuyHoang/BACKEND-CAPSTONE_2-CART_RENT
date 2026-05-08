const mongoose = require('mongoose');

const outboxSchema = new mongoose.Schema(
    {
        event_type: { type: String, required: true, trim: true, index: true },
        aggregate_type: { type: String, required: true, trim: true, index: true },
        aggregate_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        payload: { type: mongoose.Schema.Types.Mixed, required: true },
        dedupe_key: { type: String, required: true, trim: true, unique: true },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'dead'],
            default: 'pending',
            index: true
        },
        retry_count: { type: Number, default: 0 },
        next_retry_at: { type: Date, default: null, index: true },
        last_error: { type: String, default: null },
        result: { type: mongoose.Schema.Types.Mixed, default: null },
        processed_at: { type: Date, default: null }
    },
    { timestamps: true }
);

outboxSchema.index({ status: 1, next_retry_at: 1, createdAt: 1 });
outboxSchema.index({ aggregate_type: 1, aggregate_id: 1, createdAt: -1 });

module.exports = mongoose.model('Outbox', outboxSchema);
