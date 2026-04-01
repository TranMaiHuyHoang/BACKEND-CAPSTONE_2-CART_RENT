require('dotenv').config();
//https://wise.com/gb/blog/stripe-payments-test-cards



const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('../models/payment.model');
const throwError = require('../utils/throwError');
const BookingService = require('./booking.service');


const ALLOWED_PAYMENT_STATUSES = [
  'pending',
  'waiting_payment'
];
class PaymentService {
  async createPaymentForBooking(bookingId) {
    // Lấy booking, ngoài ra còn lấy total price để tạo amount trong payment db
    const booking = await BookingService.getBookingById(bookingId);
    if (!booking) throwError('Không tìm thấy booking', 404);

    // Kiểm tra có được phép thanh toán không
    if (!ALLOWED_PAYMENT_STATUSES.includes(booking.status)) {
      throwError('Booking không thể thanh toán', 400);
    }

    // Tìm payment cũ
    let payment = await PaymentModel.findOne({
      booking_id: bookingId,
      payment_status: 'pending'
    }).lean();

    // Nếu chưa có thì tạo mới
    if (!payment) {
      payment = await this.createPaymentDB({
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
      intent = await this.getPaymentIntentById(payment.stripe_payment_intent_id);
    } else {
      // Nếu chưa có → tạo mới
      intent = await this.createPaymentIntent({
        paymentId: payment._id
      });

      await PaymentModel.findByIdAndUpdate(payment._id, {
        stripe_payment_intent_id: intent.id
      });

    }

    return { ...payment, stripe_payment_intent_id: intent.id, client_secret: intent.client_secret };
  }


  async createPaymentIntent(body = {}) {
  const { paymentId } = body;

  const payment = await this.getPaymentDBById(paymentId);

  if (!payment) {
    throw throwError('Payment không tồn tại', 404);
  }

  if (payment.payment_status !== "pending") {
    throw throwError('Chỉ có thanh toán pending mới được tạo intent', 400);
  }

  const intent = await stripe.paymentIntents.create({
    amount: payment.amount,
    currency: payment.currency,
    metadata: {
      booking_id: payment.booking_id.toString(),
      payment_id: payment.id.toString()
    }
  });

  return intent;
}



  async createPaymentDB(body) {
    const transactionCode = `TXN-${Date.now()}`;

    const payment = await PaymentModel.create({
      transaction_code: transactionCode,
      ...body
    });

    return payment.toObject();
  }

    async getPaymentIntentById(intentId) {
  return await stripe.paymentIntents.retrieve(intentId);
}



  async getPaymentDBById(paymentId) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      throw throwError('Không tìm thấy dữ liệu thanh toán', 404);
    }
    return payment.toObject();
  }


  async updatePaymentDBStatus(paymentId, newStatus) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) throw throwError('Không tìm thấy dữ liệu thanh toán', 404);

    payment.payment_status = newStatus;

    await payment.save();
    return payment.toObject();
  }




  async processEvent(event) {
    const updatePaymentAndBooking = async (intent, paymentStatus, bookingStatus, logMessageFn) => {
      const paymentId = intent.metadata.payment_id;
      const payment = await this.getPaymentDBById(paymentId);

      await this.updatePaymentDBStatus(paymentId, paymentStatus);
      await BookingService.updateBookingStatus(payment.booking_id, bookingStatus);

      if (paymentStatus === 'successful') {
        payment.paid_at = new Date();
        await payment.save();
      }

      console.log(logMessageFn(intent));
    };

    switch (event.type) {
      case "payment_intent.succeeded":
        await updatePaymentAndBooking(
          event.data.object,
          'successful',
          'paid',
          (intent) => `Thanh toán ${intent.amount} ${intent.currency} thành công!`
        );
        break;

      case "payment_intent.payment_failed":
        await updatePaymentAndBooking(
          event.data.object,
          'failed',
          'waiting_payment',
          (intent) => `Thanh toán ${intent.amount} ${intent.currency} thất bại!`
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}




module.exports = new PaymentService();