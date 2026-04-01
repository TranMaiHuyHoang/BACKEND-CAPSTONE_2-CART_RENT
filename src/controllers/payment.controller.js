const paymentService = require('../services/payment.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('../models/payment.model');

class PaymentController {
  async createPaymentForBooking(req, res, next) {
    try {
      const { bookingId } = req.params;

      const payment = await paymentService.createPaymentForBooking(bookingId);

      return res.status(201).json({
        message: 'Tạo thanh toán thành công',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }


  async createPaymentDB(req, res) {
    try {
      const { ...body } = req.body;
      const payment = await paymentService.createPaymentDB(body);
      res.status(201).json({ message: 'Tạo dữ liệu thanh toán thành công', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentDBById(req, res, next) {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.getPaymentDBById(paymentId);

      if (!payment) {
        return res.status(404).json({ error: "Không tìm thấy dữ liệu thanh toán" });
      }

      return res.status(200).json({message: "Lấy dữ liệu thanh toán thành công", data: payment});
    } catch (err) {
      next(err);
    }
  }

  

  async getPaymentIntentById(req, res, next) {
    try {
      const { intentId } = req.params;
      const paymentIntent = await paymentService.getPaymentIntentById(intentId );


      if (!paymentIntent) {
        return res.status(404).json({
          message: 'Không tìm thấy Payment Intent'
        });
      }


      return res.status(200).json({
        message: 'Lấy Payment Intent thành công',
        data: {
          clientSecret: paymentIntent.client_secret,
        }
      });
    } catch (error) {
      next(error);
    }
  }
  async handleWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.sendStatus(400);
    }
    
    // Gọi service để xử lý event
    await paymentService.processEvent(event);

    res.sendStatus(200);
  }

}

module.exports = new PaymentController();