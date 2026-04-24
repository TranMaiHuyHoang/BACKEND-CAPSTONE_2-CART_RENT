
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('../models/payment.model');
const PaymentService = require('./payment.service');
const BookingService = require('./booking.service');
const mongoose = require('mongoose');
const paymentService = require('./payment.service');
const BookingModel = require('../models/booking.model');
const paymentModel = require('../models/payment.model');
const throwError = require('../utils/throwError');

const ALLOWED_PAYMENT_STATUSES = [
    'pending',
    'waiting_payment'
];

/** 
 * Tách riêng service để tránh bị circular dependency giữa booking service và payment service
*/
class BookingPaymentService {

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


    async cancelBookingWithRefund(bookingId) {
        const session = await mongoose.startSession();

        let refund = null;
        let paymentStatus = null;
        let bookingStatus = 'cancel_pending';
        let payment = null;
        let result = null;
        try {
            // 1. validate
            payment = await PaymentModel.findOne({ booking_id: bookingId });
            if (!payment) throwError('Không tìm thấy payment', 404);

            await session.withTransaction(async () => {
                // cancel booking (reuse)
                await BookingService.updateBookingStatus(
                    bookingId,
                    'cancel_pending',
                    { session }
                );
                if (['pending', 'failed'].includes(payment.payment_status)) {

                    paymentStatus = 'declined';

                    await PaymentService.updatePaymentDBStatus(
                        payment._id,
                        paymentStatus,
                        { session }
                    );
                }
            });
            //ngoài transaction
            // 3. gọi refund (ngoài transaction)
            if (payment.payment_status === 'successful') {
                try {
                    refund = await PaymentService.processRefund(
                        payment,
                        'requested_by_customer'
                    );

                    paymentStatus = 'refunded';
                    bookingStatus = 'cancelled';
                    await PaymentService.updatePaymentDBStatus(
                        payment._id,
                        paymentStatus
                    );
                    // Cập nhật trạng thái cuối cùng sau khi Stripe OK
                    await Promise.all([
                        BookingService.updateBookingStatus(bookingId, bookingStatus),
                        PaymentService.updatePaymentDBStatus(payment._id, paymentStatus)
                    ]);
                }
                catch (stripeError) {
                    bookingStatus = 'cancel_failed';
                    await BookingService.updateBookingStatus(bookingId, bookingStatus);
                    console.error("Stripe Refund Error:", stripeError);
                    throwError(`Lỗi hoàn tiền: ${stripeError.message}`, 500);
                }
            }
            else if (paymentStatus === 'declined') {
                bookingStatus = 'cancelled'; // Nếu ko có refund, hủy luôn đơn
                await BookingService.updateBookingStatus(bookingId, bookingStatus);
            }
            result = {
                bookingId,
                bookingStatus,
                paymentStatus,
                refundId: refund?.id || null,
                intentId: refund?.payment_intent || null,
                refundStatus: refund?.status || null
            }
        }
        finally {
            await session.endSession();
        }
        return result;
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

module.exports = new BookingPaymentService();