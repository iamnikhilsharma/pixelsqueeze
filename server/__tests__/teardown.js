// Server-side test teardown
const mongoose = require('mongoose');

module.exports = async () => {
  // Close database connection
  await mongoose.connection.close();
  
  console.log('Test database teardown complete');
};
