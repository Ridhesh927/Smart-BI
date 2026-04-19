require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const dashboardsRoutes = require('./routes/dashboards');
const datasetsRoutes = require('./routes/datasets');
const paymentsRoutes = require('./routes/payments');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/user');

const app = express();

// --- Middleware Setup ---

// Configure CORS to accept requests from frontend dev server
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};
app.use(cors(corsOptions));

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
// Optional mapping for just /api/upload for simpler semantic paths
app.use('/api/upload', datasetsRoutes); 
app.use('/api/payment', paymentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);

// Healthcheck Route
app.get('/', (req, res) => {
  res.status(200).json({ status: "Smart Dash API is running flawlessly." });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server successfully started on http://localhost:${PORT}`);
});
