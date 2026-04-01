const express = require('express');
var morgan = require('morgan');
// import routes
const authRoutes = require('./routes/auth.route');
const uploadRoutes = require('./routes/upload.route');
const vehicleRoutes = require('./routes/vehicle.route')
const vehicleLocationRoutes = require('./routes/vehicleLocation.routes')
const contactUsRoutes = require('./routes/contactUs.route')
const bookingRoutes = require('./routes/booking.route')
const paymentRoutes = require('./routes/payment.route')
const webhookRouter = require('./routes/webhook.route')
// middleware for hand
const errorHandler = require('./middlewares/errorHandler');

const app = express();


app.use("/api/payment", webhookRouter); // raw body thay cho json
app.use(express.json());
require('dotenv').config();

app.use(morgan('dev'));
app.use('/api/uploads', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicle_location', vehicleLocationRoutes);
app.use('/api/contact_us', contactUsRoutes);
app.use('/api/booking/', bookingRoutes)
app.use('/api/payment/', paymentRoutes)
app.use(errorHandler);


module.exports = app;
