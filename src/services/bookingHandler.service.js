
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('../models/payment.model');
const PaymentService = require('./payment.service');
const BookingService = require('./booking.service');
const vehicleService = require('./vehicle.service');

const mongoose = require('mongoose');
const paymentService = require('./payment.service');
const BookingModel = require('../models/booking.model');
const paymentModel = require('../models/payment.model');
const VehicleModel = require('../models/vehicle.model');
const OutboxService = require('./outbox.service');
const throwError = require('../utils/throwError');

const ALLOWED_PAYMENT_STATUSES = [
    'pending',
    'waiting_payment'
];

/** 
 * Tách riêng service để tránh bị circular dependency giữa booking service và payment service
 * ngoài ra còn chưa các logic nghiệp vụ liên kết (Hủy đơn = Stripe + Booking + Vehicle).
*/
class bookingHandlerService {
    buildOutboxSnapshotPayload({
        booking,
        payment,
        vehicle,
        reason = null,
        previousBookingStatus = null,
        bookingStatus = null,
        previousPaymentStatus = null,
        paymentStatus = null,
        previousVehicleStatus = null,
        vehicleStatus = null,
        refundId = null,
        refundStatus = null,
        error = null
    }) {
        return {
            bookingId: booking?._id?.toString() || null,
            paymentId: payment?._id?.toString() || null,
            vehicleId: booking?.vehicle_id?.toString() || null,
            amount: payment?.amount ?? null,
            reason,
            refundId,
            refundStatus,
            error,
            previousBookingStatus,
            bookingStatus,
            previousPaymentStatus,
            paymentStatus,
            previousVehicleStatus,
            vehicleStatus
        };
    }

    async createPaymentForBooking(bookingId) {
        const session = await mongoose.startSession();
        let result;
        try {
            await session.withTransaction(async () => {
                // Lấy booking, ngoài ra còn lấy total price để tạo amount trong payment db
                const booking = await BookingModel.findById(bookingId);
                if (!booking) throwError('Không tìm thấy booking cho payment này', 404);

                if (booking.status === "paid") {
                    throwError("Booking đã thanh toán", 400);
                }

                // Kiểm tra có được phép thanh toán không
                if (!ALLOWED_PAYMENT_STATUSES.includes(booking.status)) {
                    throwError(
                        `Booking ở trạng thái "${booking.status}" không thể thanh toán. 
        Chỉ các trạng thái được phép: ${ALLOWED_PAYMENT_STATUSES.join(', ')}`,
                        400
                    );
                }
                // Tìm payment cũ
                let payment = await PaymentModel.findOne({
                    booking_id: bookingId,
                    payment_status: 'pending'
                })

                if (payment && payment.payment_status !== "pending") {
                    throw throwError('Chỉ có thanh toán pending mới được tạo intent', 400);
                }

                // Nếu chưa có thì tạo mới
                if (!payment) {
                    payment = await paymentService.createPaymentDB({
                        booking_id: bookingId,
                        amount: booking.total_price,
                        payment_status: 'pending'
                    });
                    await BookingService.updateBookingStatus(
                        bookingId,
                        'waiting_payment'
                    );

                }

                let intent;
                // Nếu đã có intent → dùng lại
                if (payment.stripe_payment_intent_id) {
                    intent = await paymentService.getPaymentIntentById(payment.stripe_payment_intent_id);

                } else {
                    // Nếu chưa có → tạo mới
                    intent = await paymentService.createPaymentIntent({
                        paymentId: payment._id
                    });

                    await paymentModel.findByIdAndUpdate(payment._id, {
                        stripe_payment_intent_id: intent.id
                    });

                }
                result = { ...payment, stripe_payment_intent_id: intent.id, client_secret: intent.client_secret };
            })
        }
        finally {
            session.endSession();
        }
        return result;
    }
    async processFullCancellation(bookingId, paymentIntentId, cancellation_reason = 'requested_by_customer') {
        const session = await mongoose.startSession();
        let result = null;
        try {
            await session.withTransaction(async () => {
                const booking = await BookingModel.findById(bookingId).session(session);
                if (!booking) throwError('Không tìm thấy booking', 404);

                const payment = await PaymentModel.findOne({ booking_id: bookingId }).session(session);
                if (!payment) throwError('Không tìm thấy payment', 404);

                let nextPaymentStatus = payment.payment_status;
                await BookingService.updateBookingStatus(bookingId, 'processing', { session });

                if (['pending', 'failed'].includes(payment.payment_status)) {
                    nextPaymentStatus = 'processing';
                    await PaymentService.updatePaymentDBStatus(payment._id, nextPaymentStatus, { session });
                }

                const vehicle = await VehicleModel.findById(booking.vehicle_id).session(session);
                await OutboxService.createEvent({
                    eventType: 'booking.full_cancel.started',
                    aggregateType: 'booking',
                    aggregateId: bookingId,
                    payload: this.buildOutboxSnapshotPayload({
                        booking,
                        payment,
                        vehicle,
                        reason: cancellation_reason,
                        previousBookingStatus: booking.status,
                        bookingStatus: 'processing',
                        previousPaymentStatus: payment.payment_status,
                        paymentStatus: nextPaymentStatus,
                        previousVehicleStatus: vehicle?.status || null,
                        vehicleStatus: vehicle?.status || null
                    }),
                    dedupeKey: `booking.full_cancel.started:${bookingId}:${payment._id}`,
                    session
                });

                result = {
                    success: true,
                    message: "Đã ghi nhận yêu cầu hủy, hệ thống đang xử lý qua outbox.",
                    data: {
                        bookingId,
                        bookingStatus: 'processing',
                        paymentStatus: nextPaymentStatus,
                        paymentIntentId: paymentIntentId || payment.stripe_payment_intent_id || null
                    }
                };
            });
            return result;
        } finally {
            session.endSession();
        }
    }



