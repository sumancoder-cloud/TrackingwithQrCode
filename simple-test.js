// Simple test to check database connection and users
const mongoose = require('mongoose');

async function simpleTest() {
  try {
    console.log('🔍 Simple database test...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/gpstracker');
    console.log('✅ Connected to MongoDB: gpstracker');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Check users collection specifically
    const usersCollection = mongoose.connection.db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`\n👥 Users collection has ${userCount} documents`);
    
    if (userCount > 0) {
      const users = await usersCollection.find({}).toArray();
      console.log('\n📋 Users in database:');
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.role}) - ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
  }
}

simpleTest();
