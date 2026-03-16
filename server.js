require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const connectDB = require('./config/db');

const app = express();

// ── Connect to MongoDB ────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from the frontend URL and localhost (for dev)
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5500',
      'http://localhost:5501',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
    ].filter(Boolean);
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body size limit raised to 5mb to handle base64 photos
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Health check ──────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏫 Mostafa Pre Cadet School API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/students',     require('./routes/students'));
app.use('/api/teachers',     require('./routes/teachers'));
app.use('/api/notices',      require('./routes/notices'));
app.use('/api/attendance',   require('./routes/attendance'));
app.use('/api/results',      require('./routes/results'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api',              require('./routes/misc'));

// ── 404 handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ──────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error.' : err.message,
  });
});

// ── Start server ──────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
