 
const mongoose = require('mongoose');
  const User = require('./models/User');
  require('dotenv').config();

 
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
    .then(() => console.log('MongoDB connected for seeding'))
    .catch(err => console.error('MongoDB connection error:', err));

 
  const seedData = async () => {
    try {
      
      await User.deleteMany();
 
      const users = [
        { username: 'talebkanj', password: 'password123', role: 'user', balance: 1000 },
        { username: 'testuser2', password: 'password123', role: 'user', balance: 500 },
      ];

    
      const bcrypt = require('bcrypt');
      const hashedUsers = users.map(user => ({
        ...user,
        password: bcrypt.hashSync(user.password, 10),
      }));

      await User.insertMany(hashedUsers);
      console.log('Seeding completed successfully');
    } catch (error) {
      console.error('Seeding error:', error);
    } finally {
    
      mongoose.connection.close();
    }
  };


  seedData();