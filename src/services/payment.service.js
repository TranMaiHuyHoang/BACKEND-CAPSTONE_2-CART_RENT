require('dotenv').config();
//https://wise.com/gb/blog/stripe-payments-test-cards



const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('../models/payment.model');
const throwError = require('../utils/throwError');
const BookingService = require('./booking.service');
const BaseService = require('./base.service');
const paymentModel = require('../models/payment.model');

const ALLOWED_PAYMENT_STATUSES = [
  'pending',
  'waiting_payment'
];

class QueryBuilder {
  static buildExactFieldFilter(filters = {}) {
    const filter = {};

    // Exact match filters: chỉ lấy những field có giá trị cụ thể
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        filter[key] = value;
      }
    }

    return filter;
  }

  static buildSearchFilter(search, fieldsObj = {}) {
    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), 'i');

      // Lấy tất cả key trong object (value không quan trọng)
      const fields = Object.keys(fieldsObj);

      if (fields.length > 0) {
        return { $or: fields.map((field) => ({ [field]: regex })) };
      }
    }
    return {};
  }

  static buildSortOptions(sorts = []) {
    const sort = {};

    // thêm các field khác
    for (const { field, value } of sorts) {
      const direction = BaseService.parseSortDirection(value);
      if (direction !== null) {
        sort[field] = direction;
      }
    }

    return sort;
  }
}

class PaymentService {
  async createPaymentForBooking(bookingId) {
    // Lấy booking, ngoài ra còn lấy total price để tạo amount trong payment db
    const booking = await BookingService.getBookingById(bookingId);
    if (!booking) throwError('Không tìm thấy booking', 404);

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

    if (payment.payment_status !== "pending") {
      throw throwError('Chỉ có thanh toán pending mới được tạo intent', 400);
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

    const intent = await stripe.paymentIntents.create({
      amount: payment.amount,
      currency: payment.currency,
      metadata: {
        booking_id: payment.booking_id.toString(),
        payment_id: payment._id.toString()
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
    return payment
  }

  async getListPaymentDB(body = {}) {
    const {
      search,
      page,
      limit,
      sort_by,
      sort_by_amount,
      transaction_code,
      booking_id
    } = body;

    // Pagination
    const pagination = BaseService.parsePagination({ page, limit });

    const searchFilter = QueryBuilder.buildSearchFilter(search, { transaction_code });

    const fieldFilter = QueryBuilder.buildExactFieldFilter({ booking_id });
    const filter = { $and: [searchFilter, fieldFilter] };
    const sortObj = QueryBuilder.buildSortOptions([{ field: 'amount', value: sort_by_amount }
      , { field: 'createdAt', value: sort_by }
    ]

    );
    return BaseService.findPaginated(paymentModel, filter, sortObj, pagination);
  }





  async updatePaymentDBStatus(paymentId, newStatus) {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) throw throwError('Không tìm thấy dữ liệu thanh toán', 404);

    payment.payment_status = newStatus;

    await payment.save();
    return payment.toObject();
  }
  async syncPaymentIntentWithDB(paymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    let payment, booking;

    const updatePaymentAndBooking = async (intent, paymentStatus, bookingStatus, logMessageFn) => {
      const paymentId = intent.metadata.payment_id;
      const bookingId = intent.metadata.booking_id;

      payment = await this.getPaymentDBById(paymentId);
      await this.updatePaymentDBStatus(paymentId, paymentStatus);
      booking = await BookingService.updateBookingStatus(bookingId, bookingStatus);

      if (paymentStatus === 'successful') {
        await PaymentModel.findByIdAndUpdate(payment._id, { paid_at: new Date() });
      }

      console.log(logMessageFn(intent));
    };

    switch (intent.status) {
      case "succeeded":
        await updatePaymentAndBooking(
          intent,
          'successful',
          'paid',
          (i) => `Thanh toán ${i.amount} ${i.currency} thành công!`
        );
        break;

      case "requires_payment_method":
      case "canceled":
        await updatePaymentAndBooking(
          intent,
          'failed',
          'waiting_payment',
          (i) => `Thanh toán ${i.amount} ${i.currency} thất bại hoặc bị hủy!`
        );
        break;

      default:
        console.log(`Unhandled intent status ${intent.status}`);
    }

    // Trả về object result cho controller
    return { payment, booking, intent };
  }
}




module.exports = new PaymentService();