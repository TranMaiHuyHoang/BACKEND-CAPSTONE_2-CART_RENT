const { body, param } = require("express-validator");

const PAYMENT_METHODS = [
    'stripe',
    'Debit/Credit Card',
    'Paypal',
    'Bank Transfer',
    'Cash',
    'Bitcoin',
    'Ethereum'
];

const PAYMENT_STATUSES = [
    'pending',
    'processing',
    'declined',
    'cancelled',
    'successful',
    'failed',
    'refunded'
];

const REFUND_REASONS = ['requested_by_customer', 'fraudulent', 'duplicate'];

const STRIPE_INTENT_REGEX = /^pi_[A-Za-z0-9_]+$/;
const STRIPE_INTENT_MSG = "Stripe Payment Intent ID không hợp lệ (phải bắt đầu bằng 'pi_')";

class PaymentValidation {
    createPaymentForBooking = [
        param("bookingId")
            .notEmpty().withMessage("bookingId không được để trống")
            .isMongoId().withMessage("bookingId phải là MongoId hợp lệ"),
    ];

    createPaymentDB = [
        body("booking_id")
            .notEmpty().withMessage("booking_id không được để trống")
            .isMongoId().withMessage("booking_id phải là MongoId hợp lệ"),

        body("amount")
            .notEmpty().withMessage("amount không được để trống")
            .isFloat({ gt: 0 }).withMessage("amount phải là số lớn hơn 0"),

        body("currency")
            .optional()
            .isString().withMessage("currency phải là chuỗi ký tự")
            .isLength({ min: 3, max: 3 }).withMessage("currency phải có 3 ký tự (ISO 4217)")
            .isAlpha().withMessage("currency chỉ chứa ký tự chữ cái"),

        body("payment_method")
            .optional()
            .isIn(PAYMENT_METHODS)
            .withMessage(`payment_method phải là một trong: ${PAYMENT_METHODS.join(" | ")}`),

        body("payment_status")
            .optional()
            .isIn(PAYMENT_STATUSES)
            .withMessage(`payment_status phải là một trong: ${PAYMENT_STATUSES.join(" | ")}`),

        body("stripe_payment_intent_id")
            .optional()
            .isString().withMessage("stripe_payment_intent_id phải là chuỗi")
            .matches(STRIPE_INTENT_REGEX).withMessage(STRIPE_INTENT_MSG),

        body("paid_by")
            .optional()
            .isMongoId().withMessage("paid_by phải là MongoId hợp lệ"),
    ];

    getPaymentDBById = [
        param("paymentId")
            .notEmpty().withMessage("paymentId không được để trống")
            .isMongoId().withMessage("paymentId phải là MongoId hợp lệ"),
    ];

    getPaymentIntentById = [
        param("intentId")
            .notEmpty().withMessage("intentId không được để trống")
            .matches(STRIPE_INTENT_REGEX).withMessage(STRIPE_INTENT_MSG),
    ];

    getListPayments = [
        body("search").optional().trim().isString().withMessage("search phải là chuỗi"),

        body("page")
            .optional()
            .isInt({ min: 1 }).withMessage("page phải là số nguyên >= 1"),

        body("limit")
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage("limit phải từ 1 đến 100"),

        body("sort_by")
            .optional()
            .toInt()
            .isIn([-1, 1]).withMessage("sort_by phải là -1 (mới nhất) hoặc 1 (cũ nhất)"),

        body("sort_by_amount")
            .optional()
            .toInt()
            .isIn([-1, 1]).withMessage("sort_by_amount phải là -1 (giảm dần) hoặc 1 (tăng dần)"),

        body("transaction_code")
            .optional()
            .isString().withMessage("transaction_code phải là chuỗi")
            .trim(),

        body("booking_id")
            .optional()
            .isMongoId().withMessage("booking_id phải là MongoId hợp lệ"),
    ];

    getPaymentState = [
        param("bookingId")
            .notEmpty().withMessage("bookingId không được để trống")
            .isMongoId().withMessage("bookingId phải là MongoId hợp lệ"),
    ];

    updatePaymentStatus = [
        param("paymentId")
            .notEmpty().withMessage("paymentId không được để trống")
            .isMongoId().withMessage("paymentId phải là MongoId hợp lệ"),

        body("paymentStatus")
            .notEmpty().withMessage("paymentStatus không được để trống")
            .isIn(PAYMENT_STATUSES)
            .withMessage(`paymentStatus phải là một trong: ${PAYMENT_STATUSES.join(" | ")}`),
    ];

    processRefund = [
        body("paymentId")
            .notEmpty().withMessage("paymentId không được để trống")
            .isMongoId().withMessage("paymentId phải là MongoId hợp lệ"),

        body("refundReason")
            .optional()
            .isIn(REFUND_REASONS)
            .withMessage(`refundReason phải là một trong: ${REFUND_REASONS.join(" | ")}`),
    ];

    getRefundInfo = [
        param("paymentIntentId")
            .notEmpty().withMessage("paymentIntentId không được để trống")
            .matches(STRIPE_INTENT_REGEX).withMessage(STRIPE_INTENT_MSG),
    ];


    confirmPayment = [
        body("paymentIntentId")
            .notEmpty().withMessage("paymentIntentId không được để trống")
            .isString().withMessage("paymentIntentId phải là chuỗi")
            .matches(STRIPE_INTENT_REGEX).withMessage(STRIPE_INTENT_MSG),
    ];
}

module.exports = new PaymentValidation();
