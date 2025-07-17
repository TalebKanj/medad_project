
const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

// إضافة دالة تسجيل للتحقق
const debug = (message) => console.log(`[DEBUG] ${message}`);

router.post('/', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  try {
    const { toUsername, amount } = req.body;
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    const fromUser = await User.findById(req.session.user.id);
    if (!fromUser) {
      return res.status(404).json({ error: 'Sender not found' });
    }
    const toUser = await User.findOne({ username: toUsername });
    if (!toUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    if (!toUser.isActive) {
      return res.status(400).json({ error: 'Recipient account is disabled' });
    }
    if (fromUser.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const originalFromBalance = fromUser.balance;
    const originalToBalance = toUser.balance;
    debug(`Initial balances - From: ${fromUser.username} (${originalFromBalance}), To: ${toUser.username} (${originalToBalance})`);

    fromUser.balance -= amount;
    toUser.balance += amount;

    try {
      // حفظ التغييرات مع التأكد من النجاح
      const savedFromUser = await fromUser.save();
      const savedToUser = await toUser.save();
      debug(`Updated balances - From: ${savedFromUser.username} (${savedFromUser.balance}), To: ${savedToUser.username} (${savedToUser.balance})`);

      const transaction = new Transaction({
        fromUser: fromUser._id,
        toUser: toUser._id,
        amount,
      });
      await transaction.save();
      debug(`Transaction completed: ${fromUser.username} -> ${toUser.username}, Amount: ${amount}`);

      res.status(201).json({ message: 'Transaction completed', transaction });
    } catch (saveError) {
      debug(`Transaction failed: ${saveError.message}`);
      // استعادة الرصيد الأصلي في حالة الفشل
      fromUser.balance = originalFromBalance;
      toUser.balance = originalToBalance;
      await fromUser.save();
      await toUser.save();
      return res.status(500).json({ error: 'Transaction failed, balances reverted' });
    }
  } catch (error) {
    debug(`Transaction error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

router.get('/history', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  try {
    const transactions = await Transaction.find({
      $or: [{ fromUser: req.session.user.id }, { toUser: req.session.user.id }],
    }).populate('fromUser toUser');
    const formatted = transactions.map(t => ({
      from: t.fromUser.username,
      to: t.toUser.username,
      amount: t.fromUser._id.equals(req.session.user.id) ? -t.amount : t.amount,
      date: t.date,
    }));
    debug(`History fetched for ${req.session.user.username}`);
    res.json(formatted);
  } catch (error) {
    debug(`History error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

router.get('/report', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  try {
    const userId = req.session.user.id;
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const transactions = await Transaction.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      date: { $gte: startOfYear }
    }).populate('fromUser toUser');

    let totalDebit = 0;
    let totalCredit = 0;

    transactions.forEach(t => {
      if (t.fromUser._id.equals(userId)) totalDebit += t.amount;
      if (t.toUser._id.equals(userId)) totalCredit += t.amount;
    });

    debug(`Report generated for ${req.session.user.username}`);
    res.json({
      username: req.session.user.username,
      totalDebit,
      totalCredit,
      netBalance: totalCredit - totalDebit,
      reportDate: new Date().toISOString()
    });
  } catch (error) {
    debug(`Report error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// نهاية حصرية للمدير: عرض جميع التحويلات
router.get('/admin/all', async (req, res) => {
  if (req.session.user?.role !== 'admin') {
    debug(`Unauthorized access to /admin/all by ${req.session.user?.username || 'unknown'}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const transactions = await Transaction.find().populate('fromUser toUser');
    debug(`Admin fetched all transactions: ${transactions.length} records`);
    res.json(transactions);
  } catch (error) {
    debug(`Admin all error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

//  عرض جميع المستخدمين
router.get('/admin/users', async (req, res) => {
  if (req.session.user?.role !== 'admin') {
    debug(`Unauthorized access to /admin/users by ${req.session.user?.username || 'unknown'}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const users = await User.find().select('-password'); // استبعاد كلمة المرور
    debug(`Admin fetched all users: ${users.length} records`);
    res.json(users);
  } catch (error) {
    debug(`Admin users error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});
//: إلغاء تحويل
router.put('/admin/cancel-transaction/:id', async (req, res) => {
  if (req.session.user?.role !== 'admin') {
    debug(`Unauthorized access to /admin/cancel-transaction by ${req.session.user?.username || 'unknown'}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const transaction = await Transaction.findById(req.params.id).populate('fromUser toUser');
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const fromUser = transaction.fromUser;
    const toUser = transaction.toUser;
    const amount = transaction.amount;

    fromUser.balance += amount;
    toUser.balance -= amount;

    await fromUser.save();
    await toUser.save();
    await transaction.deleteOne();

    debug(`Admin canceled transaction ${transaction._id}: Reverted ${amount} from ${toUser.username} to ${fromUser.username}`);
    res.json({ message: 'Transaction canceled, balances reverted' });
  } catch (error) {
    debug(`Cancel transaction error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;