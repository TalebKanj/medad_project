 
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  isActive: { type: Boolean, default: true },
  balance: Number,
 // حقل البريد الإلكتروني 
  email: {       
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  }
});

module.exports = mongoose.model('User', userSchema);