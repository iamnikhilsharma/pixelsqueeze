# PixelSqueeze Quick Start Guide

Get PixelSqueeze up and running in minutes!

## 🚀 Quick Installation

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd pixelsqueeze

# Run the installation script
chmod +x install.sh
./install.sh
```

### Option 2: Manual Setup

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Copy environment file
cp env.example .env
```

## ⚙️ Configuration

1. **Edit the `.env` file** with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/pixelsqueeze

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AWS S3 Configuration (Required for file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=pixelsqueeze-uploads

# Stripe Configuration (Required for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

## 🗄️ Database Setup

### Option 1: Local MongoDB

```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Or run manually
mongod --dbpath /usr/local/var/mongodb
```

### Option 2: Docker (Recommended)

```bash
# Start MongoDB with Docker
docker run -d \
  --name pixelsqueeze-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:6.0
```

### Option 3: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start both backend and frontend
npm run dev

# Or start them separately
npm run server:dev  # Backend on http://localhost:5000
npm run client:dev  # Frontend on http://localhost:3000
```

### Docker Mode

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/health

## 👤 First Steps

1. **Register an account** at http://localhost:3000/register
2. **Get your API key** from the dashboard
3. **Upload your first image** using the web interface
4. **Test the API** with your API key

## 🔧 API Testing

Test the API with curl:

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Optimize an image
curl -X POST http://localhost:5000/api/optimize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "image=@/path/to/your/image.jpg" \
  -F "quality=80"
```

## 📊 Monitoring

- **Health Check**: http://localhost:5000/health
- **Logs**: Check the `logs/` directory
- **Database**: Connect to MongoDB to view data

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find and kill the process
   lsof -ti:5000 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   ```

2. **MongoDB connection failed**
   ```bash
   # Check if MongoDB is running
   brew services list | grep mongodb
   
   # Or check Docker container
   docker ps | grep mongodb
   ```

3. **Permission denied on install.sh**
   ```bash
   chmod +x install.sh
   ```

4. **Node modules issues**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   rm -rf client/node_modules client/package-lock.json
   npm install
   cd client && npm install && cd ..
   ```

### Logs

Check the logs for detailed error information:

```bash
# Backend logs
tail -f logs/combined.log

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🚀 Production Deployment

For production deployment, see the [Deployment Guide](DEPLOYMENT.md).

## 📚 Next Steps

- Read the [API Documentation](API.md)
- Check out the [SDK Examples](SDK_EXAMPLES.md)
- Learn about [Customization](CUSTOMIZATION.md)

## 🆘 Support

- **Documentation**: [README.md](README.md)
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions

---

**Happy optimizing! 🎉** 