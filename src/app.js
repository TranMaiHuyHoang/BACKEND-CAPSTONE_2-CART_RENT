const express = require('express');

// import routes
const authRoutes = require('./routes/auth.route');


// middleware for hand
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);

app.use(errorHandler);

module.exports = app;
