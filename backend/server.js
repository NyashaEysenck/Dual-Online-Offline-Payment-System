const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const ip = require('ip');
const qrcode = require('qrcode');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 5000; // Changed to 5000 to match the frontend proxy

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Updated to match the Vite dev server
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 3600
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Store transactions in memory (in a real app, this would be a database)
const transactions = [];

// Get local IP address
const localIpAddress = 'localhost';
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

// API Routes
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

// Endpoint for compatibility with the online server
app.post('/api/payments', (req, res) => {
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

    // Create transaction record
    const transaction = {
      id: transactionId,
      sender,
      recipient,
      amount: parseFloat(amount),
      note,
      timestamp,
      receiptId,
      status: 'completed',
      type: type || 'offline',
    };

    // Store transaction in memory
    transactions.push(transaction);
    console.log('Transaction stored:', transaction);

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

// Legacy endpoint for backward compatibility
app.post('/api/transactions', (req, res) => {
  try {
    console.log('Received payment request at /api/transactions (legacy):', req.body);
    const { sender, recipient = 'server-user', amount, note, type = 'offline', timestamp = Date.now() } = req.body;

    // Validate request
    if (!sender || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment request' });
    }

    // Generate unique IDs for the transaction and receipt
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create transaction record
    const transaction = {
      id: transactionId,
      sender,
      recipient,
      amount: parseFloat(amount),
      note,
      timestamp,
      receiptId,
      status: 'completed',
      type: type || 'offline',
    };

    // Store transaction in memory
    transactions.push(transaction);
    console.log('Transaction stored (legacy):', transaction);

    // Return receipt
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      receiptId,
      transactionId,
      amount: parseFloat(amount),
      sender,
      recipient,
      timestamp,
      type: type || 'offline',
    });
  } catch (error) {
    console.error('Error processing payment (legacy):', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get all transactions
app.get('/api/transactions', (req, res) => {
  try {
    console.log('Returning all transactions:', transactions);
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get transaction by ID
app.get('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transaction = transactions.find(tx => tx.id === id || tx.receiptId === id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start the server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`HTTP Server running at ${serverUrl}`);
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
