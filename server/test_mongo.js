import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduproctor';

async function testMongo() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log('Total users in mongo:', users.length);
    if (users.length > 0) {
      console.log('First user:', users[0].name);
      console.log('Last user name:', users[users.length-1].name);
      console.log('Last user object keys:', Object.keys(users[users.length-1]));
    }
    process.exit(0);
  } catch (e) {
    console.error('Mongo error:', e.message);
    process.exit(1);
  }
}

testMongo();
