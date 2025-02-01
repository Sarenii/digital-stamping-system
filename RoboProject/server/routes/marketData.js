const express = require('express');
const axios = require('axios');
const router = express.Router();

// Use your API key (or use 'demo' for testing purposes)
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

// Example route to fetch realtime market data using Alpha Vantage API
router.get('/realtime', async (req, res) => {
  try {
    // Get the stock symbol from query parameters (default to MSFT)
    const symbol = req.query.symbol || 'MSFT';

    // Call the Alpha Vantage API (using the TIME_SERIES_INTRADAY endpoint)
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_INTRADAY',
        symbol: symbol,
        interval: '5min',
        apikey: API_KEY,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching market data:', error.message);
    res.status(500).json({ message: 'Error fetching market data' });
  }
});

module.exports = router;