    async cancelBookingWithRefund(bookingId) {
        const session = await mongoose.startSession();

        let paymentStatus = null;
        let bookingStatus = 'processing';
        let payment = null;
        let booking = null;
        let vehicle = null;
        let result = null;
        const refundReason = 'requested_by_customer';
        try {
            // 1. validate
            payment = await PaymentModel.findOne({ booking_id: bookingId });
            if (!payment) throwError('Không tìm thấy payment', 404);
            booking = await BookingModel.findById(bookingId);
            if (!booking) throwError('Không tìm thấy booking', 404);
            vehicle = await VehicleModel.findById(booking.vehicle_id);

            await session.withTransaction(async () => {
                // cancel booking (reuse)
                await BookingService.updateBookingStatus(
                    bookingId,
                    'processing',
                    { session }
                );
                // Chỉ đánh dấu in-flight cho các trạng thái có thể chuyển sang processing.
                if (['pending', 'failed'].includes(payment.payment_status)) {
                    paymentStatus = 'processing';
                    await PaymentService.updatePaymentDBStatus(payment._id, paymentStatus, { session });
                } else {
                    paymentStatus = payment.payment_status;
                }
                await OutboxService.createEvent({
                    eventType: 'booking.cancel.started',
                    aggregateType: 'booking',
                    aggregateId: bookingId,
                    payload: this.buildOutboxSnapshotPayload({
                        booking,
                        payment,
                        vehicle,
                        reason: refundReason,
                        previousBookingStatus: booking.status,
                        bookingStatus: 'processing',
                        previousPaymentStatus: payment.payment_status,
                        paymentStatus,
                        previousVehicleStatus: vehicle?.status || null,
                        vehicleStatus: vehicle?.status || null
                    }),
                    dedupeKey: `booking.cancel.started:${bookingId}:${payment._id}`,
                    session
                });
            });
            result = {
                bookingId,
                bookingStatus,
                paymentStatus,
                intentId: payment?.stripe_payment_intent_id || null,
            }
        }
        finally {
            await session.endSession();
        }
        return result;
    }


