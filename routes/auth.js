
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();


router.post('/register', async (req, res) => {
  try {
    const { username, password, role, balance } = req.body;  
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      role: role || 'user',
      balance: balance || 0,
      isActive: true
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    req.session.user = { id: user._id, username: user.username, role: user.role };
    res.json({ message: 'Logged in successfully', user: { id: user._id, username, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/toggle-account/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Admin access required' });
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, [
      { $set: { isActive: { $not: '$isActive' } } }
    ], { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      message: `User ${user.isActive ? 'activated' : 'disabled'} successfully`,
      user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.put('/update-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    if (!req.session.user || req.session.user.username !== username) {
      return res.status(403).json({ error: 'Unauthorized: Only the user can update their password' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }

  
});




module.exports = router;