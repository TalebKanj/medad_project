const express = require('express');
const session = require('express-session');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
require('dotenv').config();

const app = express();


connectDB();


app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));


app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));