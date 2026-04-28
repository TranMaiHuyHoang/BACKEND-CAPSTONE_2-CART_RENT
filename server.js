const dotenv = require("dotenv");

dotenv.config(); // load .env
const app = require('./src/app');
const connectDB = require('./src/config/db');
var cors = require('cors')
const PORT = process.env.PORT || 3000;


const allowedOrigins = new Set([
  process.env.FRONTEND_ORIGIN || 'http://localhost:5000', // frontend origin, sửa nếu cần
    'http://127.0.0.1:5000',
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, origin);
    } else {
        const err = new Error(`Origin ${origin} không được phép truy cập API này`);
      err.statusCode = 403;
      console.error('CORS blocked: ', err.message);
      callback(err);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));


connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
