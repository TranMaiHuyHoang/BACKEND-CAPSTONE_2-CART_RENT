const express = require('express');

// import routes
const authRoutes = require('./routes/auth.route');
const uploadRoutes = require('./routes/upload.route');

// middleware for hand
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use('/api/uploads', uploadRoutes);
app.use('/api/auth', authRoutes);

app.use(errorHandler);

module.exports = app;
