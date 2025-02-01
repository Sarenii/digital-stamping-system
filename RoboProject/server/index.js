const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Existing routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const portfolioRoutes = require('./routes/portfolios');

// New routes
const marketDataRoutes = require('./routes/marketData');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolios', portfolioRoutes);

// New endpoints
app.use('/api/market-data', marketDataRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to RoboAdvisor Backend!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
