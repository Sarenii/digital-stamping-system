const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const users = require('../data/users');

// Middleware to allow only administrators
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admins only' });
};

// Endpoint to view all users (Admin only)
router.get('/users', authMiddleware, adminOnly, (req, res) => {
  res.json(users);
});

// Endpoint to update a user's details by id (Admin only)
router.put('/users/:id', authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Update the user with the provided data (ensure to validate input in production)
  Object.assign(user, req.body);
  res.json({ message: 'User updated', user });
});

module.exports = router;
