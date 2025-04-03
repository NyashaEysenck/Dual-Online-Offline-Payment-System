const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const https = require('https'); // Add this
const fs = require('fs'); // Add this
require('dotenv').config();
 // In Node.js backend code
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 1. Load mkcert root CA
const caPath = `C:/Users/Administrator/AppData/Local/mkcert/rootCA.pem`; // Adjust path if needed
const caCert = fs.readFileSync(caPath);

// 2. HTTPS options for Express
const options = {
  key: fs.readFileSync('192.168.131.181-key.pem'), // Your mkcert-generated key
  cert: fs.readFileSync('192.168.131.181.pem'),    // Your mkcert-generated cert
  ca: caCert, // Trust mkcert's root CA
  requestCert: false,
  rejectUnauthorized: true, // Now safe to enable
};
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const deviceRoutes = require('./routes/device');
const walletRoutes = require('./routes/wallet');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://192.168.1.') || origin.startsWith('https://192.168.1.') || 
        origin.startsWith('http://192.168.131.') || origin.startsWith('https://192.168.131.') || 
        origin === 'https://localhost:5173') {
      callback(null, true);
    } else {
      callback(null, false); // Allow other origins
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

 
// Create HTTPS server instead of HTTP
const PORT = process.env.PORT || 5000;
https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in HTTPS mode on port ${PORT}`);
});