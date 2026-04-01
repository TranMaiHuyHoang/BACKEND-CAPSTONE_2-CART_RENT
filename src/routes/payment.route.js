
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.post('/createPaymentDB', paymentController.createPaymentDB);
router.get('/getPaymentIntent/:intentId', paymentController.getPaymentIntentById);
router.get("/getPaymentById/:paymentId",paymentController.getPaymentDBById);
router.post("/webhook",express.raw({ type: "application/json" }), paymentController.handleWebhook);



module.exports = router;