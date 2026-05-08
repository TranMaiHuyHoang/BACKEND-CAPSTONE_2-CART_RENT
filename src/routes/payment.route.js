const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");
const validate = require("../middlewares/validate.middleware");
const paymentValidation = require("../validations/payment.validation");

router.post(
    "/:bookingId/createPayment",
    authMiddleware,
    paymentValidation.createPaymentForBooking,
    validate,
    paymentController.createPaymentForBooking
);

router.post(
    "/processRefund",
    authMiddleware,
    authorizeRoles("admin"),
    paymentValidation.processRefund,
    validate,
    paymentController.processRefund
);

router.get(
    "/getRefundInfo/:paymentIntentId",
    authMiddleware,
    authorizeRoles("admin"),
    paymentValidation.getRefundInfo,
    validate,
    paymentController.getRefundInfo
);

// router.post(
//   '/cancelExpiredStripeIntent/:intentId',
//   authMiddleware,
//   authorizeRoles("admin"),
//   paymentValidation.cancelExpiredStripeIntent,
//   validate,
//   paymentController.cancelExpiredStripeIntent
// );

router.post(
    "/createPaymentDB",
    authMiddleware,
    authorizeRoles("admin"),
    paymentValidation.createPaymentDB,
    validate,
    paymentController.createPaymentDB
);

router.get(
    "/getPaymentIntent/:intentId",
    authMiddleware,
    paymentValidation.getPaymentIntentById,
    validate,
    paymentController.getPaymentIntentById
);

router.get(
    "/getPaymentById/:paymentId",
    authMiddleware,
    paymentValidation.getPaymentDBById,
    validate,
    paymentController.getPaymentDBById
);

router.post(
    "/getListPayments",
    authMiddleware,
    authorizeRoles("admin"),
    paymentValidation.getListPayments,
    validate,
    paymentController.getListPaymentDB
);

router.get(
    "/getPaymentState/:bookingId",
    authMiddleware,
    paymentValidation.getPaymentState,
    validate,
    paymentController.getPaymentState
);

router.patch(
    "/updatePaymentStatus/:paymentId",
    authMiddleware,
    authorizeRoles("admin"),
    paymentValidation.updatePaymentStatus,
    validate,
    paymentController.updatePaymentStatus
);

router.post(
    "/confirmPayment",
    authMiddleware,
    paymentValidation.confirmPayment,
    validate,
    paymentController.confirmPayment
);

module.exports = router;
