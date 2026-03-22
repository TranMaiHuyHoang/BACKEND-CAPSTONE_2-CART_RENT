const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/booking.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const bookingValidation = require("../validations/booking.validation");

router.post("/", authMiddleware, bookingValidation.createBooking, validate, bookingController.createBooking);
router.get("/", authMiddleware, bookingValidation.getAllBookings, validate, bookingController.getAllBookings);
router.get("/:id", authMiddleware, bookingValidation.getBookingById, validate, bookingController.getBookingById);
router.patch("/:id/status", authMiddleware, bookingValidation.updateBookingStatus, validate, bookingController.updateBookingStatus);
router.delete("/:id", authMiddleware, bookingValidation.deleteBooking, validate, bookingController.deleteBooking);


module.exports = router;