 
const mongoose = require('mongoose');


const transactionSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  email: {      
    type: String,
    required: false,
    trim: true
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);