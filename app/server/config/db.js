require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.WEB_MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 simultaneous connections
    });
    console.log('MongoDB Connected ');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
