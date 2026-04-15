require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const dashboardsRoutes = require('./routes/dashboards');
const datasetsRoutes = require('./routes/datasets');
const paymentsRoutes = require('./routes/payments');

const app = express();

// --- CORS MUST come first before any other middleware ---

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    // or from any localhost port during development
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200  // Some legacy browsers (IE11) choke on 204
};

// Apply CORS globally
app.use(cors(corsOptions));

// Handle ALL preflight OPTIONS requests explicitly — this MUST be before routes
app.options('/{*path}', cors(corsOptions));

// Specific headers for Firebase Google Popup COOP issues
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// JSON Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes setup ---

app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardsRoutes);
app.use('/api/datasets', datasetsRoutes);
app.use('/api/upload', datasetsRoutes);
app.use('/api/payment', paymentsRoutes);

// Healthcheck Route
app.get('/', (req, res) => {
  res.status(200).json({ status: "SmartDash API is running flawlessly." });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server successfully started on http://localhost:${PORT}`);
});
