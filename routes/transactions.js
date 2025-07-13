

const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

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
    fromUser.balance -= amount;
    toUser.balance += amount;

    try {
      await fromUser.save();
      await toUser.save();
      const transaction = new Transaction({
        fromUser: fromUser._id,
        toUser: toUser._id,
        amount,
      });
      await transaction.save();
      res.status(201).json({ message: 'Transaction completed', transaction });
    } catch (saveError) {
    
      fromUser.balance = originalFromBalance;
      toUser.balance = originalToBalance;
      await fromUser.save();
      await toUser.save();
      return res.status(500).json({ error: 'Transaction failed, balances reverted' });
    }
  } catch (error) {
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
    res.json(formatted);
  } catch (error) {
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

    res.json({
      username: req.session.user.username,
      totalDebit,
      totalCredit,
      netBalance: totalCredit - totalDebit,
      reportDate: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;