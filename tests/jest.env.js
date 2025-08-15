// Jest environment setup for PixelSqueeze tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5003'; // Use different port for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.RAZORPAY_KEY_ID = 'rzp_test_test_key_id';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret_key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/pixelsqueeze_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.MAX_FILE_SIZE = '10485760';
process.env.UPLOAD_PATH = './test-uploads';

// Disable logging in tests
process.env.LOG_LEVEL = 'error';
