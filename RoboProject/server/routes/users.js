// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware');
// const users = require('../data/users');

// // Get logged in user's profile
// router.get('/me', authMiddleware, (req, res) => {
//   const user = users.find(u => u.id === req.user.id);
//   if (!user) return res.status(404).json({ message: 'User not found' });
//   res.json({ id: user.id, email: user.email, role: user.role, profile: user.profile });
// });

// // Update logged in user's profile
// router.put('/me', authMiddleware, (req, res) => {
//   const user = users.find(u => u.id === req.user.id);
//   if (!user) return res.status(404).json({ message: 'User not found' });
//   // Update profile with data provided
//   user.profile = { ...user.profile, ...req.body.profile };
//   res.json({ message: 'Profile updated', profile: user.profile });
// });

// module.exports = router;
// server/routes/users.js
const express = require('express');
const router = express.Router();
const users = require('../data/users');

// New endpoint to get all users (unprotected - be careful in production)
router.get('/', (req, res) => {
  res.json(users);
});

module.exports = router;
