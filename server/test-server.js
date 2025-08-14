const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Basic CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://pixelsqueeze-rho.vercel.app',
    'https://pixelsqueeze.vercel.app',
    'https://pixelsqueeze.onrender.com'
  ],
  credentials: true
}));

// Basic middleware
app.use(express.json());

// Test routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    test: true
  });
});

app.get('/api/analytics/user', (req, res) => {
  res.json({ 
    message: 'Analytics endpoint working!', 
    timestamp: new Date().toISOString(),
    test: true
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
