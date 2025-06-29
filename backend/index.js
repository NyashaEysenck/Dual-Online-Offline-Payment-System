const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const ip = require('ip');
const qrcode = require('qrcode');
const http = require('http');
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Offline payment server routes (consolidated from server.js)
const localIpAddress = 'localhost';
const PORT = process.env.PORT || 5000;
const serverUrl = `http://${localIpAddress}:${PORT}`;

// Generate QR code with server URL
const generateQRCode = async () => {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(serverUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

// Server info endpoint for offline payments
app.get('/api/server-info', async (req, res) => {
  try {
    const qrCodeDataUrl = await generateQRCode();
    res.json({
      serverUrl,
      qrCodeDataUrl,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting server info:', error);
    res.status(500).json({ error: 'Failed to get server information' });
  }
});

// Offline payments endpoint (using persistent storage)
app.post('/api/payments', async (req, res) => {
  try {
    console.log('Received payment request at /api/payments:', req.body);
    const { sender, recipient = 'server-user', amount, note, type = 'offline', timestamp = Date.now() } = req.body;

    // Validate request
    if (!sender || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment request' });
    }

    // Generate unique IDs for the transaction and receipt
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create transaction record using the Transaction model
    const Transaction = require('./models/Transaction');
    const User = require('./models/User');

    // Find sender and recipient users
    const senderUser = await User.findOne({ email: sender });
    const recipientUser = await User.findOne({ email: recipient });

    if (!senderUser) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Create recipient if it doesn't exist (for server-user)
    let recipientId = null;
    if (recipientUser) {
      recipientId = recipientUser._id;
    } else if (recipient === 'server-user') {
      // Create a default server user if it doesn't exist
      const serverUser = new User({
        username: 'Server User',
        email: 'server-user',
        password: 'dummy-password' // This won't be used for login
      });
      await serverUser.save();
      recipientId = serverUser._id;
    }

    const transaction = new Transaction({
      transaction_id: transactionId,
      sender_id: senderUser._id,
      receiver_id: recipientId,
      amount: parseFloat(amount),
      note: note || null,
      status: 'completed',
      transaction_type: 'payment',
      offline_method: 'QR',
      token_id: receiptId,
      created_at: new Date(timestamp)
    });

    await transaction.save();
    console.log('Transaction stored in database:', transaction);

    // Return receipt
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      receipt: {
        receiptId,
        transactionId,
        amount: parseFloat(amount),
        sender,
        recipient,
        timestamp,
        type: type || 'offline',
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Error handling middleware
app.use(errorHandler);

// Start HTTP server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running at ${serverUrl}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
    process.exit(1);
  }
});

module.exports = { app, server };