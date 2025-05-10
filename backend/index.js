const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const deviceRoutes = require('./routes/device');
const walletRoutes = require('./routes/wallet');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin === 'http://localhost:5173') {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 3600
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Banko Simulate API');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Error handling middleware
app.use(errorHandler);

// Start HTTP server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
