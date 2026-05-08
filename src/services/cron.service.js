

// -------------------------------------------------------------------
// Required modules / models / services
// -------------------------------------------------------------------
const cron = require('node-cron');                     // scheduler
const OutboxService = require('./outbox.service');
const BookingModel = require('../models/booking.model');
const PaymentModel = require('../models/payment.model');
const BookingService = require('./booking.service');
const paymentService = require('./payment.service');
// Services (adjust the relative paths if they differ in your project)
const bookingHandler = require('./bookingHandler.service')
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/31c15c6b-ac5a-49d1-8816-968cda90a5f5';
// -------------------------------------------------------------------
// Cron — schedule: * * * * * (mỗi phút; chỉnh trong cron.schedule nếu cần)
// -------------------------------------------------------------------




const initCron = () => {
    cron.schedule('* * * * *', async () => {
        console.log('--- Đang xử lý Outbox events ---');
        while (true) {
            const event = await OutboxService.claimNextEvent([
                'booking.cancel.started',
                'booking.full_cancel.started',
                'booking.cancel.refund.retry_required'
            ]);

            if (!event) break;

            try {
                const bookingId = event.payload?.bookingId;
                const paymentId = event.payload?.paymentId;

                if (!bookingId || !paymentId) {
                    throw new Error(`Outbox payload không hợp lệ cho event ${event._id}`);
                }

                // Idempotency guard: skip event nếu Booking/Payment đã về trạng thái cuối.
                // Lưu ý: block này thêm 2 query DB + 1 log, có thể làm giảm hiệu năng và gây nhiễu log nếu lạm dụng.
                const [booking, payment] = await Promise.all([
                    BookingModel.findById(bookingId),
                    PaymentModel.findById(paymentId),
                ]);
                const currentBookingStatus = booking?.status;
                const currentPaymentStatus = payment?.payment_status;


                // ==================== TERMINAL STATE GUARD ====================
                if (BookingService.isTerminalBookingStatus(currentBookingStatus)) {

                    const paymentIsTerminal = currentPaymentStatus === 'refunded' ||
                    currentPaymentStatus === 'cancelled';

                    // Chỉ skip khi CẢ HAI đều đã terminal
                    if (paymentIsTerminal) {
                        const action = currentPaymentStatus === 'refunded' ? 'refund' : 'cancel';

                        console.log(`[SKIP-${action.toUpperCase()}] Event ${event._id} - Đã hoàn tất`);

                        await OutboxService.markCompleted(event._id, {
                            stripeAction: action,
                            bookingStatus: currentBookingStatus,
                            paymentStatus: currentPaymentStatus,
                            skippedByTerminalStateGuard: true
                        });
                        continue;
                    }

                    // Nếu booking terminal nhưng payment CHƯA terminal → PHẢI XỬ LÝ
                    // (để update payment status)
                    console.log(`[PROCESS] Booking đã cancelled nhưng payment vẫn ${paymentStatus} → tiếp tục reversal`);
                }

                // 1. Lấy trạng thái đã được chuẩn hóa (ví dụ: 'refunded' hoặc 'cancelled')
                if (!payment?.stripe_payment_intent_id) {
                    throw new Error(`Payment ${paymentId} không có stripe_payment_intent_id`);
                }
                const  {
                    paymentStatus,
                    bookingStatus,
                    vehicleStatus,
                    actionType
                } = await paymentService.handleStripeReversal(payment.stripe_payment_intent_id);


                // 2. Truyền vào hàm xử lý DB dưới dạng Object
                await bookingHandler.finalizeDBAfterStripe({
                    bookingId: bookingId,
                    paymentStatus: paymentStatus,
                    bookingStatus: bookingStatus,
                    vehicleStatus: vehicleStatus,
                    isDebug: true
                });
                await OutboxService.markCompleted(event._id, {
                    stripeAction: actionType,
                    bookingStatus: bookingStatus,
                    paymentStatus: paymentStatus,
                    vehicleStatus: vehicleStatus,
                });

                console.log(`[Outbox Success] Event ${event._id} đã xử lý xong.`);
            }
            catch (err) {
                // #region agent log
                fetch(DEBUG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'pre-fix',hypothesisId:'H5',location:'src/services/cron.service.js:103',message:'Cron event error',data:{errName:err?.name||null,errType:err?.type||null,errMessage:err?.message||null,errStackTop:String(err?.stack||'').split('\n')[0]||null},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                const fatalErrors = [
                    'StripeInvalidRequestError',
                    'StripeIdempotencyError',
                    'StripeAuthenticationError',
                    'StripePermissionError'
                ];

                if (fatalErrors.includes(err.type || '')) {
                    await OutboxService.createEvent({
                        eventType: 'booking.cancel.reversal.fatal',
                        aggregateType: 'booking',
                        aggregateId: event.aggregate_id,
                        payload: {
                            bookingId: event.payload?.bookingId || null,
                            paymentId: event.payload?.paymentId || null,
                            vehicleId: event.payload?.vehicleId || null,
                            amount: event.payload?.amount || null,
                            reason: event.payload?.reason || null,
                            previousBookingStatus: event.payload?.previousBookingStatus || null,
                            bookingStatus: event.payload?.bookingStatus || null,
                            previousPaymentStatus: event.payload?.previousPaymentStatus || null,
                            paymentStatus: event.payload?.paymentStatus || null,
                            previousVehicleStatus: event.payload?.previousVehicleStatus || null,
                            vehicleStatus: event.payload?.vehicleStatus || null,
                            errorType: err.type,
                            errorMessage: err.message
                        },
                        dedupeKey: `booking.cancel.reversal.fatal:${event.aggregate_id}:${err.type}`
                    });
                    await OutboxService.markFailed(event._id, err, 5 * 60 * 1000);
                    console.error(`[FATAL] Event ${event._id} lỗi nghiêm trọng.`);
                } else {
                    await OutboxService.markFailed(event._id, err, 60 * 1000);
                    console.warn(`[RETRY] Event ${event._id} sẽ được thử lại. Lỗi: ${err.message}`);
                }
            }
        }
    }
    );
}

module.exports = initCron;