        /**
     * Đồng bộ trạng thái cuối cùng giữa Stripe và Hệ thống sau khi xử lý tiền tệ.
     * Đảm bảo tính nguyên tử (Atomicity): Hủy đơn + Cập nhật tiền + Giải phóng xe.
     * 
     * Chỉ dùng hàm này khi bạn muốn ĐÓNG đơn hàng và TRẢ xe về kho. Không dùng khi muốn MỞ đơn hàng để bắt đầu chuyến đi.
     */
    async finalizeDBAfterStripe({
        bookingId,
        paymentStatus,
        bookingStatus,
        vehicleStatus,
        isDebug = false
    } = {}) {
    // Tạo hàm log nội bộ: chỉ in ra nếu isDebug = true
    const logDebug = (msg) => isDebug && console.log(`[DB-Debug] ${msg}`);

    logDebug(`Bắt đầu đồng bộ DB cho Booking: ${bookingId}.`);
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const booking = await BookingModel.findById(bookingId).session(session);
            if (!booking) throwError(`Không tìm thấy Booking: ${bookingId}`);

            // 1. Cập nhật Booking (đi qua transition hợp lệ)
            const updatedBooking = await BookingService.updateBookingStatus(
                bookingId,
                bookingStatus,
                { session }
            );
            logDebug(`Bước 1: OK - Booking cancelled`);

            // 2. Cập nhật Payment
            // Cập nhật trạng thái Payment linh hoạt hơn
        
            const payment = await PaymentModel.findOne({ booking_id: bookingId }).session(session);
            if (!payment) throwError(`Không tìm thấy Payment cho booking: ${bookingId}`);
            await PaymentService.updatePaymentDBStatus(payment._id, paymentStatus, { session });
            logDebug(`Bước 2: OK - Payment status:${paymentStatus}`);

            // 3. Nhả xe
            if (updatedBooking.vehicle_id) {
                await VehicleModel.findByIdAndUpdate(
                    updatedBooking.vehicle_id, 
                    { status: vehicleStatus }, 
                    { session }
                );
                logDebug(`Bước 3: OK - Xe available`);
            }
        });

        if (isDebug) console.log(`[DB-Success] ✅ Hoàn tất: ${bookingId}`);
    } catch (error) {
        // LUÔN hiện lỗi Fatal vì nó quan trọng cho team
        console.error(`[DB-Fatal] ❌ Booking ${bookingId}: ${error.message}`);
        throw error; 
    } finally {
        session.endSession();
    }
}


    async confirmPaymentFromStripe(paymentIntentId) {
        // 1. Stripe
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const { payment_id: paymentId, booking_id: bookingId } = intent.metadata;

        // 2. DB
        const payment = await PaymentService.getPaymentDBById(paymentId);

        // 3. Validate amount (chỉ khi success)
        if (intent.status === 'succeeded') {
            const expectedAmount = await PaymentService.ensureAmount(payment);

            if (intent.amount_received !== expectedAmount) {
                throwError('Sai lệch số tiền thanh toán giữa Stripe và hệ thống', 400);
            }
        }

        // 4. Inline mapping (gộp luôn)
        let paymentStatus = 'pending';
        let bookingStatus = 'pending';

        switch (intent.status) {
            case 'succeeded':
                paymentStatus = 'successful';
                bookingStatus = 'paid';
                break;

            case 'canceled':
            case 'requires_payment_method':
                paymentStatus = 'failed';
                bookingStatus = 'waiting_payment';
                break;

            default:
                // giữ pending
                break;
        }

        // 5. Transaction
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await PaymentService.updatePaymentDBStatus(
                    payment._id,
                    paymentStatus,
                    { session }
                );

                await BookingService.updateBookingStatus(
                    bookingId,
                    bookingStatus,
                    { session }
                );

                if (paymentStatus === 'successful') {
                    await PaymentModel.findByIdAndUpdate(
                        payment._id,
                        { paid_at: new Date() },
                        { session }
                    );
                }
            });
        } finally {
            await session.endSession();
        }

        // 6. Return
        return {
            intent,
            paymentId,
            bookingId,
            paymentStatus,
            bookingStatus
        };
    }



}

module.exports = new bookingHandlerService();