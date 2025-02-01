const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// In‑memory portfolios storage
let portfolios = [];

// Create a new portfolio
router.post('/', authMiddleware, (req, res) => {
  const { name, assets } = req.body;
  const newPortfolio = { 
    id: Date.now().toString(), 
    userId: req.user.id, 
    name, 
    assets: assets || [], 
    createdAt: new Date() 
  };
  portfolios.push(newPortfolio);
  res.status(201).json(newPortfolio);
});

// Get all portfolios for the logged in user
router.get('/', authMiddleware, (req, res) => {
  const userPortfolios = portfolios.filter(p => p.userId === req.user.id);
  res.json(userPortfolios);
});

// Update a portfolio
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const portfolio = portfolios.find(p => p.id === id && p.userId === req.user.id);
  if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
  portfolio.name = req.body.name || portfolio.name;
  portfolio.assets = req.body.assets || portfolio.assets;
  res.json(portfolio);
});

// Delete a portfolio
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  portfolios = portfolios.filter(p => !(p.id === id && p.userId === req.user.id));
  res.json({ message: 'Portfolio deleted' });
});

module.exports = router;
