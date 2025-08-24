#!/usr/bin/env node
/*
  Usage:
    node scripts/reset-password.js user@example.com NewPassword123
  or via npm script:
    npm run reset:password -- user@example.com NewPassword123
*/

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const User = require(path.resolve(process.cwd(), 'server/models/User.js'));

async function main() {
  const [email, newPassword] = process.argv.slice(2);

  if (!email || !newPassword) {
    console.error('Usage: node scripts/reset-password.js <email> <newPassword>');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixelsqueeze';

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`User not found for email: ${email}`);
      process.exit(2);
    }

    user.password = newPassword; // pre-save hook will hash
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.loginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    console.log(`Password reset successfully for ${email}`);
  } catch (err) {
    console.error('Error resetting password:', err.message);
    process.exit(3);
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
}

main();

