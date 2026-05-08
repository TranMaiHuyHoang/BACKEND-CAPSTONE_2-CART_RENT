const OutboxModel = require('../models/outbox.model');

/** Số lần claim tối đa (mỗi lần claim tăng retry_count). Sau lần thứ này không pick event nữa. */
const MAX_OUTBOX_ATTEMPTS = 5;

class OutboxService {

    static async createEvent({
        eventType,
        aggregateType,
        aggregateId,
        payload = {},
        dedupeKey,
        session = null
    }) {
        const doc = {
            event_type: eventType,
            aggregate_type: aggregateType,
            aggregate_id: aggregateId,
            payload,
            dedupe_key: dedupeKey
        };

        const [event] = await OutboxModel.create([doc], session ? { session } : undefined);
        return event;
    }

    static async claimNextEvent(eventTypes = []) {
        const now = new Date();
        const filter = {
            status: { $in: ['pending', 'failed'] },
            retry_count: { $lt: MAX_OUTBOX_ATTEMPTS },
            $or: [{ next_retry_at: null }, { next_retry_at: { $lte: now } }]
        };

        if (eventTypes.length > 0) {
            filter.event_type = { $in: eventTypes };
        }

        return OutboxModel.findOneAndUpdate(
            filter,
            {
                $set: { status: 'processing', last_error: null },
                $inc: { retry_count: 1 }
            },
            { new: true, sort: { createdAt: 1 } }
        );
    }

    static async markCompleted(eventId, result = null) {
        return OutboxModel.findByIdAndUpdate(
            eventId,
            {
                status: 'completed',
                result,
                processed_at: new Date(),
                next_retry_at: null
            },
            { new: true }
        );
    }

    static async markFailed(eventId, error, retryDelayMs = 60000) {
        const errMsg = error?.message || String(error);

        const exhausted = await OutboxModel.findOneAndUpdate(
            {
                _id: eventId,
                retry_count: { $gte: MAX_OUTBOX_ATTEMPTS }
            },
            {
                $set: {
                    status: 'dead',
                    last_error: errMsg,
                    next_retry_at: null,
                    result: {
                        exhaustedRetries: true,
                        maxAttempts: MAX_OUTBOX_ATTEMPTS
                    }
                }
            },
            { new: true }
        );

        if (exhausted) {
            return exhausted;
        }

        const nextRetryAt = new Date(Date.now() + retryDelayMs);
        return OutboxModel.findByIdAndUpdate(
            eventId,
            {
                status: 'failed',
                last_error: errMsg,
                next_retry_at: nextRetryAt
            },
            { new: true }
        );
    }
}

module.exports = OutboxService;
module.exports.MAX_OUTBOX_ATTEMPTS = MAX_OUTBOX_ATTEMPTS;
