# PixelSqueeze - AI-Powered Image Optimization Platform

A comprehensive SaaS platform for professional image optimization with advanced AI-powered compression, watermarking, and analytics capabilities.

## 🚀 Features

### Web Application
- **Drag-and-drop image optimization interface** with real-time preview
- **Multi-format support**: JPEG, PNG, WebP with intelligent format detection
- **Advanced compression settings**: Quality control, metadata preservation, format conversion
- **Image thumbnails and previews** with before/after comparison
- **Bulk processing**: Upload and optimize up to 10 images simultaneously
- **User authentication & usage statistics** with detailed analytics
- **Images management page** with compression form integration
- **Advanced Admin Panel** with comprehensive analytics and user management
- **Real-time notifications** with customizable themes and sounds
- **Comprehensive analytics dashboard** for business insights
- **Responsive design** optimized for all devices

### REST API Service
- `POST /api/optimize` - Upload and optimize images with advanced settings
- `POST /api/optimize-url` - Optimize images from URLs
- `GET /api/images` - Retrieve user's optimized images with pagination
- `GET /api/download/:id` - Download optimized images
- `GET /api/stats` - Get comprehensive usage statistics
- **API key authentication** with secure token management
- **Rate limiting and usage tracking** with subscription enforcement
- **Advanced image processing** with Sharp + Imagemin optimization
- **Batch processing** capabilities for multiple images
- **Error handling** with detailed error codes and messages

### Subscription Plans
- **Free Tier**: 100 images/month, max 2MB each
- **Starter**: 5,000 images - $9/month
- **Pro**: 20,000 images - $29/month
- **Enterprise**: 100,000 images - $99/month

### Payment Processing
- **Stripe Integration**: Secure payment processing
- **Subscription Management**: Automatic billing and plan upgrades
- **Billing Portal**: Self-service billing management
- **Webhook Handling**: Real-time subscription updates

## 🛠 Technology Stack

- **Backend**: Node.js + Express with TypeScript support
- **Frontend**: React + Next.js + TypeScript with Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Image Processing**: Sharp + Imagemin (mozjpeg, pngquant)
- **Storage**: Local file system with cloud-ready architecture
- **Payments**: Stripe + Razorpay integration
- **Authentication**: JWT + API Keys with secure token management
- **Real-time**: WebSocket support for live updates
- **State Management**: Zustand with persistence
- **UI Components**: Custom components with Heroicons
- **Analytics**: Custom analytics engine with detailed metrics
- **Error Handling**: Comprehensive logging and error tracking

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- Stripe account (for payments)
- Razorpay account (alternative payment)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd pixelsqueeze
```

2. **Install dependencies**
```bash
npm install
cd client && npm install
```

3. **Environment configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
PORT=5002
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/pixelsqueeze

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# API
API_RATE_LIMIT=100
API_RATE_LIMIT_WINDOW=900000
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp
```

4. **Start development servers**
```bash
# Start backend server
npm run server:dev

# Start frontend (in another terminal)
cd client && npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5002

6. **Build for production**
```bash
npm run build
npm start
```

## 🏗 Project Structure

```
pixelsqueeze/
├── client/                 # Next.js frontend
│   ├── components/        # React components
│   ├── pages/            # Next.js pages
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── server/                # Express.js backend
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   ├── models/           # MongoDB models
│   └── middleware/       # Express middleware
├── docs/                  # Project documentation
└── shared/                # Shared utilities
```

## 🚀 Deployment

### Vercel (Frontend)
```bash
cd client
vercel --prod
```

### Render/Heroku (Backend)
```bash
git push heroku main
```

## 🆕 Recent Improvements

### Image Processing Enhancements
- **Fixed missing image processing binaries** (mozjpeg, pngquant)
- **Improved compression algorithms** with Sharp + Imagemin integration
- **Enhanced image thumbnails** with proper display and error handling
- **Optimized database indexes** to eliminate Mongoose warnings
- **Better error handling** with detailed error messages and logging

### User Experience Improvements
- **Images management page** with integrated compression form
- **Real-time image previews** with thumbnail display
- **Enhanced authentication flow** with proper state management
- **Improved responsive design** for all device sizes
- **Better loading states** and user feedback

### Technical Improvements
- **Clean server startup** with no warnings or errors
- **Optimized MongoDB connections** with proper timeout handling
- **Enhanced API endpoints** with comprehensive error handling
- **Improved state management** with Zustand persistence
- **Better code organization** and TypeScript support

## 📊 Current Status

✅ **Phase 1**: Core Image Optimization  
✅ **Phase 2**: User Authentication & Plans  
✅ **Phase 3**: Payment Integration  
✅ **Phase 4**: Advanced Features  
✅ **Phase 5**: System Integration  
✅ **Phase 6**: User Experience Enhancements  
✅ **Phase 7**: Advanced Analytics & Insights  
✅ **Phase 8**: Bug Fixes & Performance Optimization  

**Status**: 🎉 **PRODUCTION READY** - All systems operational with clean logs and optimal performance

## 📖 API Usage Examples

### Upload and Optimize Image
```bash
curl -X POST http://localhost:5002/api/optimize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@your-image.jpg" \
  -F "quality=80" \
  -F "format=auto"
```

### Get User Images
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5002/api/images
```

### Download Optimized Image
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5002/api/download/IMAGE_ID \
  --output optimized-image.jpg
```

## 🔧 Development

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Comprehensive error handling
- Clean architecture with separation of concerns

### Testing
- Manual testing completed
- Production deployment verified
- Performance monitoring enabled
- Error logging and monitoring

## 📝 License

MIT License - see LICENSE file for details. 