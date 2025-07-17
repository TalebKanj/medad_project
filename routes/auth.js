const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

// إضافة سجل للتحقق
const debug = (message) => console.log(`[DEBUG] ${message}`);

router.post('/register', async (req, res) => {
  try {
    const { username, password, role, balance, email } = req.body; 
    const hashedPassword = await bcrypt.hash(password, 10);
    debug(`Hashing password for ${username}: ${hashedPassword.substring(0, 10)}...`);

    const user = new User({
      username,
      password: hashedPassword,
      role: role || 'user',
      balance: balance || 0,
      isActive: true, // تفعيل الحساب افتراضيًا
      email: email || '' // يجب أن يكون email موجودًا بسبب required في userModel
    });

    await user.save();
    debug(`User ${username} registered successfully`);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    debug(`Registration error for ${username}: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password, email } = req.body; 

    // التأكد من وجود بيانات اعتماد
    if (!username && !email) {
      return res.status(400).json({ error: 'Username or email is required' });
    }
    debug(`Login attempt with username: ${username}, email: ${email}`);

    // البحث عن المستخدم باستخدام username أو email
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
      debug(`User not found for username: ${username}, email: ${email}`);
      return res.status(401).json({ error: 'User not found' });
    }
    debug(`User found: ${user.username}, email: ${user.email}`);

    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    debug(`Password match result: ${isMatch}`); // سجل للتحقق
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // التحقق من حالة الحساب
    if (!user.isActive) {
      debug(`Account for ${user.username} is disabled`);
      return res.status(403).json({ error: 'Account is disabled. Contact an admin to activate it.' });
    }

    // إعداد الجلسة
    req.session.user = { id: user._id, username: user.username, role: user.role };
    debug(`Session set for user: ${user.username}`);
    res.json({ 
      message: 'Logged in successfully', 
      user: { id: user._id, username: user.username, role: user.role } 
    });
  } catch (error) {
    debug(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Server error: ' + error.message }); // تحسين رسالة الخطأ
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
    debug(`Toggled account ${user.username} to ${user.isActive ? 'active' : 'disabled'}`);
    res.json({
      message: `User ${user.isActive ? 'activated' : 'disabled'} successfully`,
      user
    });
  } catch (error) {
    debug(`Toggle account error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

router.put('/update-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword, email } = req.body; 
    if (!req.session.user || (req.session.user.username !== username && req.session.user.email !== email)) {
      return res.status(403).json({ error: 'Unauthorized: Only the user can update their password' });
    }

    const user = await User.findOne({ $or: [{ username }, { email }] }); 
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    debug(`Password updated for ${username}`);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    debug(`Update password error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
