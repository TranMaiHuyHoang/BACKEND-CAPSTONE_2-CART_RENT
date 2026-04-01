const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

module.exports = router;
